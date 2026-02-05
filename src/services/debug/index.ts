/**
 * 巨大娘计算器 - 调试服务导出
 * 
 * @module services/debug
 */

export { getMvuDebugInfo } from './info-collector';

export {
  injectTestData,
  clearTestData,
  type TestInjectionResult,
} from './test-injector';

// 重导出类型供 UI 使用
export type { MvuDebugInfo, DebugCharacterInfo } from '../../types';
