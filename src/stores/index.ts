/**
 * 巨大娘计算器 - Store 统一导出
 * 
 * @module stores
 */

// Settings Store
export {
  useSettingsStore,
  DAMAGE_SCENARIOS,
  SCENARIO_DESCRIPTIONS,
  type DamageScenario,
  type SettingsType,
  type DebugLogEntry,
} from './settings';

// Characters Store (base store, for internal use)
export {
  useCharactersStoreBase,
  type CharacterData,
  type HeightRecord,
} from './characters';

// Prompts Store
export {
  usePromptsStore,
  DEFAULT_TEMPLATES,
  type PromptTemplate,
} from './prompts';

// Worldviews Store
export {
  useWorldviewsStore,
  DEFAULT_WORLDVIEWS,
  type Worldview,
} from './worldviews';
