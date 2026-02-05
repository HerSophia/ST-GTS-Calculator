/**
 * 巨大娘计算器 - 提示词相关类型定义
 */

/**
 * 提示词模板类型
 */
export type PromptTemplateType =
  | 'header'
  | 'character'
  | 'interaction'
  | 'rules'
  | 'worldview'
  | 'damage'
  | 'items'
  | 'scenario'
  | 'footer';

/**
 * 提示词模板定义
 */
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  order: number;
  /** 模板内容，支持变量插值 */
  content: string;
  /** 模板类型 */
  type: PromptTemplateType;
  /** 是否为系统内置（不可删除） */
  builtin?: boolean;
  /** 是否为只读（不可编辑内容，仅可开关） */
  readonly?: boolean;
  /** 是否依赖特定功能开关 */
  requiresFeature?: 'damageCalculation' | 'itemsSystem';
}

/**
 * 提示词变量上下文
 */
export interface PromptContext {
  角色名: string;
  当前身高: number;
  当前身高_格式化: string;
  原身高: number;
  原身高_格式化: string;
  倍率: number;
  级别: string;
  描述: string;
  身体数据: string;
  /** 自定义部位数据 */
  自定义部位: string;
  相对参照: string;
  互动限制列表: string;
  世界观提示词: string;
  世界观名称: string;
  /** 损害计算数据 */
  损害数据: string;
  /** 物品数据 */
  物品数据: string;
  /** 当前场景名称 */
  当前场景: string;
  /** 场景详情描述 */
  场景详情: string;
  /** 可用场景列表 */
  可用场景列表: string;
  /** 允许额外的自定义字段 */
  [key: string]: string | number;
}
