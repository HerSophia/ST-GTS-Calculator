/**
 * 提示词管理逻辑 Composable
 * 处理提示词模板管理
 */
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePromptsStore, type PromptTemplate } from '../prompts';

export interface NewTemplateData {
  name: string;
  description: string;
  content: string;
  type: 'header' | 'character' | 'interaction' | 'rules' | 'footer';
  enabled: boolean;
}

const defaultNewTemplate = (): NewTemplateData => ({
  name: '',
  description: '',
  content: '',
  type: 'footer',
  enabled: true,
});

export function usePrompts() {
  const promptsStore = usePromptsStore();
  const { templates } = storeToRefs(promptsStore);
  
  // 面板状态
  const showPrompts = ref(false);
  const isCreatingTemplate = ref(false);
  const editingTemplate = ref<PromptTemplate | null>(null);
  const newTemplate = ref<NewTemplateData>(defaultNewTemplate());

  /**
   * 启用的模板列表
   */
  const enabledTemplates = computed(() => 
    templates.value.filter(t => t.enabled)
  );

  /**
   * 切换模板启用状态
   */
  const toggleTemplate = (id: string) => {
    promptsStore.toggleTemplate(id);
  };

  /**
   * 开始编辑模板
   */
  const startEditTemplate = (template: PromptTemplate) => {
    editingTemplate.value = { ...template };
    isCreatingTemplate.value = false;
  };

  /**
   * 取消编辑
   */
  const cancelEditTemplate = () => {
    editingTemplate.value = null;
  };

  /**
   * 保存模板
   */
  const saveTemplate = () => {
    if (editingTemplate.value) {
      promptsStore.updateTemplate(editingTemplate.value.id, editingTemplate.value);
      toastr.success(`模板 "${editingTemplate.value.name}" 已保存`);
      editingTemplate.value = null;
      return true;
    }
    return false;
  };

  /**
   * 开始创建新模板
   */
  const startCreateTemplate = () => {
    newTemplate.value = defaultNewTemplate();
    isCreatingTemplate.value = true;
    editingTemplate.value = null;
  };

  /**
   * 取消创建模板
   */
  const cancelCreateTemplate = () => {
    isCreatingTemplate.value = false;
    newTemplate.value = defaultNewTemplate();
  };

  /**
   * 创建新模板
   */
  const createTemplate = () => {
    if (!newTemplate.value.name.trim()) {
      toastr.warning('请输入模板名称');
      return false;
    }
    promptsStore.addTemplate({
      name: newTemplate.value.name.trim(),
      description: newTemplate.value.description.trim(),
      content: newTemplate.value.content,
      type: newTemplate.value.type,
      enabled: newTemplate.value.enabled,
    });
    toastr.success(`模板 "${newTemplate.value.name}" 已创建`);
    // 重置表单
    newTemplate.value = defaultNewTemplate();
    isCreatingTemplate.value = false;
    return true;
  };

  /**
   * 删除模板
   */
  const deleteTemplate = (id: string, name: string) => {
    if (confirm(`确定要删除模板 "${name}" 吗？`)) {
      promptsStore.removeTemplate(id);
      toastr.success(`模板 "${name}" 已删除`);
      return true;
    }
    return false;
  };

  /**
   * 移动模板顺序
   */
  const moveTemplate = (id: string, direction: 'up' | 'down') => {
    promptsStore.moveTemplate(id, direction);
  };

  /**
   * 重置为默认模板
   */
  const resetPrompts = () => {
    if (confirm('确定要重置所有模板为默认值吗？自定义模板将被删除。')) {
      promptsStore.resetToDefaults();
      toastr.success('模板已重置为默认值');
    }
  };

  /**
   * 打开提示词面板
   */
  const openPromptsPanel = () => {
    showPrompts.value = true;
  };

  /**
   * 关闭提示词面板
   */
  const closePromptsPanel = () => {
    showPrompts.value = false;
    cancelEditTemplate();
    cancelCreateTemplate();
  };

  return {
    // 状态
    templates,
    enabledTemplates,
    showPrompts,
    isCreatingTemplate,
    editingTemplate,
    newTemplate,
    // 方法
    toggleTemplate,
    startEditTemplate,
    cancelEditTemplate,
    saveTemplate,
    startCreateTemplate,
    cancelCreateTemplate,
    createTemplate,
    deleteTemplate,
    moveTemplate,
    resetPrompts,
    openPromptsPanel,
    closePromptsPanel,
  };
}
