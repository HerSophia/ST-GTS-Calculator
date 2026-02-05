/**
 * 巨大娘计算器 - 变量读取服务
 * 
 * 职责：
 * - 从酒馆楼层变量读取巨大娘数据（内部使用）
 * - 提供公开 API 从 Store 读取数据
 * 
 * 注意：
 * - `_internal_*` 函数仅供 sync.ts 使用，用于从变量同步到 Store
 * - 公开 API 函数从 Store 读取，不直接访问酒馆变量
 * 
 * @module services/variables/reader
 */

import type {
  GiantessVariableData,
  CharacterMvuData,
  ReadOptions,
  ProcessingState,
} from '../../types/variables';
import type { CharacterData } from '../../types/character';
import type { PairwiseInteraction } from '../../types/interactions';
import { useSettingsStore } from '../../stores/settings';
import { useCharactersStoreBase, type ScenarioData } from '../../stores/characters';

// ========== 内部函数（仅供 sync.ts 使用）==========

/**
 * [内部] 从指定消息楼层读取巨大娘数据
 * 直接访问酒馆变量，仅供 sync.ts 同步时使用
 * 
 * @internal
 * @param options 读取选项
 * @returns 巨大娘数据，如果不存在则返回 null
 */
export function _internal_readGiantessData(
  options: ReadOptions = {}
): GiantessVariableData | null {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;

  // 内部辅助函数：从变量中提取数据
  const extractData = (variables: Record<string, unknown>): GiantessVariableData | null => {
    const data = _.get(variables, `stat_data.${prefix}`) as GiantessVariableData | undefined;
    
    if (!data || typeof data !== 'object') {
      return null;
    }
    
    settingsStore.debugLog(`📖 [内部] 读取到巨大娘数据`, {
      hasScene: !!data._场景,
      hasCharacters: !!data.角色,
      characterCount: data.角色 ? Object.keys(data.角色).length : 0,
    });
    
    return data;
  };

  // 尝试使用指定的 messageId
  try {
    const variables = getVariables({ type: 'message', message_id: messageId });
    return extractData(variables);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 如果是楼层号超出范围的错误，回退到 'latest'
    if (errorMessage.includes('超出了范围') && messageId !== 'latest') {
      settingsStore.debugLog(`⚠️ [内部] messageId ${messageId} 超出范围，回退到 'latest'`);
      
      try {
        const variables = getVariables({ type: 'message', message_id: 'latest' });
        return extractData(variables);
      } catch (fallbackError) {
        settingsStore.debugError('❌ [内部] 回退到 latest 也失败:', fallbackError);
        return null;
      }
    }
    
    settingsStore.debugLog(`📖 [内部] 未找到巨大娘数据 (prefix: ${prefix}, messageId: ${messageId})`);
    return null;
  }
}

/**
 * [内部] 从数据中提取角色列表
 * 支持新旧两种数据格式
 * 
 * @internal
 * @param data 巨大娘数据对象
 * @returns 角色数据映射
 */
export function _internal_extractCharacters(
  data: GiantessVariableData
): Record<string, CharacterMvuData> {
  // 新结构：角色数据在 `角色` 键下
  if (data.角色 && typeof data.角色 === 'object') {
    return data.角色;
  }
  
  // 旧结构兼容：过滤掉以 _ 开头的键和特殊键
  const characters: Record<string, CharacterMvuData> = {};
  for (const [key, value] of Object.entries(data)) {
    if (
      !key.startsWith('_') &&
      key !== '角色' &&
      typeof value === 'object' &&
      value !== null
    ) {
      // 验证是角色数据（有身高相关字段）
      const charData = value as CharacterMvuData;
      if (charData.当前身高 !== undefined || charData.身高 !== undefined) {
        characters[key] = charData;
      }
    }
  }
  
  return characters;
}

/**
 * [内部] 从数据中提取场景信息
 * 
 * @internal
 * @param data 巨大娘数据对象
 * @returns 场景数据
 */
export function _internal_extractScenario(
  data: GiantessVariableData
): ScenarioData | null {
  return data._场景 || null;
}

/**
 * [内部] 从数据中提取互动限制
 * 
 * @internal
 * @param data 巨大娘数据对象
 * @returns 互动限制数据
 */
export function _internal_extractInteractions(
  data: GiantessVariableData
): Record<string, PairwiseInteraction> | null {
  return (data._互动限制 as Record<string, PairwiseInteraction>) || null;
}

/**
 * [内部] 从数据中提取处理状态
 * 
 * @internal
 * @param data 巨大娘数据对象
 * @returns 处理状态
 */
export function _internal_extractProcessingState(
  data: GiantessVariableData
): ProcessingState | null {
  return data._处理状态 || null;
}

/**
 * [内部] 读取处理状态
 * 直接从变量读取，用于检查消息是否已处理
 * 
 * @internal
 * @param options 读取选项
 * @returns 处理状态
 */
