/**
 * 巨大娘计算器 - 变量服务统一导出
 * 
 * 这个模块提供了新的变量服务系统，用于替代 MVU 事件驱动机制。
 * 
 * 主要功能：
 * - 从 Store 读取巨大娘数据（公开 API）
 * - 从酒馆楼层变量读写数据（内部 API，用于同步）
 * - 解析 AI 输出中的变量更新命令
 * - 监听酒馆事件并同步状态
 * - 管理角色数据的计算和更新
 * 
 * @module services/variables
 */

// === 变量读取（公开 API，从 Store 读取）===
export {
  readGiantessData,
  extractCharacters,
  readCharacterData,
  readScenarioData,
  hasGiantessData,
  getCharacterNames,
  readInteractionLimits,
  readRawVariables,
  // 兼容性别名
  getCharacterData,
} from './reader';

// === 变量读取（内部 API，直接访问酒馆变量）===
export {
  _internal_readGiantessData,
  _internal_extractCharacters,
  _internal_extractScenario,
  _internal_extractInteractions,
  _internal_extractProcessingState,
  _internal_readProcessingState,
  _internal_readRawVariables,
} from './reader';

// === 变量写入 ===
export {
  getCharacterPath,
  writeCharacterCalcData,
  writeCharacterDamageData,
  writeActualDamage,
  clearActualDamage,
  addHeightHistory,
  addHeightHistoryInternal,
  batchUpdateCharacters,
  writeInteractionLimits,
  writeScenarioData,
  deleteCharacterData,
  clearAllGiantessData,
  migrateOldDataFormat,
  // 处理状态管理
  writeProcessingState,
  updateProcessingState,
  clearProcessingState,
  // 通用追加函数
  appendToArray,
} from './writer';

// === AI 输出解析 ===
export {
  parseValue,
  parseGtsUpdateCommands,
  parseStandaloneSetCommands,
  parseAllUpdateCommands,
  applyParsedUpdates,
  extractAndApplyUpdates,
  hasUpdateCommands,
  getAffectedCharacters,
  // 值比较
  deepEqual,
  compareUpdatesWithExisting,
  filterChangedUpdates,
  hashContent,
} from './parser';

// === 状态同步 ===
export {
  syncVariablesToStore,
  syncStoreToVariables,
  processCharacterUpdates,
  reinjectPromptsIfNeeded,
  fullDataProcess,
  refreshCharactersFromMvu,
} from './sync';

// === 事件处理 ===
export {
  initVariableEventListeners,
  cleanupEventListeners,
  getServiceStatus,
  manualSync,
  isInitialized,
} from './event-handler';

// === 类型重导出 ===
export type {
  ParsedUpdate,
  SyncResult,
  CharacterUpdateData,
  ReadOptions,
  WriteOptions,
  EventHandlerConfig,
  VariableServiceStatus,
  CalculationData,
  CharacterFullData,
  // 第三阶段新增
  ProcessingState,
  ValueComparisonResult,
} from '../../types/variables';
