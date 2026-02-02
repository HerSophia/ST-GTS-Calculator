/**
 * 酒馆助手 API Mock
 */
import { vi } from 'vitest';

/** 变量存储（模拟酒馆的变量系统） */
interface VariableStore {
  script: Map<string, Record<string, unknown>>;
  global: Record<string, unknown>;
  chat: Record<string, unknown>;
  message: Record<string, unknown>;
}

export function createTavernMock() {
  // 模拟变量存储
  const variableStore: VariableStore = {
    script: new Map(),
    global: {},
    chat: {},
    message: {},
  };

  const TH = {
    getChat: vi.fn(() => ({
      messages: [],
      characterName: '测试角色',
    })),
    getCharacter: vi.fn(() => ({
      name: '测试角色',
      avatar: 'avatar.png',
    })),
    getLastChatId: vi.fn(() => 'test-chat-id'),
    saveSettings: vi.fn(),
    loadSettings: vi.fn(() => ({})),
    injectPrompt: vi.fn(),
    removePrompt: vi.fn(),
  };

  return {
    TH,
    // 辅助方法
    __variableStore: variableStore,
    __reset: () => {
      variableStore.script.clear();
      variableStore.global = {};
      variableStore.chat = {};
      variableStore.message = {};
      vi.clearAllMocks();
    },
  };
}

export type TavernMock = ReturnType<typeof createTavernMock>;

/**
 * 创建酒馆助手变量 API Mock
 * 用于 mock getVariables, insertOrAssignVariables, getScriptId 等函数
 */
export function createVariablesMock() {
  const store: VariableStore = {
    script: new Map(),
    global: {},
    chat: {},
    message: {},
  };

  const getScriptId = vi.fn(() => 'test-script-id');

  const getVariables = vi.fn((options: { type: string; script_id?: string }) => {
    if (options.type === 'script' && options.script_id) {
      return store.script.get(options.script_id) || {};
    }
    if (options.type === 'global') {
      return store.global;
    }
    if (options.type === 'chat') {
      return store.chat;
    }
    if (options.type === 'message') {
      return store.message;
    }
    return {};
  });

  const insertOrAssignVariables = vi.fn(
    (data: Record<string, unknown>, options: { type: string; script_id?: string }) => {
      if (options.type === 'script' && options.script_id) {
        const existing = store.script.get(options.script_id) || {};
        store.script.set(options.script_id, { ...existing, ...data });
      } else if (options.type === 'global') {
        Object.assign(store.global, data);
      } else if (options.type === 'chat') {
        Object.assign(store.chat, data);
      } else if (options.type === 'message') {
        Object.assign(store.message, data);
      }
    }
  );

  return {
    getScriptId,
    getVariables,
    insertOrAssignVariables,
    // 辅助方法（仅测试使用）
    __store: store,
    __reset: () => {
      store.script.clear();
      store.global = {};
      store.chat = {};
      store.message = {};
      vi.clearAllMocks();
    },
    __setScriptVariables: (scriptId: string, data: Record<string, unknown>) => {
      store.script.set(scriptId, data);
    },
    __setGlobalVariables: (data: Record<string, unknown>) => {
      Object.assign(store.global, data);
    },
  };
}

export type VariablesMock = ReturnType<typeof createVariablesMock>;
