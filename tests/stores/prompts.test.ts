/**
 * Store: prompts 模块测试
 * 验证提示词模板状态管理的正确性
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setupTestPinia } from '../mocks/pinia';
import { variablesMock } from '../setup';
import {
  usePromptsStore,
  DEFAULT_TEMPLATES,
} from '@/stores/prompts';
import type { PromptTemplate } from '@/types';

describe('Store: prompts', () => {
  beforeEach(() => {
    setupTestPinia();
    variablesMock.__reset();
  });

  describe('初始状态', () => {
    it('应该加载默认模板', () => {
      const store = usePromptsStore();

      expect(store.templates.length).toBeGreaterThan(0);
      expect(store.templates.length).toBe(DEFAULT_TEMPLATES.length);
    });

    it('应该包含所有内置模板', () => {
      const store = usePromptsStore();

      const builtinIds = ['header', 'character-data', 'interaction-limits', 
        'variable-update-rules', 'worldview', 'damage-calculation', 'writing-guidelines'];
      
      for (const id of builtinIds) {
        expect(store.templates.find(t => t.id === id)).toBeDefined();
      }
    });

    it('templates 数组应该存在（不保证排序）', () => {
      const store = usePromptsStore();

      // templates 直接返回数组，不保证排序
      // 只有 enabledTemplates 计算属性才排序
      expect(store.templates.length).toBe(DEFAULT_TEMPLATES.length);
    });
  });

  describe('enabledTemplates', () => {
    it('应该只返回启用的模板', () => {
      const store = usePromptsStore();

      // writing-guidelines 默认禁用
      const writingGuidelines = store.templates.find(t => t.id === 'writing-guidelines');
      expect(writingGuidelines?.enabled).toBe(false);

      const enabled = store.enabledTemplates;
      expect(enabled.find(t => t.id === 'writing-guidelines')).toBeUndefined();
    });

    it('应该按 order 排序', () => {
      const store = usePromptsStore();
      const enabled = store.enabledTemplates;

      for (let i = 1; i < enabled.length; i++) {
        expect(enabled[i].order).toBeGreaterThanOrEqual(enabled[i - 1].order);
      }
    });
  });

  describe('toggleTemplate', () => {
    it('应该切换模板启用状态', () => {
      const store = usePromptsStore();
      const template = store.templates.find(t => t.id === 'header');
      const initialEnabled = template?.enabled;

      store.toggleTemplate('header');
      expect(store.templates.find(t => t.id === 'header')?.enabled).toBe(!initialEnabled);

      store.toggleTemplate('header');
      expect(store.templates.find(t => t.id === 'header')?.enabled).toBe(initialEnabled);
    });

    it('切换不存在的模板不应该报错', () => {
      const store = usePromptsStore();

      expect(() => store.toggleTemplate('不存在的模板')).not.toThrow();
    });
  });

  describe('updateTemplate', () => {
    it('应该更新模板的部分属性', () => {
      const store = usePromptsStore();

      store.updateTemplate('header', {
        content: '新的内容',
        order: 100,
      });

      const updated = store.templates.find(t => t.id === 'header');
      expect(updated?.content).toBe('新的内容');
      expect(updated?.order).toBe(100);
      // 其他属性应该保持不变
      expect(updated?.name).toBe('头部说明');
    });

    it('更新不存在的模板不应该有任何效果', () => {
      const store = usePromptsStore();
      const originalLength = store.templates.length;

      store.updateTemplate('不存在', { content: '新内容' });

      expect(store.templates.length).toBe(originalLength);
    });
  });

  describe('addTemplate', () => {
    it('应该添加自定义模板', () => {
      const store = usePromptsStore();
      const originalLength = store.templates.length;

      store.addTemplate({
        name: '自定义模板',
        description: '测试描述',
        enabled: true,
        type: 'footer',
        content: '自定义内容',
      });

      expect(store.templates.length).toBe(originalLength + 1);
      const added = store.templates.find(t => t.name === '自定义模板');
      expect(added).toBeDefined();
      expect(added?.builtin).toBe(false);
    });

    it('自定义模板应该有自动生成的 ID', () => {
      const store = usePromptsStore();

      store.addTemplate({
        name: '自定义模板',
        description: '测试',
        enabled: true,
        type: 'footer',
        content: '内容',
      });

      const added = store.templates.find(t => t.name === '自定义模板');
      expect(added?.id).toMatch(/^custom-\d+$/);
    });

    it('自定义模板的 order 应该在最后', () => {
      const store = usePromptsStore();
      const maxOrder = Math.max(...store.templates.map(t => t.order));

      store.addTemplate({
        name: '自定义模板',
        description: '测试',
        enabled: true,
        type: 'footer',
        content: '内容',
      });

      const added = store.templates.find(t => t.name === '自定义模板');
      expect(added?.order).toBeGreaterThan(maxOrder);
    });
  });

  describe('removeTemplate', () => {
    it('应该删除自定义模板', () => {
      const store = usePromptsStore();
      store.addTemplate({
        name: '待删除模板',
        description: '测试',
        enabled: true,
        type: 'footer',
        content: '内容',
      });
      const added = store.templates.find(t => t.name === '待删除模板');
      const id = added!.id;
      const lengthAfterAdd = store.templates.length;

      store.removeTemplate(id);

      expect(store.templates.length).toBe(lengthAfterAdd - 1);
      expect(store.templates.find(t => t.id === id)).toBeUndefined();
    });

    it('不应该删除内置模板', () => {
      const store = usePromptsStore();
      const originalLength = store.templates.length;

      store.removeTemplate('header');

      expect(store.templates.length).toBe(originalLength);
      expect(store.templates.find(t => t.id === 'header')).toBeDefined();
    });

    it('删除不存在的模板不应该报错', () => {
      const store = usePromptsStore();

      expect(() => store.removeTemplate('不存在')).not.toThrow();
    });
  });

  describe('resetToDefaults', () => {
    it('应该重置所有模板为默认值', () => {
      const store = usePromptsStore();

      // 修改一些设置
      store.updateTemplate('header', { content: '修改后的内容', enabled: false });
      store.addTemplate({
        name: '自定义',
        description: '',
        enabled: true,
        type: 'footer',
        content: '',
      });

      store.resetToDefaults();

      expect(store.templates.length).toBe(DEFAULT_TEMPLATES.length);
      const header = store.templates.find(t => t.id === 'header');
      expect(header?.content).not.toBe('修改后的内容');
      expect(header?.enabled).toBe(true);
    });
  });

  describe('moveTemplate', () => {
    it('应该向上移动模板', () => {
      const store = usePromptsStore();
      const sorted = [...store.templates].sort((a, b) => a.order - b.order);
      const secondId = sorted[1].id;
      const secondOrder = sorted[1].order;
      const firstOrder = sorted[0].order;

      store.moveTemplate(secondId, 'up');

      const updatedSecond = store.templates.find(t => t.id === secondId);
      expect(updatedSecond?.order).toBe(firstOrder);
    });

    it('应该向下移动模板', () => {
      const store = usePromptsStore();
      const sorted = [...store.templates].sort((a, b) => a.order - b.order);
      const firstId = sorted[0].id;
      const firstOrder = sorted[0].order;
      const secondOrder = sorted[1].order;

      store.moveTemplate(firstId, 'down');

      const updatedFirst = store.templates.find(t => t.id === firstId);
      expect(updatedFirst?.order).toBe(secondOrder);
    });

    it('第一个模板向上移动不应该有效果', () => {
      const store = usePromptsStore();
      const sorted = [...store.templates].sort((a, b) => a.order - b.order);
      const firstId = sorted[0].id;
      const firstOrder = sorted[0].order;

      store.moveTemplate(firstId, 'up');

      const first = store.templates.find(t => t.id === firstId);
      expect(first?.order).toBe(firstOrder);
    });

    it('最后一个模板向下移动不应该有效果', () => {
      const store = usePromptsStore();
      const sorted = [...store.templates].sort((a, b) => a.order - b.order);
      const lastId = sorted[sorted.length - 1].id;
      const lastOrder = sorted[sorted.length - 1].order;

      store.moveTemplate(lastId, 'down');

      const last = store.templates.find(t => t.id === lastId);
      expect(last?.order).toBe(lastOrder);
    });

    it('移动不存在的模板不应该报错', () => {
      const store = usePromptsStore();

      expect(() => store.moveTemplate('不存在', 'up')).not.toThrow();
      expect(() => store.moveTemplate('不存在', 'down')).not.toThrow();
    });
  });

  describe('getTemplate', () => {
    it('应该返回存在的模板', () => {
      const store = usePromptsStore();

      const template = store.getTemplate('header');

      expect(template).toBeDefined();
      expect(template?.id).toBe('header');
      expect(template?.name).toBe('头部说明');
    });

    it('应该返回 undefined 对于不存在的模板', () => {
      const store = usePromptsStore();

      const template = store.getTemplate('不存在');

      expect(template).toBeUndefined();
    });
  });
});

describe('常量: DEFAULT_TEMPLATES', () => {
  it('应该有正确数量的模板', () => {
    expect(DEFAULT_TEMPLATES).toHaveLength(7);
  });

  it('所有内置模板应该标记为 builtin', () => {
    for (const template of DEFAULT_TEMPLATES) {
      expect(template.builtin).toBe(true);
    }
  });

  it('每个模板应该有必要的字段', () => {
    for (const template of DEFAULT_TEMPLATES) {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.content).toBeDefined();
      expect(template.type).toBeTruthy();
      expect(typeof template.enabled).toBe('boolean');
      expect(typeof template.order).toBe('number');
    }
  });

  it('模板 ID 应该唯一', () => {
    const ids = DEFAULT_TEMPLATES.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('损害计算模板应该依赖 damageCalculation 功能', () => {
    const damageTemplate = DEFAULT_TEMPLATES.find(t => t.id === 'damage-calculation');
    expect(damageTemplate?.requiresFeature).toBe('damageCalculation');
  });

  it('写作指南模板默认应该禁用', () => {
    const writingTemplate = DEFAULT_TEMPLATES.find(t => t.id === 'writing-guidelines');
    expect(writingTemplate?.enabled).toBe(false);
  });
});
