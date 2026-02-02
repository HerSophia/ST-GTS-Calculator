/**
 * 巨大娘计算器 - 调试信息收集服务
 * 
 * 职责：
 * - 收集 MVU 状态信息
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
} from '../../types';
import { useSettingsStore } from '../../stores/settings';
import { useWorldviewsStore } from '../../stores/worldviews';

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
 * 获取当前 MVU 变量状态（用于调试）
 */
export function getMvuDebugInfo(): MvuDebugInfo {
  const settingsStore = useSettingsStore();
  const worldviewsStore = useWorldviewsStore();
  const prefix = settingsStore.settings.variablePrefix;

  try {
    // 从楼层变量读取数据
    const messageVars = getVariables({ type: 'message', message_id: 'latest' });
    const scriptVars = getVariables({ type: 'script', script_id: getScriptId() });

    const giantessData = _.get(messageVars, `stat_data.${prefix}`) as
      | Record<string, CharacterMvuData>
      | undefined;
    const scenarioData = _.get(messageVars, `stat_data.${prefix}._场景`) as
      | ScenarioMvuData
      | undefined;
    const interactionData = _.get(messageVars, `stat_data.${prefix}._互动限制`);

    // 收集角色详细信息
    const characterDetails: DebugCharacterInfo[] = [];
    if (giantessData) {
      for (const [name, data] of Object.entries(giantessData)) {
        if (name.startsWith('_')) continue;
        characterDetails.push(
          collectCharacterDebugInfo(
            name,
            data as CharacterMvuData,
            settingsStore.settings.damageScenario,
            scenarioData
          )
        );
      }
    }

    // 确定当前场景来源
    const currentScenario = scenarioData?.当前场景 || settingsStore.settings.damageScenario;
    const scenarioSource = scenarioData?.当前场景 ? 'MVU变量' : '默认设置';

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
      },
      worldview: {
        id: worldviewsStore.currentWorldviewId,
        name: worldviewsStore.currentWorldview.name,
      },
      messageVariables: {
        hasStatData: !!_.get(messageVars, 'stat_data'),
        hasGiantessData: !!giantessData,
        hasScenarioData: !!scenarioData,
        hasInteractionData: !!interactionData,
        giantessCharacters: characterDetails.map((c) => c.name),
        characterDetails,
        rawData: giantessData,
      },
      scriptVariables: scriptVars,
      timestamp: new Date().toISOString(),
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
    };
  }
}
