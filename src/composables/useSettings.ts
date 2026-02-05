/**
 * 设置面板逻辑 Composable
 * 处理设置管理和面板状态
 */
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore, DAMAGE_SCENARIOS } from '../settings';

export function useSettings() {
  const settingsStore = useSettingsStore();
  const { settings, debugLogs } = storeToRefs(settingsStore);
  
  // 面板状态
  const showSettings = ref(false);

  /**
   * 切换启用状态
   */
  const toggleEnabled = () => {
    settingsStore.toggle();
  };

  /**
   * 打开设置面板
   */
  const openSettings = () => {
    showSettings.value = true;
  };

  /**
   * 关闭设置面板
   */
  const closeSettings = () => {
    showSettings.value = false;
  };

  /**
   * 清除调试日志
   */
  const clearDebugLogs = () => {
    settingsStore.clearDebugLogs();
  };

  /**
   * 记录调试日志
   */
  const debugLog = (...args: unknown[]) => {
    settingsStore.debugLog(...args);
  };

  /**
   * 记录调试错误
   */
  const debugError = (...args: unknown[]) => {
    settingsStore.debugError(...args);
  };

  return {
    // 状态
    settings,
    debugLogs,
    showSettings,
    DAMAGE_SCENARIOS,
    // 方法
    toggleEnabled,
    openSettings,
    closeSettings,
    clearDebugLogs,
    debugLog,
    debugError,
  };
}
