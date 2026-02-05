/**
 * 巨大娘计算器 - 世界观模板系统（兼容层）
 * 
 * 此文件重导出 stores/worldviews 和 services/prompt 的内容
 * 新代码请直接从对应模块导入
 * 
 * @module worldviews
 */

// 重导出 Store 和相关内容
export {
  useWorldviewsStore,
  DEFAULT_WORLDVIEWS,
  type Worldview,
} from './stores/worldviews';

// 重导出工具函数（从 services/prompt/builder）
export { generateWorldviewPrompt } from './services/prompt/builder';
