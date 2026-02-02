/**
 * 巨大娘计算器 - MVU 事件处理服务
 * 
 * 职责：
 * - 处理 MVU 变量更新事件
 * - 协调计算、历史记录、提示词注入
 * - 初始化 MVU 集成
 * 
 * @module services/mvu/handler
 */

import type {
  CharacterMvuData,
  PairwiseInteraction,
  DamageCalculation,
} from '../../types';
import { calculateGiantessData, calculateTinyData, calculateDamage } from '../../core';
import { useSettingsStore } from '../../stores/settings';
// 使用兼容层以获取完整的业务逻辑方法
import { useCharactersStore } from '../../characters';
import {
  calculatePairwiseInteractions,
  needsRecalculation,
  type CharacterForInteraction,
} from '../calculator';
import { buildAndInjectPrompt } from '../prompt';
import { addHeightHistory } from './history';
import { extensionManager } from '../extensions';

/**
 * 处理 MVU 变量更新事件
 * 
 * @param variables 当前变量快照
 * @param _variables_before 更新前的变量快照（保留参数以匹配事件签名）
 */
export function handleVariableUpdate(
  variables: Record<string, unknown>,
  _variables_before: Record<string, unknown>
): void {
  const settingsStore = useSettingsStore();
  const charactersStore = useCharactersStore();

  settingsStore.debugLog('📥 收到 MVU 变量更新事件');
  settingsStore.debugLog('变量快照:', {
    stat_data: _.get(variables, 'stat_data'),
    hasPrefix: !!_.get(variables, `stat_data.${settingsStore.settings.variablePrefix}`),
  });

  if (!settingsStore.settings.enabled) {
    settingsStore.debugLog('⏸️ 脚本已禁用，跳过处理');
    return;
  }

  const prefix = settingsStore.settings.variablePrefix;
  const giantessData = _.get(variables, `stat_data.${prefix}`) as
    | Record<string, CharacterMvuData>
    | undefined;

  if (!giantessData) {
    settingsStore.debugLog(`⚠️ 未找到数据路径: stat_data.${prefix}`);
    return;
  }

  settingsStore.debugLog(
    `✅ 找到巨大娘数据，角色数: ${Object.keys(giantessData).filter((k) => !k.startsWith('_')).length}`
  );

  let hasUpdates = false;
  const allCharacters: CharacterForInteraction[] = [];

  // 处理每个角色
  for (const [name, data] of Object.entries(giantessData)) {
    if (name.startsWith('_')) continue;

    const result = processCharacter(
      variables,
      prefix,
      name,
      data as CharacterMvuData,
      settingsStore,
      charactersStore
    );

    if (result.updated) {
      hasUpdates = true;
    }

    if (result.characterInfo) {
      allCharacters.push(result.characterInfo);
    }
  }

  // 计算互动限制
  if (allCharacters.length >= 2 && settingsStore.settings.injectInteractionLimits) {
    const interactions = calculatePairwiseInteractions(allCharacters);
    _.set(variables, `stat_data.${prefix}._互动限制`, interactions);
    settingsStore.debugLog(`🤝 已计算 ${allCharacters.length} 个角色的互动限制`);
  }

  // 注入提示词
  if (hasUpdates && settingsStore.settings.autoInject) {
    const giantessDataWithInteractions = _.get(variables, `stat_data.${prefix}`) as Record<
      string,
      CharacterMvuData & { _互动限制?: Record<string, PairwiseInteraction> }
    >;
    buildAndInjectPrompt(giantessDataWithInteractions);
    settingsStore.debugLog(`💉 已注入提示词`);
  }

  settingsStore.debugLog(`✨ 变量更新处理完成`, {
    更新数: hasUpdates ? '有更新' : '无更新',
    角色总数: allCharacters.length,
  });
}

/**
 * 处理单个角色的数据更新
 */
