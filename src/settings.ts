/**
 * 巨大娘计算器 - 设置 Store（兼容层）
 * 
 * 此文件重导出 stores/settings，保持向后兼容
 * 新代码请直接从 './stores' 或 './stores/settings' 导入
 * 
 * @deprecated 请使用 './stores/settings' 代替
 */

// 重导出所有内容
export {
  useSettingsStore,
  DAMAGE_SCENARIOS,
  SCENARIO_DESCRIPTIONS,
  type DamageScenario,
  type SettingsType,
  type DebugLogEntry,
} from './stores/settings';
