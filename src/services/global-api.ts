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
  };

  (window as unknown as Record<string, unknown>).GiantessCalc = api;
}

// 声明全局类型
declare global {
  interface Window {
    GiantessCalc: GiantessCalcAPI;
  }
}
