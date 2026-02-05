/**
 * usePrompts Composable 测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupTestPinia } from '../mocks/pinia';
import { toastrMock } from '../setup';
import { usePrompts } from '@/composables/usePrompts';
import { usePromptsStore } from '@/stores/prompts';

describe('Composable: usePrompts', () => {
  beforeEach(() => {
    setupTestPinia();
    vi.clearAllMocks();
  });

  describe('初始状态', () => {
    it('应该有正确的默认值', () => {
      const {
        templates,
        showPrompts,
        isCreatingTemplate,
        editingTemplate,
        newTemplate,
      } = usePrompts();

      expect(templates.value.length).toBeGreaterThan(0); // 有内置模板
      expect(showPrompts.value).toBe(false);
      expect(isCreatingTemplate.value).toBe(false);
      expect(editingTemplate.value).toBeNull();
      expect(newTemplate.value).toEqual({
        name: '',
        description: '',
        content: '',
        type: 'footer',
        enabled: true,
      });
    });
  });

  describe('enabledTemplates computed', () => {
    it('应该只返回启用的模板', () => {
      const store = usePromptsStore();
      const { enabledTemplates, templates } = usePrompts();

      // 禁用第一个模板
      if (templates.value.length > 0) {
        store.toggleTemplate(templates.value[0].id);
      }

      const allCount = templates.value.length;
      const enabledCount = enabledTemplates.value.length;

      expect(enabledCount).toBeLessThan(allCount);
      expect(enabledTemplates.value.every(t => t.enabled)).toBe(true);
    });
  });

  describe('toggleTemplate', () => {
    it('应该切换模板启用状态', () => {
      const { templates, toggleTemplate } = usePrompts();
      
      if (templates.value.length > 0) {
        const template = templates.value[0];
        const initialEnabled = template.enabled;

        toggleTemplate(template.id);

        expect(templates.value[0].enabled).toBe(!initialEnabled);
      }
    });
  });

  describe('startEditTemplate / cancelEditTemplate', () => {
    it('startEditTemplate 应该设置编辑状态', () => {
      const { templates, editingTemplate, isCreatingTemplate, startEditTemplate } = usePrompts();
      
      if (templates.value.length > 0) {
        const template = templates.value[0];
        startEditTemplate(template);

        expect(editingTemplate.value).not.toBeNull();
        expect(editingTemplate.value?.id).toBe(template.id);
        expect(isCreatingTemplate.value).toBe(false);
      }
    });

    it('cancelEditTemplate 应该清除编辑状态', () => {
      const { templates, editingTemplate, startEditTemplate, cancelEditTemplate } = usePrompts();
      
      if (templates.value.length > 0) {
        startEditTemplate(templates.value[0]);
        expect(editingTemplate.value).not.toBeNull();

        cancelEditTemplate();

        expect(editingTemplate.value).toBeNull();
      }
    });
  });

  describe('saveTemplate', () => {
    it('当没有编辑中的模板时应该返回 false', () => {
      const { saveTemplate } = usePrompts();

      const result = saveTemplate();

      expect(result).toBe(false);
    });

    it('当有编辑中的模板时应该保存并返回 true', () => {
      const { templates, editingTemplate, startEditTemplate, saveTemplate } = usePrompts();
      
      if (templates.value.length > 0) {
        startEditTemplate(templates.value[0]);
        editingTemplate.value!.description = '修改后的描述';

        const result = saveTemplate();

        expect(result).toBe(true);
        expect(editingTemplate.value).toBeNull();
        expect(toastrMock.success).toHaveBeenCalled();
      }
    });
  });

  describe('startCreateTemplate / cancelCreateTemplate', () => {
    it('startCreateTemplate 应该设置创建状态', () => {
      const { isCreatingTemplate, editingTemplate, newTemplate, startCreateTemplate } = usePrompts();

      startCreateTemplate();

      expect(isCreatingTemplate.value).toBe(true);
      expect(editingTemplate.value).toBeNull();
      expect(newTemplate.value.name).toBe('');
    });

    it('cancelCreateTemplate 应该重置创建状态', () => {
      const { isCreatingTemplate, newTemplate, startCreateTemplate, cancelCreateTemplate } = usePrompts();

      startCreateTemplate();
      newTemplate.value.name = '测试模板';

      cancelCreateTemplate();

      expect(isCreatingTemplate.value).toBe(false);
      expect(newTemplate.value.name).toBe('');
    });
  });

  describe('createTemplate', () => {
    it('当模板名称为空时应该显示警告并返回 false', () => {
      const { newTemplate, startCreateTemplate, createTemplate } = usePrompts();

      startCreateTemplate();
      newTemplate.value.name = '';

      const result = createTemplate();

      expect(result).toBe(false);
      expect(toastrMock.warning).toHaveBeenCalledWith('请输入模板名称');
    });

    it('当模板名称有效时应该创建模板并返回 true', () => {
      const { templates, newTemplate, isCreatingTemplate, startCreateTemplate, createTemplate } = usePrompts();
      const initialCount = templates.value.length;

      startCreateTemplate();
      newTemplate.value.name = '新模板';
      newTemplate.value.content = '模板内容';

      const result = createTemplate();

      expect(result).toBe(true);
      expect(templates.value.length).toBe(initialCount + 1);
      expect(isCreatingTemplate.value).toBe(false);
      expect(toastrMock.success).toHaveBeenCalled();
    });
  });

  describe('deleteTemplate', () => {
    it('当用户确认时应该删除模板并返回 true', () => {
      const { templates, newTemplate, startCreateTemplate, createTemplate, deleteTemplate } = usePrompts();
      
      // 先创建一个模板
      startCreateTemplate();
      newTemplate.value.name = '待删除模板';
      createTemplate();
      
      const customTemplate = templates.value.find(t => t.name === '待删除模板');
      expect(customTemplate).toBeDefined();
      
      // Mock confirm
      const confirmMock = vi.fn(() => true);
      vi.stubGlobal('confirm', confirmMock);

      const result = deleteTemplate(customTemplate!.id, customTemplate!.name);

      expect(result).toBe(true);
      expect(templates.value.find(t => t.name === '待删除模板')).toBeUndefined();
      expect(toastrMock.success).toHaveBeenCalled();
    });

    it('当用户取消时应该返回 false', () => {
      const { templates, deleteTemplate } = usePrompts();
      const template = templates.value[0];
      
      // Mock confirm 返回 false
      const confirmMock = vi.fn(() => false);
      vi.stubGlobal('confirm', confirmMock);

      const result = deleteTemplate(template.id, template.name);

      expect(result).toBe(false);
    });
  });

  describe('moveTemplate', () => {
    it('应该调用 store 的 moveTemplate 方法', () => {
      const store = usePromptsStore();
      const moveSpy = vi.spyOn(store, 'moveTemplate');
      const { templates, moveTemplate } = usePrompts();

      if (templates.value.length > 0) {
        moveTemplate(templates.value[0].id, 'down');
        expect(moveSpy).toHaveBeenCalledWith(templates.value[0].id, 'down');
      }
    });
  });

  describe('resetPrompts', () => {
    it('当用户确认时应该重置模板', () => {
      const store = usePromptsStore();
      const resetSpy = vi.spyOn(store, 'resetToDefaults');
      const { resetPrompts } = usePrompts();
      
      const confirmMock = vi.fn(() => true);
      vi.stubGlobal('confirm', confirmMock);

      resetPrompts();

      expect(resetSpy).toHaveBeenCalled();
      expect(toastrMock.success).toHaveBeenCalled();
    });
  });

  describe('openPromptsPanel / closePromptsPanel', () => {
    it('openPromptsPanel 应该打开面板', () => {
      const { showPrompts, openPromptsPanel } = usePrompts();

      expect(showPrompts.value).toBe(false);

      openPromptsPanel();

      expect(showPrompts.value).toBe(true);
    });

    it('closePromptsPanel 应该关闭面板并清除编辑状态', () => {
      const { 
        showPrompts, 
        isCreatingTemplate,
        editingTemplate,
        templates,
        openPromptsPanel, 
        closePromptsPanel,
        startEditTemplate,
        startCreateTemplate,
      } = usePrompts();

      openPromptsPanel();
      if (templates.value.length > 0) {
        startEditTemplate(templates.value[0]);
      }
      startCreateTemplate();

      closePromptsPanel();

      expect(showPrompts.value).toBe(false);
      expect(isCreatingTemplate.value).toBe(false);
      expect(editingTemplate.value).toBeNull();
    });
  });
});
