/**
 * 巨大娘计算器 - 互动限制计算服务
 * 
 * 职责：
 * - 计算两个角色之间的互动限制
 * - 生成互动限制提示词
 * - 计算多角色的两两互动
 * 
 * @module services/calculator/interaction-calculator
 */

import type { PairwiseInteraction, InteractionLimits } from '../../types';
import {
  checkInteractionLimits,
  generateInteractionPrompt,
  formatLength,
} from '../../core';

/**
 * 角色信息（用于互动计算）
 */
export interface CharacterForInteraction {
  name: string;
  height: number;
}

/**
 * 计算两个角色之间的互动限制
 * 
 * @param char1 角色1
 * @param char2 角色2
 * @returns 互动限制信息
 */
export function calculatePairInteraction(
  char1: CharacterForInteraction,
  char2: CharacterForInteraction
): PairwiseInteraction {
  // 确定大小关系
  let big: CharacterForInteraction;
  let small: CharacterForInteraction;
  
  if (char1.height >= char2.height) {
    big = char1;
    small = char2;
  } else {
    big = char2;
    small = char1;
  }
  
  // 计算互动限制
  const limits = checkInteractionLimits(big.height, small.height, formatLength);
  
  return {
    大者: big.name,
    小者: small.name,
    ...limits,
    提示: generateInteractionPrompt(big.name, small.name, limits),
  };
}

/**
 * 计算多个角色之间的两两互动限制
 * 
 * @param characters 角色列表
 * @returns 互动限制映射（键格式：大者_小者）
 */
export function calculatePairwiseInteractions(
  characters: CharacterForInteraction[]
): Record<string, PairwiseInteraction> {
  const interactions: Record<string, PairwiseInteraction> = {};
  
  for (let i = 0; i < characters.length; i++) {
    for (let j = i + 1; j < characters.length; j++) {
      const interaction = calculatePairInteraction(characters[i], characters[j]);
      const pairKey = `${interaction.大者}_${interaction.小者}`;
      interactions[pairKey] = interaction;
    }
  }
  
  return interactions;
}

/**
 * 获取有实际限制的互动（过滤掉无限制的）
 * 
 * @param interactions 互动限制映射
 * @returns 有限制的互动列表
 */
export function getInteractionsWithLimits(
  interactions: Record<string, PairwiseInteraction>
): PairwiseInteraction[] {
  return Object.values(interactions).filter(
    (interaction) => interaction.impossible && interaction.impossible.length > 0
  );
}

/**
 * 格式化互动限制为简洁的列表格式
 * 
 * @param interactions 互动限制列表
 * @returns 格式化的互动限制信息
 */
export function formatInteractionsForPrompt(
  interactions: PairwiseInteraction[]
): Array<{
  大者: string;
  小者: string;
  impossible: Array<{ action: string; reason: string; alternative: string }>;
}> {
  return interactions
    .filter((i) => i.impossible && i.impossible.length > 0)
    .map((i) => ({
      大者: i.大者,
      小者: i.小者,
      impossible: i.impossible || [],
    }));
}

/**
 * 直接使用身高值检查互动限制
 * 
 * @param bigHeight 较大者身高
 * @param smallHeight 较小者身高
 * @returns 互动限制
 */
export function checkInteraction(
  bigHeight: number,
  smallHeight: number
): InteractionLimits {
  return checkInteractionLimits(bigHeight, smallHeight, formatLength);
}
