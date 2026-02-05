/**
 * 解析器值比较功能测试
 * 
 * 测试第三阶段的值比较和内容哈希功能
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { variablesMock } from '../../setup';
import {
  deepEqual,
  compareUpdatesWithExisting,
  filterChangedUpdates,
  hashContent,
} from '@/services/variables/parser';
import type { ParsedUpdate } from '@/types/variables';

describe('Service: variables/parser - 值比较功能', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    variablesMock.__reset();
  });

  // ========== deepEqual ==========
  describe('deepEqual', () => {
    it('应该正确比较基本类型', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual('a', 'a')).toBe(true);
      expect(deepEqual('a', 'b')).toBe(false);
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(true, false)).toBe(false);
    });

    it('应该正确处理 null 和 undefined', () => {
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
      expect(deepEqual(null, undefined)).toBe(false);
      expect(deepEqual(1, null)).toBe(false);
    });

    it('应该正确比较数组', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(deepEqual([], [])).toBe(true);
    });

    it('应该正确比较对象', () => {
      expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
      expect(deepEqual({}, {})).toBe(true);
    });

    it('应该正确比较嵌套结构', () => {
      expect(deepEqual(
        { a: { b: [1, 2, 3] } },
        { a: { b: [1, 2, 3] } }
      )).toBe(true);
      
      expect(deepEqual(
        { a: { b: [1, 2, 3] } },
        { a: { b: [1, 2, 4] } }
      )).toBe(false);
    });

    it('应该正确处理类型不同的情况', () => {
      expect(deepEqual(1, '1')).toBe(false);
      expect(deepEqual([1], { 0: 1 })).toBe(false);
    });
  });

  // ========== hashContent ==========
  describe('hashContent', () => {
    it('相同内容应该产生相同哈希', () => {
      const content = '测试内容 123';
      expect(hashContent(content)).toBe(hashContent(content));
    });

    it('不同内容应该产生不同哈希', () => {
      expect(hashContent('内容A')).not.toBe(hashContent('内容B'));
    });

    it('空字符串应该产生固定哈希', () => {
      expect(hashContent('')).toBe('0');
    });

    it('应该返回十六进制字符串', () => {
      const hash = hashContent('test');
      expect(/^-?[0-9a-f]+$/i.test(hash)).toBe(true);
    });
  });

  // ========== compareUpdatesWithExisting ==========
  describe('compareUpdatesWithExisting', () => {
    it('空更新应该返回无变化', () => {
      const result = compareUpdatesWithExisting([]);
      
      expect(result.hasChanges).toBe(false);
      expect(result.newUpdates).toHaveLength(0);
      expect(result.changedUpdates).toHaveLength(0);
      expect(result.unchangedUpdates).toHaveLength(0);
    });

    it('变量中不存在时应该识别为新增', () => {
      variablesMock.__setVariables({});
      
      const updates: ParsedUpdate[] = [
        { path: '巨大娘.角色.络络.当前身高', value: 100 },
      ];
      
      const result = compareUpdatesWithExisting(updates);
      
      expect(result.hasChanges).toBe(true);
      expect(result.newUpdates).toHaveLength(1);
      expect(result.changedUpdates).toHaveLength(0);
    });

    it('值相同时应该识别为未变化', () => {
      variablesMock.__setVariables({
        stat_data: {
          巨大娘: {
            角色: {
              络络: { 当前身高: 100 },
            },
          },
        },
      });
      
      const updates: ParsedUpdate[] = [
        { path: '巨大娘.角色.络络.当前身高', value: 100 },
      ];
      
      const result = compareUpdatesWithExisting(updates);
      
      expect(result.hasChanges).toBe(false);
      expect(result.unchangedUpdates).toHaveLength(1);
    });

    it('值不同时应该识别为变化', () => {
      variablesMock.__setVariables({
        stat_data: {
          巨大娘: {
            角色: {
              络络: { 当前身高: 100 },
            },
          },
        },
      });
      
      const updates: ParsedUpdate[] = [
        { path: '巨大娘.角色.络络.当前身高', value: 200 },
      ];
      
      const result = compareUpdatesWithExisting(updates);
      
      expect(result.hasChanges).toBe(true);
      expect(result.changedUpdates).toHaveLength(1);
    });

    it('应该正确分类混合更新', () => {
      variablesMock.__setVariables({
        stat_data: {
          巨大娘: {
            角色: {
              络络: { 
                当前身高: 100,
                变化原因: '初始',
              },
            },
          },
        },
      });
      
      const updates: ParsedUpdate[] = [
        { path: '巨大娘.角色.络络.当前身高', value: 100 },    // 未变化
        { path: '巨大娘.角色.络络.变化原因', value: '喝药' }, // 变化
        { path: '巨大娘.角色.络络.变化时间', value: '今天' }, // 新增
      ];
      
      const result = compareUpdatesWithExisting(updates);
      
      expect(result.hasChanges).toBe(true);
      expect(result.newUpdates).toHaveLength(1);
      expect(result.changedUpdates).toHaveLength(1);
      expect(result.unchangedUpdates).toHaveLength(1);
    });
  });

  // ========== filterChangedUpdates ==========
  describe('filterChangedUpdates', () => {
    it('应该过滤掉未变化的更新', () => {
      variablesMock.__setVariables({
        stat_data: {
          巨大娘: {
            角色: {
              络络: { 当前身高: 100 },
            },
          },
        },
      });
      
      const updates: ParsedUpdate[] = [
        { path: '巨大娘.角色.络络.当前身高', value: 100 },  // 未变化
        { path: '巨大娘.角色.络络.原身高', value: 1.65 },   // 新增
      ];
      
      const filtered = filterChangedUpdates(updates);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].path).toBe('巨大娘.角色.络络.原身高');
    });

    it('变量为空时应该返回所有更新', () => {
      variablesMock.__setVariables({});
      
      const updates: ParsedUpdate[] = [
        { path: '巨大娘.角色.络络.当前身高', value: 100 },
        { path: '巨大娘.角色.络络.原身高', value: 1.65 },
      ];
      
      const filtered = filterChangedUpdates(updates);
      
      expect(filtered).toHaveLength(2);
    });
  });
});
