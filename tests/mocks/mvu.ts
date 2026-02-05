/**
 * MVU 库 Mock
 */
import { vi } from 'vitest';

export function createMvuMock() {
  const store = new Map<string, unknown>();

  const _ = {
    get: vi.fn((path: string, defaultValue?: unknown) => {
      return store.get(path) ?? defaultValue;
    }),
    set: vi.fn((path: string, value: unknown) => {
      store.set(path, value);
    }),
    has: vi.fn((path: string) => store.has(path)),
    del: vi.fn((path: string) => store.delete(path)),
    keys: vi.fn(() => Array.from(store.keys())),
  };

  return {
    _,
    // 辅助方法（仅测试使用）
    __store: store,
    __reset: () => {
      store.clear();
      vi.clearAllMocks();
    },
    __setData: (path: string, value: unknown) => {
      store.set(path, value);
    },
  };
}

export type MvuMock = ReturnType<typeof createMvuMock>;
