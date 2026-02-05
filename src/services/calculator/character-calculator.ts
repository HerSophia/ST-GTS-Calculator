/**
 * 巨大娘计算器 - 角色计算服务
 * 
 * 职责：
 * - 计算角色身体数据（巨大娘/小人）
 * - 计算损害数据
 * - 判断角色类型
 * 
 * @module services/calculator/character-calculator
 */

import type {
  GiantessData,
  TinyData,
  DamageCalculation,
  CharacterMvuData,
} from '../../types';
import {
  calculateGiantessData,
  calculateTinyData,
  calculateDamage,
  formatLength,
  type POPULATION_DENSITY,
} from '../../core';

/**
 * 角色类型
 */
export type CharacterType = 'giant' | 'tiny' | 'normal';

/**
 * 计算结果
 */
export interface CalculationResult {
  type: CharacterType;
  scale: number;
  calcData: GiantessData | TinyData | null;
  damageData: DamageCalculation | null;
}

/**
 * 判断角色类型
 * 
 * @param scale 缩放比例
 * @returns 角色类型
 */
export function getCharacterType(scale: number): CharacterType {
  if (scale >= 1.5) return 'giant';
  if (scale <= 0.8) return 'tiny';
  return 'normal';
}

/**
 * 计算角色数据
 * 
 * @param currentHeight 当前身高（米）
 * @param originalHeight 原始身高（米）
 * @param customParts 自定义部位尺寸
 * @returns 计算结果（巨大娘或小人数据）
 */
export function calculateCharacterData(
  currentHeight: number,
  originalHeight: number,
  customParts?: Record<string, number>
): GiantessData | TinyData {
  const scale = currentHeight / originalHeight;
  
  if (scale >= 1) {
    return calculateGiantessData(currentHeight, originalHeight, customParts);
  } else {
    return calculateTinyData(currentHeight, originalHeight);
  }
}

/**
 * 从 MVU 原始数据计算角色数据
 * 
 * @param rawData MVU 变量中的原始数据
 * @returns 计算结果，如果数据无效则返回 null
 */
export function calculateFromMvuData(
  rawData: CharacterMvuData
): { calcData: GiantessData | TinyData; type: CharacterType } | null {
  const currentHeight = rawData.当前身高 || rawData.身高;
  const originalHeight = rawData.原身高 || rawData.原始身高 || 1.65;
  
  if (!currentHeight || currentHeight <= 0) {
    return null;
  }
  
  const customParts = rawData.自定义部位 || {};
  const scale = currentHeight / originalHeight;
  const type = getCharacterType(scale);
  const calcData = calculateCharacterData(currentHeight, originalHeight, customParts);
  
  return { calcData, type };
}

/**
 * 计算角色的完整数据（包括损害）
 * 
 * @param currentHeight 当前身高
 * @param originalHeight 原始身高
 * @param options 选项
 * @returns 完整计算结果
 */
export function calculateFullCharacterData(
  currentHeight: number,
  originalHeight: number,
  options: {
    customParts?: Record<string, number>;
    enableDamage?: boolean;
    damageScenario?: keyof typeof POPULATION_DENSITY;
  } = {}
): CalculationResult {
  const scale = currentHeight / originalHeight;
  const type = getCharacterType(scale);
  
  if (type === 'normal') {
    return {
      type,
      scale,
      calcData: null,
      damageData: null,
    };
  }
  
  const calcData = calculateCharacterData(
    currentHeight,
    originalHeight,
    options.customParts
  );
  
  let damageData: DamageCalculation | null = null;
  if (options.enableDamage && type === 'giant') {
    damageData = calculateDamage(
      currentHeight,
      originalHeight,
      options.damageScenario || '大城市'
    );
  }
  
  return {
    type,
    scale,
    calcData,
    damageData,
  };
}

/**
 * 检查是否需要重新计算
 * 
 * @param rawData 新的原始数据
 * @param existingCalcData 已存在的计算数据
 * @returns 是否需要重新计算
 */
export function needsRecalculation(
  rawData: CharacterMvuData,
  existingCalcData?: GiantessData | TinyData
): boolean {
  const currentHeight = rawData.当前身高 || rawData.身高;
  const originalHeight = rawData.原身高 || rawData.原始身高;
  
  // 调试输出
  console.log('[GiantessCalc] needsRecalculation 输入:', {
    rawData_当前身高: rawData.当前身高,
    rawData_身高: rawData.身高,
    rawData_原身高: rawData.原身高,
    rawData_原始身高: rawData.原始身高,
    currentHeight,
    originalHeight,
    existingCalcData_原身高: existingCalcData?.原身高,
    existingCalcData_当前身高: existingCalcData?.当前身高,
  });
  
  if (!currentHeight) {
    console.log('[GiantessCalc] needsRecalculation: 无当前身高，返回 false');
    return false;
  }
  
  if (!existingCalcData) {
    console.log('[GiantessCalc] needsRecalculation: 无已有计算数据，返回 true');
    return true;
  }
  
  // 当前身高变化
  if (existingCalcData.当前身高 !== currentHeight) {
    console.log('[GiantessCalc] needsRecalculation: 当前身高变化，返回 true', {
      old: existingCalcData.当前身高,
      new: currentHeight,
    });
    return true;
  }
  
  // 原身高变化（重要：原身高影响倍率和所有身体部位的计算）
  if (originalHeight !== undefined && existingCalcData.原身高 !== originalHeight) {
    console.log('[GiantessCalc] needsRecalculation: 原身高变化，返回 true', {
      old: existingCalcData.原身高,
      new: originalHeight,
    });
    return true;
  }
  
  // 自定义部位变化
  const newCustomParts = rawData.自定义部位 || {};
  const oldCustomParts = (existingCalcData as GiantessData).自定义部位 || {};
  
  if (JSON.stringify(newCustomParts) !== JSON.stringify(oldCustomParts)) {
    console.log('[GiantessCalc] needsRecalculation: 自定义部位变化，返回 true');
    return true;
  }
  
  console.log('[GiantessCalc] needsRecalculation: 无变化，返回 false');
  return false;
}

/**
 * 重新计算损害数据
 * 
 * @param currentHeight 当前身高
 * @param originalHeight 原始身高
 * @param scenario 场景
 * @returns 损害数据，如果不适用则返回 null
 */
export function recalculateDamage(
  currentHeight: number,
  originalHeight: number,
  scenario: keyof typeof POPULATION_DENSITY = '大城市'
): DamageCalculation | null {
  const scale = currentHeight / originalHeight;
  
  if (scale < 1) {
    return null; // 小人不计算损害
  }
  
  return calculateDamage(currentHeight, originalHeight, scenario);
}

/**
 * 格式化身高为可读字符串
 */
export { formatLength };
