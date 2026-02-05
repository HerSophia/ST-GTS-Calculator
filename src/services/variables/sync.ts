/**
 * 巨大娘计算器 - 状态同步服务
 * 
 * 职责：
 * - 从变量同步数据到 Store
 * - 从 Store 同步数据回变量
 * - 处理角色数据的计算和更新
 * 
 * @module services/variables/sync
 */

import type {
  SyncResult,
  CharacterMvuData,
  MvuHeightRecord,
  ReadOptions,
  WriteOptions,
} from '../../types/variables';
import type { CharacterData } from '../../types/character';
import {
  _internal_readGiantessData,
  _internal_extractCharacters,
  _internal_extractScenario,
  _internal_extractInteractions,
  readGiantessData,
  extractCharacters,
} from './reader';
import {
  writeCharacterCalcData,
  writeCharacterDamageData,
  addHeightHistory,
  writeInteractionLimits,
  batchUpdateCharacters,
} from './writer';
import { useSettingsStore } from '../../stores/settings';
import { useCharactersStoreBase } from '../../stores/characters';
import { calculateGiantessData, calculateTinyData, calculateDamage } from '../../core';
import {
  calculatePairwiseInteractions,
  needsRecalculation,
  type CharacterForInteraction,
} from '../calculator';
import { buildAndInjectPrompt, type PromptDataInput } from '../prompt';
import { extensionManager } from '../extensions';

/**
 * 从变量同步数据到 Store
 * 这是核心同步函数，在各种事件触发时调用
 * 
 * 关键行为：
 * - 检测消息 ID 是否变化
 * - 如果变化，自动清空旧数据以确保隔离
 * - 然后填充新消息的数据
 * 
 * @param options 读取选项
 * @returns 同步结果
 */
export function syncVariablesToStore(options: ReadOptions = {}): SyncResult {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const charactersStore = useCharactersStoreBase();
  
  settingsStore.debugLog('🔄 开始同步变量到 Store...', { messageId });
  
  // 关键：检查消息 ID 是否变化，实现数据隔离
  const messageChanged = charactersStore.setCurrentMessageId(messageId);
  if (messageChanged) {
    settingsStore.debugLog('📦 消息 ID 变化，已清空旧数据', {
      newMessageId: messageId,
    });
  }
  
  // 使用内部函数直接从变量读取
  const data = _internal_readGiantessData(options);
  if (!data) {
    // 注意：这里不再调用 clearAll，因为 setCurrentMessageId 已经处理了
    return { success: false, characterCount: 0, error: '未找到巨大娘数据' };
  }
  
  // 同步场景数据
  const scenarioData = _internal_extractScenario(data);
  if (scenarioData) {
    charactersStore.setScenario(scenarioData);
    settingsStore.debugLog('📍 已同步场景数据:', scenarioData);
  } else {
    charactersStore.clearScenario();
  }
  
  // 同步互动限制
  const interactionsData = _internal_extractInteractions(data);
  if (interactionsData) {
    charactersStore.setInteractions(interactionsData);
    settingsStore.debugLog('🤝 已同步互动限制:', Object.keys(interactionsData).length, '对');
  } else {
    charactersStore.clearInteractions();
  }
  
  // 同步角色数据
  const characters = _internal_extractCharacters(data);
  const characterCount = Object.keys(characters).length;
  
  if (characterCount === 0) {
    charactersStore.clear();
    return { success: true, characterCount: 0 };
  }
  
  let syncedCount = 0;
  
  for (const [name, charData] of Object.entries(characters)) {
    const currentHeight = charData.当前身高 || charData.身高;
    const originalHeight = charData.原身高 || charData.原始身高 || 1.65;
    
    if (currentHeight && currentHeight > 0) {
      // 计算数据
      const scale = currentHeight / originalHeight;
      const calcData = scale >= 1
        ? calculateGiantessData(currentHeight, originalHeight, charData.自定义部位)
        : calculateTinyData(currentHeight, originalHeight);
      
      // 计算损害（如果启用且是巨大娘）
      let damageData = charData._损害数据;
      if (settingsStore.settings.enableDamageCalculation && scale >= 1) {
        // 使用已同步的场景或默认场景
        const scenario = scenarioData?.当前场景 || settingsStore.settings.damageScenario;
        
        // 构建损害计算选项，支持自定义人群密度
        damageData = calculateDamage(
          currentHeight,
          originalHeight,
          {
            scenario: scenario as keyof typeof import('../../core/damage').POPULATION_DENSITY,
            customPopulationDensity: scenarioData?.人群密度,
          }
        );
      }
      
      // 转换历史记录格式
      const history = charData._身高历史 || [];
      
      // 更新 Store
      charactersStore.setCharacter(name, {
        name,
        currentHeight,
        originalHeight,
        changeReason: charData.变化原因,
        changeTime: charData.变化时间,
        customParts: charData.自定义部位,
        calcData,
        damageData,
        actualDamage: charData._实际损害,
        itemsCalc: charData._物品计算,
        history: history.map((h: MvuHeightRecord) => ({
          height: h.身高,
          heightFormatted: h.身高_格式化,
          time: h.时间点,
          reason: h.原因,
        })),
      });
      syncedCount++;
    }
  }
  
  settingsStore.debugLog(`✅ 同步完成: ${syncedCount} 个角色`);
  return { success: true, characterCount: syncedCount };
}

