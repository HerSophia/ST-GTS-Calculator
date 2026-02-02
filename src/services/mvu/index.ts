/**
 * 巨大娘计算器 - MVU 集成服务导出
 * 
 * @module services/mvu
 */

export {
  handleVariableUpdate,
  initMvuIntegration,
  refreshCharactersFromMvu,
} from './handler';

export {
  addHeightHistory,
  getHeightHistory,
  clearHeightHistory,
} from './history';
