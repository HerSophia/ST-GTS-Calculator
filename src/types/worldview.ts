/**
 * 巨大娘计算器 - 世界观相关类型定义
 */

/**
 * 世界观定义
 */
export interface Worldview {
  /** 唯一标识 */
  id: string;

  /** 世界观名称 */
  name: string;

  /** 图标（Font Awesome 类名） */
  icon: string;

  /** 简短描述 */
  description: string;

  /** 变化机制说明 */
  mechanism: string;

  /** 身体特性 - 体型变化后的身体变化规律 */
  bodyCharacteristics: string;

  /** 可能的限制或副作用 */
  limitations: string[];

  /** 特殊能力/规则 */
  specialRules: string[];

  /** 写作建议 */
  writingTips: string[];

  /** 是否为内置（不可删除） */
  builtin?: boolean;

  /** 身体部位独立变化的默认启用状态 */
  allowPartialScaling?: boolean;

  /** 该世界观下的典型部位变化（如某些世界观下胸部会额外增大等） */
  typicalPartOverrides?: Record<string, number>;
}

/**
 * 世界观 Store 状态
 */
export interface WorldviewState {
  /** 当前选中的世界观 ID */
  currentWorldviewId: string;

  /** 自定义世界观列表 */
  customWorldviews: Worldview[];

  /** 是否注入世界观提示词 */
  injectWorldviewPrompt: boolean;
}
