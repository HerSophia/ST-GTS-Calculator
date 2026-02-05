/**
 * Core: calculator 模块测试
 * 验证核心计算逻辑的正确性
 */
import { describe, it, expect } from 'vitest';
import {
  determineLevel,
  findSimilarObject,
  calculateGiantessData,
  calculateTinyData,
} from '@/core/calculator';
import { BASE_BODY_PARTS } from '@/core/constants';

describe('Core: calculator', () => {
  describe('determineLevel', () => {
    describe('巨大化级别', () => {
      it.each([
        [1, 'Mini级'],
        [5, 'Mini级'],
        [10, '十倍'],
        [50, '十倍'],
        [100, 'Kilo级'],
        [500, 'Kilo级'],
        [1000, '千倍'],
        [5000, '千倍'],
        [10000, 'Mega级_万倍'],
        [100000, 'Mega级_十万倍'],
        [1000000, 'Giga级_百万倍'],
        [10000000, 'Giga级_千万倍'],
        [100000000, 'Giga级_亿倍'],
        [1e9, 'Tera级_十亿倍'],
        [1e10, 'Tera级_百亿倍'],
        [1e11, 'Tera级_千亿倍'],
        [1e12, '星系级_万亿倍'],
        [1e16, '光年级'],
        [1e21, '宇宙级'],
      ])('倍率 %d 应该返回级别 %s', (scale, expectedLevel) => {
        const result = determineLevel(scale);
        expect(result.name).toBe(expectedLevel);
        expect(result.type).toBe('giant');
      });

      it('应该返回级别描述', () => {
        const result = determineLevel(100);
        expect(result.description).toBeTruthy();
        expect(typeof result.description).toBe('string');
      });

      it('极大倍率应该返回宇宙级', () => {
        const result = determineLevel(1e50);
        expect(result.name).toBe('宇宙级');
        expect(result.type).toBe('giant');
      });
    });

    describe('缩小级别', () => {
      it.each([
        [0.1, '十分之一'],
        [0.05, '十分之一'],
        [0.01, '百分之一'],
        [0.005, '百分之一'],
        [0.001, '千分之一_毫米级'],
        [0.0001, '万分之一'],
        [0.000001, '微米级'],
        [0.000000001, '纳米级'],
        [0.000000000001, '皮米级'],
      ])('倍率 %s 应该返回级别 %s', (scale, expectedLevel) => {
        const result = determineLevel(scale);
        expect(result.name).toBe(expectedLevel);
        expect(result.type).toBe('tiny');
      });

      it('极小倍率应该返回亚原子级', () => {
        const result = determineLevel(1e-20);
        expect(result.name).toBe('亚原子级');
        expect(result.type).toBe('tiny');
      });
    });
  });

  describe('findSimilarObject', () => {
    it('人类身高应该匹配普通成年人', () => {
      const result = findSimilarObject(1.7);
      expect(result).toContain('普通成年人');
    });

    it('约 3 米应该匹配单层楼高', () => {
      const result = findSimilarObject(3);
      expect(result).toContain('单层楼高');
    });

    it('很小的尺寸应该匹配昆虫', () => {
      const result = findSimilarObject(0.003);
      expect(result).toContain('蚂蚁');
    });

    it('地球尺度应该匹配地球直径', () => {
      const result = findSimilarObject(12742000);
      expect(result).toContain('地球直径');
    });

    it('介于两个参照物之间时应该返回比较描述', () => {
      const result = findSimilarObject(2); // 介于人类和单层楼之间
      expect(result).toBeTruthy();
      // 应该包含"大一些"或"小一些"
      expect(result.includes('大一些') || result.includes('小一些') || result.includes('约等于')).toBe(true);
    });
  });

  describe('calculateGiantessData', () => {
    describe('基本计算', () => {
      it('应该正确计算倍率', () => {
        const result = calculateGiantessData(170, 1.7);
        expect(result.倍率).toBe(100);
      });

      it('应该正确计算非整数倍率', () => {
        const result = calculateGiantessData(170, 1.65);
        expect(result.倍率).toBeCloseTo(103.03, 1);
      });

      it('应该使用默认原身高 1.65 米', () => {
        const result = calculateGiantessData(165);
        expect(result.原身高).toBe(1.65);
        expect(result.倍率).toBe(100);
      });

      it('应该包含当前身高和格式化版本', () => {
        const result = calculateGiantessData(170, 1.7);
        expect(result.当前身高).toBe(170);
        expect(result.当前身高_格式化).toBe('170米');
      });

      it('应该返回正确的级别', () => {
        const result = calculateGiantessData(170, 1.7); // 100 倍
        expect(result.级别).toBe('Kilo级');
        expect(result.级别描述).toBeTruthy();
      });
    });

    describe('身体部位计算', () => {
      it('应该计算所有身体部位', () => {
        const result = calculateGiantessData(170, 1.7);
        
        // 检查关键部位存在
        expect(result.身体部位).toHaveProperty('身高');
        expect(result.身体部位).toHaveProperty('足长');
        expect(result.身体部位).toHaveProperty('手掌长');
        expect(result.身体部位).toHaveProperty('乳房高度');
      });

      it('身高应该等于当前身高', () => {
        const result = calculateGiantessData(170, 1.7);
        expect(result.身体部位.身高).toBe(170);
      });

      it('应该按倍率缩放普通部位', () => {
        const scale = 100;
        const originalHeight = 1.75; // 使用 BASE_HEIGHT
        const result = calculateGiantessData(originalHeight * scale, originalHeight);

        // 足长应该是基准值 * 倍率
        const expectedFootLength = BASE_BODY_PARTS.足长 * scale;
        expect(result.身体部位.足长).toBeCloseTo(expectedFootLength, 0);
      });

      it('重量应该按立方缩放', () => {
        const scale = 10; // 17.5 / 1.75 = 10
        const result = calculateGiantessData(17.5, 1.75);

        // 重量按立方缩放
        const expectedBreastWeight = BASE_BODY_PARTS.单乳重量 * Math.pow(scale, 3);
        expect(result.身体部位.单乳重量).toBeCloseTo(expectedBreastWeight, 0);
      });

      it('容积应该按立方缩放', () => {
        const scale = 10;
        const result = calculateGiantessData(17.5, 1.75);

        // 容积按立方缩放
        const expectedVolume = BASE_BODY_PARTS.阴道容积_闭合 * Math.pow(scale, 3);
        expect(result.身体部位.阴道容积_闭合).toBeCloseTo(expectedVolume, 6);
      });

      it('面积应该按平方缩放', () => {
        const scale = 10;
        const result = calculateGiantessData(17.5, 1.75);

        // 面积按平方缩放
        const expectedArea = BASE_BODY_PARTS.指尖面积 * Math.pow(scale, 2);
        expect(result.身体部位.指尖面积).toBeCloseTo(expectedArea, 4);
      });

      it('应该提供格式化的身体部位数据', () => {
        const result = calculateGiantessData(170, 1.7);

        expect(result.身体部位_格式化).toHaveProperty('身高');
        expect(result.身体部位_格式化.身高).toBe('170米');
        expect(typeof result.身体部位_格式化.足长).toBe('string');
      });
    });

    describe('自定义部位', () => {
      it('应该支持自定义部位尺寸', () => {
        const customParts = { 足长: 50 };
        const result = calculateGiantessData(170, 1.7, customParts);

        expect(result.身体部位.足长).toBe(50);
      });

      it('应该记录自定义部位', () => {
        const customParts = { 足长: 50, 乳房高度: 28 };
        const result = calculateGiantessData(170, 1.7, customParts);

        expect(result.自定义部位).toEqual({ 足长: 50, 乳房高度: 28 });
      });

      it('应该计算自定义部位的倍率', () => {
        const customParts = { 足长: 50 };
        const result = calculateGiantessData(170, 1.7, customParts);

        // 足长基准值约 0.25 米，自定义 50 米，倍率约 200
        expect(result.自定义部位_倍率.足长).toBeGreaterThan(100);
      });

      it('自定义部位应该带有标记', () => {
        const customParts = { 足长: 50 };
        const result = calculateGiantessData(170, 1.7, customParts);

        expect(result.身体部位_格式化.足长).toContain('⚡');
      });

      it('非自定义部位不应该有标记', () => {
        const customParts = { 足长: 50 };
        const result = calculateGiantessData(170, 1.7, customParts);

        expect(result.身体部位_格式化.手掌长).not.toContain('⚡');
      });
    });

    describe('眼中的世界', () => {
      it('应该计算参照物在巨大娘眼中的相对尺寸', () => {
        const scale = 100;
        const result = calculateGiantessData(165, 1.65); // 100 倍

        // 普通成年人 1.7 米，在 100 倍巨大娘眼中是 1.7 厘米
        expect(result.眼中的世界.普通成年人).toBeCloseTo(0.017, 3);
      });

      it('应该提供格式化的参照物数据', () => {
        const result = calculateGiantessData(165, 1.65);

        expect(result.眼中的世界_格式化).toHaveProperty('普通成年人');
        expect(typeof result.眼中的世界_格式化.普通成年人).toBe('string');
      });

      it('应该包含昆虫参照物', () => {
        const result = calculateGiantessData(170, 1.7);

        expect(result.眼中的世界).toHaveProperty('蚂蚁');
        expect(result.眼中的世界).toHaveProperty('蟑螂');
      });
    });

    describe('描述生成', () => {
      it('应该生成描述文本', () => {
        const result = calculateGiantessData(170, 1.7);

        expect(result.描述).toBeTruthy();
        expect(typeof result.描述).toBe('string');
        expect(result.描述.length).toBeGreaterThan(50);
      });

      it('描述应该包含级别信息', () => {
        const result = calculateGiantessData(170, 1.7);

        expect(result.描述).toContain('Kilo级');
      });

      it('描述应该包含身体数据', () => {
        const result = calculateGiantessData(170, 1.7);

        expect(result.描述).toContain('身高');
        expect(result.描述).toContain('足长');
      });
    });

    describe('元数据', () => {
      it('应该包含计算时间戳', () => {
        const before = Date.now();
        const result = calculateGiantessData(170, 1.7);
        const after = Date.now();

        expect(result._计算时间).toBeGreaterThanOrEqual(before);
        expect(result._计算时间).toBeLessThanOrEqual(after);
      });

      it('应该包含版本号', () => {
        const result = calculateGiantessData(170, 1.7);

        expect(result._版本).toBeTruthy();
        expect(typeof result._版本).toBe('string');
      });
    });

    describe('不同原身高', () => {
      it('应该根据原身高调整基准比例', () => {
        // 两个人都变到 170 米，但原身高不同
        const tallPerson = calculateGiantessData(170, 1.85);
        const shortPerson = calculateGiantessData(170, 1.55);

        // 矮的人变化倍率更大
        expect(shortPerson.倍率).toBeGreaterThan(tallPerson.倍率);
      });
    });

    describe('边界情况', () => {
      it('应该处理 1 倍（无变化）', () => {
        const result = calculateGiantessData(1.65, 1.65);
        
        expect(result.倍率).toBe(1);
        expect(result.级别).toBe('Mini级');
      });

      it('应该处理极大身高', () => {
        const result = calculateGiantessData(1e20, 1.65);

        // 1e20 米约 10 光年，属于光年级
        expect(result.级别).toBe('光年级');
        expect(result.当前身高_格式化).toContain('光年');
      });
    });
  });

  describe('calculateTinyData', () => {
    describe('基本计算', () => {
      it('应该正确计算倍率', () => {
        const result = calculateTinyData(0.017, 1.7);
        expect(result.倍率).toBeCloseTo(0.01, 4);
      });

      it('应该使用默认原身高 1.7 米', () => {
        const result = calculateTinyData(0.017);
        expect(result.原身高).toBe(1.7);
      });

      it('应该返回正确的级别', () => {
        const result = calculateTinyData(0.017, 1.7); // 1% = 百分之一
        expect(result.级别).toBe('百分之一');
        expect(result.级别描述).toBeTruthy();
      });

      it('应该包含当前身高和格式化版本', () => {
        const result = calculateTinyData(0.017, 1.7);
        expect(result.当前身高).toBe(0.017);
        expect(result.当前身高_格式化).toContain('厘米');
      });
    });

    describe('眼中的巨大娘', () => {
      it('应该计算正常女性在小人眼中的相对尺寸', () => {
        const scale = 0.01; // 百分之一
        const result = calculateTinyData(1.7 * scale, 1.7);

        // 身高 1.75m 在 1% 小人眼中是 175 米
        expect(result.眼中的巨大娘.身高).toBeCloseTo(175, 0);
      });

      it('应该提供格式化数据', () => {
        const result = calculateTinyData(0.017, 1.7);

        expect(result.眼中的巨大娘_格式化).toHaveProperty('身高');
        expect(result.眼中的巨大娘_格式化).toHaveProperty('足长');
      });

      it('不应该包含重量、容积、面积数据', () => {
        const result = calculateTinyData(0.017, 1.7);

        expect(result.眼中的巨大娘).not.toHaveProperty('单乳重量');
        expect(result.眼中的巨大娘).not.toHaveProperty('阴道容积_闭合');
        expect(result.眼中的巨大娘).not.toHaveProperty('指尖面积');
      });
    });

    describe('描述生成', () => {
      it('应该生成描述文本', () => {
        const result = calculateTinyData(0.017, 1.7);

        expect(result.描述).toBeTruthy();
        expect(result.描述).toContain('百分之一');
      });

      it('微小级别应该包含毛发相关描述', () => {
        const result = calculateTinyData(0.0017, 1.7); // 千分之一

        expect(result.描述).toContain('阴毛');
      });
    });

    describe('边界情况', () => {
      it('应该处理极小尺寸', () => {
        const result = calculateTinyData(1e-10, 1.7);

        expect(result.级别).toBeTruthy();
        expect(result.倍率).toBeLessThan(1e-9);
      });
    });

    describe('元数据', () => {
      it('应该包含计算时间戳和版本', () => {
        const result = calculateTinyData(0.017, 1.7);

        expect(result._计算时间).toBeDefined();
        expect(result._版本).toBeDefined();
      });
    });
  });

  describe('巨大娘与小人对比', () => {
    it('100倍巨大娘和1%小人应该产生相反的视角', () => {
      const giantess = calculateGiantessData(170, 1.7); // 100倍
      const tiny = calculateTinyData(0.017, 1.7); // 1%

      // 巨大娘眼中的普通人 ≈ 小人当前身高
      expect(giantess.眼中的世界.普通成年人).toBeCloseTo(tiny.当前身高, 2);

      // 小人眼中的正常女性身高
      // 小人是 1% 比例，所以正常女性 1.75m 在他眼中是 175m
      // 这与巨大娘的身高 170m 不完全相同（因为巨大娘基于 1.7m 原身高）
      expect(tiny.眼中的巨大娘.身高).toBe(175); // BASE_HEIGHT / 0.01 = 175
    });
  });
});