export function _internal_readProcessingState(
  options: ReadOptions = {}
): ProcessingState | null {
  const data = _internal_readGiantessData(options);
  if (!data) return null;
  return _internal_extractProcessingState(data);
}

/**
 * [内部] 读取原始变量对象
 * 用于需要直接操作变量的场景
 * 
 * @internal
 * @param options 读取选项
 * @returns 变量对象
 */
export function _internal_readRawVariables(
  options: ReadOptions = {}
): Record<string, unknown> {
  const { messageId = 'latest' } = options;
  
  try {
    return getVariables({ type: 'message', message_id: messageId });
  } catch (error) {
    console.error('[GiantessCalc] 读取原始变量失败:', error);
    return {};
  }
}

// ========== 公开 API（从 Store 读取）==========

/**
 * 从 Store 读取巨大娘数据
 * 这是公开 API，应用代码应使用此函数
 * 
 * @returns 巨大娘数据对象，如果没有数据则返回 null
 */
export function readGiantessData(): GiantessVariableData | null {
  const charactersStore = useCharactersStoreBase();
  
  if (!charactersStore.hasCharacters()) {
    return null;
  }
  
  // 从 Store 构建数据结构
  const characters: Record<string, CharacterMvuData> = {};
  
  for (const char of charactersStore.getAllCharacters()) {
    characters[char.name] = {
      当前身高: char.currentHeight,
      原身高: char.originalHeight,
      变化原因: char.changeReason,
      变化时间: char.changeTime,
      自定义部位: char.customParts,
      _计算数据: char.calcData,
      _损害数据: char.damageData,
      _实际损害: char.actualDamage,
      _身高历史: char.history?.map(h => ({
        身高: h.height,
        身高_格式化: h.heightFormatted,
        时间戳: Date.now(),
        时间点: h.time,
        原因: h.reason,
      })),
    };
  }
  
  return {
    _场景: charactersStore.scenario,
    _互动限制: charactersStore.interactions,
    角色: characters,
  };
}

/**
 * 从 Store 提取角色列表
 * 
 * @param data 巨大娘数据对象（可选，如果不提供则从 Store 获取）
 * @returns 角色数据映射
 */
export function extractCharacters(
  data?: GiantessVariableData | null
): Record<string, CharacterMvuData> {
  // 如果提供了数据，使用内部函数处理
  if (data) {
    return _internal_extractCharacters(data);
  }
  
  // 否则从 Store 读取
  const storeData = readGiantessData();
  return storeData?.角色 || {};
}

/**
 * 从 Store 获取指定角色的数据
 * 
 * @param name 角色名
 * @returns 角色数据，如果不存在则返回 null
 */
export function readCharacterData(name: string): CharacterMvuData | null {
  const charactersStore = useCharactersStoreBase();
  const char = charactersStore.getCharacter(name);
  
  if (!char) return null;
  
  return {
    当前身高: char.currentHeight,
    原身高: char.originalHeight,
    变化原因: char.changeReason,
    变化时间: char.changeTime,
    自定义部位: char.customParts,
    _计算数据: char.calcData,
    _损害数据: char.damageData,
    _实际损害: char.actualDamage,
    _身高历史: char.history?.map(h => ({
      身高: h.height,
      身高_格式化: h.heightFormatted,
      时间戳: Date.now(),
      时间点: h.time,
      原因: h.reason,
    })),
  };
}

/**
 * 从 Store 获取场景数据
 * 
 * @returns 场景数据
 */
export function readScenarioData(): ScenarioData | null {
  const charactersStore = useCharactersStoreBase();
  const scenario = charactersStore.scenario;
  
  if (!scenario || Object.keys(scenario).length === 0) {
    return null;
  }
  
  return scenario;
}

/**
 * 检查 Store 中是否有巨大娘数据
 * 
 * @returns 是否有数据
 */
export function hasGiantessData(): boolean {
  const charactersStore = useCharactersStoreBase();
  return charactersStore.hasCharacters();
}

/**
 * 从 Store 获取所有角色名称
 * 
 * @returns 角色名称数组
 */
export function getCharacterNames(): string[] {
  const charactersStore = useCharactersStoreBase();
  return charactersStore.getCharacterNames();
}

/**
 * 从 Store 获取所有互动限制
 * 
 * @returns 互动限制数据
 */
export function readInteractionLimits(): Record<string, PairwiseInteraction> {
  const charactersStore = useCharactersStoreBase();
  return charactersStore.getAllInteractions();
}

/**
 * 读取原始变量对象（兼容旧 API）
 * 注意：这仍然直接读取酒馆变量，用于调试等场景
 * 
 * @param options 读取选项
 * @returns 变量对象
 */
export function readRawVariables(
  options: ReadOptions = {}
): Record<string, unknown> {
  return _internal_readRawVariables(options);
}

// ========== 兼容性别名 ==========

/**
 * @deprecated 请使用 readCharacterData 代替
 */
export function getCharacterData(name: string): CharacterData | undefined {
  const charactersStore = useCharactersStoreBase();
  return charactersStore.getCharacter(name);
}