/**
 * 从 Store 同步数据回变量（反向同步）
 * 用于用户通过 UI 修改数据时
 * 
 * @param options 写入选项
 */
export function syncStoreToVariables(options: WriteOptions = {}): void {
  const charactersStore = useCharactersStoreBase();
  const settingsStore = useSettingsStore();
  
  const allCharacters = charactersStore.getAllCharacters();
  
  if (allCharacters.length === 0) {
    settingsStore.debugLog('⚠️ Store 中没有角色数据，跳过反向同步');
    return;
  }
  
  const updates = allCharacters.map((char: CharacterData) => ({
    name: char.name,
    data: {
      当前身高: char.currentHeight,
      原身高: char.originalHeight,
      变化原因: char.changeReason,
      变化时间: char.changeTime,
      自定义部位: char.customParts,
      _计算数据: char.calcData,
      _损害数据: char.damageData,
    } as Partial<CharacterMvuData>,
  }));
  
  batchUpdateCharacters(updates, options);
  settingsStore.debugLog(`🔄 反向同步完成: ${updates.length} 个角色`);
}

/**
 * 处理角色数据更新
 * 包括计算、记录历史、写入变量
 * 
 * @param options 写入选项
 * @returns 是否有更新
 */
export function processCharacterUpdates(options: WriteOptions = {}): boolean {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  const charactersStore = useCharactersStoreBase();
  
  // 使用内部函数直接从变量读取
  const data = _internal_readGiantessData({ messageId });
  if (!data) return false;
  
  const characters = _internal_extractCharacters(data);
  let hasUpdates = false;
  const allCharacterInfo: CharacterForInteraction[] = [];
  
  for (const [name, charData] of Object.entries(characters)) {
    const currentHeight = charData.当前身高 || charData.身高;
    const originalHeight = charData.原身高 || charData.原始身高 || 1.65;
    
    if (!currentHeight) continue;
    
    // 检查是否需要重新计算
    if (!needsRecalculation(charData, charData._计算数据)) {
      // 不需要更新，但仍然收集角色信息用于互动计算
      allCharacterInfo.push({ name, height: currentHeight });
      continue;
    }
    
    hasUpdates = true;
    
    settingsStore.debugLog(`🔄 处理角色更新: ${name}`, {
      currentHeight,
      originalHeight,
      changeReason: charData.变化原因,
    });
    
    // 计算数据
    const scale = currentHeight / originalHeight;
    const calcData = scale >= 1
      ? calculateGiantessData(currentHeight, originalHeight, charData.自定义部位)
      : calculateTinyData(currentHeight, originalHeight);
    
    // 写入计算数据
    writeCharacterCalcData(name, calcData, { messageId });
    
    // 记录历史
    addHeightHistory(
      name,
      currentHeight,
      charData.变化原因 || '',
      charData.变化时间 || '',
      { messageId }
    );
    
    // 计算损害（如果启用且是巨大娘）
    let damageData = undefined;
    if (settingsStore.settings.enableDamageCalculation && scale >= 1) {
      // 从 Store 获取场景数据（已在 syncVariablesToStore 中同步）
      const scenarioData = charactersStore.scenario;
      const scenario = scenarioData?.当前场景 || settingsStore.settings.damageScenario;
      
      // 构建损害计算选项，支持自定义人群密度
      damageData = calculateDamage(
        currentHeight,
        originalHeight,
        {
          scenario: scenario as keyof typeof import('../../core/damage').POPULATION_DENSITY,
          customPopulationDensity: scenarioData?.人群密度,
        }
      );
      
      writeCharacterDamageData(name, damageData, { messageId });
    }
    
    // 构建角色数据对象用于扩展
    const characterDataForExtension = {
      name,
      currentHeight,
      originalHeight,
      changeReason: charData.变化原因,
      changeTime: charData.变化时间,
      calcData,
      history: [],
    };
    
    // 触发扩展钩子
    const extensionData = extensionManager.triggerCharacterUpdate(
      characterDataForExtension,
      calcData
    );
    
    // 写入扩展数据
    if (Object.keys(extensionData).length > 0) {
      const updates = [{
        name,
        data: extensionData as Partial<CharacterMvuData>,
      }];
      batchUpdateCharacters(updates, { messageId });
    }
    
    // 更新 Store
    charactersStore.setCharacter(name, {
      ...characterDataForExtension,
      damageData,
      actualDamage: charData._实际损害,
    });
    
    // 收集角色信息
    allCharacterInfo.push({ name, height: currentHeight });
  }
  
  // 计算互动限制
  if (allCharacterInfo.length >= 2 && settingsStore.settings.injectInteractionLimits) {
    const interactionsMap = calculatePairwiseInteractions(allCharacterInfo);
    
    // 写入变量
    writeInteractionLimits(interactionsMap, { messageId });
    
    // 同步到 Store
    charactersStore.setInteractions(interactionsMap);
    
    settingsStore.debugLog(`🤝 已计算 ${allCharacterInfo.length} 个角色的互动限制`);
  }
  
  return hasUpdates;
}

