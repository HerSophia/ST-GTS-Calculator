/**
 * 巨大娘计算器 - 变量写入服务
 * 
 * 职责：
 * - 写入角色计算数据到楼层变量
 * - 批量更新角色数据
 * - 管理身高历史记录
 * 
 * @module services/variables/writer
 */

import type {
  CharacterMvuData,
  CharacterUpdateData,
  WriteOptions,
  CalculationData,
  MvuHeightRecord,
  ProcessingState,
} from '../../types/variables';
import type { DamageCalculation } from '../../types/damage';
import type { PairwiseInteraction } from '../../types/interactions';
import { useSettingsStore } from '../../stores/settings';
import { formatLength } from '../../core/formatter';

/**
 * 安全地更新变量，如果指定的 messageId 超出范围则回退到 'latest'
 * 
 * @param updater 更新函数
 * @param messageId 消息 ID
 * @returns 是否成功
 */
function safeUpdateVariables(
  updater: (variables: Record<string, unknown>) => Record<string, unknown>,
  messageId: number | 'latest' = 'latest'
): boolean {
  const settingsStore = useSettingsStore();
  
  try {
    updateVariablesWith(updater, { type: 'message', message_id: messageId });
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 如果是楼层号超出范围的错误，回退到 'latest'
    if (errorMessage.includes('超出了范围') && messageId !== 'latest') {
      settingsStore.debugLog(`⚠️ messageId ${messageId} 超出范围，回退到 'latest'`);
      
      try {
        updateVariablesWith(updater, { type: 'message', message_id: 'latest' });
        return true;
      } catch (fallbackError) {
        settingsStore.debugError('❌ 回退到 latest 也失败:', fallbackError);
        return false;
      }
    }
    
    settingsStore.debugError('❌ 更新变量失败:', error);
    return false;
  }
}

/**
 * 获取角色数据的完整路径
 * 
 * @param prefix 变量前缀
 * @param name 角色名
 * @returns 完整路径
 */
export function getCharacterPath(prefix: string, name: string): string {
  return `stat_data.${prefix}.角色.${name}`;
}

/**
 * 写入角色计算数据
 * 
 * @param name 角色名
 * @param calcData 计算数据
 * @param options 写入选项
 */
export function writeCharacterCalcData(
  name: string,
  calcData: CalculationData,
  options: WriteOptions = {}
): void {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;
  const path = `${getCharacterPath(prefix, name)}._计算数据`;

  const success = safeUpdateVariables(
    (variables) => {
      _.set(variables, path, calcData);
      return variables;
    },
    messageId
  );
  
  if (success) {
    settingsStore.debugLog(`📝 写入计算数据: ${name}`);
  }
}

/**
 * 写入角色损害数据
 * 
 * @param name 角色名
 * @param damageData 损害数据
 * @param options 写入选项
 */
export function writeCharacterDamageData(
  name: string,
  damageData: DamageCalculation,
  options: WriteOptions = {}
): void {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;
  const path = `${getCharacterPath(prefix, name)}._损害数据`;

  const success = safeUpdateVariables(
    (variables) => {
      _.set(variables, path, damageData);
      return variables;
    },
    messageId
  );
  
  if (success) {
    settingsStore.debugLog(`📝 写入损害数据: ${name}`);
  }
}

/**
 * 添加身高历史记录（内部版本，用于批量操作）
 * 直接修改传入的 variables 对象，不执行写入
 * 
 * @param variables 变量对象（会被修改）
 * @param prefix 变量前缀
 * @param name 角色名
 * @param newHeight 新身高
 * @param reason 变化原因
 * @param timestamp 时间点
 */
