/**
 * Pinia 测试辅助
 */
import { setActivePinia, createPinia } from 'pinia';

/**
 * 创建测试用 Pinia 实例
 * 在 beforeEach 中调用以确保每个测试有独立的状态
 */
export function setupTestPinia() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}
