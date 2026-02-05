/**
 * useCalculator Composable 测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupTestPinia } from '../mocks/pinia';
import { toastrMock } from '../setup';
import { useCalculator } from '@/composables/useCalculator';

describe('Composable: useCalculator', () => {
  beforeEach(() => {
    setupTestPinia();
    vi.clearAllMocks();
  });

  describe('初始状态', () => {
    it('应该有正确的默认值', () => {
      const {
        calcHeight,
        calcOriginal,
        calcResult,
        isGiant,
        hasResult,
      } = useCalculator();

      expect(calcHeight.value).toBeUndefined();
      expect(calcOriginal.value).toBe(1.65);
      expect(calcResult.value).toBeNull();
      expect(isGiant.value).toBe(true);
      expect(hasResult.value).toBe(false);
    });
  });

  describe('doCalculate', () => {
    it('当身高未输入时，应该显示警告', () => {
      const { doCalculate, calcHeight } = useCalculator();
      calcHeight.value = undefined;

      doCalculate();

      expect(toastrMock.warning).toHaveBeenCalledWith('请输入有效的身高');
    });

    it('当身高为 0 时，应该显示警告', () => {
      const { doCalculate, calcHeight } = useCalculator();
      calcHeight.value = 0;

      doCalculate();

      expect(toastrMock.warning).toHaveBeenCalledWith('请输入有效的身高');
    });

    it('当身高为负数时，应该显示警告', () => {
      const { doCalculate, calcHeight } = useCalculator();
      calcHeight.value = -10;

      doCalculate();

      expect(toastrMock.warning).toHaveBeenCalledWith('请输入有效的身高');
    });

    it('当计算巨大娘（倍率>=1）时，应该返回巨大娘数据', () => {
      const { doCalculate, calcHeight, calcOriginal, calcResult, isGiant, hasResult } = useCalculator();
      
      calcHeight.value = 170; // 170米
      calcOriginal.value = 1.65; // 原身高 1.65米

      doCalculate();

      expect(isGiant.value).toBe(true);
      expect(hasResult.value).toBe(true);
      expect(calcResult.value).not.toBeNull();
      // 使用中文字段名 "倍率"
      expect(calcResult.value?.倍率).toBeCloseTo(103.03, 1);
    });

    it('当计算小人（倍率<1）时，应该返回小人数据', () => {
      const { doCalculate, calcHeight, calcOriginal, calcResult, isGiant, hasResult } = useCalculator();
      
      calcHeight.value = 0.0165; // 1.65厘米
      calcOriginal.value = 1.65; // 原身高 1.65米

      doCalculate();

      expect(isGiant.value).toBe(false);
      expect(hasResult.value).toBe(true);
      expect(calcResult.value).not.toBeNull();
      // 使用中文字段名 "倍率"
      expect(calcResult.value?.倍率).toBeCloseTo(0.01, 3);
    });

    it('当倍率刚好为 1 时，应该返回巨大娘数据', () => {
      const { doCalculate, calcHeight, calcOriginal, isGiant } = useCalculator();
      
      calcHeight.value = 1.65;
      calcOriginal.value = 1.65;

      doCalculate();

      expect(isGiant.value).toBe(true);
    });
  });

  describe('clearCalcResult', () => {
    it('应该清除计算结果', () => {
      const { doCalculate, clearCalcResult, calcHeight, calcResult, hasResult } = useCalculator();
      
      // 先计算
      calcHeight.value = 170;
      doCalculate();
      expect(hasResult.value).toBe(true);

      // 清除
      clearCalcResult();

      expect(calcResult.value).toBeNull();
      expect(hasResult.value).toBe(false);
    });
  });

  describe('resetCalculator', () => {
    it('应该重置所有输入和结果', () => {
      const {
        doCalculate,
        resetCalculator,
        calcHeight,
        calcOriginal,
        calcResult,
        isGiant,
        hasResult,
      } = useCalculator();
      
      // 先进行一些操作
      calcHeight.value = 0.01;
      calcOriginal.value = 1.70;
      doCalculate();
      expect(isGiant.value).toBe(false);

      // 重置
      resetCalculator();

      expect(calcHeight.value).toBeUndefined();
      expect(calcOriginal.value).toBe(1.65);
      expect(calcResult.value).toBeNull();
      expect(isGiant.value).toBe(true);
      expect(hasResult.value).toBe(false);
    });
  });

  describe('hasResult computed', () => {
    it('当没有结果时应该返回 false', () => {
      const { hasResult } = useCalculator();
      expect(hasResult.value).toBe(false);
    });

    it('当有结果时应该返回 true', () => {
      const { doCalculate, calcHeight, hasResult } = useCalculator();
      
      calcHeight.value = 100;
      doCalculate();

      expect(hasResult.value).toBe(true);
    });
  });
});
