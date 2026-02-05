/**
 * 巨大娘计算器 - 互动限制相关类型定义
 */

/**
 * 互动规则定义
 */
export interface InteractionRule {
  minRatio: number;
  description: string;
  alternatives: string;
}

/**
 * 不可能的互动项
 */
export interface ImpossibleInteraction {
  action: string;
  reason: string;
  alternative: string;
}

/**
 * 互动限制结果
 */
export interface InteractionLimits {
  ratio: number;
  ratioFormatted: string;
  smallInBigEyes: string;
  possible: string[];
  impossible: ImpossibleInteraction[];
  alternatives: Record<string, string>;
}

/**
 * 成对互动限制（包含角色信息）
 */
export interface PairwiseInteraction extends InteractionLimits {
  大者: string;
  小者: string;
  提示: string;
}
