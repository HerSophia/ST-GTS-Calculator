/**
 * 巨大娘计算器 - 扩展系统类型定义
 */

import type { Component } from 'vue';
import type { CharacterData } from './character';
import type { GiantessData, TinyData } from './calculator';
import type { PromptContext, PromptTemplate } from './prompt';

/**
 * 角色卡片扩展内容的上下文
 */
export interface CharacterCardContext {
  /** 角色数据 */
  character: CharacterData;
  /** 计算数据 */
  calcData: GiantessData | TinyData | null;
  /** 是否展开 */
  expanded: boolean;
}

/**
 * 扩展定义
 */
export interface Extension {
  /** 扩展唯一标识 */
  id: string;

  /** 扩展名称 */
  name: string;

  /** 扩展描述 */
  description: string;

  /** 图标（Font Awesome 类名） */
  icon: string;

  /** 是否默认启用 */
  defaultEnabled?: boolean;

  /** 依赖的其他扩展 */
  dependencies?: string[];

  // ========== 生命周期钩子 ==========

  /** 扩展启用时调用 */
  onEnable?: () => void | Promise<void>;

  /** 扩展禁用时调用 */
  onDisable?: () => void | Promise<void>;

  /** 初始化时调用（无论是否启用） */
  onInit?: () => void | Promise<void>;

  // ========== 计算钩子 ==========

  /** 角色数据更新后调用 */
  onCharacterUpdate?: (
    character: CharacterData,
    calcData: GiantessData | TinyData
  ) => void | Record<string, unknown>;

  /** 提示词注入前调用，可以修改上下文 */
  onBeforePromptInject?: (context: PromptContext) => PromptContext;

  /** 提示词注入后调用 */
  onAfterPromptInject?: (promptId: string) => void;

  // ========== 内容贡献 ==========

  /** 贡献的提示词模板 */
  getPromptTemplates?: () => PromptTemplate[];

  /**
   * 贡献要追加到主规则模板的规则片段
   * 这些片段会被追加到 'rules' 类型模板的末尾
   * @returns 规则片段内容（Markdown 格式）
   */
  getRulesContribution?: () => string | null;

  /** 贡献的设置项组件 */
  getSettingsComponent?: () => Component;

  /**
   * 贡献的角色卡片额外内容
   * 返回一个组件，该组件会接收 CharacterCardContext 作为 props
   */
  getCharacterCardExtra?: () => Component;

  /**
   * 判断是否应该为该角色显示扩展内容
   * @param context 角色卡片上下文
   * @returns 是否显示
   */
  shouldShowCardContent?: (context: CharacterCardContext) => boolean;

  /** 贡献的调试面板内容 */
  getDebugPanelExtra?: () => Component;
}

/**
 * 扩展注册表
 */
export interface ExtensionRegistry {
  /** 注册扩展 */
  register(extension: Extension): void;

  /** 获取扩展 */
  get(id: string): Extension | undefined;

  /** 获取所有扩展 */
  getAll(): Extension[];

  /** 获取已启用的扩展 */
  getEnabled(): Extension[];

  /** 启用扩展 */
  enable(id: string): void;

  /** 禁用扩展 */
  disable(id: string): void;

  /** 检查扩展是否启用 */
  isEnabled(id: string): boolean;
}

/**
 * 扩展状态
 */
export interface ExtensionState {
  /** 已启用的扩展 ID 列表 */
  enabledExtensions: string[];
}

/**
 * 扩展信息（用于 UI 展示和 API 返回）
 */
export interface ExtensionInfo {
  /** 扩展定义 */
  extension: Extension;
  /** 是否已启用 */
  enabled: boolean;
  /** 是否可以禁用（没有其他扩展依赖它） */
  canDisable: boolean;
  /** 是否可以启用（所有依赖都已启用） */
  canEnable: boolean;
  /** 缺失的依赖列表（当 canEnable 为 false 时） */
  missingDependencies?: string[];
}

/**
 * 扩展 API（对外暴露的接口）
 */
export interface ExtensionAPI {
  /** 注册扩展 */
  register(extension: Extension): void;

  /** 获取扩展 */
  get(id: string): Extension | undefined;

  /** 获取所有扩展 */
  getAll(): Extension[];

  /** 获取已启用的扩展 */
  getEnabled(): Extension[];

  /** 启用扩展 */
  enable(id: string): boolean;

  /** 禁用扩展 */
  disable(id: string): boolean;

  /** 切换扩展状态 */
  toggle(id: string): boolean;

  /** 检查扩展是否启用 */
  isEnabled(id: string): boolean;

  /** 获取扩展详细信息 */
  getInfo(id: string): ExtensionInfo | null;

  /** 获取所有扩展详细信息 */
  getAllInfo(): ExtensionInfo[];

  /** 检查是否可以启用扩展 */
  canEnable(id: string): { success: boolean; reason?: string; missingDependencies?: string[] };

  /** 检查是否可以禁用扩展 */
  canDisable(id: string): { success: boolean; reason?: string; dependents?: string[] };
}
