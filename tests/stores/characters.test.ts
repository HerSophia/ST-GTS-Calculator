/**
 * Store: characters 模块测试
 * 验证角色状态管理的正确性
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setupTestPinia } from '../mocks/pinia';
import { useCharactersStoreBase } from '@/stores/characters';
import type { CharacterData, HeightRecord } from '@/types';

/**
 * 创建测试用角色数据
 */
function createMockCharacter(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    name: '测试角色',
    currentHeight: 170,
    originalHeight: 1.65,
    changeReason: '测试原因',
    changeTime: '测试时间',
    ...overrides,
  };
}

/**
 * 创建测试用巨大娘数据
 */
function createMockGiantess(scale: number = 100): CharacterData {
  return createMockCharacter({
    name: '巨大娘',
    currentHeight: 1.65 * scale,
    originalHeight: 1.65,
    changeReason: `变成 ${scale} 倍`,
  });
}

/**
 * 创建测试用小人数据
 */
function createMockTiny(scale: number = 0.01): CharacterData {
  return createMockCharacter({
    name: '小人',
    currentHeight: 1.70 * scale,
    originalHeight: 1.70,
    changeReason: `缩小到 ${scale * 100}%`,
  });
}

describe('Store: characters', () => {
  beforeEach(() => {
    setupTestPinia();
  });

  describe('初始状态', () => {
    it('characters 应该初始为空', () => {
      const store = useCharactersStoreBase();
      expect(store.characters.size).toBe(0);
    });

    it('getCharacterNames 应该返回空数组', () => {
      const store = useCharactersStoreBase();
      expect(store.getCharacterNames()).toEqual([]);
    });

    it('getAllCharacters 应该返回空数组', () => {
      const store = useCharactersStoreBase();
      expect(store.getAllCharacters()).toEqual([]);
    });
  });

  describe('setCharacter', () => {
    it('应该添加新角色', () => {
      const store = useCharactersStoreBase();
      const character = createMockCharacter({ name: '络络' });

      store.setCharacter('络络', character);

      expect(store.characters.size).toBe(1);
      expect(store.getCharacter('络络')).toEqual(character);
    });

    it('应该更新已存在的角色', () => {
      const store = useCharactersStoreBase();
      const character1 = createMockCharacter({ name: '络络', currentHeight: 100 });
      const character2 = createMockCharacter({ name: '络络', currentHeight: 200 });

      store.setCharacter('络络', character1);
      store.setCharacter('络络', character2);

      expect(store.characters.size).toBe(1);
      expect(store.getCharacter('络络')?.currentHeight).toBe(200);
    });

    it('应该支持添加多个角色', () => {
      const store = useCharactersStoreBase();
      const giantess = createMockGiantess(100);
      const tiny = createMockTiny(0.01);

      store.setCharacter('巨大娘', giantess);
      store.setCharacter('小人', tiny);

      expect(store.characters.size).toBe(2);
      expect(store.getCharacterNames()).toContain('巨大娘');
      expect(store.getCharacterNames()).toContain('小人');
    });
  });

  describe('getCharacter', () => {
    it('应该返回存在的角色', () => {
      const store = useCharactersStoreBase();
      const character = createMockCharacter({ name: '络络' });
      store.setCharacter('络络', character);

      const result = store.getCharacter('络络');
      expect(result).toEqual(character);
    });

    it('应该返回 undefined 对于不存在的角色', () => {
      const store = useCharactersStoreBase();

      const result = store.getCharacter('不存在');
      expect(result).toBeUndefined();
    });
  });

  describe('removeCharacter', () => {
    it('应该删除存在的角色', () => {
      const store = useCharactersStoreBase();
      store.setCharacter('络络', createMockCharacter({ name: '络络' }));

      store.removeCharacter('络络');

      expect(store.characters.size).toBe(0);
      expect(store.getCharacter('络络')).toBeUndefined();
    });

    it('删除不存在的角色不应该报错', () => {
      const store = useCharactersStoreBase();

      expect(() => store.removeCharacter('不存在')).not.toThrow();
    });

    it('只应该删除指定的角色', () => {
      const store = useCharactersStoreBase();
      store.setCharacter('角色A', createMockCharacter({ name: '角色A' }));
      store.setCharacter('角色B', createMockCharacter({ name: '角色B' }));

      store.removeCharacter('角色A');

      expect(store.characters.size).toBe(1);
      expect(store.getCharacter('角色A')).toBeUndefined();
      expect(store.getCharacter('角色B')).toBeDefined();
    });
  });

  describe('clear', () => {
    it('应该清空所有角色', () => {
      const store = useCharactersStoreBase();
      store.setCharacter('角色A', createMockCharacter({ name: '角色A' }));
      store.setCharacter('角色B', createMockCharacter({ name: '角色B' }));
      store.setCharacter('角色C', createMockCharacter({ name: '角色C' }));

      store.clear();

      expect(store.characters.size).toBe(0);
      expect(store.getAllCharacters()).toEqual([]);
    });

    it('清空空 store 不应该报错', () => {
      const store = useCharactersStoreBase();

      expect(() => store.clear()).not.toThrow();
    });
  });

  describe('getCharacterNames', () => {
    it('应该返回所有角色名称', () => {
      const store = useCharactersStoreBase();
      store.setCharacter('络络', createMockCharacter({ name: '络络' }));
      store.setCharacter('小明', createMockCharacter({ name: '小明' }));

      const names = store.getCharacterNames();

      expect(names).toHaveLength(2);
      expect(names).toContain('络络');
      expect(names).toContain('小明');
    });
  });

  describe('getAllCharacters', () => {
    it('应该返回所有角色数据', () => {
      const store = useCharactersStoreBase();
      const character1 = createMockCharacter({ name: '角色1' });
      const character2 = createMockCharacter({ name: '角色2' });
      store.setCharacter('角色1', character1);
      store.setCharacter('角色2', character2);

      const characters = store.getAllCharacters();

      expect(characters).toHaveLength(2);
      expect(characters).toContainEqual(character1);
      expect(characters).toContainEqual(character2);
    });
  });

  describe('updateCharacter', () => {
    it('应该更新角色的部分数据', () => {
      const store = useCharactersStoreBase();
      store.setCharacter('络络', createMockCharacter({
        name: '络络',
        currentHeight: 100,
        changeReason: '原始原因',
      }));

      store.updateCharacter('络络', {
        currentHeight: 200,
        changeReason: '新原因',
      });

      const updated = store.getCharacter('络络');
      expect(updated?.currentHeight).toBe(200);
      expect(updated?.changeReason).toBe('新原因');
      // 其他字段应该保持不变
      expect(updated?.name).toBe('络络');
      expect(updated?.originalHeight).toBe(1.65);
    });

    it('更新不存在的角色不应该有任何效果', () => {
      const store = useCharactersStoreBase();

      store.updateCharacter('不存在', { currentHeight: 200 });

      expect(store.characters.size).toBe(0);
    });
  });

  describe('addHistory', () => {
    it('应该添加历史记录', () => {
      const store = useCharactersStoreBase();
      store.setCharacter('络络', createMockCharacter({ name: '络络' }));

      const record: HeightRecord = {
        height: 100,
        heightFormatted: '100米',
        time: '第一天',
        reason: '喝下药水',
      };

      store.addHistory('络络', record);

      const character = store.getCharacter('络络');
      expect(character?.history).toHaveLength(1);
      expect(character?.history?.[0]).toEqual(record);
    });

    it('应该追加多条历史记录', () => {
      const store = useCharactersStoreBase();
      store.setCharacter('络络', createMockCharacter({ name: '络络' }));

      store.addHistory('络络', {
        height: 100,
        heightFormatted: '100米',
        time: '第一天',
        reason: '变大',
      });
      store.addHistory('络络', {
        height: 200,
        heightFormatted: '200米',
        time: '第二天',
        reason: '继续变大',
      });

      const character = store.getCharacter('络络');
      expect(character?.history).toHaveLength(2);
      expect(character?.history?.[0].height).toBe(100);
      expect(character?.history?.[1].height).toBe(200);
    });

    it('应该限制历史记录数量', () => {
      const store = useCharactersStoreBase();
      store.setCharacter('络络', createMockCharacter({ name: '络络' }));

      // 添加 25 条记录，限制 20 条
      for (let i = 0; i < 25; i++) {
        store.addHistory('络络', {
          height: i * 10,
          heightFormatted: `${i * 10}米`,
          time: `第${i}天`,
          reason: `变化${i}`,
        }, 20);
      }

      const character = store.getCharacter('络络');
      expect(character?.history).toHaveLength(20);
      // 最早的记录应该被移除
      expect(character?.history?.[0].height).toBe(50); // 第 5 条
      expect(character?.history?.[19].height).toBe(240); // 第 24 条
    });

    it('添加历史到不存在的角色不应该有任何效果', () => {
      const store = useCharactersStoreBase();

      store.addHistory('不存在', {
        height: 100,
        heightFormatted: '100米',
        time: '第一天',
        reason: '变化',
      });

      expect(store.characters.size).toBe(0);
    });
  });

  describe('getAllCharacterInfo', () => {
    it('应该返回所有角色的简要信息', () => {
      const store = useCharactersStoreBase();
      store.setCharacter('巨大娘', createMockGiantess(100));
      store.setCharacter('小人', createMockTiny(0.01));

      const info = store.getAllCharacterInfo();

      expect(info).toHaveLength(2);
      expect(info.find(c => c.name === '巨大娘')?.height).toBe(165);
      expect(info.find(c => c.name === '小人')?.height).toBeCloseTo(0.017, 3);
    });

    it('应该包含 calcData 和 damageData', () => {
      const store = useCharactersStoreBase();
      const characterWithData = createMockCharacter({
        name: '测试',
        calcData: { 倍率: 100 } as any,
        damageData: { 破坏力级别: '城市级' } as any,
      });
      store.setCharacter('测试', characterWithData);

      const info = store.getAllCharacterInfo();

      expect(info[0].calcData).toBeDefined();
      expect(info[0].damageData).toBeDefined();
    });
  });

  describe('getDamageSummary', () => {
    it('应该返回空数据对于空 store', () => {
      const store = useCharactersStoreBase();

      const summary = store.getDamageSummary();

      expect(summary.giantCount).toBe(0);
      expect(summary.tinyCount).toBe(0);
      expect(summary.totalCasualties.min).toBe(0);
      expect(summary.totalCasualties.max).toBe(0);
      expect(summary.totalBuildings.min).toBe(0);
      expect(summary.totalBuildings.max).toBe(0);
    });

    it('应该正确统计巨大娘和小人数量', () => {
      const store = useCharactersStoreBase();
      store.setCharacter('巨大娘1', createMockGiantess(100));
      store.setCharacter('巨大娘2', createMockGiantess(50));
      store.setCharacter('小人', createMockTiny(0.01));

      const summary = store.getDamageSummary();

      expect(summary.giantCount).toBe(2);
      expect(summary.tinyCount).toBe(1);
    });

    it('应该汇总损害数据', () => {
      const store = useCharactersStoreBase();
      store.setCharacter('巨大娘1', {
        ...createMockGiantess(100),
        damageData: {
          单步损害: {
            小人伤亡: { 最小估计: 100, 最大估计: 200 },
            建筑损毁: { 最小估计: 5, 最大估计: 10 },
          },
        } as any,
      });
      store.setCharacter('巨大娘2', {
        ...createMockGiantess(200),
        damageData: {
          单步损害: {
            小人伤亡: { 最小估计: 300, 最大估计: 500 },
            建筑损毁: { 最小估计: 15, 最大估计: 25 },
          },
        } as any,
      });

      const summary = store.getDamageSummary();

      expect(summary.totalCasualties.min).toBe(400);
      expect(summary.totalCasualties.max).toBe(700);
      expect(summary.totalBuildings.min).toBe(20);
      expect(summary.totalBuildings.max).toBe(35);
    });

    it('应该使用提供的场景名称', () => {
      const store = useCharactersStoreBase();

      const summary = store.getDamageSummary('东京市中心');

      expect(summary.scenario).toBe('东京市中心');
    });

    it('应该使用默认场景名称', () => {
      const store = useCharactersStoreBase();

      const summary = store.getDamageSummary();

      expect(summary.scenario).toBe('大城市');
    });
  });

  describe('消息页数据隔离', () => {
    describe('getCurrentMessageId', () => {
      it('初始应该为 null', () => {
        const store = useCharactersStoreBase();
        expect(store.getCurrentMessageId()).toBeNull();
      });
    });

    describe('setCurrentMessageId', () => {
      it('首次设置消息 ID 应该返回 true', () => {
        const store = useCharactersStoreBase();
        
        const result = store.setCurrentMessageId(1);
        
        expect(result).toBe(true);
        expect(store.getCurrentMessageId()).toBe(1);
      });

      it('设置相同的消息 ID 应该返回 false', () => {
        const store = useCharactersStoreBase();
        store.setCurrentMessageId(1);
        
        const result = store.setCurrentMessageId(1);
        
        expect(result).toBe(false);
      });

      it('切换消息 ID 应该清空角色数据', () => {
        const store = useCharactersStoreBase();
        store.setCurrentMessageId(1);
        store.setCharacter('角色A', createMockCharacter({ name: '角色A' }));
        store.setCharacter('角色B', createMockCharacter({ name: '角色B' }));
        expect(store.characters.size).toBe(2);
        
        const result = store.setCurrentMessageId(2);
        
        expect(result).toBe(true);
        expect(store.characters.size).toBe(0);
        expect(store.getCurrentMessageId()).toBe(2);
      });

      it('切换消息 ID 应该清空场景数据', () => {
        const store = useCharactersStoreBase();
        store.setCurrentMessageId(1);
        store.setScenario({ 当前场景: '大城市', 场景原因: '测试' });
        
        store.setCurrentMessageId(2);
        
        expect(store.scenario).toEqual({});
      });

      it('切换消息 ID 应该清空互动限制', () => {
        const store = useCharactersStoreBase();
        store.setCurrentMessageId(1);
        store.setInteractions({ 'A_B': { sizeRatio: 100, impossible: [], possible: [] } as any });
        
        store.setCurrentMessageId(2);
        
        expect(store.getAllInteractions()).toEqual({});
      });

      it('支持 "latest" 作为消息 ID', () => {
        const store = useCharactersStoreBase();
        
        const result = store.setCurrentMessageId('latest');
        
        expect(result).toBe(true);
        expect(store.getCurrentMessageId()).toBe('latest');
      });

      it('从 "latest" 切换到数字 ID 应该清空数据', () => {
        const store = useCharactersStoreBase();
        store.setCurrentMessageId('latest');
        store.setCharacter('角色', createMockCharacter({ name: '角色' }));
        
        const result = store.setCurrentMessageId(5);
        
        expect(result).toBe(true);
        expect(store.characters.size).toBe(0);
      });
    });

    describe('clearAll', () => {
      it('应该清空消息 ID', () => {
        const store = useCharactersStoreBase();
        store.setCurrentMessageId(1);
        store.setCharacter('角色', createMockCharacter({ name: '角色' }));
        
        store.clearAll();
        
        expect(store.getCurrentMessageId()).toBeNull();
        expect(store.characters.size).toBe(0);
      });
    });

    describe('数据隔离场景', () => {
      it('不同消息的角色数据应该完全隔离', () => {
        const store = useCharactersStoreBase();
        
        // 消息 1 的数据
        store.setCurrentMessageId(1);
        store.setCharacter('络络', createMockCharacter({ 
          name: '络络', 
          currentHeight: 100,
        }));
        
        // 切换到消息 2
        store.setCurrentMessageId(2);
        
        // 消息 1 的数据应该被清空
        expect(store.getCharacter('络络')).toBeUndefined();
        
        // 添加消息 2 的数据
        store.setCharacter('络络', createMockCharacter({ 
          name: '络络', 
          currentHeight: 200,
        }));
        
        // 验证消息 2 的数据
        expect(store.getCharacter('络络')?.currentHeight).toBe(200);
      });

      it('同名角色在不同消息中可以有不同数据', () => {
        const store = useCharactersStoreBase();
        
        // 模拟切换回消息 1（假设重新从变量读取）
        store.setCurrentMessageId(1);
        store.setCharacter('络络', createMockCharacter({ 
          name: '络络', 
          currentHeight: 100,
          changeReason: '消息1的原因',
        }));
        expect(store.getCharacter('络络')?.currentHeight).toBe(100);
        
        // 切换到消息 2
        store.setCurrentMessageId(2);
        store.setCharacter('络络', createMockCharacter({ 
          name: '络络', 
          currentHeight: 500,
          changeReason: '消息2的原因',
        }));
        expect(store.getCharacter('络络')?.currentHeight).toBe(500);
        expect(store.getCharacter('络络')?.changeReason).toBe('消息2的原因');
      });
    });
  });
});
