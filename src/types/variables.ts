/**
 * 巨大娘计算器 - 变量服务类型定义
 * 
 * 这些类型用于新的变量服务系统，替代 MVU 事件驱动机制
 * 
 * @module types/variables
 */

import type { CharacterMvuData, MvuHeightRecord } from './character';
import type { GiantessData, TinyData } from './calculator';
import type { DamageCalculation, ActualDamageRecord } from './damage';
import type { GiantessMvuData } from './mvu';

// 重导出需要的类型
export type { CharacterMvuData, MvuHeightRecord };
export type { GiantessData, TinyData };
export type { DamageCalculation, ActualDamageRecord };
export type { GiantessMvuData };

/**
 * 解析的变量更新命令
 */
export interface ParsedUpdate {
  /** 变量路径（如 '巨大娘.角色.络络.当前身高'） */
  path: string;
  /** 变量值 */
  value: unknown;
}

/**
 * 同步结果
 */
export interface SyncResult {
  /** 是否成功 */
  success: boolean;
  /** 同步的角色数量 */
  characterCount: number;
  /** 错误信息（如果失败） */
  error?: string;
}

/**
 * 角色更新数据
 */
export interface CharacterUpdateData {
  /** 角色名 */
  name: string;
  /** 要更新的数据 */
  data: Partial<CharacterMvuData>;
}

/**
 * 变量读取选项
 */
export interface ReadOptions {
  /** 消息楼层 ID，默认为 'latest' */
  messageId?: number | 'latest';
}

/**
 * 变量写入选项
 */
export interface WriteOptions {
  /** 消息楼层 ID，默认为 'latest' */
  messageId?: number | 'latest';
  /** 是否触发同步到 Store */
  syncToStore?: boolean;
}

/**
 * 事件处理器配置
 */
export interface EventHandlerConfig {
  /** 是否启用防抖 */
  debounce?: boolean;
  /** 防抖延迟（毫秒） */
  debounceDelay?: number;
  /** 是否在初始化时立即同步 */
  syncOnInit?: boolean;
}

/**
 * 变量服务状态
 */
export interface VariableServiceStatus {
  /** 是否已初始化 */
  initialized: boolean;
  /** 最后同步时间 */
  lastSyncTime: number | null;
  /** 注册的事件监听器数量 */
  listenerCount: number;
  /** 当前消息 ID */
  currentMessageId: number | 'latest' | null;
}

/**
 * 处理状态记录
 * 用于追踪消息是否已被处理，避免重复处理
 */
export interface ProcessingState {
  /** 最后处理的消息 ID */
  最后处理消息ID?: number | 'latest';
  /** 最后处理时间戳 */
  最后处理时间?: number;
  /** 消息内容的哈希值（用于检测编辑） */
  内容哈希?: string;
  /** 处理的角色列表 */
  已处理角色?: string[];
}

/**
 * 计算数据联合类型
 */
export type CalculationData = GiantessData | TinyData;

/**
 * 角色完整数据（用于 Store）
 */
export interface CharacterFullData {
  name: string;
  currentHeight: number;
  originalHeight: number;
  changeReason?: string;
  changeTime?: string;
  calcData: CalculationData;
  damageData?: DamageCalculation;
  actualDamage?: ActualDamageRecord;
  history: MvuHeightRecord[];
  customParts?: Record<string, number>;
}

/**
 * 场景数据（从变量读取）
 */
export interface ScenarioVariableData {
  /** 当前场景类型（如：大城市、郊区、室内等） */
  当前场景?: string;
  /** 场景变化原因 */
  场景原因?: string;
  /** 具体地点描述（可选，如：东京银座、公司办公室） */
  具体地点?: string;
  /** 场景时间（可选，如：傍晚、深夜） */
  场景时间?: string;
  /** 人群状态（可选，如：拥挤、稀疏、撤离中） */
  人群状态?: string;
  /** 
   * 人群密度（人/平方公里）
   * 直接指定密度值，优先级高于场景预设
   */
  人群密度?: number;
  /** 最后更新时间戳 */
  _更新时间?: number;
}

/**
 * 巨大娘数据结构（从变量读取）
 * 与 GiantessMvuData 相同，但更明确用于变量服务
 * 支持旧格式兼容
 */
export interface GiantessVariableData {
  /** 场景设置 */
  _场景?: ScenarioVariableData;
  /** 互动限制（脚本自动计算） */
  _互动限制?: Record<string, unknown>;
  /** 处理状态追踪 */
  _处理状态?: ProcessingState;
  /** 角色数据（键为角色名） */
  角色?: Record<string, CharacterMvuData>;
  /** 兼容旧格式：角色数据可能直接在顶层 */
  [key: string]: unknown;
}

/**
 * 值比较结果
 */
export interface ValueComparisonResult {
  /** 是否有变化 */
  hasChanges: boolean;
  /** 新增的更新 */
  newUpdates: ParsedUpdate[];
  /** 变化的更新（值不同） */
  changedUpdates: ParsedUpdate[];
  /** 未变化的更新（值相同） */
  unchangedUpdates: ParsedUpdate[];
}
