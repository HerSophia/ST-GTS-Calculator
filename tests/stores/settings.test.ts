/**
 * Store: settings 模块测试
 * 验证设置状态管理的正确性
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupTestPinia } from '../mocks/pinia';
import { variablesMock } from '../setup';
import {
  useSettingsStore,
  DAMAGE_SCENARIOS,
  SCENARIO_DESCRIPTIONS,
} from '@/stores/settings';

describe('Store: settings', () => {
  beforeEach(() => {
    setupTestPinia();
    variablesMock.__reset();
  });

  describe('初始状态', () => {
    it('应该有正确的默认值', () => {
      const store = useSettingsStore();

      expect(store.settings.enabled).toBe(true);
      expect(store.settings.debug).toBe(false);
      expect(store.settings.variablePrefix).toBe('巨大娘');
      expect(store.settings.autoInject).toBe(true);
      expect(store.settings.injectDepth).toBe(9999);
      expect(store.settings.precision).toBe(2);
      expect(store.settings.maxHistoryRecords).toBe(20);
    });

    it('应该有正确的默认损害计算设置', () => {
      const store = useSettingsStore();

      expect(store.settings.enableDamageCalculation).toBe(false);
      expect(store.settings.injectDamagePrompt).toBe(true);
      expect(store.settings.damageScenario).toBe('大城市');
      expect(store.settings.showSpecialEffects).toBe(true);
      expect(store.settings.showDamagePerCharacter).toBe(true);
      expect(store.settings.showDamageSummary).toBe(true);
    });

    it('应该有正确的默认提示词设置', () => {
      const store = useSettingsStore();

      expect(store.settings.showVariableUpdateRules).toBe(true);
      expect(store.settings.showWritingGuidelines).toBe(false);
      expect(store.settings.compactPromptFormat).toBe(false);
    });

    it('应该有正确的默认世界观设置', () => {
      const store = useSettingsStore();

      expect(store.settings.injectWorldviewPrompt).toBe(true);
      expect(store.settings.allowPartialScaling).toBe(false);
    });
  });

  describe('toggle', () => {
    it('应该切换启用状态', () => {
      const store = useSettingsStore();
      expect(store.settings.enabled).toBe(true);

      store.toggle();
      expect(store.settings.enabled).toBe(false);

      store.toggle();
      expect(store.settings.enabled).toBe(true);
    });
  });

  describe('设置修改', () => {
    it('应该能修改单个设置项', () => {
      const store = useSettingsStore();

      store.settings.debug = true;
      expect(store.settings.debug).toBe(true);

      store.settings.precision = 4;
      expect(store.settings.precision).toBe(4);
    });

    it('应该能修改多个设置项', () => {
      const store = useSettingsStore();

      store.settings.variablePrefix = '测试前缀';
      store.settings.maxHistoryRecords = 50;
      store.settings.enableDamageCalculation = true;

      expect(store.settings.variablePrefix).toBe('测试前缀');
      expect(store.settings.maxHistoryRecords).toBe(50);
      expect(store.settings.enableDamageCalculation).toBe(true);
    });
  });

  describe('调试日志', () => {
    it('debugLogs 初始应该为空', () => {
      const store = useSettingsStore();
      expect(store.debugLogs).toHaveLength(0);
    });

    it('debugLog 在调试模式关闭时不应该添加日志', () => {
      const store = useSettingsStore();
      store.settings.debug = false;

      store.debugLog('测试消息');

      expect(store.debugLogs).toHaveLength(0);
    });

    it('debugLog 在调试模式开启时应该添加日志', () => {
      const store = useSettingsStore();
      store.settings.debug = true;

      store.debugLog('测试消息');

      expect(store.debugLogs).toHaveLength(1);
      expect(store.debugLogs[0].message).toBe('测试消息');
      expect(store.debugLogs[0].type).toBe('log');
      expect(store.debugLogs[0].time).toBeTruthy();
    });

    it('debugWarn 在调试模式关闭时不应该添加日志到列表', () => {
      const store = useSettingsStore();
      store.settings.debug = false;

      store.debugWarn('警告消息');

      // 虽然控制台会输出，但 debugLogs 列表不会添加
      expect(store.debugLogs).toHaveLength(0);
    });

    it('debugWarn 在调试模式开启时应该添加警告日志', () => {
      const store = useSettingsStore();
      store.settings.debug = true;

      store.debugWarn('警告消息');

      expect(store.debugLogs).toHaveLength(1);
      expect(store.debugLogs[0].type).toBe('warn');
      expect(store.debugLogs[0].message).toBe('警告消息');
    });

    it('debugError 在调试模式关闭时不应该添加日志到列表', () => {
      const store = useSettingsStore();
      store.settings.debug = false;

      store.debugError('错误消息');

      // 虽然控制台会输出，但 debugLogs 列表不会添加
      expect(store.debugLogs).toHaveLength(0);
    });

    it('debugError 在调试模式开启时应该添加错误日志', () => {
      const store = useSettingsStore();
      store.settings.debug = true;

      store.debugError('错误消息');

      expect(store.debugLogs).toHaveLength(1);
      expect(store.debugLogs[0].type).toBe('error');
      expect(store.debugLogs[0].message).toBe('错误消息');
    });

    it('应该限制日志数量为 50 条', () => {
      const store = useSettingsStore();
      store.settings.debug = true;

      // 添加 60 条日志
      for (let i = 0; i < 60; i++) {
        store.debugLog(`日志 ${i}`);
      }

      expect(store.debugLogs).toHaveLength(50);
      // 最早的日志应该被移除
      expect(store.debugLogs[0].message).toBe('日志 10');
      expect(store.debugLogs[49].message).toBe('日志 59');
    });

    it('clearDebugLogs 应该清空所有日志', () => {
      const store = useSettingsStore();
      store.settings.debug = true;

      store.debugLog('测试1');
      store.debugLog('测试2');
      expect(store.debugLogs).toHaveLength(2);

      store.clearDebugLogs();
      expect(store.debugLogs).toHaveLength(0);
    });

    it('应该正确格式化对象参数', () => {
      const store = useSettingsStore();
      store.settings.debug = true;

      store.debugLog('对象:', { name: '测试', value: 123 });

      expect(store.debugLogs[0].message).toContain('对象:');
      expect(store.debugLogs[0].message).toContain('测试');
      expect(store.debugLogs[0].message).toContain('123');
    });
  });

  describe('控制台日志', () => {
    it('log 在调试模式关闭时不应该输出', () => {
      const store = useSettingsStore();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      store.settings.debug = false;

      store.log('测试消息');

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('log 在调试模式开启时应该输出', () => {
      const store = useSettingsStore();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      store.settings.debug = true;

      store.log('测试消息');

      expect(consoleSpy).toHaveBeenCalledWith('[GiantessCalc]', '测试消息');
      consoleSpy.mockRestore();
    });

    it('warn 应该始终输出', () => {
      const store = useSettingsStore();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      store.settings.debug = false;

      store.warn('警告消息');

      expect(consoleSpy).toHaveBeenCalledWith('[GiantessCalc]', '警告消息');
      consoleSpy.mockRestore();
    });

    it('error 应该始终输出', () => {
      const store = useSettingsStore();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      store.settings.debug = false;

      store.error('错误消息');

      expect(consoleSpy).toHaveBeenCalledWith('[GiantessCalc]', '错误消息');
      consoleSpy.mockRestore();
    });
  });
});

describe('常量: DAMAGE_SCENARIOS', () => {
  it('应该包含所有场景类型', () => {
    expect(DAMAGE_SCENARIOS).toContain('荒野');
    expect(DAMAGE_SCENARIOS).toContain('乡村');
    expect(DAMAGE_SCENARIOS).toContain('大城市');
    expect(DAMAGE_SCENARIOS).toContain('东京市中心');
    expect(DAMAGE_SCENARIOS).toContain('住宅内');
    expect(DAMAGE_SCENARIOS).toContain('巨大娘体内');
  });

  it('应该有 15 个场景', () => {
    expect(DAMAGE_SCENARIOS).toHaveLength(15);
  });
});

describe('常量: SCENARIO_DESCRIPTIONS', () => {
  it('每个场景应该有对应的描述', () => {
    for (const scenario of DAMAGE_SCENARIOS) {
      expect(SCENARIO_DESCRIPTIONS[scenario]).toBeTruthy();
      expect(typeof SCENARIO_DESCRIPTIONS[scenario]).toBe('string');
    }
  });

  it('描述应该包含有意义的内容', () => {
    expect(SCENARIO_DESCRIPTIONS['大城市']).toContain('省会');
    expect(SCENARIO_DESCRIPTIONS['东京市中心']).toContain('东京');
    expect(SCENARIO_DESCRIPTIONS['巨大娘体内']).toContain('体内');
  });
});
