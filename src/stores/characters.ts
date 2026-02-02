/**
 * 巨大娘计算器 - 角色数据 Store（精简版）
 * 只负责状态管理，计算逻辑委托给 services
 * 
 * @module stores/characters
 */

import type {
  HeightRecord,
  CharacterData,
  DamageSummary,
} from '../types';

// 重导出类型以保持向后兼容
export type { HeightRecord, CharacterData };

/**
 * 角色 Store
 * 
 * 职责：
 * - 管理角色状态列表
 * - 提供 CRUD 操作
 * - 不包含计算逻辑（由 services 处理）
 */
export const useCharactersStoreBase = defineStore('giantess-characters-base', () => {
  // ========== 核心状态 ==========
  const characters = ref<Map<string, CharacterData>>(new Map());

  // ========== CRUD 操作 ==========
  
  /**
   * 设置角色数据（由 service 调用，数据已计算好）
   */
  const setCharacter = (name: string, data: CharacterData) => {
    characters.value.set(name, data);
  };

  /**
   * 获取角色数据
   */
  const getCharacter = (name: string): CharacterData | undefined => {
    return characters.value.get(name);
  };

  /**
   * 删除角色
   */
  const removeCharacter = (name: string) => {
    characters.value.delete(name);
  };

  /**
   * 清空所有角色
   */
  const clear = () => {
    characters.value.clear();
  };

  /**
   * 获取所有角色名称
   */
  const getCharacterNames = (): string[] => {
    return Array.from(characters.value.keys());
  };

  /**
   * 获取所有角色数据
   */
  const getAllCharacters = (): CharacterData[] => {
    return Array.from(characters.value.values());
  };

  /**
   * 更新角色的部分数据
   */
  const updateCharacter = (name: string, updates: Partial<CharacterData>) => {
    const existing = characters.value.get(name);
    if (existing) {
      characters.value.set(name, { ...existing, ...updates });
    }
  };

  /**
   * 添加历史记录
   */
  const addHistory = (name: string, record: HeightRecord, maxRecords: number = 20) => {
    const existing = characters.value.get(name);
    if (existing) {
      const history = [...(existing.history || []), record];
      // 限制历史记录数量
      if (history.length > maxRecords) {
        history.splice(0, history.length - maxRecords);
      }
      characters.value.set(name, { ...existing, history });
    }
  };

  // ========== 查询方法 ==========

  /**
   * 获取所有角色信息（用于互动计算）
   */
  const getAllCharacterInfo = () => {
    return Array.from(characters.value.values()).map((c) => ({
      name: c.name,
      height: c.currentHeight,
      calcData: c.calcData,
      damageData: c.damageData,
    }));
  };

  /**
   * 获取所有角色的损害汇总
   */
  const getDamageSummary = (scenario: string = '大城市'): DamageSummary => {
    let totalCasualtiesMin = 0;
    let totalCasualtiesMax = 0;
    let totalBuildingsMin = 0;
    let totalBuildingsMax = 0;
    let giantCount = 0;
    let tinyCount = 0;

    for (const [, data] of characters.value) {
      if (data.damageData) {
        totalCasualtiesMin += data.damageData.单步损害.小人伤亡.最小估计;
        totalCasualtiesMax += data.damageData.单步损害.小人伤亡.最大估计;
        totalBuildingsMin += data.damageData.单步损害.建筑损毁.最小估计;
        totalBuildingsMax += data.damageData.单步损害.建筑损毁.最大估计;
      }
      // 判断角色类型
      const ratio = data.currentHeight / data.originalHeight;
      if (ratio > 1) {
        giantCount++;
      } else if (ratio < 1) {
        tinyCount++;
      }
    }

    return {
      giantCount,
      tinyCount,
      totalCasualties: { min: totalCasualtiesMin, max: totalCasualtiesMax },
      totalBuildings: { min: totalBuildingsMin, max: totalBuildingsMax },
      scenario,
    };
  };

  return {
    // 核心状态
    characters,
    // CRUD
    setCharacter,
    getCharacter,
    removeCharacter,
    clear,
    getCharacterNames,
    getAllCharacters,
    updateCharacter,
    addHistory,
    // 查询
    getAllCharacterInfo,
    getDamageSummary,
  };
});
