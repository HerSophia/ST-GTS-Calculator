/**
 * Core: constants 模块测试
 * 验证常量定义的完整性和合理性
 */
import { describe, it, expect } from 'vitest';
import {
  BASE_HEIGHT,
  BASE_BODY_PARTS,
  REFERENCE_OBJECTS,
  INSECT_REFERENCES,
  SIZE_LEVELS,
  TINY_LEVELS,
} from '@/core/constants';

describe('Core: constants', () => {
  describe('BASE_HEIGHT', () => {
    it('应该是合理的基准身高值', () => {
      expect(BASE_HEIGHT).toBe(1.75);
      expect(BASE_HEIGHT).toBeGreaterThan(1.5);
      expect(BASE_HEIGHT).toBeLessThan(2.0);
    });
  });

  describe('BASE_BODY_PARTS', () => {
    it('应该包含所有必要的身体部位', () => {
      const requiredParts = [
        '身高',
        '眼睛高度',
        '足长',
        '足宽',
        '手掌长',
        '乳房高度',
        '臀部宽度',
        '阴道深度_闭合',
      ];

      for (const part of requiredParts) {
        expect(BASE_BODY_PARTS).toHaveProperty(part);
      }
    });

    it('身高应该等于 BASE_HEIGHT', () => {
      expect(BASE_BODY_PARTS.身高).toBe(BASE_HEIGHT);
    });

    it('所有部位值应该是正数', () => {
      for (const [part, value] of Object.entries(BASE_BODY_PARTS)) {
        expect(value, `${part} 应该是正数`).toBeGreaterThan(0);
      }
    });

    it('垂直高度部位应该按从高到低排列', () => {
      expect(BASE_BODY_PARTS.眼睛高度).toBeLessThan(BASE_BODY_PARTS.身高);
      expect(BASE_BODY_PARTS.肩膀高度).toBeLessThan(BASE_BODY_PARTS.眼睛高度);
      expect(BASE_BODY_PARTS.肚脐高度).toBeLessThan(BASE_BODY_PARTS.肩膀高度);
      expect(BASE_BODY_PARTS.裆部高度).toBeLessThan(BASE_BODY_PARTS.肚脐高度);
      expect(BASE_BODY_PARTS.脚踝高度).toBeLessThan(BASE_BODY_PARTS.裆部高度);
    });

    it('足长应该约为身高的 14%', () => {
      const ratio = BASE_BODY_PARTS.足长 / BASE_BODY_PARTS.身高;
      expect(ratio).toBeGreaterThan(0.12);
      expect(ratio).toBeLessThan(0.18);
    });

    it('重量单位的部位应该有合理的值', () => {
      // 单乳重量约 1kg
      expect(BASE_BODY_PARTS.单乳重量).toBeGreaterThan(0.5);
      expect(BASE_BODY_PARTS.单乳重量).toBeLessThan(2);

      // 臀部重量约 20-30kg
      expect(BASE_BODY_PARTS.臀部重量).toBeGreaterThan(15);
      expect(BASE_BODY_PARTS.臀部重量).toBeLessThan(40);
    });
  });

  describe('REFERENCE_OBJECTS', () => {
    it('应该包含人类尺度参照物', () => {
      expect(REFERENCE_OBJECTS.普通成年人).toBe(1.7);
      expect(REFERENCE_OBJECTS.普通男性).toBe(1.75);
      expect(REFERENCE_OBJECTS.普通女性).toBe(1.65);
    });

    it('应该包含建筑参照物', () => {
      expect(REFERENCE_OBJECTS.单层楼高).toBe(3);
      expect(REFERENCE_OBJECTS.十层楼房).toBe(30);
      expect(REFERENCE_OBJECTS.哈利法塔).toBe(828);
    });

    it('应该包含天体参照物', () => {
      expect(REFERENCE_OBJECTS.月球直径).toBe(3474000);
      expect(REFERENCE_OBJECTS.地球直径).toBe(12742000);
      expect(REFERENCE_OBJECTS.太阳直径).toBe(1392000000);
    });

    it('天体尺寸应该按从小到大排列', () => {
      expect(REFERENCE_OBJECTS.月球直径).toBeLessThan(REFERENCE_OBJECTS.地球直径);
      expect(REFERENCE_OBJECTS.地球直径).toBeLessThan(REFERENCE_OBJECTS.太阳直径);
      expect(REFERENCE_OBJECTS.太阳直径).toBeLessThan(REFERENCE_OBJECTS.光年);
    });

    it('所有参照物值应该是正数', () => {
      for (const [name, value] of Object.entries(REFERENCE_OBJECTS)) {
        expect(value, `${name} 应该是正数`).toBeGreaterThan(0);
      }
    });
  });

  describe('INSECT_REFERENCES', () => {
    it('应该包含常见昆虫', () => {
      expect(INSECT_REFERENCES).toHaveProperty('蚂蚁');
      expect(INSECT_REFERENCES).toHaveProperty('蟑螂');
      expect(INSECT_REFERENCES).toHaveProperty('蜜蜂');
    });

    it('昆虫尺寸应该都小于 10 厘米', () => {
      for (const [name, value] of Object.entries(INSECT_REFERENCES)) {
        expect(value, `${name} 应该小于 0.1 米`).toBeLessThan(0.1);
      }
    });

    it('蚂蚁应该比蟑螂小', () => {
      expect(INSECT_REFERENCES.蚂蚁).toBeLessThan(INSECT_REFERENCES.蟑螂);
    });

    it('细菌应该是最小的', () => {
      const minSize = Math.min(...Object.values(INSECT_REFERENCES));
      expect(INSECT_REFERENCES.细菌).toBe(minSize);
    });
  });

  describe('SIZE_LEVELS', () => {
    it('应该有足够的级别覆盖各种尺寸', () => {
      expect(SIZE_LEVELS.length).toBeGreaterThanOrEqual(10);
    });

    it('每个级别应该有名称和描述', () => {
      for (const level of SIZE_LEVELS) {
        expect(level.name).toBeTruthy();
        expect(level.description).toBeTruthy();
        expect(level.minScale).toBeGreaterThan(0);
      }
    });

    it('级别应该按倍率从小到大排列', () => {
      for (let i = 1; i < SIZE_LEVELS.length; i++) {
        expect(
          SIZE_LEVELS[i].minScale,
          `级别 ${SIZE_LEVELS[i].name} 的最小倍率应该大于前一个级别`
        ).toBeGreaterThan(SIZE_LEVELS[i - 1].minScale as number);
      }
    });

    it('级别应该连续覆盖（无间隙）', () => {
      for (let i = 1; i < SIZE_LEVELS.length; i++) {
        expect(
          SIZE_LEVELS[i].minScale,
          `级别 ${SIZE_LEVELS[i].name} 应该从前一级别的最大值开始`
        ).toBe(SIZE_LEVELS[i - 1].maxScale);
      }
    });

    it('第一个级别应该从 1 倍开始', () => {
      expect(SIZE_LEVELS[0].minScale).toBe(1);
    });

    it('最后一个级别的最大值应该是无穷大', () => {
      expect(SIZE_LEVELS[SIZE_LEVELS.length - 1].maxScale).toBe(Infinity);
    });
  });

  describe('TINY_LEVELS', () => {
    it('应该有足够的缩小级别', () => {
      expect(TINY_LEVELS.length).toBeGreaterThanOrEqual(5);
    });

    it('每个级别应该有名称、倍率和描述', () => {
      for (const level of TINY_LEVELS) {
        expect(level.name).toBeTruthy();
        expect(level.description).toBeTruthy();
        expect(level.scale).toBeGreaterThan(0);
        expect(level.scale).toBeLessThan(1);
      }
    });

    it('级别应该按倍率从大到小排列（越来越小）', () => {
      for (let i = 1; i < TINY_LEVELS.length; i++) {
        expect(
          TINY_LEVELS[i].scale,
          `级别 ${TINY_LEVELS[i].name} 的倍率应该小于前一个级别`
        ).toBeLessThan(TINY_LEVELS[i - 1].scale);
      }
    });

    it('应该覆盖从十分之一到纳米级', () => {
      const scales = TINY_LEVELS.map((l: { scale: number }) => l.scale);
      expect(Math.max(...scales)).toBe(0.1);
      expect(Math.min(...scales)).toBeLessThanOrEqual(1e-9);
    });
  });
});
