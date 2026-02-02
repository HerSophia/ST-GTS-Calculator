/**
 * 巨大娘计算器 - 扩展管理器
 * 
 * 职责：
 * - 管理扩展的注册、启用、禁用
 * - 触发扩展钩子
 * - 收集扩展贡献的内容
 * 
 * @module services/extensions/manager
 */

import type { Component } from 'vue';
import type {
  Extension,
  ExtensionRegistry,
  CharacterData,
  PromptContext,
  PromptTemplate,
  GiantessData,
  TinyData,
} from '../../types';

/**
 * 扩展管理器实现
 */
class ExtensionManagerImpl implements ExtensionRegistry {
  private extensions = new Map<string, Extension>();
  private enabledSet = new Set<string>();
  private initialized = false;

  /**
   * 注册扩展
   */
  register(extension: Extension): void {
    if (this.extensions.has(extension.id)) {
      console.warn(`[ExtensionManager] Extension ${extension.id} already registered`);
      return;
    }

    this.extensions.set(extension.id, extension);
    console.log(`[ExtensionManager] Registered extension: ${extension.id}`);

    // 调用初始化钩子
    try {
      extension.onInit?.();
    } catch (e) {
      console.error(`[ExtensionManager] Failed to init extension ${extension.id}:`, e);
    }
  }

  /**
   * 获取扩展
   */
  get(id: string): Extension | undefined {
    return this.extensions.get(id);
  }

  /**
   * 获取所有扩展
   */
  getAll(): Extension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * 获取已启用的扩展
   */
  getEnabled(): Extension[] {
    return this.getAll().filter((ext) => this.enabledSet.has(ext.id));
  }

  /**
   * 启用扩展
   */
  enable(id: string): void {
    const ext = this.extensions.get(id);
    if (!ext) {
      console.warn(`[ExtensionManager] Extension ${id} not found`);
      return;
    }

    // 检查依赖
    if (ext.dependencies) {
      for (const depId of ext.dependencies) {
        if (!this.isEnabled(depId)) {
          console.warn(
            `[ExtensionManager] Cannot enable ${id}: dependency ${depId} not enabled`
          );
          return;
        }
      }
    }

    if (this.enabledSet.has(id)) {
      return; // 已经启用
    }

    this.enabledSet.add(id);
    console.log(`[ExtensionManager] Enabled extension: ${id}`);

    // 调用启用钩子
    try {
      ext.onEnable?.();
    } catch (e) {
      console.error(`[ExtensionManager] Failed to enable extension ${id}:`, e);
      this.enabledSet.delete(id);
    }
  }

  /**
   * 禁用扩展
   */
  disable(id: string): void {
    const ext = this.extensions.get(id);
    if (!ext) {
      return;
    }

    // 检查是否有其他扩展依赖它
    for (const [otherId, other] of this.extensions) {
      if (other.dependencies?.includes(id) && this.isEnabled(otherId)) {
        console.warn(`[ExtensionManager] Cannot disable ${id}: ${otherId} depends on it`);
        return;
      }
    }

    if (!this.enabledSet.has(id)) {
      return; // 已经禁用
    }

    this.enabledSet.delete(id);
    console.log(`[ExtensionManager] Disabled extension: ${id}`);

    // 调用禁用钩子
    try {
      ext.onDisable?.();
    } catch (e) {
      console.error(`[ExtensionManager] Failed to disable extension ${id}:`, e);
    }
  }

  /**
   * 检查扩展是否启用
   */
  isEnabled(id: string): boolean {
    return this.enabledSet.has(id);
  }

  /**
   * 切换扩展状态
   */
  toggle(id: string): boolean {
    if (this.isEnabled(id)) {
      this.disable(id);
      return false;
    } else {
      this.enable(id);
      return this.isEnabled(id);
    }
  }

  // ========== 钩子触发方法 ==========

  /**
   * 触发角色更新钩子
   * @returns 所有扩展返回的额外数据合并结果
   */
  triggerCharacterUpdate(
    character: CharacterData,
    calcData: GiantessData | TinyData
  ): Record<string, unknown> {
    const results: Record<string, unknown> = {};

    for (const ext of this.getEnabled()) {
      if (ext.onCharacterUpdate) {
        try {
          const extResult = ext.onCharacterUpdate(character, calcData);
          if (extResult && typeof extResult === 'object') {
            Object.assign(results, extResult);
          }
        } catch (e) {
          console.error(
            `[ExtensionManager] Error in ${ext.id}.onCharacterUpdate:`,
            e
          );
        }
      }
    }

    return results;
  }

