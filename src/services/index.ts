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

// MVU Service - MVU 集成服务（兼容入口）
// 注意：v3.1.0 起大部分功能已迁移到 services/variables/
export {
  initMvuIntegration,
  cleanupMvuIntegration,
  refreshCharactersFromMvu,
  addHeightHistory,
  addHeightHistoryInternal,
  getHeightHistory,
  clearHeightHistory,
  getCharacterPath,
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

// Updater - 更新服务
export {
  initUpdater,
  checkForUpdates,
  fetchLatestRelease,
  getLatestReleaseApiUrl,
  getReleasePageUrl,
  getJsDelivrUrl,
  getRemoteScriptUrl,
  getRemoteJsonUrl,
} from './updater';

// Worldbook 服务已弃用，不再需要世界书初始化
// 如需使用，请直接从 './worldbook' 导入

// Variables Service - 变量服务（阶段二：新系统）
export {
  // 读取
  readGiantessData,
  extractCharacters,
  readCharacterData,
  readScenarioData,
  hasGiantessData,
  getCharacterNames,
  readRawVariables,
  // 写入
  getCharacterPath as getVariableCharacterPath,
  writeCharacterCalcData,
  writeCharacterDamageData,
  addHeightHistory as addVariableHeightHistory,
  addHeightHistoryInternal as addVariableHeightHistoryInternal,
  batchUpdateCharacters,
  writeInteractionLimits,
  writeScenarioData,
  deleteCharacterData,
  clearAllGiantessData,
  migrateOldDataFormat,
  // 解析
  parseValue,
  parseGtsUpdateCommands,
  parseStandaloneSetCommands,
  parseAllUpdateCommands,
  applyParsedUpdates,
  extractAndApplyUpdates,
  hasUpdateCommands,
  getAffectedCharacters,
  // 同步
  syncVariablesToStore,
  syncStoreToVariables,
  processCharacterUpdates,
  reinjectPromptsIfNeeded,
  fullDataProcess,
  // 事件处理
  initVariableEventListeners,
  cleanupEventListeners,
  getServiceStatus as getVariableServiceStatus,
  manualSync,
  isInitialized as isVariableServiceInitialized,
  // 类型
  type ParsedUpdate,
  type SyncResult,
  type CharacterUpdateData,
  type ReadOptions,
  type WriteOptions,
  type EventHandlerConfig,
  type VariableServiceStatus,
  type CalculationData,
  type CharacterFullData,
} from './variables';

// Regex Service - 正则服务
export {
  // 初始化和清理
  initRegexService,
  cleanupRegexService,
  // 注册和注销
  registerRegex,
  unregisterRegex,
  registerBuiltinRegexes,
  unregisterAllRegexes,
  // 状态查询
  isRegexRegistered,
  setRegexEnabled,
  getRegisteredRegexes,
  getRegexServiceState,
  // 常量
  REGEX_ID_PREFIX,
  GTS_UPDATE_HIDE_REGEX_ID,
  GTS_UPDATE_HIDE_REGEX_NAME,
  createGtsUpdateHideRegex,
  getBuiltinRegexConfigs,
} from './regex';
