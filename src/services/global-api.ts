/**
 * 巨大娘计算器 - 全局 API 暴露服务
 * 
 * 职责：
 * - 暴露 window.GiantessCalc 全局对象
 * - 提供向后兼容的 API
 * 
 * @module services/global-api
 */

import {
  calculateGiantessData,
  calculateTinyData,
  checkInteractionLimits,
  formatLength,
  formatWeight,
  formatVolume,
  determineLevel,
  BASE_BODY_PARTS,
  REFERENCE_OBJECTS,
  SIZE_LEVELS,
  INTERACTION_RULES,
} from '../core';
import { VERSION } from '../version';
import { useSettingsStore } from '../stores/settings';
import { getMvuDebugInfo, injectTestData, clearTestData } from './debug';
import { checkForUpdates, getReleasePageUrl } from './updater';
import {
  getRegisteredRegexes,
  setRegexEnabled,
  getRegexServiceState,
} from './regex';
import { extensionManager } from './extensions';
import type { ExtensionAPI, Extension } from '../types';

/**
 * 全局 API 类型定义
 */
export interface GiantessCalcAPI {
  calculate: typeof calculateGiantessData;
  calculateTiny: typeof calculateTinyData;
  checkInteraction: (big: number, small: number) => ReturnType<typeof checkInteractionLimits>;
  formatLength: typeof formatLength;
  formatWeight: typeof formatWeight;
  formatVolume: typeof formatVolume;
  determineLevel: typeof determineLevel;
  BASE_BODY_PARTS: typeof BASE_BODY_PARTS;
  REFERENCE_OBJECTS: typeof REFERENCE_OBJECTS;
  SIZE_LEVELS: typeof SIZE_LEVELS;
  INTERACTION_RULES: typeof INTERACTION_RULES;
  VERSION: string;
  CONFIG: ReturnType<typeof useSettingsStore>['settings'];
  debug: {
    getMvuInfo: typeof getMvuDebugInfo;
    injectTestData: typeof injectTestData;
    clearTestData: typeof clearTestData;
    logs: ReturnType<typeof useSettingsStore>['debugLogs'];
    clearLogs: () => void;
  };
  updater: {
    checkForUpdates: typeof checkForUpdates;
    getReleasePageUrl: typeof getReleasePageUrl;
  };
  regex: {
    getRegistered: typeof getRegisteredRegexes;
    setEnabled: typeof setRegexEnabled;
    getState: typeof getRegexServiceState;
  };
  /**
   * 扩展系统 API
   * 允许第三方脚本注册和管理扩展
   */
  extensions: ExtensionAPI;
}

/**
 * 暴露全局函数
 */
export function exposeGlobalFunctions(): void {
  const settingsStore = useSettingsStore();

  const api: GiantessCalcAPI = {
    calculate: calculateGiantessData,
    calculateTiny: calculateTinyData,
    checkInteraction: (big: number, small: number) =>
      checkInteractionLimits(big, small, formatLength),
    formatLength,
    formatWeight,
    formatVolume,
    determineLevel,
    BASE_BODY_PARTS,
    REFERENCE_OBJECTS,
    SIZE_LEVELS,
    INTERACTION_RULES,
    VERSION,
    get CONFIG() {
      return settingsStore.settings;
    },
    debug: {
      getMvuInfo: getMvuDebugInfo,
      injectTestData,
      clearTestData,
      get logs() {
        return settingsStore.debugLogs;
      },
      clearLogs: () => settingsStore.clearDebugLogs(),
    },
    updater: {
      checkForUpdates,
      getReleasePageUrl,
    },
    // 正则管理（调试用）
    regex: {
      getRegistered: getRegisteredRegexes,
      setEnabled: setRegexEnabled,
      getState: getRegexServiceState,
    },
    // 扩展系统 API
    extensions: createExtensionsAPI(),
  };

  // 使用酒馆助手的 initializeGlobal 注册全局对象
  // 这样其他脚本可以通过 waitGlobalInitialized('GiantessCalc') 等待初始化
  initializeGlobal('GiantessCalc', api);
  
  // 同时也直接挂载到 window 上，方便控制台调试
  (window as unknown as Record<string, unknown>).GiantessCalc = api;
  
  console.log('[GiantessCalc] ✅ 全局 API 已注册');
}

/**
 * 创建扩展系统 API
 * 包装 extensionManager，提供对外安全的接口
 */
function createExtensionsAPI(): ExtensionAPI {
  return {
    register(extension: Extension): void {
      extensionManager.register(extension);
    },

    get(id: string) {
      return extensionManager.get(id);
    },

    getAll() {
      return extensionManager.getAll();
    },

    getEnabled() {
      return extensionManager.getEnabled();
    },

    enable(id: string): boolean {
      return extensionManager.enable(id);
    },

    disable(id: string): boolean {
      return extensionManager.disable(id);
    },

    toggle(id: string): boolean {
      return extensionManager.toggle(id);
    },

    isEnabled(id: string): boolean {
      return extensionManager.isEnabled(id);
    },

    getInfo(id: string) {
      return extensionManager.getInfo(id);
    },

    getAllInfo() {
      return extensionManager.getAllInfo();
    },

    canEnable(id: string) {
      return extensionManager.canEnable(id);
    },

    canDisable(id: string) {
      return extensionManager.canDisable(id);
    },
  };
}

// 声明全局类型
declare global {
  interface Window {
    GiantessCalc: GiantessCalcAPI;
  }
}
