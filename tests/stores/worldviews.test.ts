/**
 * Store: worldviews 模块测试
 * 验证世界观状态管理的正确性
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setupTestPinia } from '../mocks/pinia';
import { variablesMock } from '../setup';
import {
  useWorldviewsStore,
  DEFAULT_WORLDVIEWS,
} from '@/stores/worldviews';
import type { Worldview } from '@/types';

describe('Store: worldviews', () => {
  beforeEach(() => {
    setupTestPinia();
    variablesMock.__reset();
  });

  describe('初始状态', () => {
    it('应该加载默认世界观', () => {
      const store = useWorldviewsStore();

      expect(store.worldviews.length).toBeGreaterThan(0);
      expect(store.worldviews.length).toBe(DEFAULT_WORLDVIEWS.length);
    });

    it('应该包含所有内置世界观', () => {
      const store = useWorldviewsStore();

      const builtinIds = [
        'realistic-physics',
        'fantasy-cultivation',
        'sci-fi-tech',
        'magical-girl',
        'monster-girl',
        'supernatural',
        'dream-fantasy',
        'fetish-pure',
      ];

      for (const id of builtinIds) {
        expect(store.worldviews.find(w => w.id === id)).toBeDefined();
      }
    });

    it('默认当前世界观应该是现实物理', () => {
      const store = useWorldviewsStore();

      expect(store.currentWorldviewId).toBe('realistic-physics');
    });
  });

  describe('currentWorldview', () => {
    it('应该返回当前选中的世界观', () => {
      const store = useWorldviewsStore();

      const current = store.currentWorldview;

      expect(current.id).toBe('realistic-physics');
      expect(current.name).toBe('现实物理');
    });

    it('切换后应该返回新的世界观', () => {
      const store = useWorldviewsStore();

      store.setCurrentWorldview('fantasy-cultivation');

      expect(store.currentWorldview.id).toBe('fantasy-cultivation');
      expect(store.currentWorldview.name).toBe('玄幻修仙');
    });

    it('当前世界观不存在时应该返回第一个世界观', () => {
      const store = useWorldviewsStore();
      // 直接修改 currentWorldviewId 为不存在的值
      store.currentWorldviewId = 'not-exist';

      const current = store.currentWorldview;

      // 应该 fallback 到第一个世界观
      expect(current).toBeDefined();
    });
  });

  describe('setCurrentWorldview', () => {
    it('应该切换到存在的世界观', () => {
      const store = useWorldviewsStore();

      store.setCurrentWorldview('sci-fi-tech');

      expect(store.currentWorldviewId).toBe('sci-fi-tech');
    });

    it('切换到不存在的世界观不应该有效果', () => {
      const store = useWorldviewsStore();
      const originalId = store.currentWorldviewId;

      store.setCurrentWorldview('not-exist');

      expect(store.currentWorldviewId).toBe(originalId);
    });
  });

  describe('addWorldview', () => {
    it('应该添加自定义世界观', () => {
      const store = useWorldviewsStore();
      const originalLength = store.worldviews.length;

      store.addWorldview({
        name: '自定义世界观',
        icon: 'fa-solid fa-star',
        description: '测试描述',
        mechanism: '测试机制',
        bodyCharacteristics: '测试特征',
        limitations: ['限制1'],
        specialRules: ['规则1'],
        writingTips: ['建议1'],
      });

      expect(store.worldviews.length).toBe(originalLength + 1);
      const added = store.worldviews.find(w => w.name === '自定义世界观');
      expect(added).toBeDefined();
      expect(added?.builtin).toBe(false);
    });

    it('自定义世界观应该有自动生成的 ID', () => {
      const store = useWorldviewsStore();

      store.addWorldview({
        name: '自定义世界观',
        icon: 'fa-solid fa-star',
        description: '测试',
        mechanism: '测试',
        bodyCharacteristics: '测试',
        limitations: [],
        specialRules: [],
        writingTips: [],
      });

      const added = store.worldviews.find(w => w.name === '自定义世界观');
      expect(added?.id).toMatch(/^custom-\d+$/);
    });
  });

  describe('updateWorldview', () => {
    it('应该更新世界观的部分属性', () => {
      const store = useWorldviewsStore();

      store.updateWorldview('realistic-physics', {
        allowPartialScaling: true,
        typicalPartOverrides: { '足长': 1.2 },
      });

      const updated = store.worldviews.find(w => w.id === 'realistic-physics');
      expect(updated?.allowPartialScaling).toBe(true);
      expect(updated?.typicalPartOverrides?.['足长']).toBe(1.2);
      // 其他属性应该保持不变
      expect(updated?.name).toBe('现实物理');
    });

    it('更新不存在的世界观不应该有任何效果', () => {
      const store = useWorldviewsStore();
      const originalLength = store.worldviews.length;

      store.updateWorldview('not-exist', { name: '新名称' });

      expect(store.worldviews.length).toBe(originalLength);
    });
  });

  describe('removeWorldview', () => {
    it('应该删除自定义世界观', () => {
      const store = useWorldviewsStore();
      store.addWorldview({
        name: '待删除世界观',
        icon: 'fa-solid fa-trash',
        description: '测试',
        mechanism: '测试',
        bodyCharacteristics: '测试',
        limitations: [],
        specialRules: [],
        writingTips: [],
      });
      const added = store.worldviews.find(w => w.name === '待删除世界观');
      const id = added!.id;
      const lengthAfterAdd = store.worldviews.length;

      store.removeWorldview(id);

      expect(store.worldviews.length).toBe(lengthAfterAdd - 1);
      expect(store.worldviews.find(w => w.id === id)).toBeUndefined();
    });

    it('不应该删除内置世界观', () => {
      const store = useWorldviewsStore();
      const originalLength = store.worldviews.length;

      store.removeWorldview('realistic-physics');

      expect(store.worldviews.length).toBe(originalLength);
      expect(store.worldviews.find(w => w.id === 'realistic-physics')).toBeDefined();
    });

    it('删除当前选中的世界观应该重置为默认', () => {
      const store = useWorldviewsStore();
      store.addWorldview({
        name: '临时世界观',
        icon: 'fa-solid fa-clock',
        description: '测试',
        mechanism: '测试',
        bodyCharacteristics: '测试',
        limitations: [],
        specialRules: [],
        writingTips: [],
      });
      const added = store.worldviews.find(w => w.name === '临时世界观');
      store.setCurrentWorldview(added!.id);
      expect(store.currentWorldviewId).toBe(added!.id);

      store.removeWorldview(added!.id);

      expect(store.currentWorldviewId).toBe('realistic-physics');
    });

    it('删除不存在的世界观不应该报错', () => {
      const store = useWorldviewsStore();

      expect(() => store.removeWorldview('not-exist')).not.toThrow();
    });
  });

  describe('resetToDefaults', () => {
    it('应该重置所有世界观为默认值', () => {
      const store = useWorldviewsStore();

      // 修改一些设置
      store.updateWorldview('realistic-physics', { allowPartialScaling: true });
      store.addWorldview({
        name: '自定义',
        icon: 'fa-solid fa-star',
        description: '',
        mechanism: '',
        bodyCharacteristics: '',
        limitations: [],
        specialRules: [],
        writingTips: [],
      });
      store.setCurrentWorldview('fantasy-cultivation');

      store.resetToDefaults();

      expect(store.worldviews.length).toBe(DEFAULT_WORLDVIEWS.length);
      expect(store.currentWorldviewId).toBe('realistic-physics');
      const physics = store.worldviews.find(w => w.id === 'realistic-physics');
      expect(physics?.allowPartialScaling).toBe(false);
    });
  });

  describe('getWorldview', () => {
    it('应该返回存在的世界观', () => {
      const store = useWorldviewsStore();

      const worldview = store.getWorldview('fantasy-cultivation');

      expect(worldview).toBeDefined();
      expect(worldview?.id).toBe('fantasy-cultivation');
      expect(worldview?.name).toBe('玄幻修仙');
    });

    it('应该返回 undefined 对于不存在的世界观', () => {
      const store = useWorldviewsStore();

      const worldview = store.getWorldview('not-exist');

      expect(worldview).toBeUndefined();
    });
  });
});

describe('常量: DEFAULT_WORLDVIEWS', () => {
  it('应该有 8 个内置世界观', () => {
    expect(DEFAULT_WORLDVIEWS).toHaveLength(8);
  });

  it('所有内置世界观应该标记为 builtin', () => {
    for (const worldview of DEFAULT_WORLDVIEWS) {
      expect(worldview.builtin).toBe(true);
    }
  });

  it('每个世界观应该有必要的字段', () => {
    for (const worldview of DEFAULT_WORLDVIEWS) {
      expect(worldview.id).toBeTruthy();
      expect(worldview.name).toBeTruthy();
      expect(worldview.icon).toBeTruthy();
      expect(worldview.description).toBeTruthy();
      expect(worldview.mechanism).toBeTruthy();
      expect(worldview.bodyCharacteristics).toBeTruthy();
      expect(Array.isArray(worldview.limitations)).toBe(true);
      expect(Array.isArray(worldview.specialRules)).toBe(true);
      expect(Array.isArray(worldview.writingTips)).toBe(true);
    }
  });

  it('世界观 ID 应该唯一', () => {
    const ids = DEFAULT_WORLDVIEWS.map(w => w.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('现实物理世界观不应该允许部位独立缩放', () => {
    const physics = DEFAULT_WORLDVIEWS.find(w => w.id === 'realistic-physics');
    expect(physics?.allowPartialScaling).toBe(false);
  });

  it('玄幻修仙世界观应该有典型部位覆盖', () => {
    const fantasy = DEFAULT_WORLDVIEWS.find(w => w.id === 'fantasy-cultivation');
    expect(fantasy?.allowPartialScaling).toBe(true);
    expect(fantasy?.typicalPartOverrides).toBeDefined();
    expect(fantasy?.typicalPartOverrides?.['乳房高度']).toBe(1.5);
  });

  it('纯粹幻想世界观应该有最宽松的设定', () => {
    const fetish = DEFAULT_WORLDVIEWS.find(w => w.id === 'fetish-pure');
    expect(fetish?.limitations).toHaveLength(1);
    expect(fetish?.limitations[0]).toBe('无');
    expect(fetish?.allowPartialScaling).toBe(true);
  });
});
