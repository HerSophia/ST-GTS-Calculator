/**
 * 巨大娘计算器 - 计算相关类型定义
 */

/**
 * 级别信息
 */
export interface LevelInfo {
  name: string;
  description: string;
  type: 'giant' | 'tiny' | 'normal';
  minScale?: number;
  maxScale?: number;
  scale?: number;
}

/**
 * 巨大娘计算结果
 */
export interface GiantessData {
  原身高: number;
  当前身高: number;
  当前身高_格式化: string;
  倍率: number;
  级别: string;
  级别描述: string;
  身体部位: Record<string, number>;
  身体部位_格式化: Record<string, string>;
  自定义部位: Record<string, number>;
  自定义部位_倍率: Record<string, number>;
  眼中的世界: Record<string, number>;
  眼中的世界_格式化: Record<string, string>;
  描述: string;
  _计算时间: number;
  _版本: string;
}

/**
 * 小人计算结果
 */
export interface TinyData {
  原身高: number;
  当前身高: number;
  当前身高_格式化: string;
  倍率: number;
  级别: string;
  级别描述: string;
  眼中的巨大娘: Record<string, number>;
  眼中的巨大娘_格式化: Record<string, string>;
  描述: string;
  _计算时间: number;
  _版本: string;
}

/**
 * 计算数据的联合类型
 */
export type CalcData = GiantessData | TinyData;
