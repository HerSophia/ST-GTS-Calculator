/**
 * 状态同步服务测试
 * 
 * 测试变量和 Store 之间的双向同步功能
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { variablesMock, mvuMock } from '../../setup';
import { useSettingsStore } from '@/stores/settings';
import { useCharactersStoreBase } from '@/stores/characters';
import {
  syncVariablesToStore,
  syncStoreToVariables,
  reinjectPromptsIfNeeded,
} from '@/services/variables/sync';
import type { GiantessVariableData } from '@/types/variables';

describe('Service: variables/sync', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mvuMock.__reset();
    variablesMock.__reset();
  });

  // ========== syncVariablesToStore ==========
  describe('syncVariablesToStore', () => {
    describe('基本同步', () => {
      it('应该同步单个角色到 Store', () => {
        const mockData: GiantessVariableData = {
          角色: {
            络络: {
              当前身高: 170,
              原身高: 1.65,
              变化原因: '喝下药水',
              变化时间: '第一天',
            },
          },
        };

        variablesMock.__setVariables({
          stat_data: {
            巨大娘: mockData,
          },
        });

        const result = syncVariablesToStore();
        const charactersStore = useCharactersStoreBase();

        expect(result.success).toBe(true);
        expect(result.characterCount).toBe(1);

        const character = charactersStore.getCharacter('络络');
        expect(character).not.toBeNull();
        expect(character?.currentHeight).toBe(170);
        expect(character?.originalHeight).toBe(1.65);
        expect(character?.changeReason).toBe('喝下药水');
      });

      it('应该同步多个角色到 Store', () => {
        variablesMock.__setVariables({
          stat_data: {
            巨大娘: {
              角色: {
                络络: { 当前身高: 170, 原身高: 1.65 },
                小明: { 当前身高: 0.017, 原身高: 1.70 },
                小红: { 当前身高: 200, 原身高: 1.60 },
              },
            },
          },
        });

        const result = syncVariablesToStore();
        const charactersStore = useCharactersStoreBase();

        expect(result.success).toBe(true);
        expect(result.characterCount).toBe(3);
        expect(charactersStore.getCharacter('络络')).not.toBeNull();
        expect(charactersStore.getCharacter('小明')).not.toBeNull();
        expect(charactersStore.getCharacter('小红')).not.toBeNull();
      });
    });

    describe('计算数据', () => {
      it('应该为巨大娘计算数据', () => {
        variablesMock.__setVariables({
          stat_data: {
            巨大娘: {
              角色: {
                络络: { 当前身高: 170, 原身高: 1.65 },
              },
            },
          },
        });

        syncVariablesToStore();
        const charactersStore = useCharactersStoreBase();
        const character = charactersStore.getCharacter('络络');

        expect(character?.calcData).toBeDefined();
        expect(character?.calcData?.倍率).toBeCloseTo(103.03, 1);
        expect(character?.calcData?.级别).toBeDefined();
      });

      it('应该为小人计算数据', () => {
        variablesMock.__setVariables({
          stat_data: {
            巨大娘: {
              角色: {
                小明: { 当前身高: 0.017, 原身高: 1.70 },
              },
            },
          },
        });

        syncVariablesToStore();
        const charactersStore = useCharactersStoreBase();
        const character = charactersStore.getCharacter('小明');

        expect(character?.calcData).toBeDefined();
        expect(character?.calcData?.倍率).toBeCloseTo(0.01, 2);
      });

      it('当启用损害计算时应该计算损害数据', () => {
        const settingsStore = useSettingsStore();
        settingsStore.settings.enableDamageCalculation = true;
        settingsStore.settings.damageScenario = '大城市';

        variablesMock.__setVariables({
          stat_data: {
            巨大娘: {
              角色: {
                络络: { 当前身高: 170, 原身高: 1.65 },
              },
            },
          },
        });

        syncVariablesToStore();
        const charactersStore = useCharactersStoreBase();
        const character = charactersStore.getCharacter('络络');

        expect(character?.damageData).toBeDefined();
        expect(character?.damageData?.破坏力等级).toBeDefined();
      });
    });

    describe('身高历史', () => {
      it('应该同步身高历史记录', () => {
        variablesMock.__setVariables({
          stat_data: {
            巨大娘: {
              角色: {
                络络: {
                  当前身高: 170,
                  原身高: 1.65,
                  _身高历史: [
                    { 身高: 50, 身高_格式化: '50米', 时间点: '第一天', 原因: '开始变化' },
                    { 身高: 100, 身高_格式化: '100米', 时间点: '第二天', 原因: '继续增长' },
                    { 身高: 170, 身高_格式化: '170米', 时间点: '第三天', 原因: '最终尺寸' },
                  ],
                },
              },
            },
          },
        });

        syncVariablesToStore();
        const charactersStore = useCharactersStoreBase();
        const character = charactersStore.getCharacter('络络');

        expect(character?.history).toHaveLength(3);
        expect(character?.history?.[0].height).toBe(50);
        expect(character?.history?.[2].height).toBe(170);
      });
    });

    describe('边界情况', () => {
      it('当没有数据时应该清空 Store', () => {
        const charactersStore = useCharactersStoreBase();
        charactersStore.setCharacter('旧角色', {
          name: '旧角色',
          currentHeight: 100,
          originalHeight: 1.65,
        });

        variablesMock.__setVariables({});

        const result = syncVariablesToStore();

        expect(result.success).toBe(false);
        expect(result.characterCount).toBe(0);
        expect(charactersStore.getCharacter('旧角色')).toBeUndefined();
      });

      it('应该使用默认原身高 1.65', () => {
        variablesMock.__setVariables({
          stat_data: {
            巨大娘: {
              角色: {
                络络: { 当前身高: 170 },  // 没有原身高
              },
            },
          },
        });

        syncVariablesToStore();
        const charactersStore = useCharactersStoreBase();
        const character = charactersStore.getCharacter('络络');

        expect(character?.originalHeight).toBe(1.65);
      });

      it('应该支持「身高」作为「当前身高」的别名', () => {
        variablesMock.__setVariables({
          stat_data: {
            巨大娘: {
              角色: {
                络络: { 身高: 170, 原身高: 1.65 },  // 使用别名
              },
            },
          },
        });

        syncVariablesToStore();
        const charactersStore = useCharactersStoreBase();
        const character = charactersStore.getCharacter('络络');

        expect(character?.currentHeight).toBe(170);
      });

      it('应该跳过无效身高的角色', () => {
        variablesMock.__setVariables({
          stat_data: {
            巨大娘: {
              角色: {
                络络: { 当前身高: 170, 原身高: 1.65 },
                无效角色: { 当前身高: 0 },  // 无效身高
                空角色: {},  // 没有身高
              },
            },
          },
        });

        const result = syncVariablesToStore();
        const charactersStore = useCharactersStoreBase();

        expect(result.characterCount).toBe(1);
        expect(charactersStore.getCharacter('络络')).not.toBeUndefined();
        expect(charactersStore.getCharacter('无效角色')).toBeUndefined();
        expect(charactersStore.getCharacter('空角色')).toBeUndefined();
      });
    });
  });

  // ========== syncStoreToVariables ==========
  describe('syncStoreToVariables', () => {
    it('应该将 Store 数据同步回变量', () => {
      const charactersStore = useCharactersStoreBase();
      charactersStore.setCharacter('络络', {
        name: '络络',
        currentHeight: 170,
        originalHeight: 1.65,
        changeReason: '喝下药水',
        changeTime: '第一天',
      });

      syncStoreToVariables();

      // 应该调用了批量更新
      expect(variablesMock.updateVariablesWith).toHaveBeenCalled();
    });

    it('当 Store 为空时应该跳过同步', () => {
      const charactersStore = useCharactersStoreBase();
      charactersStore.clear();

      syncStoreToVariables();

      expect(variablesMock.updateVariablesWith).not.toHaveBeenCalled();
    });

    it('应该同步多个角色', () => {
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

      syncStoreToVariables();

      expect(variablesMock.updateVariablesWith).toHaveBeenCalled();
    });
  });

  // ========== reinjectPromptsIfNeeded ==========
  describe('reinjectPromptsIfNeeded', () => {
    it('当脚本禁用时不应该注入', () => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.enabled = false;

      reinjectPromptsIfNeeded();

      // 不应该有任何注入操作
      // 因为脚本禁用了
    });

    it('当自动注入禁用时不应该注入', () => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.enabled = true;
      settingsStore.settings.autoInject = false;

      reinjectPromptsIfNeeded();

      // 不应该有任何注入操作
    });

    it('当启用且有角色时应该尝试注入', () => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.enabled = true;
      settingsStore.settings.autoInject = true;

      const charactersStore = useCharactersStoreBase();
      charactersStore.setCharacter('络络', {
        name: '络络',
        currentHeight: 170,
        originalHeight: 1.65,
        calcData: {
          当前身高: 170,
          当前身高_格式化: '170米',
          原身高: 1.65,
          倍率: 103.03,
          级别: 'Kilo级',
          级别描述: '城市踩在脚下',
          描述: '',
          身体部位: {},
          身体部位_格式化: {},
          自定义部位: {},
          自定义部位_倍率: {},
          眼中的世界: {},
          眼中的世界_格式化: {},
          _计算时间: Date.now(),
          _版本: '3.0.0',
        },
      });

      // 这个测试主要验证不会抛出错误
      expect(() => reinjectPromptsIfNeeded()).not.toThrow();
    });
  });
});
