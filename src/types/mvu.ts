/**
 * 巨大娘计算器 - MVU 集成相关类型定义
 * 
 * 注意：v3.1.0 起，角色数据路径从 `{prefix}.{角色名}` 改为 `{prefix}.角色.{角色名}`
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
 * MVU 变量中的巨大娘数据结构（新版 v3.1.0+）
 * 
 * 路径示例：
 * - `巨大娘._场景.当前场景` - 场景设置
 * - `巨大娘.角色.络络.当前身高` - 角色身高
 * - `巨大娘._互动限制` - 互动限制
 */
export interface GiantessMvuData {
  /** 场景设置 */
  _场景?: ScenarioMvuData;
  /** 互动限制（脚本自动计算） */
  _互动限制?: Record<string, PairwiseInteraction>;
  /** 角色数据（键为角色名） */
  角色?: Record<string, CharacterMvuData>;
}

/**
 * 旧版 MVU 数据结构（v3.0.x 及之前）
 * 角色数据直接在顶层，与 _场景、_互动限制 混在一起
 * 
 * @deprecated 请使用 GiantessMvuData，旧版数据会自动迁移
 */
export interface LegacyGiantessMvuData {
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