export function addHeightHistoryInternal(
  variables: Record<string, unknown>,
  prefix: string,
  name: string,
  newHeight: number,
  reason: string = '',
  timestamp: string = ''
): void {
  const settingsStore = useSettingsStore();
  const historyPath = `${getCharacterPath(prefix, name)}._身高历史`;
  let history = (_.get(variables, historyPath) as MvuHeightRecord[]) || [];
  
  const lastRecord = history[history.length - 1];
  const lastHeight = lastRecord ? lastRecord.身高 : null;
  
  // 如果身高没变，不记录
  if (lastHeight === newHeight) {
    return;
  }
  
  const record: MvuHeightRecord = {
    身高: newHeight,
    身高_格式化: formatLength(newHeight, newHeight > 1e10),
    时间戳: Date.now(),
    时间点: timestamp || new Date().toLocaleString(),
    原因: reason,
    变化: lastHeight ? (newHeight > lastHeight ? '增大' : '缩小') : undefined,
    变化倍率: lastHeight ? Math.round((newHeight / lastHeight) * 100) / 100 : undefined,
  };
  
  history.push(record);
  
  // 限制历史记录数量
  const maxRecords = settingsStore.settings.maxHistoryRecords;
  if (history.length > maxRecords) {
    history = history.slice(-maxRecords);
  }
  
  _.set(variables, historyPath, history);
}

/**
 * 添加身高历史记录
 * 
 * @param name 角色名
 * @param newHeight 新身高
 * @param reason 变化原因
 * @param timestamp 时间点
 * @param options 写入选项
 */
export function addHeightHistory(
  name: string,
  newHeight: number,
  reason: string = '',
  timestamp: string = '',
  options: WriteOptions = {}
): void {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;
  const historyPath = `${getCharacterPath(prefix, name)}._身高历史`;

  const success = safeUpdateVariables(
    (variables) => {
      let history = (_.get(variables, historyPath) as MvuHeightRecord[]) || [];
      
      const lastRecord = history[history.length - 1];
      const lastHeight = lastRecord ? lastRecord.身高 : null;
      
      // 如果身高没变，不记录
      if (lastHeight === newHeight) {
        return variables;
      }
      
      const record: MvuHeightRecord = {
        身高: newHeight,
        身高_格式化: formatLength(newHeight, newHeight > 1e10),
        时间戳: Date.now(),
        时间点: timestamp || new Date().toLocaleString(),
        原因: reason,
        变化: lastHeight ? (newHeight > lastHeight ? '增大' : '缩小') : undefined,
        变化倍率: lastHeight ? Math.round((newHeight / lastHeight) * 100) / 100 : undefined,
      };
      
      history.push(record);
      
      // 限制历史记录数量
      const maxRecords = settingsStore.settings.maxHistoryRecords;
      if (history.length > maxRecords) {
        history = history.slice(-maxRecords);
      }
      
      _.set(variables, historyPath, history);
      return variables;
    },
    messageId
  );
  
  if (success) {
    settingsStore.debugLog(`📜 添加身高历史: ${name} -> ${formatLength(newHeight)}`);
  }
}

/**
 * 批量更新角色数据
 * 
 * @param updates 更新数据数组
 * @param options 写入选项
 */
export function batchUpdateCharacters(
  updates: CharacterUpdateData[],
  options: WriteOptions = {}
): void {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;

  if (updates.length === 0) return;

  const success = safeUpdateVariables(
    (variables) => {
      for (const { name, data } of updates) {
        const basePath = getCharacterPath(prefix, name);
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined) {
            _.set(variables, `${basePath}.${key}`, value);
          }
        }
      }
      return variables;
    },
    messageId
  );
  
  if (success) {
    settingsStore.debugLog(`📝 批量更新 ${updates.length} 个角色数据`);
  }
}

/**
 * 写入互动限制数据
 * 
 * @param interactions 互动限制数据
 * @param options 写入选项
 */
export function writeInteractionLimits(
  interactions: Record<string, PairwiseInteraction>,
  options: WriteOptions = {}
): void {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;
  const path = `stat_data.${prefix}._互动限制`;

  const success = safeUpdateVariables(
    (variables) => {
      _.set(variables, path, interactions);
      return variables;
    },
    messageId
  );
  
  if (success) {
    settingsStore.debugLog(`🤝 写入互动限制数据`);
  }
}

/**
 * 写入场景数据
 * 
 * @param scenario 场景名称
 * @param reason 场景原因
 * @param options 写入选项
 */
export function writeScenarioData(
  scenario: string,
  reason: string = '',
  options: WriteOptions = {}
): void {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;
  const path = `stat_data.${prefix}._场景`;

  const success = safeUpdateVariables(
    (variables) => {
      _.set(variables, path, {
        当前场景: scenario,
        场景原因: reason,
      });
      return variables;
    },
    messageId
  );
  
  if (success) {
    settingsStore.debugLog(`🏙️ 写入场景数据: ${scenario}`);
  }
}

