/**
 * 变量读取服务测试
 * 
 * 测试从楼层变量和 Store 读取巨大娘数据的功能
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { variablesMock, mvuMock } from '../../setup';
import { useSettingsStore } from '@/stores/settings';
import { useCharactersStoreBase } from '@/stores/characters';
import {
  // 公开 API（从 Store 读取）
  readGiantessData,
  extractCharacters,
  readCharacterData,
  readScenarioData,
  hasGiantessData,
  getCharacterNames,
  readRawVariables,
  // 内部 API（从变量读取）
  _internal_readGiantessData,
  _internal_extractCharacters,
  _internal_extractScenario,
} from '@/services/variables/reader';
import type { GiantessVariableData } from '@/types/variables';

describe('Service: variables/reader', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mvuMock.__reset();
    variablesMock.__reset();
  });

  // ========== 内部函数测试（从变量读取）==========
  describe('内部函数: _internal_readGiantessData', () => {
    it('应该从变量读取到巨大娘数据', () => {
      const mockData: GiantessVariableData = {
        _场景: { 当前场景: '大城市', 场景原因: '测试' },
        角色: {
          络络: { 当前身高: 170, 原身高: 1.65 },
        },
      };

      variablesMock.__setVariables({
        stat_data: {
          巨大娘: mockData,
        },
      });

      const result = _internal_readGiantessData();

      expect(result).not.toBeNull();
      expect(result?._场景?.当前场景).toBe('大城市');
      expect(result?.角色?.['络络']).toBeDefined();
    });

    it('当没有数据时应该返回 null', () => {
      variablesMock.__setVariables({});

      const result = _internal_readGiantessData();

      expect(result).toBeNull();
    });

    it('应该使用设置中的变量前缀', () => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.variablePrefix = '自定义前缀';

      variablesMock.__setVariables({
        stat_data: {
          自定义前缀: {
            角色: {
              角色A: { 当前身高: 100 },
            },
          },
        },
      });

      const result = _internal_readGiantessData();

      expect(result).not.toBeNull();
      expect(result?.角色?.['角色A']).toBeDefined();
    });

    it('应该支持指定 messageId', () => {
      variablesMock.__setVariables({
        stat_data: {
          巨大娘: {
            角色: {
              络络: { 当前身高: 170 },
            },
          },
        },
      });

      _internal_readGiantessData({ messageId: 5 });

      // 验证调用了正确的 messageId
      expect(variablesMock.getVariables).toHaveBeenCalledWith(
        expect.objectContaining({ message_id: 5 })
      );
    });
  });

  // ========== 内部函数: _internal_extractCharacters ==========
  describe('内部函数: _internal_extractCharacters', () => {
    describe('新格式数据', () => {
      it('应该从新格式中提取角色', () => {
        const data: GiantessVariableData = {
          角色: {
            络络: { 当前身高: 170, 原身高: 1.65 },
            小明: { 当前身高: 0.017, 原身高: 1.70 },
          },
        };

        const characters = _internal_extractCharacters(data);

        expect(Object.keys(characters)).toHaveLength(2);
        expect(characters['络络']).toBeDefined();
        expect(characters['络络'].当前身高).toBe(170);
        expect(characters['小明']).toBeDefined();
      });
    });

    describe('旧格式数据兼容', () => {
      it('应该从旧格式中提取角色', () => {
        // 旧格式：角色直接在顶层
        const data = {
          络络: { 当前身高: 170, 原身高: 1.65 },
          小明: { 当前身高: 0.017, 原身高: 1.70 },
          _场景: { 当前场景: '大城市' },
          _互动限制: {},
        } as unknown as GiantessVariableData;

        const characters = _internal_extractCharacters(data);

        expect(Object.keys(characters)).toHaveLength(2);
        expect(characters['络络']).toBeDefined();
        expect(characters['小明']).toBeDefined();
      });

      it('应该过滤掉以 _ 开头的键', () => {
        const data = {
          络络: { 当前身高: 170 },
          _场景: { 当前场景: '大城市' },
          _互动限制: {},
          _计算数据: {},
        } as unknown as GiantessVariableData;

        const characters = _internal_extractCharacters(data);

        expect(Object.keys(characters)).toHaveLength(1);
        expect(characters['络络']).toBeDefined();
        expect(characters['_场景']).toBeUndefined();
      });

      it('应该过滤掉没有身高字段的对象', () => {
        const data = {
          络络: { 当前身高: 170 },
          其他数据: { 名称: '测试', 数值: 123 },
        } as unknown as GiantessVariableData;

        const characters = _internal_extractCharacters(data);

        expect(Object.keys(characters)).toHaveLength(1);
        expect(characters['络络']).toBeDefined();
        expect(characters['其他数据']).toBeUndefined();
      });

      it('应该支持「身高」作为「当前身高」的别名', () => {
        const data = {
          络络: { 身高: 170 },  // 使用别名
        } as unknown as GiantessVariableData;

        const characters = _internal_extractCharacters(data);

        expect(characters['络络']).toBeDefined();
      });
    });

    describe('边界情况', () => {
      it('应该处理空数据', () => {
        const data = {} as GiantessVariableData;

        const characters = _internal_extractCharacters(data);

        expect(Object.keys(characters)).toHaveLength(0);
      });

      it('应该处理空的角色对象', () => {
        const data: GiantessVariableData = {
          角色: {},
        };

        const characters = _internal_extractCharacters(data);

        expect(Object.keys(characters)).toHaveLength(0);
      });
    });
  });

  // ========== 内部函数: _internal_extractScenario ==========
  describe('内部函数: _internal_extractScenario', () => {
    it('应该提取场景数据', () => {
      const data: GiantessVariableData = {
        _场景: {
          当前场景: '东京市中心',
          场景原因: '角色来到了市中心',
        },
        角色: {},
      };

      const result = _internal_extractScenario(data);

      expect(result).not.toBeNull();
      expect(result?.当前场景).toBe('东京市中心');
      expect(result?.场景原因).toBe('角色来到了市中心');
    });

    it('当没有场景数据时应该返回 null', () => {
      const data: GiantessVariableData = {
        角色: {},
      };

      const result = _internal_extractScenario(data);

      expect(result).toBeNull();
    });
  });

  // ========== 公开 API 测试（从 Store 读取）==========
  describe('公开 API: readGiantessData (从 Store 读取)', () => {
    it('当 Store 有角色数据时应该返回数据', () => {
      const charactersStore = useCharactersStoreBase();
      charactersStore.setCharacter('络络', {
        name: '络络',
        currentHeight: 170,
        originalHeight: 1.65,
        changeReason: '喝了药水',
      });

      const result = readGiantessData();

      expect(result).not.toBeNull();
      expect(result?.角色?.['络络']).toBeDefined();
      expect(result?.角色?.['络络'].当前身高).toBe(170);
    });

    it('当 Store 为空时应该返回 null', () => {
      const result = readGiantessData();

      expect(result).toBeNull();
    });

    it('应该包含场景数据', () => {
      const charactersStore = useCharactersStoreBase();
      charactersStore.setCharacter('络络', {
        name: '络络',
        currentHeight: 170,
        originalHeight: 1.65,
      });
      charactersStore.setScenario({
        当前场景: '大城市',
        场景原因: '测试',
      });

      const result = readGiantessData();

      expect(result?._场景?.当前场景).toBe('大城市');
    });
  });

  describe('公开 API: extractCharacters', () => {
    it('当提供数据时应该使用内部函数处理', () => {
      const data: GiantessVariableData = {
        角色: {
          络络: { 当前身高: 170, 原身高: 1.65 },
        },
      };

      const characters = extractCharacters(data);

      expect(characters['络络']).toBeDefined();
    });

    it('当不提供数据时应该从 Store 读取', () => {
      const charactersStore = useCharactersStoreBase();
      charactersStore.setCharacter('络络', {
        name: '络络',
        currentHeight: 170,
        originalHeight: 1.65,
      });

      const characters = extractCharacters();

      expect(characters['络络']).toBeDefined();
    });
  });

  describe('公开 API: readCharacterData (从 Store 读取)', () => {
    it('应该读取指定角色的数据', () => {
      const charactersStore = useCharactersStoreBase();
      charactersStore.setCharacter('络络', {
        name: '络络',
        currentHeight: 170,
        originalHeight: 1.65,
        changeReason: '喝了药水',
      });

      const result = readCharacterData('络络');

      expect(result).not.toBeNull();
      expect(result?.当前身高).toBe(170);
      expect(result?.原身高).toBe(1.65);
      expect(result?.变化原因).toBe('喝了药水');
    });

    it('当角色不存在时应该返回 null', () => {
      const charactersStore = useCharactersStoreBase();
      charactersStore.setCharacter('络络', {
        name: '络络',
        currentHeight: 170,
        originalHeight: 1.65,
      });

      const result = readCharacterData('不存在的角色');

      expect(result).toBeNull();
    });
  });

  describe('公开 API: readScenarioData (从 Store 读取)', () => {
    it('应该读取场景数据', () => {
      const charactersStore = useCharactersStoreBase();
      charactersStore.setScenario({
        当前场景: '东京市中心',
        场景原因: '角色来到了市中心',
      });

      const result = readScenarioData();

      expect(result).not.toBeNull();
      expect(result?.当前场景).toBe('东京市中心');
      expect(result?.场景原因).toBe('角色来到了市中心');
    });

    it('当没有场景数据时应该返回 null', () => {
      const result = readScenarioData();

      expect(result).toBeNull();
    });
  });

  describe('公开 API: hasGiantessData (从 Store 读取)', () => {
    it('当 Store 有角色数据时应该返回 true', () => {
      const charactersStore = useCharactersStoreBase();
      charactersStore.setCharacter('络络', {
        name: '络络',
        currentHeight: 170,
        originalHeight: 1.65,
      });

      expect(hasGiantessData()).toBe(true);
    });

    it('当 Store 为空时应该返回 false', () => {
      expect(hasGiantessData()).toBe(false);
    });
  });

  describe('公开 API: getCharacterNames (从 Store 读取)', () => {
    it('应该返回所有角色名称', () => {
      const charactersStore = useCharactersStoreBase();
      charactersStore.setCharacter('络络', {
        name: '络络',
        currentHeight: 170,
        originalHeight: 1.65,
      });
      charactersStore.setCharacter('小明', {
        name: '小明',
        currentHeight: 0.017,
        originalHeight: 1.70,
      });

      const names = getCharacterNames();

      expect(names).toHaveLength(2);
      expect(names).toContain('络络');
      expect(names).toContain('小明');
    });

    it('当 Store 为空时应该返回空数组', () => {
      expect(getCharacterNames()).toEqual([]);
    });
  });

  // ========== readRawVariables（仍直接读取变量）==========
  describe('readRawVariables', () => {
    it('应该返回原始变量对象', () => {
      const mockVariables = {
        stat_data: {
          巨大娘: { 角色: {} },
        },
        other_data: { key: 'value' },
      };

      variablesMock.__setVariables(mockVariables);

      const result = readRawVariables();

      expect(result).toEqual(mockVariables);
    });

    it('当读取失败时应该返回空对象', () => {
      variablesMock.getVariables.mockImplementation(() => {
        throw new Error('读取失败');
      });

      const result = readRawVariables();

      expect(result).toEqual({});
    });
  });
});
