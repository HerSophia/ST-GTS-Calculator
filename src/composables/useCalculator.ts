/**
 * 快速计算逻辑 Composable
 * 处理面板中的快速计算功能
 */
import { ref, computed } from 'vue';
import { calculateGiantessData, calculateTinyData, type GiantessData, type TinyData } from '../core';

export function useCalculator() {
  // 快速计算状态
  const calcHeight = ref<number | undefined>(undefined);
  const calcOriginal = ref(1.65);
  const calcResult = ref<GiantessData | TinyData | null>(null);
  const isGiant = ref(true);

  /**
   * 执行计算
   */
  const doCalculate = () => {
    if (!calcHeight.value || calcHeight.value <= 0) {
      toastr.warning('请输入有效的身高');
      return;
    }

    const scale = calcHeight.value / calcOriginal.value;
    isGiant.value = scale >= 1;

    calcResult.value = scale >= 1
      ? calculateGiantessData(calcHeight.value, calcOriginal.value)
      : calculateTinyData(calcHeight.value, calcOriginal.value);
  };

  /**
   * 清除计算结果
   */
  const clearCalcResult = () => {
    calcResult.value = null;
  };

  /**
   * 重置所有输入
   */
  const resetCalculator = () => {
    calcHeight.value = undefined;
    calcOriginal.value = 1.65;
    calcResult.value = null;
    isGiant.value = true;
  };

  /**
   * 是否有计算结果
   */
  const hasResult = computed(() => calcResult.value !== null);

  return {
    // 状态
    calcHeight,
    calcOriginal,
    calcResult,
    isGiant,
    hasResult,
    // 方法
    doCalculate,
    clearCalcResult,
    resetCalculator,
  };
}