/**
 * 写入角色实际损害数据
 * 
 * @param name 角色名
 * @param actualDamage 实际损害数据
 * @param options 写入选项
 */
export function writeActualDamage(
  name: string,
  actualDamage: unknown,
  options: WriteOptions = {}
): void {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;
  const path = `${getCharacterPath(prefix, name)}._实际损害`;

  const success = safeUpdateVariables(
    (variables) => {
      _.set(variables, path, actualDamage);
      return variables;
    },
    messageId
  );
  
  if (success) {
    settingsStore.debugLog(`📝 写入实际损害数据: ${name}`);
  }
}

/**
 * 清除角色实际损害数据
 * 
 * @param name 角色名
 * @param options 写入选项
 */
export function clearActualDamage(
  name: string,
  options: WriteOptions = {}
): void {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;
  const path = `${getCharacterPath(prefix, name)}._实际损害`;

  const success = safeUpdateVariables(
    (variables) => {
      _.unset(variables, path);
      return variables;
    },
    messageId
  );
  
  if (success) {
    settingsStore.debugLog(`🗑️ 清除实际损害数据: ${name}`);
  }
}

/**
 * 删除角色数据
 * 
 * @param name 角色名
 * @param options 写入选项
 */
export function deleteCharacterData(
  name: string,
  options: WriteOptions = {}
): void {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;
  const path = getCharacterPath(prefix, name);

  const success = safeUpdateVariables(
    (variables) => {
      _.unset(variables, path);
      return variables;
    },
    messageId
  );
  
  if (success) {
    settingsStore.debugLog(`🗑️ 删除角色数据: ${name}`);
  }
}

/**
 * 清空所有巨大娘数据
 * 
 * @param options 写入选项
 */
export function clearAllGiantessData(options: WriteOptions = {}): void {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;
  const path = `stat_data.${prefix}`;

  const success = safeUpdateVariables(
    (variables) => {
      _.unset(variables, path);
      return variables;
    },
    messageId
  );
  
  if (success) {
    settingsStore.debugLog('🗑️ 清空所有巨大娘数据');
  }
}

/**
 * 写入处理状态
 * 用于追踪消息是否已被处理
 * 
 * @param state 处理状态
 * @param options 写入选项
 */
export function writeProcessingState(
  state: ProcessingState,
  options: WriteOptions = {}
): void {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;
  const path = `stat_data.${prefix}._处理状态`;

  const success = safeUpdateVariables(
    (variables) => {
      _.set(variables, path, state);
      return variables;
    },
    messageId
  );
  
  if (success) {
    settingsStore.debugLog(`📋 写入处理状态: messageId=${state.最后处理消息ID}`);
  }
}

/**
 * 更新处理状态（部分更新）
 * 
 * @param updates 要更新的字段
 * @param options 写入选项
 */
export function updateProcessingState(
  updates: Partial<ProcessingState>,
  options: WriteOptions = {}
): void {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;
  const path = `stat_data.${prefix}._处理状态`;

  const success = safeUpdateVariables(
    (variables) => {
      const existing = (_.get(variables, path) as ProcessingState) || {};
      _.set(variables, path, { ...existing, ...updates });
      return variables;
    },
    messageId
  );
  
  if (success) {
    settingsStore.debugLog(`📋 更新处理状态:`, updates);
  }
}

/**
 * 清除处理状态
 * 
 * @param options 写入选项
 */
export function clearProcessingState(options: WriteOptions = {}): void {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;
  const path = `stat_data.${prefix}._处理状态`;

  const success = safeUpdateVariables(
    (variables) => {
      _.unset(variables, path);
      return variables;
    },
    messageId
  );
  
  if (success) {
    settingsStore.debugLog(`🗑️ 清除处理状态`);
  }
}

