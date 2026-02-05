/**
 * 巨大娘计算器 - 计算服务导出
 * 
 * @module services/calculator
 */

export {
  getCharacterType,
  calculateCharacterData,
  calculateFromMvuData,
  calculateFullCharacterData,
  needsRecalculation,
  recalculateDamage,
  formatLength,
  type CharacterType,
  type CalculationResult,
} from './character-calculator';

export {
  calculatePairInteraction,
  calculatePairwiseInteractions,
  getInteractionsWithLimits,
  formatInteractionsForPrompt,
  checkInteraction,
  type CharacterForInteraction,
} from './interaction-calculator';
