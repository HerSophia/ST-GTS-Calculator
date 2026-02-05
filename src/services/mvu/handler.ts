/**
 * 巨大娘计算器 - 变量事件系统入口
 * 
 * 职责：
 * - 初始化变量事件监听系统
 * - 监听设置变更，自动重新注入提示词
 * 
 * 注意：
 * - v3.1.0 起使用酒馆原生事件替代 MVU 的 VARIABLE_UPDATE_ENDED
 * - 函数名保留 "Mvu" 是为了向后兼容，实际使用 services/variables 新系统
 * - MVU 库仍用于变量读写，但不再监听 MVU 事件
 * 
 * @module services/mvu/handler
 * @deprecated 此模块作为兼容入口，核心逻辑在 services/variables/
 */

import { useSettingsStore } from '../../stores/settings';
import { usePromptsStore } from '../../stores/prompts';
import { useWorldviewsStore } from '../../stores/worldviews';
import {
  initVariableEventListeners,
  getServiceStatus,
  reinjectPromptsIfNeeded,
} from '../variables';

/** 防抖的重新注入函数 */
let debouncedReinject: (() => void) | null = null;

/** 设置监听器的停止函数 */
let stopSettingsWatcher: (() => void) | null = null;

/** 提示词模板监听器的停止函数 */
let stopPromptsWatcher: (() => void) | null = null;

/** 世界观监听器的停止函数 */
let stopWorldviewsWatcher: (() => void) | null = null;

/**
 * 初始化变量事件系统
 * 
 * 使用酒馆原生事件替代 MVU 的 VARIABLE_UPDATE_ENDED 事件
 * 监听的事件包括：MESSAGE_SWIPED、MESSAGE_EDITED、GENERATION_ENDED 等
 */
export function initMvuIntegration(): void {
  const settingsStore = useSettingsStore();

  settingsStore.debugLog('🚀 开始初始化变量事件系统...');
  console.log('[GiantessCalc] 🚀 启动变量事件系统...');
  
  try {
    initVariableEventListeners({
      debounce: true,
      debounceDelay: 100,
      syncOnInit: true,
    });
    
    const status = getServiceStatus();
    console.log('[GiantessCalc] ✅ 变量事件系统已启动', status);
    settingsStore.debugLog('✅ 变量事件系统已启动', status);
  } catch (e) {
    console.error('[GiantessCalc] ❌ 变量事件系统启动失败:', e);
    settingsStore.debugError('❌ 变量事件系统启动失败:', e);
  }
  
  // MVU 全局对象仍可用于读写变量，但不再监听 VARIABLE_UPDATE_ENDED 事件
  if (typeof Mvu !== 'undefined') {
    settingsStore.debugLog('ℹ️ MVU 全局对象可用', {
      version: (Mvu as { version?: string }).version || '未知',
    });
  }
  
  // 监听设置变更，自动重新注入提示词
  initSettingsWatcher();
}

/**
 * 初始化设置监听器
 * 当设置/提示词模板/世界观变更时，使用防抖重新注入提示词
 */
function initSettingsWatcher(): void {
  const settingsStore = useSettingsStore();
  const promptsStore = usePromptsStore();
  const worldviewsStore = useWorldviewsStore();
  
  // 创建防抖的重新注入函数（500ms 防抖）
  debouncedReinject = _.debounce(() => {
    reinjectPromptsIfNeeded({ messageId: 'latest' });
  }, 500);
  
  // 监听设置变化
  stopSettingsWatcher = watch(
    () => settingsStore.settings,
    () => {
      console.log('[GiantessCalc] ⚙️ 检测到设置变更');
      settingsStore.debugLog('⚙️ 检测到设置变更，准备重新注入...');
      debouncedReinject?.();
    },
    { deep: true }
  );
  
  // 监听提示词模板变化（启用/禁用/内容修改）
  stopPromptsWatcher = watch(
    () => promptsStore.templates,
    () => {
      console.log('[GiantessCalc] 📝 检测到提示词模板变更');
      settingsStore.debugLog('📝 检测到提示词模板变更，准备重新注入...');
      debouncedReinject?.();
    },
    { deep: true }
  );
  
  // 监听世界观变化
  stopWorldviewsWatcher = watch(
    () => [worldviewsStore.currentWorldview, worldviewsStore.worldviews],
    () => {
      console.log('[GiantessCalc] 🌍 检测到世界观变更');
      settingsStore.debugLog('🌍 检测到世界观变更，准备重新注入...');
      debouncedReinject?.();
    },
    { deep: true }
  );
  
  settingsStore.debugLog('✅ 已启动设置/模板/世界观变更监听（防抖 500ms）');
}

/**
 * 清理事件监听器
 * 在页面卸载时调用
 */
export function cleanupMvuIntegration(): void {
  // 清理设置监听器
  stopSettingsWatcher?.();
  stopPromptsWatcher?.();
  stopWorldviewsWatcher?.();
  
  stopSettingsWatcher = null;
  stopPromptsWatcher = null;
  stopWorldviewsWatcher = null;
  debouncedReinject = null;
  
  const settingsStore = useSettingsStore();
  settingsStore.debugLog('🧹 已清理 MVU 集成监听器');
}
