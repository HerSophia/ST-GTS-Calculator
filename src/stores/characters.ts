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
import type { PairwiseInteraction } from '../types/interactions';

// 重导出类型以保持向后兼容
export type { HeightRecord, CharacterData };

/**
 * 场景数据
 */
export interface ScenarioData {
  /** 当前场景类型（如：大城市、郊区、室内等） */
  当前场景?: string;
  /** 场景变化原因 */
  场景原因?: string;
  /** 具体地点描述（可选，如：东京银座、公司办公室） */
  具体地点?: string;
  /** 场景时间（可选，如：傍晚、深夜） */
  场景时间?: string;
  /** 人群状态（可选，如：拥挤、稀疏、撤离中） */
  人群状态?: string;
  /** 
   * 人群密度（人/平方公里）
   * 直接指定密度值，优先级高于场景预设
   * 例如：10000 = 大城市默认密度，50000 = 演唱会现场
   */
  人群密度?: number;
  /** 最后更新时间戳 */
  _更新时间?: number;
}

/**
 * 角色 Store
 * 
 * 职责：
 * - 管理角色状态列表
 * - 管理场景和互动限制状态
 * - 提供 CRUD 操作
 * - 追踪当前消息 ID，实现数据隔离
 * - 不包含计算逻辑（由 services 处理）
 */
export const useCharactersStoreBase = defineStore('giantess-characters-base', () => {
  // ========== 核心状态 ==========
  const characters = ref<Map<string, CharacterData>>(new Map());
  
  /** 当前场景数据 */
  const scenario = ref<ScenarioData>({});
  
  /** 互动限制数据（键为 "角色A_角色B" 格式） */
  const interactions = ref<Record<string, PairwiseInteraction>>({});
  
  /** 
   * 当前关联的消息 ID
   * 用于实现消息页之间的数据隔离
   * 当消息 ID 变化时，会清空旧数据
   */
  const currentMessageId = ref<number | 'latest' | null>(null);

  // ========== 角色 CRUD 操作 ==========
  
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

  /**
   * 检查是否有角色数据
   */
  const hasCharacters = (): boolean => {
    return characters.value.size > 0;
  };

  // ========== 场景操作 ==========
  
  /**
   * 设置场景数据
   */
  const setScenario = (data: ScenarioData) => {
    scenario.value = data;
  };

  /**
   * 获取当前场景名称
   */
  const getCurrentScenario = (): string | undefined => {
    return scenario.value.当前场景;
  };

  /**
   * 清空场景数据
   */
  const clearScenario = () => {
    scenario.value = {};
  };

  // ========== 互动限制操作 ==========
  
  /**
   * 设置互动限制数据
   */
  const setInteractions = (data: Record<string, PairwiseInteraction>) => {
    interactions.value = data;
  };

  /**
   * 获取两个角色之间的互动限制
   */
  const getInteraction = (char1: string, char2: string): PairwiseInteraction | undefined => {
    // 尝试两种顺序
    const key1 = `${char1}_${char2}`;
    const key2 = `${char2}_${char1}`;
    return interactions.value[key1] || interactions.value[key2];
  };

  /**
   * 获取所有互动限制
   */
  const getAllInteractions = (): Record<string, PairwiseInteraction> => {
    return interactions.value;
  };

  /**
   * 清空互动限制
   */
  const clearInteractions = () => {
    interactions.value = {};
  };

  // ========== 消息 ID 管理（数据隔离）==========
  
  /**
   * 获取当前关联的消息 ID
   */
  const getCurrentMessageId = (): number | 'latest' | null => {
    return currentMessageId.value;
  };

  /**
   * 设置当前消息 ID
   * 如果消息 ID 变化，会自动清空旧数据以确保数据隔离
   * 
   * @param messageId 新的消息 ID
   * @returns 是否发生了消息切换（true = 数据已被清空）
   */
  const setCurrentMessageId = (messageId: number | 'latest' | null): boolean => {
    const previousId = currentMessageId.value;
    
    // 如果是相同的消息 ID，不需要处理
    if (previousId === messageId) {
      return false;
    }
    
    // 消息 ID 变化，清空旧数据以确保隔离
    characters.value.clear();
    scenario.value = {};
    interactions.value = {};
    currentMessageId.value = messageId;
    
    return true;
  };

  // ========== 全部清空 ==========
  
  /**
   * 清空所有状态（包括消息 ID）
   */
  const clearAll = () => {
    characters.value.clear();
    scenario.value = {};
    interactions.value = {};
    currentMessageId.value = null;
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
  const getDamageSummary = (scenarioName: string = '大城市'): DamageSummary => {
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
      scenario: scenarioName,
    };
  };

  return {
    // 核心状态
    characters,
    scenario,
    interactions,
    currentMessageId,
    // 角色 CRUD
    setCharacter,
    getCharacter,
    removeCharacter,
    clear,
    getCharacterNames,
    getAllCharacters,
    updateCharacter,
    addHistory,
    hasCharacters,
    // 场景操作
    setScenario,
    getCurrentScenario,
    clearScenario,
    // 互动限制操作
    setInteractions,
    getInteraction,
    getAllInteractions,
    clearInteractions,
    // 消息 ID 管理
    getCurrentMessageId,
    setCurrentMessageId,
    // 全部清空
    clearAll,
    // 查询
    getAllCharacterInfo,
    getDamageSummary,
  };
});
