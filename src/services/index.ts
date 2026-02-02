/**
 * 巨大娘计算器 - 服务层统一导出
 * 
 * 服务层职责：
 * - 协调多个模块完成复杂业务
 * - 不包含 UI 逻辑
 * - 依赖 Core 层和 Stores 层
 * 
 * @module services
 */

// Calculator Service - 计算服务
export {
  getCharacterType,
  calculateCharacterData,
  calculateFromMvuData,
  calculateFullCharacterData,
  needsRecalculation,
  recalculateDamage,
  formatLength,
  calculatePairInteraction,
  calculatePairwiseInteractions,
  getInteractionsWithLimits,
  formatInteractionsForPrompt,
  checkInteraction,
  type CharacterType,
  type CalculationResult,
  type CharacterForInteraction,
} from './calculator';

// Prompt Service - 提示词服务
export {
  interpolate,
  formatBodyData,
  formatRelativeReferences,
  formatInteractionLimits,
  generateWorldviewPrompt,
  buildCharacterContext,
  generateAllDamagePrompt,
  getInjectedPromptId,
  uninjectPrompt,
  injectPromptContent,
  buildAndInjectPrompt,
  type CharacterDataForInjection,
} from './prompt';

// MVU Service - MVU 集成服务
export {
  handleVariableUpdate,
  initMvuIntegration,
  refreshCharactersFromMvu,
  addHeightHistory,
  getHeightHistory,
  clearHeightHistory,
} from './mvu';

// Debug Service - 调试服务
export {
  getMvuDebugInfo,
  injectTestData,
  clearTestData,
  type TestInjectionResult,
} from './debug';

// Global API - 全局 API
export {
  exposeGlobalFunctions,
  type GiantessCalcAPI,
} from './global-api';

// Extensions - 扩展系统
export {
  extensionManager,
  damageExtension,
  DAMAGE_EXTENSION_ID,
  generateDamagePromptForCharacter,
  registerBuiltinExtensions,
  initExtensions,
  syncExtensionsWithSettings,
} from './extensions';