function processCharacter(
  variables: Record<string, unknown>,
  prefix: string,
  name: string,
  data: CharacterMvuData,
  settingsStore: ReturnType<typeof useSettingsStore>,
  charactersStore: ReturnType<typeof useCharactersStore>
): {
  updated: boolean;
  characterInfo: CharacterForInteraction | null;
} {
  const currentHeight = data.当前身高 || data.身高;
  const originalHeight = data.原身高 || data.原始身高 || 1.65;
  const oldCalcData = data._计算数据;
  const changeReason = data.变化原因 || '';
  const changeTime = data.变化时间 || '';
  const customParts = data.自定义部位 || {};

  // 检查是否需要重新计算
  if (!currentHeight || !needsRecalculation(data, oldCalcData)) {
    // 不需要更新，但仍然返回角色信息用于互动计算
    if (currentHeight) {
      return {
        updated: false,
        characterInfo: { name, height: currentHeight },
      };
    }
    return { updated: false, characterInfo: null };
  }

  settingsStore.debugLog(`🔄 检测到 ${name} 数据变化:`, {
    新身高: currentHeight,
    原身高: originalHeight,
    旧计算数据: oldCalcData ? '有' : '无',
    变化原因: changeReason || '未指定',
    变化时间: changeTime || '未指定',
    自定义部位: Object.keys(customParts).length > 0 ? customParts : '无',
  });

  // 记录历史
  addHeightHistory(variables, prefix, name, currentHeight, changeReason, changeTime);
  settingsStore.debugLog(`📝 已记录身高历史`);

  // 计算数据
  const scale = currentHeight / originalHeight;
  const calcResult =
    scale >= 1
      ? calculateGiantessData(currentHeight, originalHeight, customParts)
      : calculateTinyData(currentHeight, originalHeight);

  _.set(variables, `stat_data.${prefix}.${name}._计算数据`, calcResult);

  settingsStore.debugLog(`📊 已计算 ${name} 的数据:`, {
    级别: calcResult.级别,
    倍率: calcResult.倍率,
    当前身高_格式化: calcResult.当前身高_格式化,
  });

  // 构建角色数据对象
  const characterData = {
    name,
    currentHeight,
    originalHeight,
    changeReason,
    changeTime,
    calcData: calcResult,
    history: [],
  };

  // 触发扩展钩子，收集额外数据（如损害计算）
  const extensionData = extensionManager.triggerCharacterUpdate(characterData, calcResult);
  
  // 将扩展返回的数据写入 MVU 变量
  if (Object.keys(extensionData).length > 0) {
    for (const [key, value] of Object.entries(extensionData)) {
      _.set(variables, `stat_data.${prefix}.${name}.${key}`, value);
      settingsStore.debugLog(`🔌 扩展数据已写入: ${key}`);
    }
  }

  // 获取损害数据（可能由扩展计算）
  const damageData = _.get(variables, `stat_data.${prefix}.${name}._损害数据`) as DamageCalculation | undefined;
  
  // 更新角色 store
  charactersStore.setCharacter(name, {
    ...characterData,
    damageData,
  });
  settingsStore.debugLog(`👤 已更新角色 Store`);

  return {
    updated: true,
    characterInfo: { name, height: currentHeight },
  };
}

/**
 * 从 MVU 变量刷新角色数据到 Store
 * 
 * @param prefix 变量前缀
 * @returns 刷新的角色数量
 */
export function refreshCharactersFromMvu(prefix: string): number {
  const settingsStore = useSettingsStore();
  const charactersStore = useCharactersStore();
  
  try {
    const variables = getVariables({ type: 'message', message_id: 'latest' });
    const giantessData = _.get(variables, `stat_data.${prefix}`) as
      | Record<string, CharacterMvuData>
      | undefined;

    if (!giantessData) {
      settingsStore.debugLog('未找到巨大娘数据（楼层变量）');
      return 0;
    }

    let count = 0;
    for (const [name, data] of Object.entries(giantessData)) {
      if (name.startsWith('_')) continue;
      if (typeof data !== 'object' || data === null) continue;

      const charData = data as CharacterMvuData;
      const currentHeight = charData.当前身高 || charData.身高;
      const originalHeight = charData.原身高 || charData.原始身高 || 1.65;

      if (currentHeight && currentHeight > 0) {
        const scale = currentHeight / originalHeight;
        const calcData = scale >= 1
          ? calculateGiantessData(currentHeight, originalHeight, charData.自定义部位)
          : calculateTinyData(currentHeight, originalHeight);
        
        let damageData: DamageCalculation | undefined;
        if (settingsStore.settings.enableDamageCalculation && scale >= 1) {
          damageData = calculateDamage(
            currentHeight,
            originalHeight,
            settingsStore.settings.damageScenario as Parameters<typeof calculateDamage>[2]
          );
        }

        charactersStore.setCharacter(name, {
          name,
          currentHeight,
          originalHeight,
          changeReason: charData.变化原因,
          changeTime: charData.变化时间,
          calcData,
          damageData,
          actualDamage: charData._实际损害,
          history: [],
        });
        count++;
      }
    }

    settingsStore.debugLog(`已刷新 ${count} 个角色数据`);
    return count;
  } catch (e) {
    settingsStore.debugError('刷新角色数据失败:', e);
    return 0;
  }
}

/**
 * 初始化 MVU 集成
 */
export function initMvuIntegration(): void {
  const settingsStore = useSettingsStore();

  settingsStore.debugLog('🚀 开始初始化 MVU 集成...');

  if (typeof Mvu !== 'undefined') {
    settingsStore.debugLog('✅ MVU 全局对象已找到:', {
      version: (Mvu as { version?: string }).version || '未知',
      events: Object.keys(Mvu.events || {}),
    });

    try {
      eventOn(
        Mvu.events.VARIABLE_UPDATE_ENDED,
        handleVariableUpdate as (...args: unknown[]) => void
      );
      settingsStore.debugLog('✅ 已监听 MVU 变量更新事件 (VARIABLE_UPDATE_ENDED)');
    } catch (e) {
      settingsStore.debugError('❌ 监听 MVU 事件失败:', e);
    }
  } else {
    settingsStore.debugWarn('⚠️ MVU 全局对象未找到');
  }
}
