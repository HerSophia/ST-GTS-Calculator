/**
 * Core: interactions 模块测试
 * 验证互动限制规则的正确性
 */
import { describe, it, expect } from 'vitest';
import {
  INTERACTION_RULES,
  checkInteractionLimits,
  generateInteractionPrompt,
} from '@/core/interactions';
import { formatLength } from '@/core/formatter';

describe('Core: interactions', () => {
  describe('INTERACTION_RULES', () => {
    it('应该包含手部互动规则', () => {
      expect(INTERACTION_RULES).toHaveProperty('手指撩下巴');
      expect(INTERACTION_RULES).toHaveProperty('手掌握住');
      expect(INTERACTION_RULES).toHaveProperty('双手捧起');
      expect(INTERACTION_RULES).toHaveProperty('拥抱');
    });

    it('应该包含足部互动规则', () => {
      expect(INTERACTION_RULES).toHaveProperty('踩在脚下_感知');
      expect(INTERACTION_RULES).toHaveProperty('脚趾夹住');
      expect(INTERACTION_RULES).toHaveProperty('用脚玩弄');
    });

    it('应该包含口部互动规则', () => {
      expect(INTERACTION_RULES).toHaveProperty('舌头卷起');
      expect(INTERACTION_RULES).toHaveProperty('咀嚼');
      expect(INTERACTION_RULES).toHaveProperty('活吞_有感觉');
      expect(INTERACTION_RULES).toHaveProperty('亲吻嘴唇');
    });

    it('应该包含身体互动规则', () => {
      expect(INTERACTION_RULES).toHaveProperty('入阴_有感觉');
      expect(INTERACTION_RULES).toHaveProperty('入菊_有感觉');
      expect(INTERACTION_RULES).toHaveProperty('乳沟夹住');
    });

    it('应该包含视觉互动规则', () => {
      expect(INTERACTION_RULES).toHaveProperty('肉眼可见');
      expect(INTERACTION_RULES).toHaveProperty('清晰辨认面容');
    });

    it('应该包含交流互动规则', () => {
      expect(INTERACTION_RULES).toHaveProperty('听到声音');
      expect(INTERACTION_RULES).toHaveProperty('正常对话');
    });

    it('每个规则应该有完整的属性', () => {
      for (const [action, rule] of Object.entries(INTERACTION_RULES)) {
        expect(rule.minRatio, `${action} 应该有 minRatio`).toBeDefined();
        expect(rule.minRatio, `${action} 的 minRatio 应该是正数`).toBeGreaterThan(0);
        expect(rule.minRatio, `${action} 的 minRatio 应该小于等于 1`).toBeLessThanOrEqual(1);
        expect(rule.description, `${action} 应该有 description`).toBeTruthy();
        expect(rule.alternatives, `${action} 应该有 alternatives`).toBeTruthy();
      }
    });

    it('拥抱需要的比例应该最高', () => {
      const embraceRatio = INTERACTION_RULES.拥抱.minRatio;
      
      // 拥抱需要双方体型相近
      expect(embraceRatio).toBeGreaterThanOrEqual(0.3);
    });

    it('肉眼可见需要的比例应该很低', () => {
      const visibleRatio = INTERACTION_RULES.肉眼可见.minRatio;
      
      // 只要 0.1 毫米就能看见
      expect(visibleRatio).toBeLessThanOrEqual(0.001);
    });
  });

  describe('checkInteractionLimits', () => {
    describe('体型比例计算', () => {
      it('应该正确计算比例', () => {
        const result = checkInteractionLimits(170, 1.7, formatLength);
        
        expect(result.ratio).toBe(0.01); // 1.7 / 170 = 0.01
      });

      it('应该格式化比例', () => {
        const result1 = checkInteractionLimits(170, 17, formatLength); // 10%
        expect(result1.ratioFormatted).toBe('10%');

        const result2 = checkInteractionLimits(170, 1.7, formatLength); // 1%
        expect(result2.ratioFormatted).toBe('1%');

        const result3 = checkInteractionLimits(170, 0.17, formatLength); // 0.1%
        expect(result3.ratioFormatted).toBe('1/1000');
      });

      it('应该格式化小者在大者眼中的尺寸', () => {
        const result = checkInteractionLimits(170, 1.7, formatLength);
        
        expect(result.smallInBigEyes).toBe('1.7米');
      });
    });

    describe('可能与不可能的互动', () => {
      it('体型相近时大多数互动都可能', () => {
        const result = checkInteractionLimits(1.7, 1.5, formatLength); // 约 88%
        
        expect(result.possible.length).toBeGreaterThan(result.impossible.length);
        expect(result.possible).toContain('拥抱');
        expect(result.possible).toContain('正常对话');
      });

      it('1% 比例时拥抱不可能', () => {
        const result = checkInteractionLimits(170, 1.7, formatLength); // 1%
        
        expect(result.impossible.some(i => i.action === '拥抱')).toBe(true);
        expect(result.impossible.some(i => i.action === '正常对话')).toBe(true);
      });

      it('1% 比例时仍可踩在脚下感知', () => {
        const result = checkInteractionLimits(170, 1.7, formatLength); // 1%
        
        expect(result.possible).toContain('踩在脚下_感知');
      });

      it('0.01% 比例时大部分互动不可能', () => {
        const result = checkInteractionLimits(17000, 1.7, formatLength); // 0.01%
        
        expect(result.impossible.length).toBeGreaterThan(result.possible.length);
      });

      it('极小比例时仅肉眼可见可能', () => {
        const result = checkInteractionLimits(17000, 0.17, formatLength); // 0.001%
        
        // 几乎所有互动都不可能
        expect(result.impossible.length).toBeGreaterThan(10);
      });
    });

    describe('不可能互动的详情', () => {
      it('应该包含动作名称', () => {
        const result = checkInteractionLimits(170, 1.7, formatLength);
        const impossibleAction = result.impossible[0];
        
        expect(impossibleAction.action).toBeTruthy();
      });

      it('应该包含原因', () => {
        const result = checkInteractionLimits(170, 1.7, formatLength);
        const impossibleAction = result.impossible[0];
        
        expect(impossibleAction.reason).toBeTruthy();
      });

      it('应该包含替代方案', () => {
        const result = checkInteractionLimits(170, 1.7, formatLength);
        const impossibleAction = result.impossible[0];
        
        expect(impossibleAction.alternative).toBeTruthy();
      });
    });

    describe('替代方案映射', () => {
      it('应该为每个不可能的互动提供替代方案', () => {
        const result = checkInteractionLimits(170, 1.7, formatLength);
        
        for (const item of result.impossible) {
          expect(
            result.alternatives,
            `${item.action} 应该在 alternatives 中有对应项`
          ).toHaveProperty(item.action);
        }
      });
    });
  });

  describe('generateInteractionPrompt', () => {
    it('体型差距不大时应该返回简短描述', () => {
      const limits = checkInteractionLimits(1.7, 1.5, formatLength);
      const prompt = generateInteractionPrompt('巨大娘', '小人', limits);
      
      expect(prompt).toContain('体型差距不大');
      expect(prompt).toContain('正常互动');
    });

    it('有不可能互动时应该生成详细提示', () => {
      const limits = checkInteractionLimits(170, 1.7, formatLength);
      const prompt = generateInteractionPrompt('巨大娘', '小人', limits);
      
      expect(prompt).toContain('互动限制');
      expect(prompt).toContain('巨大娘');
      expect(prompt).toContain('小人');
    });

    it('应该包含体型比例信息', () => {
      const limits = checkInteractionLimits(170, 1.7, formatLength);
      const prompt = generateInteractionPrompt('络络', '小明', limits);
      
      expect(prompt).toContain('体型比例');
      expect(prompt).toContain('1%');
    });

    it('应该包含相对尺寸信息', () => {
      const limits = checkInteractionLimits(170, 1.7, formatLength);
      const prompt = generateInteractionPrompt('络络', '小明', limits);
      
      expect(prompt).toContain('小明');
      expect(prompt).toContain('眼中');
    });

    it('应该列出不合理的互动', () => {
      const limits = checkInteractionLimits(170, 1.7, formatLength);
      const prompt = generateInteractionPrompt('络络', '小明', limits);
      
      expect(prompt).toContain('物理上不合理');
      expect(prompt).toContain('拥抱');
    });

    it('应该包含替代方案', () => {
      const limits = checkInteractionLimits(170, 1.7, formatLength);
      const prompt = generateInteractionPrompt('络络', '小明', limits);
      
      expect(prompt).toContain('替代');
    });
  });

  describe('实际场景测试', () => {
    it('100 倍巨大娘 vs 正常人', () => {
      const giantHeight = 165; // 100 倍
      const normalHeight = 1.65;
      const limits = checkInteractionLimits(giantHeight, normalHeight, formatLength);

      // 1% 比例
      expect(limits.ratio).toBe(0.01);
      
      // 这些应该可以
      expect(limits.possible).toContain('踩在脚下_感知');
      expect(limits.possible).toContain('手掌握住');
      expect(limits.possible).toContain('肉眼可见');
      
      // 这些应该不行
      expect(limits.impossible.some(i => i.action === '拥抱')).toBe(true);
      expect(limits.impossible.some(i => i.action === '正常对话')).toBe(true);
    });

    it('1000 倍巨大娘 vs 正常人', () => {
      const giantHeight = 1650; // 1000 倍
      const normalHeight = 1.65;
      const limits = checkInteractionLimits(giantHeight, normalHeight, formatLength);

      // 0.1% 比例
      expect(limits.ratio).toBe(0.001);
      
      // 这些应该可以
      expect(limits.possible).toContain('踩在脚下_感知');
      expect(limits.possible).toContain('肉眼可见');
      
      // 更多互动变得不可能
      expect(limits.impossible.length).toBeGreaterThan(5);
    });

    it('10 倍巨大娘 vs 正常人', () => {
      const giantHeight = 16.5; // 10 倍
      const normalHeight = 1.65;
      const limits = checkInteractionLimits(giantHeight, normalHeight, formatLength);

      // 10% 比例（使用 toBeCloseTo 避免浮点精度问题）
      expect(limits.ratio).toBeCloseTo(0.1, 10);
      
      // 大部分互动应该可以
      expect(limits.possible).toContain('手掌握住');
      expect(limits.possible).toContain('用脚玩弄');
      expect(limits.possible).toContain('咀嚼');
      
      // 但拥抱和正常对话仍然不行
      expect(limits.impossible.some(i => i.action === '拥抱')).toBe(true);
    });
  });
});
