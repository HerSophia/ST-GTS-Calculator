/**
 * 巨大娘计算器 - 调试信息收集服务
 * 
 * 职责：
 * - 收集变量状态信息
 * - 收集角色详细信息
 * - 生成调试报告
 * 
 * @module services/debug/info-collector
 */

import type {
  CharacterMvuData,
  ScenarioMvuData,
  DebugCharacterInfo,
  MvuDebugInfo,
  GiantessVariableData,
} from '../../types';
import { useSettingsStore } from '../../stores/settings';
import { useWorldviewsStore } from '../../stores/worldviews';
import { useCharactersStoreBase } from '../../stores/characters';
import {
  readGiantessData,
  extractCharacters,
  readScenarioData,
  _internal_readGiantessData,
} from '../variables';

/**
 * 格式化大数字为可读字符串
 */
function formatNum(n: number): string {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}千`;
  return Math.round(n).toString();
}

/**
 * 收集单个角色的调试信息
 */
function collectCharacterDebugInfo(
  name: string,
  data: CharacterMvuData,
  defaultDamageScenario: string,
  scenarioData?: ScenarioMvuData
): DebugCharacterInfo {
  const calcData = data._计算数据;
  const damageData = data._损害数据;
  const actualDamage = data._实际损害;
  const history = data._身高历史;
  const currentHeight = data.当前身高 || data.身高;
  const originalHeight = data.原身高 || data.原始身高 || 1.65;
  const scale = currentHeight ? currentHeight / originalHeight : undefined;

  return {
    name,
    当前身高: currentHeight,
    当前身高_格式化: calcData?.当前身高_格式化,
    原身高: originalHeight,
    倍率: calcData?.倍率,
    级别: calcData?.级别,
    类型: scale === undefined ? '未知' : scale >= 1 ? '巨大娘' : '小人',
    有计算数据: !!calcData,
    有损害数据: !!damageData,
    有实际损害: !!actualDamage,
    有身高历史: !!history && history.length > 0,
    历史记录数: history?.length,
    自定义部位: data.自定义部位,
    // 预估损害（系统自动计算）
    预估损害: damageData
      ? {
          破坏力等级: damageData.破坏力等级,
          单步伤亡: damageData.单步损害.小人伤亡.格式化,
          场景: scenarioData?.当前场景 || defaultDamageScenario,
        }
      : undefined,
    // 实际损害（LLM 或用户记录）
    实际损害: actualDamage
      ? {
          总伤亡人数: actualDamage.总伤亡人数,
          总伤亡人数_格式化: actualDamage.总伤亡人数
            ? formatNum(actualDamage.总伤亡人数) + '人'
            : undefined,
          总建筑损毁: actualDamage.总建筑损毁,
          最近行动: actualDamage.最近行动?.描述,
          重大事件数: actualDamage.重大事件?.length,
        }
      : undefined,
  };
}

/**
 * 获取当前变量状态（用于调试）
 * 
 * 注意：此函数现在从 Store 读取数据，不再直接访问酒馆变量
 * 如需查看原始变量数据，请使用 getRawVariableDebugInfo()
 */
export function getMvuDebugInfo(): MvuDebugInfo {
  const settingsStore = useSettingsStore();
  const worldviewsStore = useWorldviewsStore();
  const charactersStore = useCharactersStoreBase();
  const prefix = settingsStore.settings.variablePrefix;

  try {
    // 从 Store 读取数据（使用公开 API）
    const giantessData = readGiantessData() as GiantessVariableData | null;
    const scenarioData = readScenarioData();
    const scriptVars = getVariables({ type: 'script', script_id: getScriptId() });

    // 从 Store 获取互动限制数据
    const interactionData = charactersStore.getAllInteractions();
    const hasInteractionData = Object.keys(interactionData).length > 0;

    // 收集角色详细信息
    const characterDetails: DebugCharacterInfo[] = [];
    if (giantessData) {
      const characters = extractCharacters(giantessData);
      for (const [name, data] of Object.entries(characters)) {
        characterDetails.push(
          collectCharacterDebugInfo(
            name,
            data,
            settingsStore.settings.damageScenario,
            scenarioData as ScenarioMvuData | undefined
          )
        );
      }
    }

    // 确定当前场景来源
    const currentScenario = scenarioData?.当前场景 || settingsStore.settings.damageScenario;
    const scenarioSource = scenarioData?.当前场景 ? 'Store（从变量同步）' : '默认设置';

    return {
      mvuAvailable: typeof Mvu !== 'undefined',
      mvuVersion:
        typeof Mvu !== 'undefined' ? (Mvu as { version?: string }).version ?? null : null,
      prefix,
      settings: {
        enabled: settingsStore.settings.enabled,
        autoInject: settingsStore.settings.autoInject,
        enableDamageCalculation: settingsStore.settings.enableDamageCalculation,
        damageScenario: settingsStore.settings.damageScenario,
        injectWorldviewPrompt: settingsStore.settings.injectWorldviewPrompt,
      },
      scenario: {
        current: currentScenario,
        source: scenarioSource,
        reason: scenarioData?.场景原因,
        // 扩展场景信息
        具体地点: scenarioData?.具体地点,
        场景时间: scenarioData?.场景时间,
        人群状态: scenarioData?.人群状态,
        人群密度: scenarioData?.人群密度,
        isCustomDensity: !!(scenarioData?.人群密度 && scenarioData.人群密度 > 0),
      },
      worldview: {
        id: worldviewsStore.currentWorldviewId,
        name: worldviewsStore.currentWorldview.name,
      },
      messageVariables: {
        hasStatData: !!giantessData,
        hasGiantessData: !!giantessData,
        hasScenarioData: !!scenarioData,
        hasInteractionData,
        giantessCharacters: characterDetails.map((c) => c.name),
        characterDetails,
        rawData: giantessData as Record<string, CharacterMvuData> | null,
      },
      scriptVariables: scriptVars,
      timestamp: new Date().toISOString(),
      // 新增：数据来源标记
      dataSource: 'Store',
    };
  } catch (e) {
    return {
      error: String(e),
      mvuAvailable: typeof Mvu !== 'undefined',
      mvuVersion: null,
      prefix,
      settings: {
        enabled: settingsStore.settings.enabled,
        autoInject: settingsStore.settings.autoInject,
        enableDamageCalculation: settingsStore.settings.enableDamageCalculation,
        damageScenario: settingsStore.settings.damageScenario,
        injectWorldviewPrompt: settingsStore.settings.injectWorldviewPrompt,
      },
      scenario: {
        current: settingsStore.settings.damageScenario,
        source: '默认设置',
      },
      worldview: {
        id: worldviewsStore.currentWorldviewId,
        name: worldviewsStore.currentWorldview.name,
      },
      messageVariables: {
        hasStatData: false,
        hasGiantessData: false,
        hasScenarioData: false,
        hasInteractionData: false,
        giantessCharacters: [],
        characterDetails: [],
        rawData: null,
      },
      scriptVariables: null,
      timestamp: new Date().toISOString(),
      dataSource: 'Store',
    };
  }
}

/**
 * 获取原始变量数据（用于调试对比）
 * 直接从酒馆变量读取，不经过 Store
 */
export function getRawVariableDebugInfo(): {
  rawGiantessData: GiantessVariableData | null;
  storeCharacterCount: number;
  variableCharacterCount: number;
  isInSync: boolean;
} {
  const charactersStore = useCharactersStoreBase();
  
  // 直接从变量读取
  const rawData = _internal_readGiantessData({ messageId: 'latest' });
  
  // 计算角色数量
  const storeCharacterCount = charactersStore.getCharacterNames().length;
  const variableCharacterCount = rawData?.角色 ? Object.keys(rawData.角色).length : 0;
  
  return {
    rawGiantessData: rawData,
    storeCharacterCount,
    variableCharacterCount,
    isInSync: storeCharacterCount === variableCharacterCount,
  };
}
