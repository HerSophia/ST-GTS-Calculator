/**
 * useWorldview Composable 测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupTestPinia } from '../mocks/pinia';
import { toastrMock } from '../setup';
import { useWorldview } from '@/composables/useWorldview';
import { useWorldviewsStore } from '@/stores/worldviews';

describe('Composable: useWorldview', () => {
  beforeEach(() => {
    setupTestPinia();
    vi.clearAllMocks();
  });

  describe('初始状态', () => {
    it('应该有正确的默认值', () => {
      const {
        worldviews,
        currentWorldviewId,
        currentWorldview,
        showWorldview,
        isEditingWorldview,
        editingWorldviewData,
        worldviewForm,
      } = useWorldview();

      expect(worldviews.value.length).toBeGreaterThan(0); // 有内置世界观
      expect(currentWorldviewId.value).toBeDefined();
      expect(currentWorldview.value).toBeDefined();
      expect(showWorldview.value).toBe(false);
      expect(isEditingWorldview.value).toBe(false);
      expect(editingWorldviewData.value).toBeNull();
      expect(worldviewForm.value).toEqual({
        name: '',
        icon: 'fa-solid fa-star',
        description: '',
        mechanism: '',
        bodyCharacteristics: '',
        limitations: [],
        specialRules: [],
        writingTips: [],
      });
    });
  });

  describe('setCurrentWorldview', () => {
    it('应该切换当前世界观', () => {
      const { worldviews, currentWorldviewId, setCurrentWorldview } = useWorldview();
      
      if (worldviews.value.length > 1) {
        const targetId = worldviews.value[1].id;
        setCurrentWorldview(targetId);

        expect(currentWorldviewId.value).toBe(targetId);
      }
    });
  });

  describe('startCreateWorldview', () => {
    it('应该初始化创建状态', () => {
      const { isEditingWorldview, editingWorldviewData, worldviewForm, startCreateWorldview } = useWorldview();

      startCreateWorldview();

      expect(isEditingWorldview.value).toBe(true);
      expect(editingWorldviewData.value).toBeNull();
      expect(worldviewForm.value.name).toBe('');
    });
  });

  describe('startEditWorldview', () => {
    it('应该使用当前世界观数据初始化编辑状态', () => {
      const { 
        currentWorldview, 
        isEditingWorldview, 
        editingWorldviewData, 
        worldviewForm,
        startEditWorldview 
      } = useWorldview();

      startEditWorldview();

      expect(isEditingWorldview.value).toBe(true);
      expect(editingWorldviewData.value).toBe(currentWorldview.value);
      expect(worldviewForm.value.name).toBe(currentWorldview.value?.name);
    });

    // 注意：由于 currentWorldview 有 fallback 到 DEFAULT_WORLDVIEWS[0]，
    // 所以实际上 currentWorldview 永远不会为空，此测试已移除
  });

  describe('cancelEditWorldview', () => {
    it('应该重置编辑状态', () => {
      const { 
        isEditingWorldview, 
        editingWorldviewData, 
        worldviewForm,
        startCreateWorldview,
        cancelEditWorldview 
      } = useWorldview();

      startCreateWorldview();
      worldviewForm.value.name = '测试';

      cancelEditWorldview();

      expect(isEditingWorldview.value).toBe(false);
      expect(editingWorldviewData.value).toBeNull();
      expect(worldviewForm.value.name).toBe('');
    });
  });

  describe('saveWorldview', () => {
    it('当名称为空时应该显示警告并返回 false', () => {
      const { worldviewForm, startCreateWorldview, saveWorldview } = useWorldview();

      startCreateWorldview();
      worldviewForm.value.name = '';

      const result = saveWorldview();

      expect(result).toBe(false);
      expect(toastrMock.warning).toHaveBeenCalledWith('请输入世界观名称');
    });

    it('创建新世界观时应该添加到列表', () => {
      const { worldviews, worldviewForm, isEditingWorldview, startCreateWorldview, saveWorldview } = useWorldview();
      const initialCount = worldviews.value.length;

      startCreateWorldview();
      worldviewForm.value.name = '新世界观';
      worldviewForm.value.description = '描述';

      const result = saveWorldview();

      expect(result).toBe(true);
      expect(worldviews.value.length).toBe(initialCount + 1);
      expect(isEditingWorldview.value).toBe(false);
      expect(toastrMock.success).toHaveBeenCalled();
    });

    it('编辑现有世界观时应该更新数据', () => {
      const { worldviews, worldviewForm, startCreateWorldview, saveWorldview, setCurrentWorldview, startEditWorldview } = useWorldview();
      
      // 先创建一个世界观
      startCreateWorldview();
      worldviewForm.value.name = '待编辑世界观';
      saveWorldview();
      
      // 找到并选中它
      const newWorldview = worldviews.value.find(w => w.name === '待编辑世界观');
      expect(newWorldview).toBeDefined();
      setCurrentWorldview(newWorldview!.id);
      
      // 开始编辑
      startEditWorldview();
      worldviewForm.value.description = '新描述';
      
      const result = saveWorldview();

      expect(result).toBe(true);
      expect(worldviews.value.find(w => w.id === newWorldview!.id)?.description).toBe('新描述');
      expect(toastrMock.success).toHaveBeenCalled();
    });
  });

  describe('deleteWorldview', () => {
    it('当用户确认时应该删除世界观并返回 true', () => {
      const { worldviews, worldviewForm, startCreateWorldview, saveWorldview, deleteWorldview } = useWorldview();
      
      // 先创建一个世界观
      startCreateWorldview();
      worldviewForm.value.name = '待删除世界观';
      saveWorldview();
      
      const toDelete = worldviews.value.find(w => w.name === '待删除世界观');
      expect(toDelete).toBeDefined();
      
      const confirmMock = vi.fn(() => true);
      vi.stubGlobal('confirm', confirmMock);

      const result = deleteWorldview(toDelete!.id, toDelete!.name);

      expect(result).toBe(true);
      expect(worldviews.value.find(w => w.name === '待删除世界观')).toBeUndefined();
      expect(toastrMock.success).toHaveBeenCalled();

      vi.mocked(globalThis.confirm).mockRestore();
    });

    it('当用户取消时应该返回 false', () => {
      const { worldviews, deleteWorldview } = useWorldview();
      const worldview = worldviews.value[0];
      
      const confirmMock = vi.fn(() => false);
      vi.stubGlobal('confirm', confirmMock);

      const result = deleteWorldview(worldview.id, worldview.name);

      expect(result).toBe(false);
    });
  });

  describe('resetWorldviews', () => {
    it('当用户确认时应该重置世界观', () => {
      const store = useWorldviewsStore();
      const resetSpy = vi.spyOn(store, 'resetToDefaults');
      const { resetWorldviews } = useWorldview();
      
      const confirmMock = vi.fn(() => true);
      vi.stubGlobal('confirm', confirmMock);

      resetWorldviews();

      expect(resetSpy).toHaveBeenCalled();
      expect(toastrMock.success).toHaveBeenCalled();
    });
  });

  describe('openWorldviewPanel / closeWorldviewPanel', () => {
    it('openWorldviewPanel 应该打开面板', () => {
      const { showWorldview, openWorldviewPanel } = useWorldview();

      expect(showWorldview.value).toBe(false);

      openWorldviewPanel();

      expect(showWorldview.value).toBe(true);
    });

    it('closeWorldviewPanel 应该关闭面板并清除编辑状态', () => {
      const { 
        showWorldview, 
        isEditingWorldview,
        openWorldviewPanel, 
        closeWorldviewPanel,
        startCreateWorldview,
      } = useWorldview();

      openWorldviewPanel();
      startCreateWorldview();

      closeWorldviewPanel();

      expect(showWorldview.value).toBe(false);
      expect(isEditingWorldview.value).toBe(false);
    });
  });
});
