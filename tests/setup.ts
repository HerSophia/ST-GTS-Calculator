/**
 * Vitest 全局配置
 *
 * 模拟 webpack unplugin-auto-import 自动导入的全局变量
 * 使用 vi.hoisted 确保 mock 在任何模块导入之前设置
 */
import { vi, afterEach } from 'vitest';
import { config } from '@vue/test-utils';

// ========== 导入需要在 hoisted 阶段使用的库 ==========
import { z } from 'zod';
import { klona } from 'klona';
import { defineStore, storeToRefs } from 'pinia';
import { ref, computed, watchEffect, watch, reactive, toRefs, toRef } from 'vue';

// ========== 使用 vi.hoisted 确保全局变量在模块加载前就绑定 ==========
const mocks = vi.hoisted(() => {
  // 创建酒馆 API mock 函数
  const getScriptId = vi.fn(() => 'test-script-id');
  const getVariables = vi.fn(() => ({}));
  const insertOrAssignVariables = vi.fn();
  const deleteVariable = vi.fn(() => ({ variables: {}, delete_occurred: true }));
  const updateVariablesWith = vi.fn((updater: (v: Record<string, unknown>) => Record<string, unknown>, _options: unknown) => {
    const current = getVariables();
    return updater(current);
  });
  const replaceVariables = vi.fn();
  
  // 提示词注入 API mock
  const injectPrompts = vi.fn((configs: unknown[]) => {
    return configs.map((_, i) => `prompt-id-${i}`);
  });
  const uninjectPrompts = vi.fn();
  
  const toastr = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  };

  const TH = {
    getChat: vi.fn(() => ({ messages: [], characterName: '测试角色' })),
    getCharacter: vi.fn(() => ({ name: '测试角色', avatar: 'avatar.png' })),
    getLastChatId: vi.fn(() => 'test-chat-id'),
    saveSettings: vi.fn(),
    loadSettings: vi.fn(() => ({})),
    injectPrompt: vi.fn(),
    removePrompt: vi.fn(),
  };

  // 实现简单的嵌套路径访问（模拟 lodash 行为）
  function getNestedValue(obj: unknown, path: string, defaultValue?: unknown): unknown {
    const parts = path.split('.');
    let current = obj as Record<string, unknown>;
    for (const part of parts) {
      if (current === undefined || current === null) return defaultValue;
      current = current[part] as Record<string, unknown>;
    }
    return current ?? defaultValue;
  }

  function setNestedValue(obj: unknown, path: string, value: unknown): void {
    const parts = path.split('.');
    let current = obj as Record<string, unknown>;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
  }

  function unsetNestedValue(obj: unknown, path: string): boolean {
    const parts = path.split('.');
    let current = obj as Record<string, unknown>;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined) return false;
      current = current[part] as Record<string, unknown>;
    }
    delete current[parts[parts.length - 1]];
    return true;
  }

  const mvuUnderscore = {
    get: vi.fn((obj: unknown, path: string, defaultValue?: unknown) => {
      return getNestedValue(obj, path, defaultValue);
    }),
    set: vi.fn((obj: unknown, path: string, value: unknown) => {
      setNestedValue(obj, path, value);
    }),
    unset: vi.fn((obj: unknown, path: string) => {
      return unsetNestedValue(obj, path);
    }),
    has: vi.fn((obj: unknown, path: string) => {
      return getNestedValue(obj, path) !== undefined;
    }),
    del: vi.fn(),
    keys: vi.fn(() => []),
    debounce: vi.fn((fn: (...args: unknown[]) => void) => fn),
  };

  // 事件系统 mock
  const eventListeners: Record<string, Array<(...args: unknown[]) => void>> = {};
  const eventOn = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
    if (!eventListeners[event]) {
      eventListeners[event] = [];
    }
    eventListeners[event].push(handler);
    return { stop: vi.fn(() => {
      const idx = eventListeners[event]?.indexOf(handler);
      if (idx !== undefined && idx >= 0) {
        eventListeners[event].splice(idx, 1);
      }
    }) };
  });
  const eventEmit = vi.fn((event: string, ...args: unknown[]) => {
    eventListeners[event]?.forEach(handler => handler(...args));
  });
  const tavern_events = {
    MESSAGE_SWIPED: 'MESSAGE_SWIPED',
    MESSAGE_EDITED: 'MESSAGE_EDITED',
    MESSAGE_UPDATED: 'MESSAGE_UPDATED',
    MESSAGE_DELETED: 'MESSAGE_DELETED',
    GENERATION_ENDED: 'GENERATION_ENDED',
    CHAT_CHANGED: 'CHAT_CHANGED',
    GENERATION_AFTER_COMMANDS: 'GENERATION_AFTER_COMMANDS',
  };

  return {
    getScriptId,
    getVariables,
    insertOrAssignVariables,
    deleteVariable,
    updateVariablesWith,
    replaceVariables,
    injectPrompts,
    uninjectPrompts,
    toastr,
    TH,
    _: mvuUnderscore,
    eventOn,
    eventEmit,
    tavern_events,
    __eventListeners: eventListeners,
  };
});

// ========== 立即设置全局变量（在任何源代码模块导入之前）==========
// 酒馆 API Mock
(globalThis as Record<string, unknown>).getScriptId = mocks.getScriptId;
(globalThis as Record<string, unknown>).getVariables = mocks.getVariables;
(globalThis as Record<string, unknown>).insertOrAssignVariables = mocks.insertOrAssignVariables;
(globalThis as Record<string, unknown>).deleteVariable = mocks.deleteVariable;
(globalThis as Record<string, unknown>).updateVariablesWith = mocks.updateVariablesWith;
(globalThis as Record<string, unknown>).replaceVariables = mocks.replaceVariables;
(globalThis as Record<string, unknown>).injectPrompts = mocks.injectPrompts;
(globalThis as Record<string, unknown>).uninjectPrompts = mocks.uninjectPrompts;
(globalThis as Record<string, unknown>).toastr = mocks.toastr;
(globalThis as Record<string, unknown>).TH = mocks.TH;
(globalThis as Record<string, unknown>)._ = mocks._;
(globalThis as Record<string, unknown>).eventOn = mocks.eventOn;
(globalThis as Record<string, unknown>).tavern_events = mocks.tavern_events;

