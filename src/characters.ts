/**
 * 巨大娘计算器 - 角色数据 Store（兼容层）
 * 
 * 此文件提供向后兼容的 API
 * 新代码请直接从 './stores' 或 './stores/characters' 导入
 * 
 * @module characters
 */

import type { ActualDamageRecord } from './types';
import {
  calculateFullCharacterData,
  recalculateDamage,
  refreshCharactersFromMvu,
  formatLength,
} from './services';
import { useSettingsStore, type DamageScenario } from './stores/settings';
import { useCharactersStoreBase, type CharacterData, type HeightRecord } from './stores/characters';

// 重导出类型
export type { CharacterData, HeightRecord };

/**
 * 增强版角色 Store
 * 
 * 在精简版 Store 基础上添加业务逻辑方法
 * 这些方法委托给 services 层实现
 */
export const useCharactersStore = defineStore('giantess-characters', () => {
  const baseStore = useCharactersStoreBase();
  const settingsStore = useSettingsStore();

  /**
   * 添加或更新角色（包含计算逻辑）
   */
  const addCharacter = (
    name: string,
    currentHeight: number,
    originalHeight: number,
    reason?: string,
    time?: string,
    customParts?: Record<string, number>,
    actualDamage?: ActualDamageRecord
  ) => {
    // 使用服务层计算
    const result = calculateFullCharacterData(currentHeight, originalHeight, {
      customParts,
      enableDamage: settingsStore.settings.enableDamageCalculation,
      damageScenario: settingsStore.settings.damageScenario as DamageScenario,
    });

    const existing = baseStore.getCharacter(name);
    const history = existing?.history || [];

    // 添加历史记录
    const newRecord: HeightRecord = {
      height: currentHeight,
      heightFormatted: formatLength(currentHeight, currentHeight > 1e10),
      time: time || new Date().toLocaleString(),
      reason: reason || '',
    };
    history.push(newRecord);

    // 限制历史记录数量
    const maxRecords = settingsStore.settings.maxHistoryRecords;
    if (history.length > maxRecords) {
      history.splice(0, history.length - maxRecords);
    }

    // 使用传入的实际损害数据，如果没有则保留现有的
    const finalActualDamage = actualDamage || existing?.actualDamage;

    baseStore.setCharacter(name, {
      name,
      currentHeight,
      originalHeight,
      changeReason: reason,
      changeTime: time,
      calcData: result.calcData || undefined,
      damageData: result.damageData || undefined,
      actualDamage: finalActualDamage,
      history,
    });
  };

  /**
   * 从 MVU 楼层变量刷新角色数据
   */
  const refresh = () => {
    const prefix = settingsStore.settings.variablePrefix;
    const count = refreshCharactersFromMvu(prefix);
    if (count > 0) {
      settingsStore.log('已刷新角色数据，共', count, '个角色');
    }
  };

  /**
   * 重新计算所有角色的损害数据
   */
  const recalculateAllDamage = (scenario?: DamageScenario) => {
    const targetScenario = scenario || (settingsStore.settings.damageScenario as DamageScenario);
    
    for (const [name, data] of baseStore.characters) {
      const damageData = recalculateDamage(
        data.currentHeight,
        data.originalHeight,
        targetScenario
      );
      if (damageData) {
        baseStore.updateCharacter(name, { damageData });
      }
    }
  };

  return {
    // 来自 base store 的状态和方法
    characters: baseStore.characters,
    setCharacter: baseStore.setCharacter,
    getCharacter: baseStore.getCharacter,
    removeCharacter: baseStore.removeCharacter,
    clear: baseStore.clear,
    getCharacterNames: baseStore.getCharacterNames,
    getAllCharacters: baseStore.getAllCharacters,
    updateCharacter: baseStore.updateCharacter,
    addHistory: baseStore.addHistory,
    getAllCharacterInfo: baseStore.getAllCharacterInfo,
    getDamageSummary: baseStore.getDamageSummary,
    // 业务逻辑方法（委托给 services）
    addCharacter,
    refresh,
    recalculateDamage: recalculateAllDamage,
  };
});
