/**
 * 巨大娘计算器 - MVU 集成服务导出
 * 
 * 注意：v3.1.0 起大部分功能已迁移到 services/variables/
 * 此模块保留作为兼容入口，从 variables 服务重导出
 * 
 * @module services/mvu
 * @deprecated 请使用 services/variables 代替
 */

export {
  initMvuIntegration,
  cleanupMvuIntegration,
} from './handler';

// 从 variables 服务重导出（兼容旧 API）
export {
  addHeightHistory,
  addHeightHistoryInternal,
  getCharacterPath,
  refreshCharactersFromMvu,
} from '../variables';

/**
 * @deprecated 使用 addHeightHistoryInternal 代替
 * 此函数签名已废弃，保留仅为向后兼容
 */
export function getHeightHistory(
  variables: Record<string, unknown>,
  prefix: string,
  name: string
): import('../../types').MvuHeightRecord[] {
  const historyPath = `stat_data.${prefix}.角色.${name}._身高历史`;
  return (_.get(variables, historyPath) as import('../../types').MvuHeightRecord[]) || [];
}

/**
 * @deprecated 使用变量服务的删除函数代替
 * 此函数签名已废弃，保留仅为向后兼容
 */
export function clearHeightHistory(
  variables: Record<string, unknown>,
  prefix: string,
  name: string
): void {
  const historyPath = `stat_data.${prefix}.角色.${name}._身高历史`;
  _.set(variables, historyPath, []);
}
