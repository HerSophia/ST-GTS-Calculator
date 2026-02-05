/**
 * 巨大娘计算器 - 提示词管理（兼容层）
 * 
 * 此文件重导出 stores/prompts 和 services/prompt 的内容
 * 新代码请直接从对应模块导入
 * 
 * @module prompts
 */

import type { PromptContext } from './types';

// 重导出 Store 和相关内容
export {
  usePromptsStore,
  DEFAULT_TEMPLATES,
  type PromptTemplate,
} from './stores/prompts';

// 重导出类型
export type { PromptContext };

// 重导出工具函数（从 services/prompt/builder）
export {
  interpolate,
  formatBodyData,
  formatRelativeReferences,
  formatInteractionLimits,
} from './services/prompt/builder';