/**
 * 重新注入提示词（如果需要）
 * 
 * @param options 读取选项（已忽略，现在从 Store 读取）
 */
export function reinjectPromptsIfNeeded(_options: ReadOptions = {}): void {
  const settingsStore = useSettingsStore();
  const charactersStore = useCharactersStoreBase();
  
  if (!settingsStore.settings.enabled || !settingsStore.settings.autoInject) {
    return;
  }
  
  // 从 Store 读取数据（使用公开 API）
  const data = readGiantessData();
  if (!data) {
    // 无数据时注入基础模板
    buildAndInjectPrompt(undefined);
    return;
  }
  
  const characters = extractCharacters(data);
  
  const promptData: PromptDataInput = {
    characters,
    interactions: charactersStore.getAllInteractions(),
  };
  
  const success = buildAndInjectPrompt(promptData);
  
  if (success) {
    settingsStore.debugLog('💉 提示词注入成功');
  } else {
    settingsStore.debugLog('⚠️ 提示词注入失败（可能没有启用的模板）');
  }
}

/**
 * 完整的数据处理流程
 * 包括：计算、同步、注入提示词
 * 
 * @param options 选项
 * @returns 同步结果
 */
export function fullDataProcess(options: ReadOptions & WriteOptions = {}): SyncResult {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  
  settingsStore.debugLog('🚀 开始完整数据处理流程...');
  
  // 1. 处理角色更新（计算、历史、扩展）
  const hasUpdates = processCharacterUpdates({ messageId });
  
  // 2. 同步到 Store
  const syncResult = syncVariablesToStore({ messageId });
  
  // 3. 注入提示词（现在从 Store 读取）
  if (hasUpdates || syncResult.characterCount > 0) {
    reinjectPromptsIfNeeded();
  }
  
  settingsStore.debugLog('✨ 完整数据处理流程完成', {
    hasUpdates,
    characterCount: syncResult.characterCount,
  });
  
  return syncResult;
}

/**
 * 从变量刷新角色数据到 Store
 * 兼容旧版 API，实际调用 syncVariablesToStore
 * 
 * @param _prefix 变量前缀（已忽略，从设置获取）
 * @returns 刷新的角色数量
 */
export function refreshCharactersFromMvu(_prefix?: string): number {
  const result = syncVariablesToStore({ messageId: 'latest' });
  return result.characterCount;
}
