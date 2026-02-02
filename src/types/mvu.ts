/**
 * 巨大娘计算器 - MVU 集成相关类型定义
 */

import type { CharacterMvuData } from './character';
import type { PairwiseInteraction } from './interactions';

/**
 * 全局场景数据（存储在 stat_data.{prefix}._场景 中）
 */
export interface ScenarioMvuData {
  /** LLM 或用户设置的当前场景 */
  当前场景?: string;
  /** 为什么在这个场景 */
  场景原因?: string;
}

/**
 * MVU 变量中的巨大娘数据结构
 */
export interface GiantessMvuData {
  /** 角色数据（键为角色名） */
  [characterName: string]: CharacterMvuData | ScenarioMvuData | Record<string, PairwiseInteraction> | undefined;
  /** 场景设置 */
  _场景?: ScenarioMvuData;
  /** 互动限制 */
  _互动限制?: Record<string, PairwiseInteraction>;
}

/**
 * MVU 状态信息
 */
export interface MvuStatus {
  available: boolean;
  version: string | null;
  prefix: string;
  hasData: boolean;
  characterCount: number;
}
