/**
 * Core: formatter 模块测试
 * 验证各种格式化函数的正确性
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  round,
  formatLength,
  formatWeight,
  formatVolume,
  formatArea,
  setPrecision,
  getPrecision,
} from '@/core/formatter';

describe('Core: formatter', () => {
  describe('round', () => {
    it('应该按默认精度（2位）四舍五入', () => {
      expect(round(3.14159)).toBe(3.14);
      expect(round(3.145)).toBe(3.15); // 四舍五入
      expect(round(3.144)).toBe(3.14);
    });

    it('应该支持指定精度', () => {
      expect(round(3.14159, 0)).toBe(3);
      expect(round(3.14159, 1)).toBe(3.1);
      expect(round(3.14159, 3)).toBe(3.142);
      expect(round(3.14159, 4)).toBe(3.1416);
    });

    it('应该正确处理负数', () => {
      expect(round(-3.14159)).toBe(-3.14);
      // 注意：JavaScript 的 Math.round 对负数的处理
      // -3.145 * 100 = -314.5, Math.round(-314.5) = -314
      expect(round(-3.145)).toBe(-3.14);
    });

    it('应该正确处理整数', () => {
      expect(round(100)).toBe(100);
      expect(round(100, 0)).toBe(100);
    });

    it('应该正确处理很小的数', () => {
      expect(round(0.001234, 4)).toBe(0.0012);
      expect(round(0.000001, 6)).toBe(0.000001);
    });
  });

  describe('setPrecision / getPrecision', () => {
    beforeEach(() => {
      setPrecision(2); // 重置为默认值
    });

    it('应该能设置和获取精度', () => {
      expect(getPrecision()).toBe(2);

      setPrecision(4);
      expect(getPrecision()).toBe(4);

      setPrecision(0);
      expect(getPrecision()).toBe(0);
    });

    it('设置精度后应该影响 round 函数', () => {
      setPrecision(3);
      expect(round(3.14159)).toBe(3.142);

      setPrecision(1);
      expect(round(3.14159)).toBe(3.1);
    });
  });

  describe('formatLength', () => {
    describe('常规单位', () => {
      it('应该正确格式化米', () => {
        expect(formatLength(1)).toBe('1米');
        expect(formatLength(10)).toBe('10米');
        expect(formatLength(999)).toBe('999米');
        expect(formatLength(1.5)).toBe('1.5米');
      });

      it('应该正确格式化公里', () => {
        expect(formatLength(1000)).toBe('1公里');
        expect(formatLength(5000)).toBe('5公里');
        expect(formatLength(1500)).toBe('1.5公里');
        expect(formatLength(1000000)).toBe('1000公里');
      });

      it('应该正确格式化厘米', () => {
        expect(formatLength(0.01)).toBe('1厘米');
        expect(formatLength(0.1)).toBe('10厘米');
        expect(formatLength(0.05)).toBe('5厘米');
        expect(formatLength(0.99)).toBe('99厘米');
      });

      it('应该正确格式化毫米', () => {
        expect(formatLength(0.001)).toBe('1毫米');
        expect(formatLength(0.005)).toBe('5毫米');
        expect(formatLength(0.0099)).toBe('9.9毫米');
      });

      it('应该正确格式化微米', () => {
        expect(formatLength(0.000001)).toBe('1微米');
        expect(formatLength(0.00001)).toBe('10微米');
        // 0.5微米 = 500纳米，会使用纳米单位
        expect(formatLength(0.0000005)).toBe('500纳米');
      });

      it('应该正确格式化纳米', () => {
        expect(formatLength(0.000000001)).toBe('1纳米');
        expect(formatLength(0.00000001)).toBe('10纳米');
      });

      it('应该正确格式化皮米', () => {
        expect(formatLength(0.000000000001)).toBe('1皮米');
        expect(formatLength(0.0000000000001)).toBe('0.1皮米');
      });
    });

    describe('天文单位', () => {
      const AU = 149597870700;
      const LIGHT_YEAR = 9460730472580800;

      it('应该正确格式化天文单位 (AU)', () => {
        expect(formatLength(AU, true)).toBe('1AU');
        expect(formatLength(AU * 2, true)).toBe('2AU');
      });

      it('应该正确格式化光年', () => {
        expect(formatLength(LIGHT_YEAR, true)).toBe('1光年');
        expect(formatLength(LIGHT_YEAR * 10, true)).toBe('10光年');
        expect(formatLength(LIGHT_YEAR * 1000, true)).toContain('光年');
      });

      it('当 useAstronomical=false 时不应使用天文单位', () => {
        expect(formatLength(AU, false)).toContain('公里');
        expect(formatLength(LIGHT_YEAR, false)).toContain('公里');
      });
    });

    describe('边界情况', () => {
      it('应该处理零', () => {
        // 0 会落入最小单位
        const result = formatLength(0);
        expect(result).toContain('0');
      });

      it('应该处理负数', () => {
        expect(formatLength(-1)).toBe('-1米');
        expect(formatLength(-1000)).toBe('-1公里');
      });
    });
  });

  describe('formatWeight', () => {
    it('应该正确格式化千克', () => {
      expect(formatWeight(1)).toBe('1千克');
      expect(formatWeight(100)).toBe('100千克');
      expect(formatWeight(999)).toBe('999千克');
    });

    it('应该正确格式化吨', () => {
      expect(formatWeight(1000)).toBe('1吨');
      expect(formatWeight(5000)).toBe('5吨');
      expect(formatWeight(1500)).toBe('1.5吨');
    });

    it('应该正确格式化百万吨', () => {
      expect(formatWeight(1e6)).toBe('1百万吨');
      expect(formatWeight(5e6)).toBe('5百万吨');
    });

    it('应该正确格式化十亿吨', () => {
      expect(formatWeight(1e9)).toBe('1十亿吨');
      expect(formatWeight(1e10)).toBe('10十亿吨');
    });

    it('应该正确格式化万亿吨', () => {
      expect(formatWeight(1e12)).toBe('1万亿吨');
      expect(formatWeight(1e15)).toBe('1000万亿吨');
    });
  });

  describe('formatVolume', () => {
    it('应该正确格式化毫升', () => {
      expect(formatVolume(0.000001)).toBe('1毫升');
      expect(formatVolume(0.00001)).toBe('10毫升');
    });

    it('应该正确格式化升', () => {
      expect(formatVolume(0.001)).toBe('1升');
      expect(formatVolume(0.01)).toBe('10升');
      expect(formatVolume(0.1)).toBe('100升');
    });

    it('应该正确格式化立方米', () => {
      expect(formatVolume(1)).toBe('1立方米');
      expect(formatVolume(100)).toBe('100立方米');
    });

    it('应该正确格式化立方公里', () => {
      expect(formatVolume(1e9)).toBe('1立方公里');
      expect(formatVolume(1e10)).toBe('10立方公里');
    });

    it('应该正确格式化立方毫米', () => {
      expect(formatVolume(1e-9)).toBe('1立方毫米');
      expect(formatVolume(1e-8)).toBe('10立方毫米');
    });
  });

  describe('formatArea', () => {
    it('应该正确格式化平方毫米', () => {
      expect(formatArea(0.000001)).toBe('1平方毫米');
      expect(formatArea(0.00001)).toBe('10平方毫米');
    });

    it('应该正确格式化平方厘米', () => {
      expect(formatArea(0.0001)).toBe('1平方厘米');
      expect(formatArea(0.001)).toBe('10平方厘米');
    });

    it('应该正确格式化平方米', () => {
      expect(formatArea(1)).toBe('1平方米');
      expect(formatArea(100)).toBe('100平方米');
    });

    it('应该正确格式化平方公里', () => {
      expect(formatArea(1e6)).toBe('1平方公里');
      expect(formatArea(1e7)).toBe('10平方公里');
    });
  });
});