/**
 * 通用数组追加函数
 * 支持自动去重，避免重复追加相同的元素
 * 
 * @template T 数组元素类型
 * @param path 变量路径（如 'stat_data.巨大娘.角色.络络._身高历史'）
 * @param item 要追加的元素
 * @param dedupeKey 去重键：属性名或生成唯一标识的函数
 * @param options 写入选项
 * @returns 是否成功追加（如果已存在则返回 false）
 * 
 * @example
 * // 使用属性名作为去重键
 * appendToArray('巨大娘.角色.络络._身高历史', { 身高: 100 }, '身高');
 * 
 * // 使用函数生成去重键
 * appendToArray('巨大娘.角色.络络._实际损害.重大事件', event, 
 *   (item) => `${item.描述}_${item.时间点}`);
 */
export function appendToArray<T extends Record<string, unknown>>(
  path: string,
  item: T,
  dedupeKey: keyof T | ((item: T) => string),
  options: WriteOptions = {}
): boolean {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  
  let appended = false;
  
  const success = safeUpdateVariables(
    (variables) => {
      // 获取现有数组，如果不存在则创建空数组
      let array = (_.get(variables, path) as T[]) || [];
      
      // 确保是数组
      if (!Array.isArray(array)) {
        array = [];
      }
      
      // 计算去重键的函数
      const getKey = typeof dedupeKey === 'function'
        ? dedupeKey
        : (i: T) => String(i[dedupeKey]);
      
      // 获取新元素的键
      const itemKey = getKey(item);
      
      // 检查是否已存在相同键的元素
      const exists = array.some((existing) => getKey(existing) === itemKey);
      
      if (exists) {
        // 已存在，不追加
        appended = false;
        return variables;
      }
      
      // 追加新元素
      array.push(item);
      _.set(variables, path, array);
      appended = true;
      
      return variables;
    },
    messageId
  );
  
  if (success && appended) {
    settingsStore.debugLog(`➕ 追加元素到 ${path}`);
  } else if (success && !appended) {
    settingsStore.debugLog(`⏭️ 元素已存在，跳过追加: ${path}`);
  }
  
  return appended;
}

/**
 * 迁移旧格式数据到新格式
 * 将顶层角色数据移动到 `角色` 键下
 * 
 * @param options 写入选项
 * @returns 迁移的角色数量
 */
export function migrateOldDataFormat(options: WriteOptions = {}): number {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;

  settingsStore.debugLog(`🔄 开始数据迁移检查 (prefix: ${prefix}, messageId: ${messageId})`);

  let migratedCount = 0;
  
  const success = safeUpdateVariables(
    (variables) => {
      settingsStore.debugLog('🔄 迁移回调执行中, stat_data 存在:', !!variables?.stat_data);
      
      const data = _.get(variables, `stat_data.${prefix}`) as Record<string, unknown> | undefined;
      
      settingsStore.debugLog(`🔄 提取 stat_data.${prefix}:`, {
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
      });
      
      if (!data) {
        settingsStore.debugLog('🔄 没有数据需要迁移');
        return variables;
      }
      
      // 检查是否有旧格式数据（角色直接在顶层）
      const oldCharacters: Record<string, CharacterMvuData> = {};
      for (const [key, value] of Object.entries(data)) {
        if (
          !key.startsWith('_') &&
          key !== '角色' &&
          typeof value === 'object' &&
          value !== null
        ) {
          const charData = value as CharacterMvuData;
          // 验证是角色数据（有身高相关字段）
          if (charData.当前身高 !== undefined || charData.身高 !== undefined) {
            oldCharacters[key] = charData;
          }
        }
      }
      
      if (Object.keys(oldCharacters).length > 0) {
        // 合并到新格式
        const existingCharacters = (data.角色 as Record<string, CharacterMvuData>) || {};
        const mergedCharacters = { ...existingCharacters, ...oldCharacters };
        
        // 写入新格式
        _.set(variables, `stat_data.${prefix}.角色`, mergedCharacters);
        
        // 删除旧的顶层角色键
        for (const key of Object.keys(oldCharacters)) {
          _.unset(variables, `stat_data.${prefix}.${key}`);
        }
        
        migratedCount = Object.keys(oldCharacters).length;
      }
      
      return variables;
    },
    messageId
  );
  
  if (success && migratedCount > 0) {
    settingsStore.debugLog(`🔄 已迁移 ${migratedCount} 个角色到新格式`);
  }
  
  return migratedCount;
}