// Zod
(globalThis as Record<string, unknown>).z = z;

// Klona
(globalThis as Record<string, unknown>).klona = klona;

// Pinia
(globalThis as Record<string, unknown>).defineStore = defineStore;
(globalThis as Record<string, unknown>).storeToRefs = storeToRefs;

// Vue Reactivity
(globalThis as Record<string, unknown>).ref = ref;
(globalThis as Record<string, unknown>).computed = computed;
(globalThis as Record<string, unknown>).watchEffect = watchEffect;
(globalThis as Record<string, unknown>).watch = watch;
(globalThis as Record<string, unknown>).reactive = reactive;
(globalThis as Record<string, unknown>).toRefs = toRefs;
(globalThis as Record<string, unknown>).toRef = toRef;

// ========== 使用 vi.stubGlobal 确保 vitest 能正确跟踪 ==========
vi.stubGlobal('getScriptId', mocks.getScriptId);
vi.stubGlobal('getVariables', mocks.getVariables);
vi.stubGlobal('insertOrAssignVariables', mocks.insertOrAssignVariables);
vi.stubGlobal('deleteVariable', mocks.deleteVariable);
vi.stubGlobal('updateVariablesWith', mocks.updateVariablesWith);
vi.stubGlobal('replaceVariables', mocks.replaceVariables);
vi.stubGlobal('toastr', mocks.toastr);
vi.stubGlobal('TH', mocks.TH);
vi.stubGlobal('_', mocks._);
vi.stubGlobal('eventOn', mocks.eventOn);
vi.stubGlobal('tavern_events', mocks.tavern_events);
vi.stubGlobal('z', z);
vi.stubGlobal('klona', klona);
vi.stubGlobal('defineStore', defineStore);
vi.stubGlobal('storeToRefs', storeToRefs);
vi.stubGlobal('ref', ref);
vi.stubGlobal('computed', computed);
vi.stubGlobal('watchEffect', watchEffect);
vi.stubGlobal('watch', watch);
vi.stubGlobal('reactive', reactive);
vi.stubGlobal('toRefs', toRefs);
vi.stubGlobal('toRef', toRef);

// ========== Vue Test Utils 全局配置 ==========
config.global.stubs = {
  FontAwesomeIcon: true,
};

// ========== 导出 mock 实例供测试使用 ==========
export const toastrMock = mocks.toastr;
export const tavernMock = { TH: mocks.TH };
// 内部存储当前变量值
let currentVariablesData: Record<string, unknown> = {};

export const variablesMock = {
  getScriptId: mocks.getScriptId,
  getVariables: mocks.getVariables,
  insertOrAssignVariables: mocks.insertOrAssignVariables,
  deleteVariable: mocks.deleteVariable,
  updateVariablesWith: mocks.updateVariablesWith,
  replaceVariables: mocks.replaceVariables,
  __reset: () => {
    mocks.getScriptId.mockClear();
    mocks.getVariables.mockClear();
    mocks.insertOrAssignVariables.mockClear();
    mocks.deleteVariable.mockClear();
    mocks.updateVariablesWith.mockClear();
    mocks.replaceVariables.mockClear();
    currentVariablesData = {};
    // 重置返回值为空对象（确保后续测试从干净状态开始）
    mocks.getVariables.mockReturnValue({});
  },
  __setVariables: (data: Record<string, unknown>) => {
    currentVariablesData = klona(data);
    mocks.getVariables.mockReturnValue(currentVariablesData);
    // 更新 updateVariablesWith 以使用当前数据
    mocks.updateVariablesWith.mockImplementation(
      (updater: (v: Record<string, unknown>) => Record<string, unknown>, _options: unknown) => {
        currentVariablesData = updater(currentVariablesData);
        mocks.getVariables.mockReturnValue(currentVariablesData);
        return currentVariablesData;
      }
    );
  },
  __getVariables: () => currentVariablesData,
};
export const eventMock = {
  eventOn: mocks.eventOn,
  tavern_events: mocks.tavern_events,
  __eventListeners: mocks.__eventListeners,
  __emit: (event: string, ...args: unknown[]) => {
    mocks.__eventListeners[event]?.forEach((handler: (...a: unknown[]) => void) => handler(...args));
  },
  __reset: () => {
    mocks.eventOn.mockClear();
    // 清空所有事件监听器
    for (const key of Object.keys(mocks.__eventListeners)) {
      delete mocks.__eventListeners[key];
    }
  },
};
export const mvuMock = {
  _: mocks._,
  __reset: () => {
    mocks._.get.mockClear();
    mocks._.set.mockClear();
    mocks._.unset.mockClear();
    mocks._.has.mockClear();
    mocks._.del.mockClear();
    mocks._.keys.mockClear();
    mocks._.debounce.mockClear();
  },
};

// ========== 清理钩子 ==========
afterEach(() => {
  mvuMock.__reset();
  variablesMock.__reset();
  eventMock.__reset();
  Object.values(mocks.toastr).forEach(fn => fn.mockClear());
  Object.values(mocks.TH).forEach(fn => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      (fn as ReturnType<typeof vi.fn>).mockClear();
    }
  });
  vi.clearAllMocks();
});
