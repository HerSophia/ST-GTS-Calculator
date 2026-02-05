/**
 * 变量写入服务测试
 * 
 * 测试写入角色数据到楼层变量的功能
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { variablesMock, mvuMock } from '../../setup';
import { useSettingsStore } from '@/stores/settings';
import {
  getCharacterPath,
  writeCharacterCalcData,
  writeCharacterDamageData,
  addHeightHistoryInternal,
  batchUpdateCharacters,
  writeInteractionLimits,
  writeScenarioData,
  deleteCharacterData,
  clearAllGiantessData,
  migrateOldDataFormat,
  appendToArray,
} from '@/services/variables/writer';
import type { CalculationData, MvuHeightRecord } from '@/types/variables';
import type { DamageCalculation } from '@/types/damage';

describe('Service: variables/writer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mvuMock.__reset();
    variablesMock.__reset();
  });

  // ========== getCharacterPath ==========
  describe('getCharacterPath', () => {
    it('应该生成正确的角色路径', () => {
      const path = getCharacterPath('巨大娘', '络络');

      expect(path).toBe('stat_data.巨大娘.角色.络络');
    });

    it('应该使用自定义前缀', () => {
      const path = getCharacterPath('自定义', '角色A');

      expect(path).toBe('stat_data.自定义.角色.角色A');
    });

    it('应该处理特殊字符的角色名', () => {
      const path = getCharacterPath('巨大娘', '角色_A');

      expect(path).toBe('stat_data.巨大娘.角色.角色_A');
    });
  });

  // ========== writeCharacterCalcData ==========
  describe('writeCharacterCalcData', () => {
    it('应该写入计算数据', () => {
      const calcData = {
        当前身高: 170,
        当前身高_格式化: '170米',
        原身高: 1.65,
        倍率: 103.03,
        级别: 'Kilo级',
        级别描述: '城市踩在脚下',
        描述: '城市踩在脚下',
        身体部位: {},
        身体部位_格式化: {},
        自定义部位: {},
        自定义部位_倍率: {},
        眼中的世界: {},
        眼中的世界_格式化: {},
        _计算时间: Date.now(),
        _版本: '3.0.0',
      } as CalculationData;

      writeCharacterCalcData('络络', calcData);

      expect(variablesMock.updateVariablesWith).toHaveBeenCalled();
    });

    it('应该支持指定 messageId', () => {
      const calcData = {
        当前身高: 170,
        当前身高_格式化: '170米',
        原身高: 1.65,
        倍率: 103.03,
        级别: 'Kilo级',
        级别描述: '',
        描述: '',
        身体部位: {},
        身体部位_格式化: {},
        自定义部位: {},
        自定义部位_倍率: {},
        眼中的世界: {},
        眼中的世界_格式化: {},
        _计算时间: Date.now(),
        _版本: '3.0.0',
      } as CalculationData;

      writeCharacterCalcData('络络', calcData, { messageId: 10 });

      expect(variablesMock.updateVariablesWith).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ message_id: 10 })
      );
    });
  });

  // ========== writeCharacterDamageData ==========
  describe('writeCharacterDamageData', () => {
    it('应该写入损害数据', () => {
      const damageData = {
        破坏力等级: '中等城市级',
        场景: '大城市',
        足迹面积: 100,
        单步损害: {
          小人伤亡: { 数值: 1000, 格式化: '1千人' },
          建筑损毁: { 数值: 10, 格式化: '10栋' },
        },
      } as unknown as DamageCalculation;

      writeCharacterDamageData('络络', damageData);

      expect(variablesMock.updateVariablesWith).toHaveBeenCalled();
    });
  });

  // ========== addHeightHistoryInternal ==========
  describe('addHeightHistoryInternal', () => {
    it('应该添加历史记录到变量对象', () => {
      const variables: Record<string, unknown> = {
        stat_data: {
          巨大娘: {
            角色: {
              络络: {},
            },
          },
        },
      };

      addHeightHistoryInternal(variables, '巨大娘', '络络', 170, '喝下药水', '第一天');

      const history = _.get(variables, 'stat_data.巨大娘.角色.络络._身高历史') as MvuHeightRecord[];

      expect(history).toBeDefined();
      expect(history).toHaveLength(1);
      expect(history[0].身高).toBe(170);
      expect(history[0].原因).toBe('喝下药水');
      expect(history[0].时间点).toBe('第一天');
    });

    it('当身高没有变化时不应该添加记录', () => {
      const variables: Record<string, unknown> = {
        stat_data: {
          巨大娘: {
            角色: {
              络络: {
                _身高历史: [
                  { 身高: 170, 时间戳: Date.now() },
                ],
              },
            },
          },
        },
      };

      addHeightHistoryInternal(variables, '巨大娘', '络络', 170, '再次测试');

      const history = _.get(variables, 'stat_data.巨大娘.角色.络络._身高历史') as MvuHeightRecord[];

      expect(history).toHaveLength(1); // 没有新增
    });

    it('应该记录变化类型（增大/缩小）', () => {
      const variables: Record<string, unknown> = {
        stat_data: {
          巨大娘: {
            角色: {
              络络: {
                _身高历史: [
                  { 身高: 100, 时间戳: Date.now() },
                ],
              },
            },
          },
        },
      };

      // 增大
      addHeightHistoryInternal(variables, '巨大娘', '络络', 200, '增大测试');

      let history = _.get(variables, 'stat_data.巨大娘.角色.络络._身高历史') as MvuHeightRecord[];
      expect(history[1].变化).toBe('增大');
      expect(history[1].变化倍率).toBe(2); // 200/100

      // 缩小
      addHeightHistoryInternal(variables, '巨大娘', '络络', 50, '缩小测试');

      history = _.get(variables, 'stat_data.巨大娘.角色.络络._身高历史') as MvuHeightRecord[];
      expect(history[2].变化).toBe('缩小');
      expect(history[2].变化倍率).toBe(0.25); // 50/200
    });

    it('应该限制历史记录数量', () => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.maxHistoryRecords = 3;

      const variables: Record<string, unknown> = {
        stat_data: {
          巨大娘: {
            角色: {
              络络: {
                _身高历史: [
                  { 身高: 100, 时间戳: 1 },
                  { 身高: 200, 时间戳: 2 },
                  { 身高: 300, 时间戳: 3 },
                ],
              },
            },
          },
        },
      };

      addHeightHistoryInternal(variables, '巨大娘', '络络', 400, '第4次');

      const history = _.get(variables, 'stat_data.巨大娘.角色.络络._身高历史') as MvuHeightRecord[];

      expect(history).toHaveLength(3); // 限制为 3 条
      expect(history[0].身高).toBe(200); // 第一条被删除
      expect(history[2].身高).toBe(400); // 新增的在最后
    });
  });

  // ========== batchUpdateCharacters ==========
  describe('batchUpdateCharacters', () => {
    it('应该批量更新多个角色', () => {
      const updates = [
        { name: '络络', data: { 当前身高: 170 } },
        { name: '小明', data: { 当前身高: 0.017 } },
      ];

      batchUpdateCharacters(updates);

      expect(variablesMock.updateVariablesWith).toHaveBeenCalled();
    });

    it('应该跳过空更新数组', () => {
      batchUpdateCharacters([]);

      expect(variablesMock.updateVariablesWith).not.toHaveBeenCalled();
    });

    it('应该跳过 undefined 值', () => {
      const updates = [
        {
          name: '络络',
          data: {
            当前身高: 170,
            变化原因: undefined, // 应该被跳过
          },
        },
      ];

      batchUpdateCharacters(updates);

      expect(variablesMock.updateVariablesWith).toHaveBeenCalled();
    });
  });

  // ========== writeInteractionLimits ==========
  describe('writeInteractionLimits', () => {
    it('应该写入互动限制数据', () => {
      const interactions = {
        '络络_小明': {
          大者: '络络',
          小者: '小明',
          倍率差: 10000,
          impossible: [],
        },
      };

      writeInteractionLimits(interactions as unknown as Record<string, import('@/types/interactions').PairwiseInteraction>);

      expect(variablesMock.updateVariablesWith).toHaveBeenCalled();
    });
  });

  // ========== writeScenarioData ==========
  describe('writeScenarioData', () => {
    it('应该写入场景数据', () => {
      writeScenarioData('东京市中心', '角色来到了市中心');

      expect(variablesMock.updateVariablesWith).toHaveBeenCalled();
    });

    it('应该支持不带原因的场景', () => {
      writeScenarioData('大城市');

      expect(variablesMock.updateVariablesWith).toHaveBeenCalled();
    });
  });

  // ========== deleteCharacterData ==========
  describe('deleteCharacterData', () => {
    it('应该删除角色数据', () => {
      deleteCharacterData('络络');

      expect(variablesMock.updateVariablesWith).toHaveBeenCalled();
    });
  });

  // ========== clearAllGiantessData ==========
  describe('clearAllGiantessData', () => {
    it('应该清空所有巨大娘数据', () => {
      clearAllGiantessData();

      expect(variablesMock.updateVariablesWith).toHaveBeenCalled();
    });
  });

  // ========== migrateOldDataFormat ==========
  describe('migrateOldDataFormat', () => {
    it('应该迁移旧格式数据到新格式', () => {
      // 模拟 updateVariablesWith 的行为
      variablesMock.updateVariablesWith.mockImplementation((updater) => {
        const oldVariables = {
          stat_data: {
            巨大娘: {
              络络: { 当前身高: 170, 原身高: 1.65 },
              小明: { 当前身高: 0.017, 原身高: 1.70 },
              _场景: { 当前场景: '大城市' },
            },
          },
        };

        return updater(oldVariables);
      });

      const count = migrateOldDataFormat();

      expect(count).toBe(2); // 迁移了 2 个角色
    });

    it('对于已经是新格式的数据应该返回 0', () => {
      variablesMock.updateVariablesWith.mockImplementation((updater) => {
        const newVariables = {
          stat_data: {
            巨大娘: {
              _场景: { 当前场景: '大城市' },
              角色: {
                络络: { 当前身高: 170 },
              },
            },
          },
        };

        return updater(newVariables);
      });

      const count = migrateOldDataFormat();

      expect(count).toBe(0); // 没有需要迁移的
    });

    it('当没有数据时应该返回 0', () => {
      variablesMock.updateVariablesWith.mockImplementation((updater) => {
        return updater({});
      });

      const count = migrateOldDataFormat();

      expect(count).toBe(0);
    });
  });

  // ========== appendToArray ==========
  describe('appendToArray', () => {
    it('应该追加新元素', () => {
      let savedVariables: Record<string, unknown> = {
        test_array: [],
      };

      variablesMock.updateVariablesWith.mockImplementation((updater) => {
        savedVariables = updater(savedVariables) as Record<string, unknown>;
        return savedVariables;
      });

      const result = appendToArray<{ id: number; name: string }>(
        'test_array',
        { id: 1, name: '测试' },
        'id'
      );

      expect(result).toBe(true);
      expect(savedVariables.test_array).toEqual([{ id: 1, name: '测试' }]);
    });

    it('相同去重键应该跳过', () => {
      let savedVariables: Record<string, unknown> = {
        test_array: [{ id: 1, name: '已存在' }],
      };

      variablesMock.updateVariablesWith.mockImplementation((updater) => {
        savedVariables = updater(savedVariables) as Record<string, unknown>;
        return savedVariables;
      });

      const result = appendToArray<{ id: number; name: string }>(
        'test_array',
        { id: 1, name: '新的' }, // id 相同
        'id'
      );

      expect(result).toBe(false);
      // 数组应该保持不变
      expect(savedVariables.test_array).toEqual([{ id: 1, name: '已存在' }]);
    });

    it('空数组时应该创建数组并追加', () => {
      let savedVariables: Record<string, unknown> = {}; // 没有 test_array

      variablesMock.updateVariablesWith.mockImplementation((updater) => {
        savedVariables = updater(savedVariables) as Record<string, unknown>;
        return savedVariables;
      });

      const result = appendToArray<{ id: number }>(
        'test_array',
        { id: 1 },
        'id'
      );

      expect(result).toBe(true);
      expect(savedVariables.test_array).toEqual([{ id: 1 }]);
    });

    it('应该支持函数类型的去重键', () => {
      let savedVariables: Record<string, unknown> = {
        events: [
          { 描述: '事件A', 时间点: '第一天' },
        ],
      };

      variablesMock.updateVariablesWith.mockImplementation((updater) => {
        savedVariables = updater(savedVariables) as Record<string, unknown>;
        return savedVariables;
      });

      // 相同的描述+时间点组合应该跳过
      const result1 = appendToArray<{ 描述: string; 时间点: string }>(
        'events',
        { 描述: '事件A', 时间点: '第一天' },
        (item) => `${item.描述}_${item.时间点}`
      );

      expect(result1).toBe(false);

      // 不同的组合应该追加
      const result2 = appendToArray<{ 描述: string; 时间点: string }>(
        'events',
        { 描述: '事件B', 时间点: '第二天' },
        (item) => `${item.描述}_${item.时间点}`
      );

      expect(result2).toBe(true);
      expect(savedVariables.events).toHaveLength(2);
    });

    it('应该处理嵌套路径', () => {
      let savedVariables: Record<string, unknown> = {
        stat_data: {
          巨大娘: {
            角色: {
              络络: {
                _重大事件: [],
              },
            },
          },
        },
      };

      variablesMock.updateVariablesWith.mockImplementation((updater) => {
        savedVariables = updater(savedVariables) as Record<string, unknown>;
        return savedVariables;
      });

      const result = appendToArray<{ id: string; 描述: string }>(
        'stat_data.巨大娘.角色.络络._重大事件',
        { id: 'evt1', 描述: '踩平了一个街区' },
        'id'
      );

      expect(result).toBe(true);
      const events = _.get(savedVariables, 'stat_data.巨大娘.角色.络络._重大事件');
      expect(events).toEqual([{ id: 'evt1', 描述: '踩平了一个街区' }]);
    });

    it('如果路径上的值不是数组应该重置为数组', () => {
      let savedVariables: Record<string, unknown> = {
        test_array: 'not an array', // 错误的类型
      };

      variablesMock.updateVariablesWith.mockImplementation((updater) => {
        savedVariables = updater(savedVariables) as Record<string, unknown>;
        return savedVariables;
      });

      const result = appendToArray<{ id: number }>(
        'test_array',
        { id: 1 },
        'id'
      );

      expect(result).toBe(true);
      expect(Array.isArray(savedVariables.test_array)).toBe(true);
      expect(savedVariables.test_array).toEqual([{ id: 1 }]);
    });

    it('应该支持指定 messageId', () => {
      variablesMock.updateVariablesWith.mockImplementation((updater) => {
        return updater({ test_array: [] });
      });

      appendToArray<{ id: number }>(
        'test_array',
        { id: 1 },
        'id',
        { messageId: 10 }
      );

      expect(variablesMock.updateVariablesWith).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ message_id: 10 })
      );
    });
  });
});
