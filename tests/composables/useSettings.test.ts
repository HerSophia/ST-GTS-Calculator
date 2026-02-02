/**
 * useSettings Composable 测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupTestPinia } from '../mocks/pinia';
import { useSettings } from '@/composables/useSettings';
import { useSettingsStore, DAMAGE_SCENARIOS } from '@/stores/settings';

describe('Composable: useSettings', () => {
  beforeEach(() => {
    setupTestPinia();
    vi.clearAllMocks();
  });

  describe('初始状态', () => {
    it('应该有正确的默认值', () => {
      const { settings, showSettings, DAMAGE_SCENARIOS: scenarios } = useSettings();

      expect(settings.value.enabled).toBe(true);
      expect(showSettings.value).toBe(false);
      expect(scenarios).toBe(DAMAGE_SCENARIOS);
    });
  });

  describe('toggleEnabled', () => {
    it('应该切换启用状态', () => {
      const { settings, toggleEnabled } = useSettings();
      const initialEnabled = settings.value.enabled;

      toggleEnabled();

      expect(settings.value.enabled).toBe(!initialEnabled);
    });

    it('多次切换应该正确工作', () => {
      const { settings, toggleEnabled } = useSettings();

      toggleEnabled(); // false
      expect(settings.value.enabled).toBe(false);

      toggleEnabled(); // true
      expect(settings.value.enabled).toBe(true);

      toggleEnabled(); // false
      expect(settings.value.enabled).toBe(false);
    });
  });

  describe('openSettings / closeSettings', () => {
    it('openSettings 应该打开设置面板', () => {
      const { showSettings, openSettings } = useSettings();

      expect(showSettings.value).toBe(false);

      openSettings();

      expect(showSettings.value).toBe(true);
    });

    it('closeSettings 应该关闭设置面板', () => {
      const { showSettings, openSettings, closeSettings } = useSettings();

      openSettings();
      expect(showSettings.value).toBe(true);

      closeSettings();

      expect(showSettings.value).toBe(false);
    });
  });

  describe('debugLog / debugError', () => {
    it('debugLog 应该记录调试日志', () => {
      const { settings, debugLogs, debugLog } = useSettings();
      // 直接修改 settings.value 而不是调用 updateSettings
      settings.value.debug = true;

      debugLog('测试日志', { data: 123 });

      expect(debugLogs.value.length).toBeGreaterThan(0);
      // 日志条目使用 message 字段而不是 content
      expect(debugLogs.value[0].message).toContain('测试日志');
    });

    it('debugError 应该记录错误日志', () => {
      const { settings, debugLogs, debugError } = useSettings();
      // 直接修改 settings.value 而不是调用 updateSettings
      settings.value.debug = true;

      debugError('测试错误', new Error('error'));

      expect(debugLogs.value.length).toBeGreaterThan(0);
      expect(debugLogs.value[0].type).toBe('error');
    });
  });

  describe('clearDebugLogs', () => {
    it('应该清除所有调试日志', () => {
      const { settings, debugLogs, debugLog, clearDebugLogs } = useSettings();
      // 直接修改 settings.value 而不是调用 updateSettings
      settings.value.debug = true;

      // 添加一些日志
      debugLog('日志1');
      debugLog('日志2');
      expect(debugLogs.value.length).toBe(2);

      // 清除
      clearDebugLogs();

      expect(debugLogs.value.length).toBe(0);
    });
  });

  describe('与 Store 的集成', () => {
    it('settings 应该响应式地反映 Store 中的变化', () => {
      const { settings } = useSettings();
      const store = useSettingsStore();

      expect(settings.value.precision).toBe(2);

      // 直接修改 store.settings.value 而不是调用 updateSettings
      store.settings.precision = 4;

      expect(settings.value.precision).toBe(4);
    });
  });
});
