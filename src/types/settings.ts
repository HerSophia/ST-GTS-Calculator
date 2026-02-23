/**
 * 巨大娘计算器 - 设置类型定义
 *
 * @module types/settings
 */

/** 可用的人口密度场景 */
export const DAMAGE_SCENARIOS = [
  // 户外场景
  '荒野',
  '乡村',
  '郊区',
  '小城市',
  '中等城市',
  '大城市',
  '超大城市中心',
  '东京市中心',
  '香港',
  '马尼拉',
  // 室内场景
  '住宅内',
  '公寓楼内',
  '办公楼内',
  '体育馆内',
  // 特殊场景
  '巨大娘体内',
] as const;

export type DamageScenario = (typeof DAMAGE_SCENARIOS)[number];

/**
 * 设置项类型
 */
export interface Settings {
  // 功能开关
  enabled: boolean;
  debug: boolean;

  // MVU 集成
  variablePrefix: string;
  autoInject: boolean;
  injectDepth: number;
  injectInteractionLimits: boolean;

  // 计算设置
  precision: number;
  maxHistoryRecords: number;

  // 提示词管理
  showVariableUpdateRules: boolean;
  showWritingGuidelines: boolean;
  compactPromptFormat: boolean;

  // 世界观设置
  injectWorldviewPrompt: boolean;
  allowPartialScaling: boolean;

  // ========== 扩展计算系统 ==========
  // 损害计算设置
  enableDamageCalculation: boolean;
  injectDamagePrompt: boolean;
  damageScenario: string;
  showSpecialEffects: boolean;
  showDamagePerCharacter: boolean;
  showDamageSummary: boolean;

  // 物品系统设置
  enableItemsSystem: boolean;
  injectItemsPrompt: boolean;

  // 玩法指导设置
  enablePlayGuide: boolean;
  enabledPlayGuides: string[];
  customPlayGuideContents: Record<string, string>;
  /** 用户自定义的玩法指导（完全由用户创建，非内置） */
  customPlayGuides: CustomPlayGuide[];

  // 楼层数据显示设置
  enableMessageDisplay: boolean;
}

/**
 * 用户自定义玩法指导
 */
export interface CustomPlayGuide {
  /** 唯一标识（自动生成） */
  id: string;
  /** 显示名称 */
  name: string;
  /** 简短描述 */
  description: string;
  /** 图标 (FontAwesome class) */
  icon: string;
  /** 提示词内容 */
  content: string;
}

/**
 * 损害汇总数据
 */
export interface DamageSummary {
  /** 巨大娘数量 */
  giantCount: number;
  /** 小人数量 */
  tinyCount: number;
  /** 总预估伤亡范围 */
  totalCasualties: {
    min: number;
    max: number;
  };
  /** 总预估建筑损毁范围 */
  totalBuildings: {
    min: number;
    max: number;
  };
  /** 当前场景 */
  scenario: string;
}

/**
 * 调试日志条目
 */
export interface DebugLogEntry {
  time: string;
  type: 'log' | 'warn' | 'error';
  message: string;
}

/**
 * 损害场景信息
 */
export interface DamageScenarioInfo {
  id: string;
  name: string;
  density: number;
  description?: string;
}
