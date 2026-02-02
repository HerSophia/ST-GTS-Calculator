/**
 * 巨大娘计算器 - 测试数据注入服务
 * 
 * 职责：
 * - 注入测试数据到 MVU 变量
 * - 清除测试数据
 * 
 * @module services/debug/test-injector
 */

import type { ScenarioMvuData } from '../../types';
import { calculateGiantessData, calculateTinyData, calculateDamage } from '../../core';
import { useSettingsStore } from '../../stores/settings';
// 使用兼容层以获取完整的业务逻辑方法
import { useCharactersStore } from '../../characters';
import { addHeightHistory } from '../mvu/history';

/**
 * 测试注入结果
 */
export interface TestInjectionResult {
  success: boolean;
  data?: unknown;
  isTiny?: boolean;
  error?: string;
}

/**
 * 注入测试数据（用于调试）
 * 
 * @param name 角色名
 * @param height 当前身高（米）
 * @param originalHeight 原始身高（米），默认 1.65
 * @returns 注入结果
 */
export function injectTestData(
  name: string,
  height: number,
  originalHeight = 1.65
): TestInjectionResult {
  const settingsStore = useSettingsStore();
  const charactersStore = useCharactersStore();
  const prefix = settingsStore.settings.variablePrefix;
  const scale = height / originalHeight;
  const isTiny = scale < 1;

  settingsStore.debugLog(`🧪 注入测试数据: ${name}`, {
    height,
    originalHeight,
    scale: scale.toFixed(4),
    type: isTiny ? '小人' : '巨大娘',
  });

  try {
    // 从楼层变量读取和写入数据
    const variables = getVariables({ type: 'message', message_id: 'latest' });

    // 设置基础测试数据
    _.set(variables, `stat_data.${prefix}.${name}.当前身高`, height);
    _.set(variables, `stat_data.${prefix}.${name}.原身高`, originalHeight);
    _.set(
      variables,
      `stat_data.${prefix}.${name}.变化原因`,
      `调试测试(${isTiny ? '小人' : '巨大娘'})`
    );
    _.set(variables, `stat_data.${prefix}.${name}.变化时间`, new Date().toLocaleString());

    // 手动计算并写入 _计算数据（因为 insertOrAssignVariables 不会触发 MVU 事件）
    const calcResult = isTiny
      ? calculateTinyData(height, originalHeight)
      : calculateGiantessData(height, originalHeight);
    _.set(variables, `stat_data.${prefix}.${name}._计算数据`, calcResult);
    settingsStore.debugLog(`📊 已计算 ${name} 的数据:`, {
      级别: calcResult.级别,
      倍率: calcResult.倍率,
      当前身高_格式化: calcResult.当前身高_格式化,
    });

    // 如果启用了损害计算且是巨大娘，计算损害数据
    if (settingsStore.settings.enableDamageCalculation && !isTiny) {
      const scenarioData = _.get(variables, `stat_data.${prefix}._场景`) as
        | ScenarioMvuData
        | undefined;
      const damageScenario = scenarioData?.当前场景 || settingsStore.settings.damageScenario;
      const damageResult = calculateDamage(
        height,
        originalHeight,
        damageScenario as Parameters<typeof calculateDamage>[2]
      );
      _.set(variables, `stat_data.${prefix}.${name}._损害数据`, damageResult);
      settingsStore.debugLog(`💥 已计算 ${name} 的损害数据:`, {
        破坏力等级: damageResult.破坏力等级,
        单步伤亡: damageResult.单步损害.小人伤亡.格式化,
        场景: damageScenario,
      });
    }

    // 记录身高历史
    addHeightHistory(
      variables,
      prefix,
      name,
      height,
      `调试测试(${isTiny ? '小人' : '巨大娘'})`,
      new Date().toLocaleString()
    );
    settingsStore.debugLog(`📝 已记录身高历史`);

    // 保存变量到楼层变量
    insertOrAssignVariables(variables, { type: 'message', message_id: 'latest' });

    // 更新角色 store
    charactersStore.setCharacter(name, {
      name,
      currentHeight: height,
      originalHeight,
      changeReason: `调试测试(${isTiny ? '小人' : '巨大娘'})`,
      changeTime: new Date().toLocaleString(),
      calcData: calcResult,
      damageData: _.get(variables, `stat_data.${prefix}.${name}._损害数据`),
      history: [],
    });
    settingsStore.debugLog(`👤 已更新角色 Store`);

    settingsStore.debugLog('✅ 测试数据已注入并计算完成');

    return {
      success: true,
      data: _.get(variables, `stat_data.${prefix}.${name}`),
      isTiny,
    };
  } catch (e) {
    settingsStore.debugError('❌ 注入测试数据失败:', e);
    return { success: false, error: String(e) };
  }
}

/**
 * 清除测试数据（用于调试）
 * 
 * @param name 角色名，不传则清除所有
 * @returns 清除结果
 */
export function clearTestData(name?: string): { success: boolean; error?: string } {
  const settingsStore = useSettingsStore();
  const charactersStore = useCharactersStore();
  const prefix = settingsStore.settings.variablePrefix;

  settingsStore.debugLog(`🗑️ 清除测试数据${name ? `: ${name}` : ' (全部)'}`);

  try {
    const messageOption = { type: 'message' as const, message_id: 'latest' as const };

    if (name) {
      // 清除指定角色 - 使用 deleteVariable 删除指定路径
      const result = deleteVariable(`stat_data.${prefix}.${name}`, messageOption);
      if (result.delete_occurred) {
        settingsStore.debugLog(`✅ 已清除角色: ${name}`);
      } else {
        settingsStore.debugLog(`⚠️ 角色不存在: ${name}`);
      }
      // 从 store 中移除
      charactersStore.removeCharacter(name);
    } else {
      // 清除所有巨大娘数据 - 使用 deleteVariable 删除整个前缀下的数据
      const result = deleteVariable(`stat_data.${prefix}`, messageOption);
      if (result.delete_occurred) {
        settingsStore.debugLog('✅ 已清除所有巨大娘数据');
      } else {
        settingsStore.debugLog('⚠️ 无数据需要清除');
      }
      // 清空角色 store
      charactersStore.clear();
    }

    return { success: true };
  } catch (e) {
    settingsStore.debugError('❌ 清除测试数据失败:', e);
    return { success: false, error: String(e) };
  }
}
