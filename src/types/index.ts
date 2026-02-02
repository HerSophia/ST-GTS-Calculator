/**
 * 巨大娘计算器 - 类型定义统一导出
 */

// 设置相关
export type {
  Settings,
  DamageSummary,
  DebugLogEntry,
  DamageScenarioInfo,
  DamageScenario,
} from './settings';

export { DAMAGE_SCENARIOS } from './settings';

// 计算相关
export type {
  LevelInfo,
  GiantessData,
  TinyData,
  CalcData,
} from './calculator';

// 常量相关
export type {
  SizeLevel,
  TinyLevel,
} from './constants';

// 互动限制相关
export type {
  InteractionRule,
  ImpossibleInteraction,
  InteractionLimits,
  PairwiseInteraction,
} from './interactions';

// 损害计算相关
export type {
  FootprintImpact,
  StepDamage,
  MacroDestruction,
  ScenarioCasualty,
  DamageCalculation,
  ActualDamageRecord,
} from './damage';

// 角色相关
export type {
  HeightRecord,
  MvuHeightRecord,
  CharacterMvuData,
  CharacterData,
  CharacterInfo,
} from './character';

// MVU 相关
export type {
  ScenarioMvuData,
  GiantessMvuData,
  MvuStatus,
} from './mvu';

// 提示词相关
export type {
  PromptTemplateType,
  PromptTemplate,
  PromptContext,
} from './prompt';

// 调试相关
export type {
  DebugCharacterInfo,
  MvuDebugInfo,
} from './debug';

// 扩展系统相关
export type {
  Extension,
  ExtensionRegistry,
  ExtensionState,
} from './extension';

// 世界观相关
export type {
  Worldview,
  WorldviewState,
} from './worldview';
