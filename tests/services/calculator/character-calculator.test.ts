/**
 * 角色计算服务测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import {
  getCharacterType,
  calculateCharacterData,
  calculateFromMvuData,
  calculateFullCharacterData,
  needsRecalculation,
  recalculateDamage,
} from '@/services/calculator/character-calculator';
import type { CharacterMvuData, GiantessData, TinyData } from '@/types';

describe('Service: character-calculator', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // ========== getCharacterType ==========
  describe('getCharacterType', () => {
    describe('当倍率 >= 1.5 时', () => {
      it('应该返回 giant 类型', () => {
        expect(getCharacterType(1.5)).toBe('giant');
        expect(getCharacterType(2)).toBe('giant');
        expect(getCharacterType(100)).toBe('giant');
        expect(getCharacterType(10000)).toBe('giant');
      });
    });

    describe('当倍率 <= 0.8 时', () => {
      it('应该返回 tiny 类型', () => {
        expect(getCharacterType(0.8)).toBe('tiny');
        expect(getCharacterType(0.5)).toBe('tiny');
        expect(getCharacterType(0.1)).toBe('tiny');
        expect(getCharacterType(0.01)).toBe('tiny');
      });
    });

    describe('当倍率在 0.8 到 1.5 之间时', () => {
      it('应该返回 normal 类型', () => {
        expect(getCharacterType(0.81)).toBe('normal');
        expect(getCharacterType(1)).toBe('normal');
        expect(getCharacterType(1.2)).toBe('normal');
        expect(getCharacterType(1.49)).toBe('normal');
      });
    });

    describe('边界值测试', () => {
      it('倍率恰好为 1.5 应该是 giant', () => {
        expect(getCharacterType(1.5)).toBe('giant');
      });

      it('倍率恰好为 0.8 应该是 tiny', () => {
        expect(getCharacterType(0.8)).toBe('tiny');
      });
    });
  });

  // ========== calculateCharacterData ==========
  describe('calculateCharacterData', () => {
    describe('当计算巨大娘数据时（scale >= 1）', () => {
      it('应该返回 GiantessData 类型的数据', () => {
        const result = calculateCharacterData(170, 1.65);
        
        expect(result).toBeDefined();
        expect(result.当前身高).toBe(170);
        expect(result.原身高).toBe(1.65);
        expect(result.倍率).toBeCloseTo(103.03, 1);
        expect(result.级别).toBeDefined();
        // GiantessData 特有字段
        expect((result as GiantessData).身体部位).toBeDefined();
        expect((result as GiantessData).眼中的世界).toBeDefined();
      });

      it('应该正确处理自定义部位', () => {
        const customParts = { 足长: 50, 乳房高度: 30 };
        const result = calculateCharacterData(170, 1.65, customParts) as GiantessData;
        
        expect(result.自定义部位).toBeDefined();
        expect(result.自定义部位.足长).toBe(50);
        expect(result.自定义部位.乳房高度).toBe(30);
      });
    });

    describe('当计算小人数据时（scale < 1）', () => {
      it('应该返回 TinyData 类型的数据', () => {
        const result = calculateCharacterData(0.017, 1.70);
        
        expect(result).toBeDefined();
        expect(result.当前身高).toBe(0.017);
        expect(result.原身高).toBe(1.70);
        expect(result.倍率).toBeCloseTo(0.01, 2);
        expect(result.级别).toBeDefined();
        // TinyData 特有字段
        expect((result as TinyData).眼中的巨大娘).toBeDefined();
      });
    });

    describe('边界情况', () => {
      it('当 scale 恰好为 1 时应该返回 GiantessData', () => {
        const result = calculateCharacterData(1.65, 1.65);
        
        expect(result.倍率).toBe(1);
        expect((result as GiantessData).身体部位).toBeDefined();
      });
    });
  });

  // ========== calculateFromMvuData ==========
  describe('calculateFromMvuData', () => {
    describe('当提供有效数据时', () => {
      it('应该正确解析「当前身高」字段', () => {
        const rawData: CharacterMvuData = {
          当前身高: 170,
          原身高: 1.65,
        };
        
        const result = calculateFromMvuData(rawData);
        
        expect(result).not.toBeNull();
        expect(result!.calcData.当前身高).toBe(170);
        expect(result!.type).toBe('giant');
      });

      it('应该正确解析「身高」字段作为备选', () => {
        const rawData: CharacterMvuData = {
          身高: 170,
          原始身高: 1.65,
        };
        
        const result = calculateFromMvuData(rawData);
        
        expect(result).not.toBeNull();
        expect(result!.calcData.当前身高).toBe(170);
      });

      it('应该使用默认原身高 1.65 当未提供时', () => {
        const rawData: CharacterMvuData = {
          当前身高: 170,
        };
        
        const result = calculateFromMvuData(rawData);
        
        expect(result).not.toBeNull();
        expect(result!.calcData.原身高).toBe(1.65);
      });

      it('应该正确处理自定义部位', () => {
        const rawData: CharacterMvuData = {
          当前身高: 170,
          原身高: 1.65,
          自定义部位: { 足长: 50 },
        };
        
        const result = calculateFromMvuData(rawData);
        
        expect(result).not.toBeNull();
        expect((result!.calcData as GiantessData).自定义部位?.足长).toBe(50);
      });
    });

    describe('当提供无效数据时', () => {
      it('当没有身高数据时应该返回 null', () => {
        const rawData: CharacterMvuData = {
          原身高: 1.65,
        };
        
        const result = calculateFromMvuData(rawData);
        
        expect(result).toBeNull();
      });

      it('当身高为 0 时应该返回 null', () => {
        const rawData: CharacterMvuData = {
          当前身高: 0,
          原身高: 1.65,
        };
        
        const result = calculateFromMvuData(rawData);
        
        expect(result).toBeNull();
      });

      it('当身高为负数时应该返回 null', () => {
        const rawData: CharacterMvuData = {
          当前身高: -10,
          原身高: 1.65,
        };
        
        const result = calculateFromMvuData(rawData);
        
        expect(result).toBeNull();
      });
    });

    describe('角色类型判定', () => {
      it('巨大娘应该返回 type=giant', () => {
        const rawData: CharacterMvuData = {
          当前身高: 170,
          原身高: 1.65,
        };
        
        const result = calculateFromMvuData(rawData);
        
        expect(result!.type).toBe('giant');
      });

      it('小人应该返回 type=tiny', () => {
        const rawData: CharacterMvuData = {
          当前身高: 0.017,
          原身高: 1.70,
        };
        
        const result = calculateFromMvuData(rawData);
        
        expect(result!.type).toBe('tiny');
      });

      it('普通人应该返回 type=normal', () => {
        const rawData: CharacterMvuData = {
          当前身高: 1.70,
          原身高: 1.65,
        };
        
        const result = calculateFromMvuData(rawData);
        
        expect(result!.type).toBe('normal');
      });
    });
  });

  // ========== calculateFullCharacterData ==========
  describe('calculateFullCharacterData', () => {
    describe('对于普通人', () => {
      it('应该返回 calcData 和 damageData 都为 null', () => {
        const result = calculateFullCharacterData(1.70, 1.65);
        
        expect(result.type).toBe('normal');
        expect(result.calcData).toBeNull();
        expect(result.damageData).toBeNull();
      });
    });

    describe('对于巨大娘', () => {
      it('应该返回正确的计算数据', () => {
        const result = calculateFullCharacterData(170, 1.65);
        
        expect(result.type).toBe('giant');
        expect(result.scale).toBeCloseTo(103.03, 1);
        expect(result.calcData).not.toBeNull();
      });

      it('当启用损害计算时应该包含 damageData', () => {
        const result = calculateFullCharacterData(170, 1.65, {
          enableDamage: true,
        });
        
        expect(result.damageData).not.toBeNull();
        expect(result.damageData!.破坏力等级).toBeDefined();
      });

      it('当禁用损害计算时 damageData 应该为 null', () => {
        const result = calculateFullCharacterData(170, 1.65, {
          enableDamage: false,
        });
        
        expect(result.damageData).toBeNull();
      });

      it('应该使用指定的损害场景', () => {
        const result = calculateFullCharacterData(170, 1.65, {
          enableDamage: true,
          damageScenario: '荒野',
        });
        
        expect(result.damageData).not.toBeNull();
        // 荒野场景伤亡应该比大城市少
        expect(result.damageData!.单步损害.小人伤亡.最小估计).toBeLessThan(100);
      });
    });

    describe('对于小人', () => {
      it('应该返回正确的计算数据', () => {
        const result = calculateFullCharacterData(0.017, 1.70);
        
        expect(result.type).toBe('tiny');
        expect(result.scale).toBeCloseTo(0.01, 2);
        expect(result.calcData).not.toBeNull();
      });

      it('即使启用损害计算，damageData 也应该为 null', () => {
        const result = calculateFullCharacterData(0.017, 1.70, {
          enableDamage: true,
        });
        
        // 小人不计算损害
        expect(result.damageData).toBeNull();
      });
    });
  });

  // ========== needsRecalculation ==========
  describe('needsRecalculation', () => {
    describe('当需要重新计算时', () => {
      it('当没有现有计算数据时应该返回 true', () => {
        const rawData: CharacterMvuData = {
          当前身高: 170,
        };
        
        const result = needsRecalculation(rawData, undefined);
        
        expect(result).toBe(true);
      });

      it('当身高变化时应该返回 true', () => {
        const rawData: CharacterMvuData = {
          当前身高: 200,
        };
        const existingData = { 当前身高: 170 } as GiantessData;
        
        const result = needsRecalculation(rawData, existingData);
        
        expect(result).toBe(true);
      });

      it('当自定义部位变化时应该返回 true', () => {
        const rawData: CharacterMvuData = {
          当前身高: 170,
          自定义部位: { 足长: 60 },
        };
        const existingData = {
          当前身高: 170,
          自定义部位: { 足长: 50 },
        } as unknown as GiantessData;
        
        const result = needsRecalculation(rawData, existingData);
        
        expect(result).toBe(true);
      });
    });

    describe('当不需要重新计算时', () => {
      it('当没有身高数据时应该返回 false', () => {
        const rawData: CharacterMvuData = {
          原身高: 1.65,
        };
        
        const result = needsRecalculation(rawData, undefined);
        
        expect(result).toBe(false);
      });

      it('当身高和自定义部位都没有变化时应该返回 false', () => {
        const rawData: CharacterMvuData = {
          当前身高: 170,
          自定义部位: { 足长: 50 },
        };
        const existingData = {
          当前身高: 170,
          自定义部位: { 足长: 50 },
        } as unknown as GiantessData;
        
        const result = needsRecalculation(rawData, existingData);
        
        expect(result).toBe(false);
      });
    });
  });

  // ========== recalculateDamage ==========
  describe('recalculateDamage', () => {
    describe('对于巨大娘', () => {
      it('应该返回损害数据', () => {
        const result = recalculateDamage(170, 1.65);
        
        expect(result).not.toBeNull();
        expect(result!.破坏力等级).toBeDefined();
        expect(result!.单步损害).toBeDefined();
      });

      it('应该使用指定的场景', () => {
        const resultCity = recalculateDamage(170, 1.65, '大城市');
        const resultWilderness = recalculateDamage(170, 1.65, '荒野');
        
        expect(resultCity).not.toBeNull();
        expect(resultWilderness).not.toBeNull();
        // 大城市伤亡应该比荒野多
        expect(resultCity!.单步损害.小人伤亡.最小估计)
          .toBeGreaterThan(resultWilderness!.单步损害.小人伤亡.最小估计);
      });
    });

    describe('对于小人', () => {
      it('应该返回 null', () => {
        const result = recalculateDamage(0.017, 1.70);
        
        expect(result).toBeNull();
      });
    });

    describe('边界情况', () => {
      it('当 scale 恰好为 1 时应该返回损害数据', () => {
        const result = recalculateDamage(1.65, 1.65);
        
        expect(result).not.toBeNull();
      });
    });
  });
});
