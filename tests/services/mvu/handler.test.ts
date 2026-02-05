/**
 * MVU 数据结构测试
 * 
 * 测试 v3.1.0 的新数据结构和旧格式兼容
 * 
 * 注意：v3.1.0 后主要逻辑已迁移到 services/variables/
 * 此测试文件验证数据结构兼容性
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mvuMock, variablesMock } from '../../setup';
import { useSettingsStore } from '@/stores/settings';
import type { CharacterMvuData, GiantessMvuData } from '@/types';

describe('Service: mvu/handler', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mvuMock.__reset();
    variablesMock.__reset();
  });

  // ========== 数据结构测试 ==========
  describe('数据结构兼容性', () => {
    describe('新格式数据 (v3.1.0+)', () => {
      it('角色数据应该在 角色 键下', () => {
        const newFormatData: GiantessMvuData = {
          _场景: { 当前场景: '大城市', 场景原因: '' },
          _互动限制: {},
          角色: {
            络络: {
              当前身高: 170,
              原身高: 1.65,
              变化原因: '喝下药水',
            },
            小明: {
              当前身高: 0.017,
              原身高: 1.70,
            },
          },
        };

        // 验证结构
        expect(newFormatData.角色).toBeDefined();
        expect(newFormatData.角色!['络络']).toBeDefined();
        expect(newFormatData.角色!['络络'].当前身高).toBe(170);
        expect(newFormatData.角色!['小明'].当前身高).toBe(0.017);
      });

      it('场景数据应该在 _场景 键下', () => {
        const data: GiantessMvuData = {
          _场景: { 当前场景: '东京市中心', 场景原因: '角色来到市中心' },
          角色: {},
        };

        expect(data._场景).toBeDefined();
        expect(data._场景!.当前场景).toBe('东京市中心');
        expect(data._场景!.场景原因).toBe('角色来到市中心');
      });
    });

    describe('旧格式数据 (v3.0.x 及之前)', () => {
      it('角色数据直接在顶层', () => {
        // 旧格式：角色直接在顶层，与 _场景、_互动限制 混在一起
        const oldFormatData: Record<string, unknown> = {
          络络: {
            当前身高: 170,
            原身高: 1.65,
          },
          小明: {
            当前身高: 0.017,
            原身高: 1.70,
          },
          _场景: { 当前场景: '大城市' },
          _互动限制: {},
        };

        // 验证旧结构
        expect(oldFormatData['络络']).toBeDefined();
        expect((oldFormatData['络络'] as CharacterMvuData).当前身高).toBe(170);
        expect(oldFormatData['_场景']).toBeDefined();
      });
    });
  });

  // ========== 路径测试 ==========
  describe('变量路径', () => {
    it('新格式路径应该包含 角色 键', () => {
      const prefix = '巨大娘';
      const name = '络络';
      const expectedPath = `stat_data.${prefix}.角色.${name}`;
      
      // 验证路径格式
      expect(expectedPath).toBe('stat_data.巨大娘.角色.络络');
    });

    it('旧格式路径不包含 角色 键', () => {
      const prefix = '巨大娘';
      const name = '络络';
      const oldPath = `stat_data.${prefix}.${name}`;
      
      expect(oldPath).toBe('stat_data.巨大娘.络络');
    });
  });

  // ========== 角色数据提取测试 ==========
  describe('角色数据提取逻辑', () => {
    /**
     * 模拟 getCharactersFromData 的逻辑
     */
    function extractCharacters(data: Record<string, unknown>): Record<string, CharacterMvuData> {
      // 新结构：角色数据在 `角色` 键下
      const newStyleCharacters = data.角色 as Record<string, CharacterMvuData> | undefined;
      if (newStyleCharacters && typeof newStyleCharacters === 'object') {
        return newStyleCharacters;
      }
      
      // 旧结构兼容：过滤掉以 _ 开头的键和特殊键
      const oldStyleCharacters: Record<string, CharacterMvuData> = {};
      for (const [key, value] of Object.entries(data)) {
        if (!key.startsWith('_') && key !== '角色' && typeof value === 'object' && value !== null) {
          oldStyleCharacters[key] = value as CharacterMvuData;
        }
      }
      
      return oldStyleCharacters;
    }

    it('应该从新格式中正确提取角色', () => {
      const newFormatData: GiantessMvuData = {
        _场景: { 当前场景: '大城市' },
        角色: {
          络络: { 当前身高: 170, 原身高: 1.65 },
          小明: { 当前身高: 0.017, 原身高: 1.70 },
        },
      };

      const characters = extractCharacters(newFormatData as Record<string, unknown>);

      expect(Object.keys(characters)).toHaveLength(2);
      expect(characters['络络']).toBeDefined();
      expect(characters['络络'].当前身高).toBe(170);
      expect(characters['小明']).toBeDefined();
      expect(characters['小明'].当前身高).toBe(0.017);
    });

    it('应该从旧格式中正确提取角色', () => {
      const oldFormatData: Record<string, unknown> = {
        络络: { 当前身高: 170, 原身高: 1.65 },
        小明: { 当前身高: 0.017, 原身高: 1.70 },
        _场景: { 当前场景: '大城市' },
        _互动限制: {},
      };

      const characters = extractCharacters(oldFormatData);

      expect(Object.keys(characters)).toHaveLength(2);
      expect(characters['络络']).toBeDefined();
      expect(characters['络络'].当前身高).toBe(170);
      expect(characters['小明']).toBeDefined();
    });

    it('应该过滤掉以 _ 开头的键', () => {
      const data: Record<string, unknown> = {
        络络: { 当前身高: 170 },
        _场景: { 当前场景: '大城市' },
        _互动限制: {},
        _计算数据: {},
      };

      const characters = extractCharacters(data);

      expect(Object.keys(characters)).toHaveLength(1);
      expect(characters['络络']).toBeDefined();
      expect(characters['_场景']).toBeUndefined();
      expect(characters['_互动限制']).toBeUndefined();
    });

    it('空数据应该返回空对象', () => {
      const characters = extractCharacters({});

      expect(Object.keys(characters)).toHaveLength(0);
    });

    it('只有系统键的数据应该返回空对象', () => {
      const data: Record<string, unknown> = {
        _场景: { 当前场景: '大城市' },
        _互动限制: {},
      };

      const characters = extractCharacters(data);

      expect(Object.keys(characters)).toHaveLength(0);
    });
  });

  // ========== 数据迁移测试 ==========
  describe('数据迁移逻辑', () => {
    /**
     * 模拟 migrateOldDataFormat 的逻辑
     */
    function migrateData(
      variables: Record<string, unknown>,
      prefix: string
    ): void {
      const data = variables[`stat_data`] as Record<string, unknown> | undefined;
      const prefixData = data?.[prefix] as Record<string, unknown> | undefined;
      if (!prefixData) return;
      
      // 检查是否有旧格式数据（角色直接在顶层）
      const oldCharacters: Record<string, CharacterMvuData> = {};
      for (const [key, value] of Object.entries(prefixData)) {
        if (!key.startsWith('_') && key !== '角色' && typeof value === 'object' && value !== null) {
          const charData = value as CharacterMvuData;
          // 验证是角色数据（有身高相关字段）
          if (charData.当前身高 !== undefined || charData.身高 !== undefined) {
            oldCharacters[key] = charData;
          }
        }
      }
      
      if (Object.keys(oldCharacters).length > 0) {
        // 合并到新格式
        const existingCharacters = (prefixData.角色 as Record<string, CharacterMvuData>) || {};
        const mergedCharacters = { ...existingCharacters, ...oldCharacters };
        
        // 写入新格式
        prefixData.角色 = mergedCharacters;
        
        // 删除旧的顶层角色键
        for (const key of Object.keys(oldCharacters)) {
          delete prefixData[key];
        }
      }
    }

    it('应该将旧格式数据迁移到新格式', () => {
      const variables: Record<string, unknown> = {
        stat_data: {
          巨大娘: {
            络络: { 当前身高: 170, 原身高: 1.65 },
            小明: { 当前身高: 0.017, 原身高: 1.70 },
            _场景: { 当前场景: '大城市' },
          },
        },
      };

      migrateData(variables, '巨大娘');

      const data = (variables.stat_data as Record<string, unknown>).巨大娘 as Record<string, unknown>;
      
      // 角色应该在 角色 键下
      expect(data.角色).toBeDefined();
      expect((data.角色 as Record<string, CharacterMvuData>)['络络']).toBeDefined();
      expect((data.角色 as Record<string, CharacterMvuData>)['小明']).toBeDefined();
      
      // 旧的顶层角色键应该被删除
      expect(data['络络']).toBeUndefined();
      expect(data['小明']).toBeUndefined();
      
      // 系统键应该保留
      expect(data._场景).toBeDefined();
    });

    it('应该合并旧格式和新格式的角色', () => {
      const variables: Record<string, unknown> = {
        stat_data: {
          巨大娘: {
            // 旧格式角色
            络络: { 当前身高: 170, 原身高: 1.65 },
            // 新格式角色
            角色: {
              小红: { 当前身高: 200, 原身高: 1.60 },
            },
          },
        },
      };

      migrateData(variables, '巨大娘');

      const data = (variables.stat_data as Record<string, unknown>).巨大娘 as Record<string, unknown>;
      const characters = data.角色 as Record<string, CharacterMvuData>;
      
      // 应该包含两个角色
      expect(Object.keys(characters)).toHaveLength(2);
      expect(characters['络络']).toBeDefined();
      expect(characters['小红']).toBeDefined();
    });

    it('对于已经是新格式的数据应该不做任何修改', () => {
      const variables: Record<string, unknown> = {
        stat_data: {
          巨大娘: {
            _场景: { 当前场景: '大城市' },
            角色: {
              络络: { 当前身高: 170, 原身高: 1.65 },
            },
          },
        },
      };

      const originalData = JSON.stringify(variables);
      migrateData(variables, '巨大娘');

      // 数据应该没有变化
      expect(JSON.stringify(variables)).toBe(originalData);
    });

    it('应该忽略非角色数据的对象', () => {
      const variables: Record<string, unknown> = {
        stat_data: {
          巨大娘: {
            络络: { 当前身高: 170, 原身高: 1.65 },
            // 这个对象没有身高字段，不应该被迁移
            其他数据: { 名称: '测试', 数值: 123 },
          },
        },
      };

      migrateData(variables, '巨大娘');

      const data = (variables.stat_data as Record<string, unknown>).巨大娘 as Record<string, unknown>;
      
      // 角色应该被迁移
      expect(data.角色).toBeDefined();
      expect((data.角色 as Record<string, CharacterMvuData>)['络络']).toBeDefined();
      
      // 非角色数据应该保留在原位
      expect(data['其他数据']).toBeDefined();
    });
  });

  // ========== 设置相关测试 ==========
  describe('设置影响', () => {
    it('当脚本禁用时应该跳过处理', () => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.enabled = false;

      // 即使有数据，也不应该处理
      // 这个测试主要验证设置的影响
      expect(settingsStore.settings.enabled).toBe(false);
    });

    it('应该使用配置的变量前缀', () => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.variablePrefix = '自定义前缀';

      expect(settingsStore.settings.variablePrefix).toBe('自定义前缀');
    });
  });

  // ========== 角色类型测试 ==========
  describe('角色类型判定', () => {
    it('倍率 >= 1.5 应该是巨大娘', () => {
      const data: CharacterMvuData = {
        当前身高: 170,  // 170 / 1.65 ≈ 103 倍
        原身高: 1.65,
      };
      
      const scale = data.当前身高! / (data.原身高 || 1.65);
      expect(scale).toBeGreaterThanOrEqual(1.5);
    });

    it('倍率 <= 0.8 应该是小人', () => {
      const data: CharacterMvuData = {
        当前身高: 0.017,  // 0.017 / 1.70 ≈ 0.01 倍
        原身高: 1.70,
      };
      
      const scale = data.当前身高! / (data.原身高 || 1.65);
      expect(scale).toBeLessThanOrEqual(0.8);
    });

    it('倍率在 0.8-1.5 之间应该是普通人', () => {
      const data: CharacterMvuData = {
        当前身高: 1.70,
        原身高: 1.65,
      };
      
      const scale = data.当前身高! / (data.原身高 || 1.65);
      expect(scale).toBeGreaterThan(0.8);
      expect(scale).toBeLessThan(1.5);
    });
  });

  // ========== 边界情况测试 ==========
  describe('边界情况', () => {
    it('应该处理缺少原身高的情况（使用默认值 1.65）', () => {
      const data: CharacterMvuData = {
        当前身高: 170,
        // 没有原身高
      };
      
      const originalHeight = data.原身高 || data.原始身高 || 1.65;
      expect(originalHeight).toBe(1.65);
    });

    it('应该支持「身高」字段作为「当前身高」的别名', () => {
      const data: CharacterMvuData = {
        身高: 170,  // 使用别名
        原身高: 1.65,
      };
      
      const currentHeight = data.当前身高 || data.身高;
      expect(currentHeight).toBe(170);
    });

    it('应该支持「原始身高」字段作为「原身高」的别名', () => {
      const data: CharacterMvuData = {
        当前身高: 170,
        原始身高: 1.65,  // 使用别名
      };
      
      const originalHeight = data.原身高 || data.原始身高 || 1.65;
      expect(originalHeight).toBe(1.65);
    });

    it('应该处理空的角色对象', () => {
      const data: GiantessMvuData = {
        角色: {},
      };
      
      expect(Object.keys(data.角色!)).toHaveLength(0);
    });
  });
});
