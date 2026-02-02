/**
 * 巨大娘计算器 - 扩展系统类型定义
 */

import type { Component } from 'vue';
import type { CharacterData } from './character';
import type { GiantessData, TinyData } from './calculator';
import type { PromptContext, PromptTemplate } from './prompt';

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

  /** 贡献的设置项组件 */
  getSettingsComponent?: () => Component;

  /** 贡献的角色卡片额外内容 */
  getCharacterCardExtra?: () => Component;

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
