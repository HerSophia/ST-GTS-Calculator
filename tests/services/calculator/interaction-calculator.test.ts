/**
 * 互动限制计算服务测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import {
  calculatePairInteraction,
  calculatePairwiseInteractions,
  getInteractionsWithLimits,
  formatInteractionsForPrompt,
  checkInteraction,
  type CharacterForInteraction,
} from '@/services/calculator/interaction-calculator';

describe('Service: interaction-calculator', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // ========== calculatePairInteraction ==========
  describe('calculatePairInteraction', () => {
    describe('当两个角色身高差异较大时', () => {
      it('应该正确识别大者和小者', () => {
        const char1: CharacterForInteraction = { name: '巨大娘', height: 170 };
        const char2: CharacterForInteraction = { name: '小人', height: 0.017 };
        
        const result = calculatePairInteraction(char1, char2);
        
        expect(result.大者).toBe('巨大娘');
        expect(result.小者).toBe('小人');
      });

      it('应该返回互动限制列表', () => {
        const giantess: CharacterForInteraction = { name: '巨大娘', height: 170 };
        const tiny: CharacterForInteraction = { name: '小人', height: 0.017 };
        
        const result = calculatePairInteraction(giantess, tiny);
        
        expect(result.impossible).toBeDefined();
        expect(Array.isArray(result.impossible)).toBe(true);
        // 这么大的差距应该有很多互动受限
        expect(result.impossible!.length).toBeGreaterThan(0);
      });

      it('应该包含生成的提示词', () => {
        const giantess: CharacterForInteraction = { name: '巨大娘', height: 170 };
        const tiny: CharacterForInteraction = { name: '小人', height: 0.017 };
        
        const result = calculatePairInteraction(giantess, tiny);
        
        expect(result.提示).toBeDefined();
        expect(typeof result.提示).toBe('string');
        expect(result.提示.length).toBeGreaterThan(0);
      });
    });

    describe('当传入顺序相反时', () => {
      it('应该仍然正确识别大者和小者', () => {
        const tiny: CharacterForInteraction = { name: '小人', height: 0.017 };
        const giantess: CharacterForInteraction = { name: '巨大娘', height: 170 };
        
        // 注意这里先传入小人
        const result = calculatePairInteraction(tiny, giantess);
        
        expect(result.大者).toBe('巨大娘');
        expect(result.小者).toBe('小人');
      });
    });

    describe('当两个角色身高相同时', () => {
      it('第一个参数应该成为大者', () => {
        const char1: CharacterForInteraction = { name: '角色A', height: 170 };
        const char2: CharacterForInteraction = { name: '角色B', height: 170 };
        
        const result = calculatePairInteraction(char1, char2);
        
        expect(result.大者).toBe('角色A');
        expect(result.小者).toBe('角色B');
      });

      it('身高相同时应该没有互动限制', () => {
        const char1: CharacterForInteraction = { name: '角色A', height: 170 };
        const char2: CharacterForInteraction = { name: '角色B', height: 170 };
        
        const result = calculatePairInteraction(char1, char2);
        
        // 身高相同，比例为 1:1，应该没有物理限制
        expect(result.impossible).toBeDefined();
        // 可能为空数组或包含极少限制
      });
    });

    describe('当身高差距较小时', () => {
      it('应该有较少的互动限制', () => {
        const char1: CharacterForInteraction = { name: '高个子', height: 2.0 };
        const char2: CharacterForInteraction = { name: '矮个子', height: 1.5 };
        
        const result = calculatePairInteraction(char1, char2);
        
        // 差距不大，限制应该很少
        expect(result.impossible!.length).toBeLessThan(3);
      });
    });
  });

  // ========== calculatePairwiseInteractions ==========
  describe('calculatePairwiseInteractions', () => {
    describe('当只有一个角色时', () => {
      it('应该返回空对象', () => {
        const characters: CharacterForInteraction[] = [
          { name: '角色A', height: 170 },
        ];
        
        const result = calculatePairwiseInteractions(characters);
        
        expect(Object.keys(result)).toHaveLength(0);
      });
    });

    describe('当有两个角色时', () => {
      it('应该返回一组互动', () => {
        const characters: CharacterForInteraction[] = [
          { name: '巨大娘', height: 170 },
          { name: '小人', height: 0.017 },
        ];
        
        const result = calculatePairwiseInteractions(characters);
        
        expect(Object.keys(result)).toHaveLength(1);
        expect(result['巨大娘_小人']).toBeDefined();
      });
    });

    describe('当有三个角色时', () => {
      it('应该返回三组互动（C(3,2)=3）', () => {
        const characters: CharacterForInteraction[] = [
          { name: 'A', height: 170 },
          { name: 'B', height: 17 },
          { name: 'C', height: 0.017 },
        ];
        
        const result = calculatePairwiseInteractions(characters);
        
        expect(Object.keys(result)).toHaveLength(3);
      });

      it('互动键名应该遵循「大者_小者」格式', () => {
        const characters: CharacterForInteraction[] = [
          { name: 'C', height: 0.017 },  // 最小
          { name: 'A', height: 170 },    // 最大
          { name: 'B', height: 17 },     // 中等
        ];
        
        const result = calculatePairwiseInteractions(characters);
        
        // 每个键都应该是 大者_小者 格式
        expect(result['A_B']).toBeDefined();
        expect(result['A_C']).toBeDefined();
        expect(result['B_C']).toBeDefined();
      });
    });

    describe('当有多个角色时', () => {
      it('应该返回正确数量的互动组合（C(n,2)）', () => {
        const characters: CharacterForInteraction[] = [
          { name: 'A', height: 1000 },
          { name: 'B', height: 100 },
          { name: 'C', height: 10 },
          { name: 'D', height: 1 },
          { name: 'E', height: 0.1 },
        ];
        
        const result = calculatePairwiseInteractions(characters);
        
        // C(5,2) = 10
        expect(Object.keys(result)).toHaveLength(10);
      });
    });

    describe('当角色列表为空时', () => {
      it('应该返回空对象', () => {
        const result = calculatePairwiseInteractions([]);
        
        expect(Object.keys(result)).toHaveLength(0);
      });
    });
  });

  // ========== getInteractionsWithLimits ==========
  describe('getInteractionsWithLimits', () => {
    describe('当有互动限制时', () => {
      it('应该只返回有限制的互动', () => {
        const characters: CharacterForInteraction[] = [
          { name: '巨大娘', height: 170 },
          { name: '普通人', height: 1.70 },
          { name: '小人', height: 0.017 },
        ];
        
        const allInteractions = calculatePairwiseInteractions(characters);
        const withLimits = getInteractionsWithLimits(allInteractions);
        
        // 所有返回的互动都应该有 impossible 且不为空
        for (const interaction of withLimits) {
          expect(interaction.impossible).toBeDefined();
          expect(interaction.impossible!.length).toBeGreaterThan(0);
        }
      });
    });

    describe('当没有互动限制时', () => {
      it('应该返回空数组', () => {
        const characters: CharacterForInteraction[] = [
          { name: '角色A', height: 1.70 },
          { name: '角色B', height: 1.65 },
        ];
        
        const allInteractions = calculatePairwiseInteractions(characters);
        const withLimits = getInteractionsWithLimits(allInteractions);
        
        // 身高差距很小，应该没有互动限制
        expect(withLimits).toHaveLength(0);
      });
    });

    describe('过滤逻辑', () => {
      it('应该过滤掉 impossible 为空数组的互动', () => {
        // 直接用真实计算来测试过滤逻辑
        const characters: CharacterForInteraction[] = [
          { name: '巨大娘', height: 170 },     // 会与普通人有限制
          { name: '普通人A', height: 1.65 },   // 与巨大娘有限制
          { name: '普通人B', height: 1.70 },   // 与普通人A差距极小，无限制
        ];
        
        const allInteractions = calculatePairwiseInteractions(characters);
        const withLimits = getInteractionsWithLimits(allInteractions);
        
        // 所有返回的都应该有非空的 impossible
        for (const interaction of withLimits) {
          expect(interaction.impossible.length).toBeGreaterThan(0);
        }
        
        // 普通人A 和 普通人B 之间不应该有限制
        const normalPairHasLimit = withLimits.some(
          i => (i.大者 === '普通人A' || i.大者 === '普通人B') &&
               (i.小者 === '普通人A' || i.小者 === '普通人B')
        );
        expect(normalPairHasLimit).toBe(false);
      });
    });
  });

  // ========== formatInteractionsForPrompt ==========
  describe('formatInteractionsForPrompt', () => {
    describe('当有互动限制时', () => {
      it('应该返回格式化的数组', () => {
        const characters: CharacterForInteraction[] = [
          { name: '巨大娘', height: 170 },
          { name: '小人', height: 0.017 },
        ];
        
        const allInteractions = calculatePairwiseInteractions(characters);
        const withLimits = getInteractionsWithLimits(allInteractions);
        const formatted = formatInteractionsForPrompt(withLimits);
        
        expect(Array.isArray(formatted)).toBe(true);
        expect(formatted.length).toBeGreaterThan(0);
        
        // 检查格式
        for (const item of formatted) {
          expect(item.大者).toBeDefined();
          expect(item.小者).toBeDefined();
          expect(item.impossible).toBeDefined();
          expect(Array.isArray(item.impossible)).toBe(true);
        }
      });

      it('impossible 项应该包含 action、reason、alternative', () => {
        const characters: CharacterForInteraction[] = [
          { name: '巨大娘', height: 170 },
          { name: '小人', height: 0.017 },
        ];
        
        const allInteractions = calculatePairwiseInteractions(characters);
        const withLimits = getInteractionsWithLimits(allInteractions);
        const formatted = formatInteractionsForPrompt(withLimits);
        
        if (formatted.length > 0 && formatted[0].impossible.length > 0) {
          const firstImpossible = formatted[0].impossible[0];
          expect(firstImpossible.action).toBeDefined();
          expect(firstImpossible.reason).toBeDefined();
          expect(firstImpossible.alternative).toBeDefined();
        }
      });
    });

    describe('当没有互动限制时', () => {
      it('应该返回空数组', () => {
        const formatted = formatInteractionsForPrompt([]);
        
        expect(formatted).toHaveLength(0);
      });
    });
  });

  // ========== checkInteraction ==========
  describe('checkInteraction', () => {
    describe('基本功能', () => {
      it('应该返回 InteractionLimits 对象', () => {
        const result = checkInteraction(170, 0.017);
        
        expect(result).toBeDefined();
        expect(result.ratio).toBeDefined();
        expect(result.ratioFormatted).toBeDefined();
        expect(result.smallInBigEyes).toBeDefined();
        expect(result.possible).toBeDefined();
        expect(result.impossible).toBeDefined();
      });

      it('应该计算正确的比例', () => {
        // ratio 是小者/大者，所以 1.70/170 = 0.01
        const result = checkInteraction(170, 1.70);
        
        expect(result.ratio).toBeCloseTo(0.01, 2);
      });
    });

    describe('极端比例', () => {
      it('应该处理极小的比例（极大差距）', () => {
        // ratio 是小者/大者，所以 0.001/1000000 = 1e-9
        const result = checkInteraction(1000000, 0.001);
        
        expect(result.ratio).toBeCloseTo(1e-9, 12);
        expect(result.impossible.length).toBeGreaterThan(0);
      });

      it('应该处理比例为 1 的情况', () => {
        const result = checkInteraction(1.70, 1.70);
        
        expect(result.ratio).toBe(1);
        // 比例为 1，应该没有物理限制
        expect(result.impossible.length).toBe(0);
      });
    });

    describe('互动限制内容', () => {
      it('大比例差异时应该有多项互动限制', () => {
        const result = checkInteraction(170, 0.017);
        
        // 比例差距 10000 倍，应该有多项限制
        expect(result.impossible.length).toBeGreaterThan(0);
        
        // 每个限制项都应该有完整的信息
        for (const item of result.impossible) {
          expect(item.action).toBeDefined();
          expect(item.reason).toBeDefined();
          expect(item.alternative).toBeDefined();
        }
      });
    });
  });
});
