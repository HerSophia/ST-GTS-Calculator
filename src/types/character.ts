/**
 * 巨大娘计算器 - 角色相关类型定义
 */

import type { GiantessData, TinyData } from './calculator';
import type { DamageCalculation, ActualDamageRecord } from './damage';

/**
 * 身高历史记录（Store 中使用的英文版本）
 * 
 * 注意：MVU 变量中存储的是中文字段版本（MvuHeightRecord）
 */
export interface HeightRecord {
  height: number;
  heightFormatted: string;
  time: string;
  reason: string;
}

/**
 * MVU 变量中的身高历史记录（中文字段）
 */
export interface MvuHeightRecord {
  身高: number;
  身高_格式化: string;
  时间戳: number;
  时间点: string;
  原因: string;
  变化?: '增大' | '缩小';
  变化倍率?: number;
}

/**
 * MVU 变量中的角色原始数据
 */
export interface CharacterMvuData {
  当前身高?: number;
  身高?: number;
  原身高?: number;
  原始身高?: number;
  变化原因?: string;
  变化时间?: string;
  /** 自定义部位尺寸 */
  自定义部位?: Record<string, number>;
  /** 计算后的数据 */
  _计算数据?: GiantessData | TinyData;
  /** 预估损害数据（基于场景和尺寸自动计算） */
  _损害数据?: DamageCalculation;
  /** 实际造成的损害（由 LLM 或用户记录） */
  _实际损害?: ActualDamageRecord;
  /** 身高历史记录（MVU 变量中使用中文字段） */
  _身高历史?: MvuHeightRecord[];
}

/**
 * Store 中使用的角色数据
 */
export interface CharacterData {
  name: string;
  currentHeight: number;
  originalHeight: number;
  changeReason?: string;
  changeTime?: string;
  customParts?: Record<string, number>;
  calcData?: GiantessData | TinyData;
  damageData?: DamageCalculation;
  actualDamage?: ActualDamageRecord;
  history?: HeightRecord[];
}

/**
 * 角色简要信息（用于列表显示）
 */
export interface CharacterInfo {
  name: string;
  height: number;
  calcData?: GiantessData | TinyData;
  damageData?: DamageCalculation;
}
