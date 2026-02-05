/**
 * Core: items 模块测试
 * 验证物品计算逻辑的正确性
 */
import { describe, it, expect } from 'vitest';
import {
  PRESET_ITEMS,
  calculateItem,
  calculateCharacterItems,
  generateItemsPrompt,
  formatItemsCompact,
} from '@/core/items';
import type { ItemDefinition, CharacterItems } from '@/types';

describe('Core: items', () => {
  describe('PRESET_ITEMS', () => {
    it('应该包含各种类型的预设物品', () => {
      expect(PRESET_ITEMS).toHaveProperty('智能手机');
      expect(PRESET_ITEMS).toHaveProperty('戒指');
      expect(PRESET_ITEMS).toHaveProperty('高跟鞋');
      expect(PRESET_ITEMS).toHaveProperty('苹果');
      expect(PRESET_ITEMS).toHaveProperty('轿车');
    });

    it('每个预设物品应该有必要的字段', () => {
      for (const [name, item] of Object.entries(PRESET_ITEMS)) {
        expect(item.名称, `${name} 应该有名称`).toBeTruthy();
        expect(item.原始尺寸, `${name} 应该有原始尺寸`).toBeDefined();
        expect(item.类型, `${name} 应该有类型`).toBeTruthy();
        expect(item.材质, `${name} 应该有材质`).toBeTruthy();
      }
    });

    it('物品尺寸应该是合理的正数', () => {
      for (const [name, item] of Object.entries(PRESET_ITEMS)) {
        const dims = item.原始尺寸;
        if (dims.长 !== undefined) {
          expect(dims.长, `${name}.长`).toBeGreaterThan(0);
        }
        if (dims.宽 !== undefined) {
          expect(dims.宽, `${name}.宽`).toBeGreaterThan(0);
        }
        if (dims.高 !== undefined) {
          expect(dims.高, `${name}.高`).toBeGreaterThan(0);
        }
        if (dims.直径 !== undefined) {
          expect(dims.直径, `${name}.直径`).toBeGreaterThan(0);
        }
        if (dims.重量 !== undefined) {
          expect(dims.重量, `${name}.重量`).toBeGreaterThan(0);
        }
      }
    });

    it('应该包含不同类型的物品', () => {
      const types = new Set(Object.values(PRESET_ITEMS).map(item => item.类型));
      expect(types.has('日用品')).toBe(true);
      expect(types.has('配饰')).toBe(true);
      expect(types.has('服装')).toBe(true);
      expect(types.has('食物')).toBe(true);
      expect(types.has('交通工具')).toBe(true);
    });

    it('应该包含不同材质的物品', () => {
      const materials = new Set(Object.values(PRESET_ITEMS).map(item => item.材质));
      expect(materials.has('金属')).toBe(true);
      expect(materials.has('玻璃')).toBe(true);
      expect(materials.has('皮革')).toBe(true);
    });
  });

  describe('calculateItem', () => {
    const testPhone: ItemDefinition = {
      名称: '测试手机',
      原始尺寸: { 长: 0.15, 宽: 0.07, 高: 0.008, 重量: 0.2 },
      类型: '日用品',
      材质: '玻璃',
    };

    describe('基本计算', () => {
      it('应该返回物品定义', () => {
        const result = calculateItem(testPhone, 1);
        expect(result.定义).toBe(testPhone);
      });

      it('1 倍缩放应该保持原尺寸', () => {
        const result = calculateItem(testPhone, 1);

        expect(result.缩放尺寸.长).toBeCloseTo(0.15);
        expect(result.缩放尺寸.宽).toBeCloseTo(0.07);
        expect(result.缩放尺寸.高).toBeCloseTo(0.008);
      });

      it('应该正确缩放尺寸', () => {
        const scale = 100;
        const result = calculateItem(testPhone, scale, true);

        expect(result.缩放尺寸.长).toBeCloseTo(0.15 * scale);
        expect(result.缩放尺寸.宽).toBeCloseTo(0.07 * scale);
        expect(result.缩放尺寸.高).toBeCloseTo(0.008 * scale);
      });

      it('重量应该按体积（三次方）缩放', () => {
        const scale = 10;
        const result = calculateItem(testPhone, scale, true);

        // 重量 = 原重量 × scale³
        expect(result.缩放尺寸.重量).toBeCloseTo(0.2 * Math.pow(scale, 3));
      });

      it('应该生成格式化尺寸', () => {
        const result = calculateItem(testPhone, 100, true);

        expect(result.缩放尺寸_格式化.长).toBeTruthy();
        expect(result.缩放尺寸_格式化.宽).toBeTruthy();
        expect(result.缩放尺寸_格式化.高).toBeTruthy();
        expect(result.缩放尺寸_格式化.重量).toBeTruthy();
      });
    });

    describe('随身携带物品', () => {
      it('isCarried=true 时应该缩放', () => {
        const result = calculateItem(testPhone, 100, true);
        expect(result.缩放尺寸.长).toBeCloseTo(15);
      });

      it('isCarried=false 时不应该缩放', () => {
        const result = calculateItem(testPhone, 100, false);
        expect(result.缩放尺寸.长).toBeCloseTo(0.15);
      });

      it('物品自带 随身携带=true 时应该缩放', () => {
        const carriedItem: ItemDefinition = {
          ...testPhone,
          随身携带: true,
        };
        const result = calculateItem(carriedItem, 100);
        expect(result.缩放尺寸.长).toBeCloseTo(15);
      });
    });

    describe('相对参照', () => {
      it('应该计算角色视角参照', () => {
        const result = calculateItem(testPhone, 100);

        expect(result.角色视角).toBeDefined();
        expect(result.角色视角.length).toBeGreaterThan(0);
      });

      it('角色视角应该包含必要字段', () => {
        const result = calculateItem(testPhone, 100);

        for (const ref of result.角色视角) {
          expect(ref.参照物).toBeTruthy();
          expect(ref.描述).toBeTruthy();
          expect(ref.比例).toBeGreaterThan(0);
        }
      });

      it('应该计算普通人视角参照', () => {
        const result = calculateItem(testPhone, 100, true);

        expect(result.普通人视角).toBeDefined();
        expect(result.普通人视角.length).toBeGreaterThan(0);
      });

      it('普通人视角应该包含必要字段', () => {
        const result = calculateItem(testPhone, 100, true);

        for (const ref of result.普通人视角) {
          expect(ref.参照物).toBeTruthy();
          expect(ref.描述).toBeTruthy();
          expect(ref.比例).toBeGreaterThan(0);
        }
      });
    });

    describe('互动可能性', () => {
      it('应该计算互动可能性', () => {
        const result = calculateItem(testPhone, 1);

        expect(result.互动可能性).toBeDefined();
        expect(result.互动可能性.length).toBeGreaterThan(0);
      });

      it('每个互动应该有必要字段', () => {
        const result = calculateItem(testPhone, 1);

        for (const interaction of result.互动可能性) {
          expect(interaction.名称).toBeTruthy();
          expect(typeof interaction.可行).toBe('boolean');
          expect(interaction.描述).toBeTruthy();
        }
      });

      it('小物品应该可以单手握持', () => {
        const result = calculateItem(testPhone, 1);

        const singleHand = result.互动可能性.find(i => i.名称 === '单手握持');
        expect(singleHand?.可行).toBe(true);
      });

      it('小物品应该可以指尖捏取', () => {
        const ring: ItemDefinition = {
          名称: '戒指',
          原始尺寸: { 直径: 0.018, 高: 0.005, 重量: 0.005 },
          类型: '配饰',
          材质: '金属',
        };
        const result = calculateItem(ring, 1);

        const pinch = result.互动可能性.find(i => i.名称 === '指尖捏取');
        expect(pinch?.可行).toBe(true);
      });

      it('大物品应该无法单手握持', () => {
        const car: ItemDefinition = {
          名称: '轿车',
          原始尺寸: { 长: 4.5, 宽: 1.8, 高: 1.5, 重量: 1500 },
          类型: '交通工具',
          材质: '金属',
        };
        const result = calculateItem(car, 1);

        const singleHand = result.互动可能性.find(i => i.名称 === '单手握持');
        expect(singleHand?.可行).toBe(false);
      });
    });

    describe('食物互动', () => {
      const apple: ItemDefinition = {
        名称: '苹果',
        原始尺寸: { 直径: 0.08, 重量: 0.2 },
        类型: '食物',
        材质: '食材',
      };

      it('食物应该有咬食相关互动', () => {
        const result = calculateItem(apple, 1);

        const eating = result.互动可能性.find(
          i => i.名称 === '一口吞下' || i.名称 === '咬食'
        );
        expect(eating).toBeDefined();
      });

      it('小食物应该可以一口吞下', () => {
        const smallFood: ItemDefinition = {
          名称: '葡萄',
          原始尺寸: { 直径: 0.02, 重量: 0.01 },
          类型: '食物',
          材质: '食材',
        };
        const result = calculateItem(smallFood, 1);

        const swallow = result.互动可能性.find(i => i.名称 === '一口吞下');
        expect(swallow?.可行).toBe(true);
      });
    });

    describe('穿戴互动', () => {
      const ring: ItemDefinition = {
        名称: '戒指',
        原始尺寸: { 直径: 0.018, 高: 0.005, 重量: 0.005 },
        类型: '配饰',
        材质: '金属',
        随身携带: true,
      };

      it('配饰应该有穿戴互动', () => {
        const result = calculateItem(ring, 1);

        const wear = result.互动可能性.find(i => i.名称 === '穿戴');
        expect(wear).toBeDefined();
      });

      it('随身携带的配饰应该可以穿戴', () => {
        const result = calculateItem(ring, 100);

        const wear = result.互动可能性.find(i => i.名称 === '穿戴');
        expect(wear?.可行).toBe(true);
      });
    });

    describe('特殊效果', () => {
      it('小物品不应该有特殊效果', () => {
        const result = calculateItem(testPhone, 1);

        expect(result.特殊效果).toBeUndefined();
      });

      it('巨大玻璃物品应该有碎裂警告', () => {
        const result = calculateItem(testPhone, 100, true);

        expect(result.特殊效果).toBeDefined();
        expect(result.特殊效果?.some(e => e.includes('玻璃'))).toBe(true);
      });

      it('巨大金属物品应该有冲击警告', () => {
        const car: ItemDefinition = {
          名称: '轿车',
          原始尺寸: { 长: 4.5, 宽: 1.8, 高: 1.5, 重量: 1500 },
          类型: '交通工具',
          材质: '金属',
        };
        const result = calculateItem(car, 10, true);

        expect(result.特殊效果).toBeDefined();
        expect(result.特殊效果?.some(e => e.includes('金属') || e.includes('冲击'))).toBe(true);
      });

      it('巨大物品应该有尺寸效果描述', () => {
        const result = calculateItem(testPhone, 10000, true);

        expect(result.特殊效果).toBeDefined();
        expect(result.特殊效果?.some(e => e.includes('建筑'))).toBe(true);
      });

      it('极巨大物品应该影响气候', () => {
        const result = calculateItem(testPhone, 100000, true);

        expect(result.特殊效果).toBeDefined();
        expect(result.特殊效果?.some(e => e.includes('气候'))).toBe(true);
      });
    });

    describe('圆形物品', () => {
      it('应该正确处理只有直径的物品', () => {
        const ring: ItemDefinition = {
          名称: '戒指',
          原始尺寸: { 直径: 0.018, 高: 0.005, 重量: 0.005 },
          类型: '配饰',
          材质: '金属',
        };
        const result = calculateItem(ring, 100, true);

        expect(result.缩放尺寸.直径).toBeCloseTo(1.8);
        expect(result.缩放尺寸_格式化.直径).toBeTruthy();
      });
    });
  });

  describe('calculateCharacterItems', () => {
    const items: CharacterItems = {
      手机: {
        名称: '智能手机',
        原始尺寸: { 长: 0.15, 宽: 0.07, 高: 0.008, 重量: 0.2 },
        类型: '日用品',
        材质: '玻璃',
        随身携带: true,
      },
      戒指: {
        名称: '戒指',
        原始尺寸: { 直径: 0.018, 高: 0.005, 重量: 0.005 },
        类型: '配饰',
        材质: '金属',
        随身携带: true,
      },
    };

    it('应该返回角色名和倍率', () => {
      const result = calculateCharacterItems('络络', 100, items);

      expect(result.角色名).toBe('络络');
      expect(result.倍率).toBe(100);
    });

    it('应该计算所有物品', () => {
      const result = calculateCharacterItems('络络', 100, items);

      expect(result.物品).toHaveProperty('手机');
      expect(result.物品).toHaveProperty('戒指');
    });

    it('每个物品应该有完整计算结果', () => {
      const result = calculateCharacterItems('络络', 100, items);

      for (const [id, calc] of Object.entries(result.物品)) {
        expect(calc.定义, `${id} 应该有定义`).toBeDefined();
        expect(calc.缩放尺寸, `${id} 应该有缩放尺寸`).toBeDefined();
        expect(calc.互动可能性, `${id} 应该有互动可能性`).toBeDefined();
      }
    });

    it('空物品列表应该返回空结果', () => {
      const result = calculateCharacterItems('络络', 100, {});

      expect(result.角色名).toBe('络络');
      expect(Object.keys(result.物品)).toHaveLength(0);
    });
  });

  describe('generateItemsPrompt', () => {
    const items: CharacterItems = {
      手机: {
        名称: '智能手机',
        原始尺寸: { 长: 0.15, 宽: 0.07, 高: 0.008, 重量: 0.2 },
        类型: '日用品',
        材质: '玻璃',
        随身携带: true,
      },
    };

    it('应该包含角色名', () => {
      const calc = calculateCharacterItems('络络', 100, items);
      const prompt = generateItemsPrompt('络络', calc);

      expect(prompt).toContain('络络');
    });

    it('应该包含物品名称', () => {
      const calc = calculateCharacterItems('络络', 100, items);
      const prompt = generateItemsPrompt('络络', calc);

      expect(prompt).toContain('智能手机');
    });

    it('应该包含物品类型和材质', () => {
      const calc = calculateCharacterItems('络络', 100, items);
      const prompt = generateItemsPrompt('络络', calc);

      expect(prompt).toContain('日用品');
      expect(prompt).toContain('玻璃');
    });

    it('应该包含尺寸信息', () => {
      const calc = calculateCharacterItems('络络', 100, items);
      const prompt = generateItemsPrompt('络络', calc);

      expect(prompt).toContain('缩放后尺寸');
    });

    it('应该包含互动可能性', () => {
      const calc = calculateCharacterItems('络络', 100, items);
      const prompt = generateItemsPrompt('络络', calc);

      expect(prompt).toMatch(/可行互动|不可行/);
    });

    it('有特殊效果时应该包含', () => {
      const calc = calculateCharacterItems('络络', 100, items);
      const prompt = generateItemsPrompt('络络', calc);

      // 100 倍的玻璃手机应该有特殊效果
      expect(prompt).toContain('特殊效果');
    });
  });

  describe('formatItemsCompact', () => {
    const items: CharacterItems = {
      手机: {
        名称: '智能手机',
        原始尺寸: { 长: 0.15, 宽: 0.07, 高: 0.008, 重量: 0.2 },
        类型: '日用品',
        材质: '玻璃',
        随身携带: true,
      },
      戒指: {
        名称: '戒指',
        原始尺寸: { 直径: 0.018, 高: 0.005, 重量: 0.005 },
        类型: '配饰',
        材质: '金属',
        随身携带: true,
      },
    };

    it('应该返回紧凑格式', () => {
      const calc = calculateCharacterItems('络络', 100, items);
      const compact = formatItemsCompact(calc);

      expect(compact).toContain('|');
    });

    it('应该包含物品名称', () => {
      const calc = calculateCharacterItems('络络', 100, items);
      const compact = formatItemsCompact(calc);

      expect(compact).toContain('智能手机');
      expect(compact).toContain('戒指');
    });

    it('应该包含尺寸信息', () => {
      const calc = calculateCharacterItems('络络', 100, items);
      const compact = formatItemsCompact(calc);

      // 应该包含尺寸单位
      expect(compact).toMatch(/长:|宽:|高:|直径:/);
    });

    it('空物品列表应该返回空字符串', () => {
      const calc = calculateCharacterItems('络络', 100, {});
      const compact = formatItemsCompact(calc);

      expect(compact).toBe('');
    });
  });

  describe('实际场景测试', () => {
    it('100 倍巨大娘的手机', () => {
      const phone = PRESET_ITEMS.智能手机;
      const result = calculateItem(phone, 100, true);

      // 手机应该变成 15 米长
      expect(result.缩放尺寸.长).toBeCloseTo(15);
      // 重量应该变成 200 吨
      expect(result.缩放尺寸.重量).toBeCloseTo(200000);
      // 应该有玻璃碎裂警告
      expect(result.特殊效果?.some(e => e.includes('玻璃'))).toBe(true);
    });

    it('巨大娘握持汽车', () => {
      const car = PRESET_ITEMS.轿车;
      const result = calculateItem(car, 100, false);

      // 汽车保持原尺寸（非随身携带）
      expect(result.缩放尺寸.长).toBeCloseTo(4.5);
      // 相对于 100 倍角色，汽车很小，应该可以单手握持
      const singleHand = result.互动可能性.find(i => i.名称 === '单手握持');
      expect(singleHand?.可行).toBe(true);
    });

    it('巨大娘的戒指', () => {
      // 使用带有随身携带属性的戒指
      const ring: ItemDefinition = {
        ...PRESET_ITEMS.戒指,
        随身携带: true,
      };
      const result = calculateItem(ring, 100);

      // 戒指应该变成 1.8 米直径
      expect(result.缩放尺寸.直径).toBeCloseTo(1.8);
      // 随身携带的配饰应该可以穿戴
      const wear = result.互动可能性.find(i => i.名称 === '穿戴');
      expect(wear?.可行).toBe(true);
    });

    it('小人视角看巨大娘的物品', () => {
      const phone = PRESET_ITEMS.智能手机;
      const result = calculateItem(phone, 100, true);

      // 普通人视角应该描述为巨大物体
      expect(result.普通人视角.length).toBeGreaterThan(0);
      const firstRef = result.普通人视角[0];
      expect(firstRef.描述).toBeTruthy();
    });
  });
});
