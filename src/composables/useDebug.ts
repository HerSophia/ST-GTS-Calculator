/**
 * 调试面板逻辑 Composable
 * 处理调试功能和测试数据注入
 */
import { ref, watch, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '../settings';
import { useCharactersStore, type CharacterData } from '../characters';
import { getMvuDebugInfo, injectTestData, clearTestData } from '../services/debug';
import { writeActualDamage, clearActualDamage, syncVariablesToStore } from '../services/variables';
import type { MvuDebugInfo } from '../types';

export interface ActualDamageFormData {
  totalCasualties: number;
  totalBuildings: number;
  lastAction: string;
  lastActionCasualties: number;
  note: string;
}

const defaultActualDamageForm = (): ActualDamageFormData => ({
  totalCasualties: 0,
  totalBuildings: 0,
  lastAction: '',
  lastActionCasualties: 0,
  note: '',
});

/**
 * 判断角色是否为巨大娘
 */
function isGiantCharacter(c: CharacterData): boolean {
  return c.currentHeight / c.originalHeight >= 1;
}

export function useDebug() {
  const settingsStore = useSettingsStore();
  const charactersStore = useCharactersStore();
  const { settings, debugLogs } = storeToRefs(settingsStore);
  const { characters } = storeToRefs(charactersStore);
  
  // 面板状态
  const showDebug = ref(false);
  const debugTab = ref<'status' | 'characters' | 'test' | 'logs' | 'raw'>('status');
  
  // MVU 状态信息
  const mvuInfo = ref<MvuDebugInfo>(getMvuDebugInfo());
  
  // 测试数据表单
  const testName = ref('测试角色');
  const testHeight = ref(100);
  const testOriginal = ref(1.65);
  
  // 实际损害表单
  const actualDamageTarget = ref('');
  const actualDamageForm = ref<ActualDamageFormData>(defaultActualDamageForm());

  /**
   * 刷新 MVU 信息
   */
  const refreshMvuInfo = () => {
    mvuInfo.value = getMvuDebugInfo();
    settingsStore.debugLog('🔄 已刷新 MVU 状态');
  };

  /**
   * 注入测试数据
   */
  const doInjectTest = () => {
    if (!testName.value) {
      toastr.warning('请输入角色名');
      return false;
    }
    if (!testHeight.value || testHeight.value <= 0) {
      toastr.warning('请输入有效的身高');
      return false;
    }

    const result = injectTestData(testName.value, testHeight.value, testOriginal.value);
    if (result.success) {
      const typeLabel = result.isTiny ? '小人' : '巨大娘';
      toastr.success(`已注入${typeLabel}测试数据: ${testName.value}`);
      // 延迟刷新状态
      setTimeout(() => {
        refreshMvuInfo();
        charactersStore.refresh();
      }, 500);
      return true;
    } else {
      toastr.error(`注入失败: ${result.error}`);
      return false;
    }
  };

  /**
   * 快捷测试
   */
  const doQuickTest = (name: string, height: number, original: number) => {
    const result = injectTestData(name, height, original);
    if (result.success) {
      const typeLabel = result.isTiny ? '小人' : '巨大娘';
      toastr.success(`已注入${typeLabel}测试数据: ${name}`);
      setTimeout(() => {
        refreshMvuInfo();
        charactersStore.refresh();
      }, 500);
      return true;
    } else {
      toastr.error(`注入失败: ${result.error}`);
      return false;
    }
  };

  /**
   * 清除测试数据
   */
  const doClearTest = (name?: string) => {
    const result = clearTestData(name);
    if (result.success) {
      toastr.success(name ? `已清除角色: ${name}` : '已清除所有测试数据');
      setTimeout(() => {
        refreshMvuInfo();
        charactersStore.refresh();
      }, 300);
      return true;
    } else {
      toastr.error(`清除失败: ${result.error}`);
      return false;
    }
  };

  /**
   * 保存实际损害数据
   */
  const doSaveActualDamage = () => {
    if (!actualDamageTarget.value) {
      toastr.warning('请先选择角色');
      return false;
    }
    
    const name = actualDamageTarget.value;
    
    try {
      // 构建实际损害数据
      const actualDamage: Record<string, unknown> = {};
      
      if (actualDamageForm.value.totalCasualties > 0) {
        actualDamage.总伤亡人数 = actualDamageForm.value.totalCasualties;
      }
      if (actualDamageForm.value.totalBuildings > 0) {
        actualDamage.总建筑损毁 = actualDamageForm.value.totalBuildings;
      }
      if (actualDamageForm.value.lastAction) {
        actualDamage.最近行动 = {
          描述: actualDamageForm.value.lastAction,
          伤亡人数: actualDamageForm.value.lastActionCasualties || 0,
          时间点: new Date().toLocaleString(),
        };
      }
      if (actualDamageForm.value.note) {
        actualDamage.备注 = actualDamageForm.value.note;
      }
      
      // 使用 writer 服务写入变量
      writeActualDamage(name, actualDamage);
      // 同步变量到 Store
      syncVariablesToStore();
      
      settingsStore.debugLog(`✅ 已保存 ${name} 的实际损害数据:`, actualDamage);
      toastr.success(`已保存 ${name} 的实际损害数据`);
      
      // 刷新状态
      setTimeout(() => {
        refreshMvuInfo();
        charactersStore.refresh();
      }, 300);
      return true;
    } catch (e) {
      settingsStore.debugError('❌ 保存实际损害数据失败:', e);
      toastr.error(`保存失败: ${e}`);
      return false;
    }
  };

  /**
   * 清除实际损害数据
   */
  const doClearActualDamage = () => {
    if (!actualDamageTarget.value) {
      toastr.warning('请先选择角色');
      return false;
    }
    
    const name = actualDamageTarget.value;
    
    try {
      // 使用 writer 服务清除变量
      clearActualDamage(name);
      // 同步变量到 Store
      syncVariablesToStore();
      
      // 重置表单
      actualDamageForm.value = defaultActualDamageForm();
      
      settingsStore.debugLog(`🗑️ 已清除 ${name} 的实际损害数据`);
      toastr.success(`已清除 ${name} 的实际损害数据`);
      
      // 刷新状态
      setTimeout(() => {
        refreshMvuInfo();
        charactersStore.refresh();
      }, 300);
      return true;
    } catch (e) {
      settingsStore.debugError('❌ 清除实际损害数据失败:', e);
      toastr.error(`清除失败: ${e}`);
      return false;
    }
  };

  /**
   * 清除调试日志
   */
  const clearDebugLogs = () => {
    settingsStore.clearDebugLogs();
  };

  /**
   * 打开调试面板
   */
  const openDebugPanel = () => {
    showDebug.value = true;
    refreshMvuInfo();
  };

  /**
   * 关闭调试面板
   */
  const closeDebugPanel = () => {
    showDebug.value = false;
  };

  /**
   * 可选择的角色名列表（用于实际损害表单）
   */
  const characterNames = computed(() => {
    const list: CharacterData[] = Array.from(characters.value.values());
    return list
      .filter(isGiantCharacter)
      .map(c => c.name);
  });

  // 打开调试面板时自动刷新
  watch(showDebug, (val) => {
    if (val) {
      refreshMvuInfo();
    }
  });

  return {
    // 状态
    showDebug,
    debugTab,
    debugLogs,
    mvuInfo,
    testName,
    testHeight,
    testOriginal,
    actualDamageTarget,
    actualDamageForm,
    characterNames,
    settings,
    characters,
    // 方法
    refreshMvuInfo,
    doInjectTest,
    doQuickTest,
    doClearTest,
    doSaveActualDamage,
    doClearActualDamage,
    clearDebugLogs,
    openDebugPanel,
    closeDebugPanel,
  };
}
