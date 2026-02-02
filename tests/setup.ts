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
  const deleteVariable = vi.fn();
  
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

  const mvuUnderscore = {
    get: vi.fn((path: string, defaultValue?: unknown) => defaultValue),
    set: vi.fn(),
    has: vi.fn(() => false),
    del: vi.fn(),
    keys: vi.fn(() => []),
  };

  return {
    getScriptId,
    getVariables,
    insertOrAssignVariables,
    deleteVariable,
    toastr,
    TH,
    _: mvuUnderscore,
  };
});

// ========== 立即设置全局变量（在任何源代码模块导入之前）==========
// 酒馆 API Mock
(globalThis as Record<string, unknown>).getScriptId = mocks.getScriptId;
(globalThis as Record<string, unknown>).getVariables = mocks.getVariables;
(globalThis as Record<string, unknown>).insertOrAssignVariables = mocks.insertOrAssignVariables;
(globalThis as Record<string, unknown>).deleteVariable = mocks.deleteVariable;
(globalThis as Record<string, unknown>).toastr = mocks.toastr;
(globalThis as Record<string, unknown>).TH = mocks.TH;
(globalThis as Record<string, unknown>)._ = mocks._;

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
vi.stubGlobal('toastr', mocks.toastr);
vi.stubGlobal('TH', mocks.TH);
vi.stubGlobal('_', mocks._);
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
export const variablesMock = {
  getScriptId: mocks.getScriptId,
  getVariables: mocks.getVariables,
  insertOrAssignVariables: mocks.insertOrAssignVariables,
  deleteVariable: mocks.deleteVariable,
  __reset: () => {
    mocks.getScriptId.mockClear();
    mocks.getVariables.mockClear();
    mocks.insertOrAssignVariables.mockClear();
    mocks.deleteVariable.mockClear();
  },
};
export const mvuMock = {
  _: mocks._,
  __reset: () => {
    mocks._.get.mockClear();
    mocks._.set.mockClear();
    mocks._.has.mockClear();
    mocks._.del.mockClear();
    mocks._.keys.mockClear();
  },
};

// ========== 清理钩子 ==========
afterEach(() => {
  mvuMock.__reset();
  variablesMock.__reset();
  Object.values(mocks.toastr).forEach(fn => fn.mockClear());
  Object.values(mocks.TH).forEach(fn => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      (fn as ReturnType<typeof vi.fn>).mockClear();
    }
  });
  vi.clearAllMocks();
});
