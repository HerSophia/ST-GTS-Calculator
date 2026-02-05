/**
 * 巨大娘计算器 - 世界书服务导出
 * 
 * @module services/worldbook
 */

export {
  generateInitYaml,
  getInitDataWithPrefix,
  DEFAULT_CHARACTER_DATA,
  DEFAULT_SCENE_DATA,
  DEFAULT_MVU_INIT_DATA,
} from './init-data';

export type {
  InitCharacterData,
  InitSceneData,
  InitMvuData,
} from './init-data';

export {
  initializeWorldbook,
  getInitializerStatus,
  createWorldbookWithInitEntry,
  ensureInitEntry,
  DEFAULT_CONFIG,
} from './initializer';

export type {
  WorldbookConfig,
  InitializerStatus,
} from './initializer';