  /**
   * 触发提示词注入前钩子
   */
  triggerBeforePromptInject(context: PromptContext): PromptContext {
    let result = context;

    for (const ext of this.getEnabled()) {
      if (ext.onBeforePromptInject) {
        try {
          result = ext.onBeforePromptInject(result);
        } catch (e) {
          console.error(
            `[ExtensionManager] Error in ${ext.id}.onBeforePromptInject:`,
            e
          );
        }
      }
    }

    return result;
  }

  /**
   * 触发提示词注入后钩子
   */
  triggerAfterPromptInject(promptId: string): void {
    for (const ext of this.getEnabled()) {
      if (ext.onAfterPromptInject) {
        try {
          ext.onAfterPromptInject(promptId);
        } catch (e) {
          console.error(
            `[ExtensionManager] Error in ${ext.id}.onAfterPromptInject:`,
            e
          );
        }
      }
    }
  }

  // ========== 内容收集方法 ==========

  /**
   * 收集所有扩展贡献的提示词模板
   */
  collectPromptTemplates(): PromptTemplate[] {
    const templates: PromptTemplate[] = [];

    for (const ext of this.getEnabled()) {
      if (ext.getPromptTemplates) {
        try {
          const extTemplates = ext.getPromptTemplates();
          templates.push(...extTemplates);
        } catch (e) {
          console.error(
            `[ExtensionManager] Error in ${ext.id}.getPromptTemplates:`,
            e
          );
        }
      }
    }

    return templates;
  }

  /**
   * 收集所有扩展贡献的设置组件
   */
  collectSettingsComponents(): Map<string, Component> {
    const components = new Map<string, Component>();

    for (const ext of this.getEnabled()) {
      if (ext.getSettingsComponent) {
        try {
          const component = ext.getSettingsComponent();
          components.set(ext.id, component);
        } catch (e) {
          console.error(
            `[ExtensionManager] Error in ${ext.id}.getSettingsComponent:`,
            e
          );
        }
      }
    }

    return components;
  }

  /**
   * 收集所有扩展贡献的角色卡片额外内容
   */
  collectCharacterCardExtras(): Map<string, Component> {
    const components = new Map<string, Component>();

    for (const ext of this.getEnabled()) {
      if (ext.getCharacterCardExtra) {
        try {
          const component = ext.getCharacterCardExtra();
          components.set(ext.id, component);
        } catch (e) {
          console.error(
            `[ExtensionManager] Error in ${ext.id}.getCharacterCardExtra:`,
            e
          );
        }
      }
    }

    return components;
  }

  /**
   * 收集所有扩展贡献的调试面板内容
   */
  collectDebugPanelExtras(): Map<string, Component> {
    const components = new Map<string, Component>();

    for (const ext of this.getEnabled()) {
      if (ext.getDebugPanelExtra) {
        try {
          const component = ext.getDebugPanelExtra();
          components.set(ext.id, component);
        } catch (e) {
          console.error(
            `[ExtensionManager] Error in ${ext.id}.getDebugPanelExtra:`,
            e
          );
        }
      }
    }

    return components;
  }

  // ========== 状态管理 ==========

  /**
   * 获取启用状态（用于持久化）
   */
  getEnabledIds(): string[] {
    return Array.from(this.enabledSet);
  }

  /**
   * 恢复启用状态（从持久化数据）
   */
  restoreEnabledIds(ids: string[]): void {
    for (const id of ids) {
      if (this.extensions.has(id)) {
        this.enable(id);
      }
    }
  }

  /**
   * 初始化默认启用的扩展
   */
  initDefaults(): void {
    if (this.initialized) return;
    this.initialized = true;

    for (const ext of this.extensions.values()) {
      if (ext.defaultEnabled) {
        this.enable(ext.id);
      }
    }
  }

  /**
   * 获取扩展信息（用于 UI 展示）
   */
  getExtensionInfo(id: string): {
    extension: Extension;
    enabled: boolean;
    canDisable: boolean;
  } | null {
    const ext = this.extensions.get(id);
    if (!ext) return null;

    // 检查是否可以禁用（没有其他扩展依赖它）
    let canDisable = true;
    for (const [otherId, other] of this.extensions) {
      if (other.dependencies?.includes(id) && this.isEnabled(otherId)) {
        canDisable = false;
        break;
      }
    }

    return {
      extension: ext,
      enabled: this.isEnabled(id),
      canDisable,
    };
  }

  /**
   * 获取所有扩展信息列表
   */
  getAllExtensionInfo(): Array<{
    extension: Extension;
    enabled: boolean;
    canDisable: boolean;
  }> {
    return this.getAll()
      .map((ext) => this.getExtensionInfo(ext.id)!)
      .filter(Boolean);
  }
}

// 单例导出
export const extensionManager = new ExtensionManagerImpl();
