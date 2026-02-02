/**
 * 巨大娘计算器 - 提示词服务导出
 * 
 * @module services/prompt
 */

// Builder - 提示词构建
export {
  interpolate,
  formatBodyData,
  formatRelativeReferences,
  formatInteractionLimits,
  generateWorldviewPrompt,
  buildCharacterContext,
  generateAllDamagePrompt,
} from './builder';

// Injector - 提示词注入
export {
  getInjectedPromptId,
  uninjectPrompt,
  injectPromptContent,
  buildAndInjectPrompt,
  type CharacterDataForInjection,
} from './injector';
