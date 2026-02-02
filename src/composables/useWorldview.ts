/**
 * 世界观面板逻辑 Composable
 * 处理世界观管理
 */
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useWorldviewsStore, type Worldview } from '../worldviews';

export interface WorldviewFormData {
  name: string;
  icon: string;
  description: string;
  mechanism: string;
  bodyCharacteristics: string;
  limitations: string[];
  specialRules: string[];
  writingTips: string[];
}

const defaultFormData = (): WorldviewFormData => ({
  name: '',
  icon: 'fa-solid fa-star',
  description: '',
  mechanism: '',
  bodyCharacteristics: '',
  limitations: [],
  specialRules: [],
  writingTips: [],
});

export function useWorldview() {
  const worldviewsStore = useWorldviewsStore();
  const { worldviews, currentWorldviewId } = storeToRefs(worldviewsStore);
  
  // 面板状态
  const showWorldview = ref(false);
  const isEditingWorldview = ref(false);
  const editingWorldviewData = ref<Worldview | null>(null);
  const worldviewForm = ref<WorldviewFormData>(defaultFormData());

  /**
   * 当前世界观（响应式）
   */
  const currentWorldview = computed(() => worldviewsStore.currentWorldview);

  /**
   * 设置当前世界观
   */
  const setCurrentWorldview = (id: string) => {
    worldviewsStore.setCurrentWorldview(id);
  };

  /**
   * 开始创建新世界观
   */
  const startCreateWorldview = () => {
    editingWorldviewData.value = null;
    worldviewForm.value = defaultFormData();
    isEditingWorldview.value = true;
  };

  /**
   * 开始编辑当前世界观
   */
  const startEditWorldview = () => {
    if (!currentWorldview.value) return;
    editingWorldviewData.value = currentWorldview.value;
    worldviewForm.value = {
      name: currentWorldview.value.name,
      icon: currentWorldview.value.icon,
      description: currentWorldview.value.description,
      mechanism: currentWorldview.value.mechanism,
      bodyCharacteristics: currentWorldview.value.bodyCharacteristics,
      limitations: [...currentWorldview.value.limitations],
      specialRules: [...currentWorldview.value.specialRules],
      writingTips: [...currentWorldview.value.writingTips],
    };
    isEditingWorldview.value = true;
  };

  /**
   * 取消编辑
   */
  const cancelEditWorldview = () => {
    isEditingWorldview.value = false;
    editingWorldviewData.value = null;
    worldviewForm.value = defaultFormData();
  };

  /**
   * 保存世界观
   */
  const saveWorldview = () => {
    if (!worldviewForm.value.name.trim()) {
      toastr.warning('请输入世界观名称');
      return false;
    }
    
    const data = {
      name: worldviewForm.value.name.trim(),
      icon: worldviewForm.value.icon.trim() || 'fa-solid fa-star',
      description: worldviewForm.value.description.trim(),
      mechanism: worldviewForm.value.mechanism.trim(),
      bodyCharacteristics: worldviewForm.value.bodyCharacteristics.trim(),
      limitations: worldviewForm.value.limitations.filter(s => s.trim()),
      specialRules: worldviewForm.value.specialRules.filter(s => s.trim()),
      writingTips: worldviewForm.value.writingTips.filter(s => s.trim()),
    };
    
    if (editingWorldviewData.value) {
      // 编辑现有世界观
      worldviewsStore.updateWorldview(editingWorldviewData.value.id, data);
      toastr.success(`世界观 "${data.name}" 已更新`);
    } else {
      // 创建新世界观
      worldviewsStore.addWorldview(data);
      toastr.success(`世界观 "${data.name}" 已创建`);
    }
    
    isEditingWorldview.value = false;
    editingWorldviewData.value = null;
    return true;
  };

  /**
   * 删除世界观
   */
  const deleteWorldview = (id: string, name: string) => {
    if (confirm(`确定要删除世界观 "${name}" 吗？`)) {
      worldviewsStore.removeWorldview(id);
      toastr.success(`世界观 "${name}" 已删除`);
      return true;
    }
    return false;
  };

  /**
   * 重置为默认世界观
   */
  const resetWorldviews = () => {
    if (confirm('确定要重置所有世界观为默认值吗？自定义世界观将被删除。')) {
      worldviewsStore.resetToDefaults();
      toastr.success('世界观已重置为默认值');
    }
  };

  /**
   * 打开世界观面板
   */
  const openWorldviewPanel = () => {
    showWorldview.value = true;
  };

  /**
   * 关闭世界观面板
   */
  const closeWorldviewPanel = () => {
    showWorldview.value = false;
    cancelEditWorldview();
  };

  return {
    // 状态
    worldviews,
    currentWorldviewId,
    currentWorldview,
    showWorldview,
    isEditingWorldview,
    editingWorldviewData,
    worldviewForm,
    // 方法
    setCurrentWorldview,
    startCreateWorldview,
    startEditWorldview,
    cancelEditWorldview,
    saveWorldview,
    deleteWorldview,
    resetWorldviews,
    openWorldviewPanel,
    closeWorldviewPanel,
  };
}
