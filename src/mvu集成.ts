/**
 * 巨大娘计算器 - MVU 集成模块（薄入口层）
 * 
 * 此文件重导出 services 层的函数，保持向后兼容
 * 新代码请直接从 './services' 导入
 * 
 * @module mvu集成
 */

import type { ActualDamageRecord } from './types';

// 重导出类型，保持向后兼容
export type { ActualDamageRecord };

// 重导出 MVU 集成服务
export { initMvuIntegration, cleanupMvuIntegration } from './services/mvu';

// 重导出调试相关类型和函数
export type { DebugCharacterInfo, MvuDebugInfo } from './types';
export { getMvuDebugInfo, injectTestData, clearTestData } from './services/debug';

// 重导出全局 API 暴露函数
export { exposeGlobalFunctions } from './services/global-api';
