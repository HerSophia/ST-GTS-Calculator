/**
 * 巨大娘计算器 - 提示词注入服务
 * 
 * 职责：
 * - 管理提示词注入状态
 * - 注入/取消注入提示词
 * - 根据模板生成并注入最终提示词
 * 
 * @module services/prompt/injector
 */

import type {
  PromptTemplate,
  PromptContext,
  CharacterMvuData,
  DamageCalculation,
  PairwiseInteraction,
} from '../../types';
import { useSettingsStore } from '../../stores/settings';
import { usePromptsStore } from '../../stores/prompts';
import { useWorldviewsStore } from '../../stores/worldviews';
import {
  interpolate,
  formatInteractionLimits,
  buildCharacterContext,
  generateAllDamagePrompt,
} from './builder';

/** 当前注入的提示词 ID */
let injectedPromptId: string | null = null;

/**
 * 获取当前注入的提示词 ID
 */
export function getInjectedPromptId(): string | null {
  return injectedPromptId;
}

/**
 * 取消之前的提示词注入
 */
export function uninjectPrompt(): void {
  if (injectedPromptId) {
    uninjectPrompts([injectedPromptId]);
    injectedPromptId = null;
  }
}

/**
 * 注入提示词到聊天
 * 
 * @param content 提示词内容
 * @param depth 注入深度
 * @returns 注入的提示词 ID
 */
export function injectPromptContent(
  content: string,
  depth: number = 1
): string {
  // 取消之前的注入
  uninjectPrompt();
  
  // 生成新的 ID
  injectedPromptId = `giantess-data-${Date.now()}`;
  
  // 注入提示词
  injectPrompts([
    {
      id: injectedPromptId,
      role: 'system',
      position: 'in_chat',
      depth: depth,
      content: content,
      should_scan: false,
    },
  ]);
  
  return injectedPromptId;
}

/**
 * 角色数据（用于注入）
 */
export interface CharacterDataForInjection {
  name: string;
  data: CharacterMvuData;
  calcData: CharacterMvuData['_计算数据'];
  damageData?: DamageCalculation;
  originalHeight: number;
}

/**
 * 从 MVU 变量构建并注入提示词
 * 
 * @param giantessData MVU 变量中的巨大娘数据
 * @returns 是否成功注入
 */
export function buildAndInjectPrompt(
  giantessData: Record<string, CharacterMvuData & { _互动限制?: Record<string, PairwiseInteraction> }>
): boolean {
  const settingsStore = useSettingsStore();
  const promptsStore = usePromptsStore();
  const worldviewsStore = useWorldviewsStore();
  
  const enabledTemplates = promptsStore.enabledTemplates;
  if (enabledTemplates.length === 0) return false;

  const contentParts: string[] = [];
  const currentWorldview = worldviewsStore.currentWorldview;

  // 收集角色数据和损害数据
  const characters: Array<{
    name: string;
    context: PromptContext;
    originalHeight: number;
    damageData?: DamageCalculation;
  }> = [];
  const allDamages: Array<{ name: string; damageData: DamageCalculation }> = [];
  
  for (const [name, data] of Object.entries(giantessData)) {
    if (name.startsWith('_')) continue;
    const calcData = data._计算数据;
    const damageData = data._损害数据;
    const originalHeight = data.原身高 || data.原始身高 || 1.65;
    
    if (calcData) {
      const context = buildCharacterContext(name, calcData, originalHeight, {
        damageData,
        worldview: currentWorldview,
        enableDamageCalculation: settingsStore.settings.enableDamageCalculation,
        compactPromptFormat: settingsStore.settings.compactPromptFormat,
      });
      
      characters.push({
        name,
        context,
        originalHeight,
        damageData,
      });
      
      if (damageData) {
        allDamages.push({ name, damageData });
      }
    }
  }

  // 收集互动限制数据
  const interactions = giantessData._互动限制;
  const interactionList: Array<{
    大者: string;
    小者: string;
    impossible: Array<{ action: string; reason: string; alternative: string }>;
  }> = [];
  
  if (interactions) {
    for (const data of Object.values(interactions)) {
      if (data.impossible && data.impossible.length > 0) {
        interactionList.push({
          大者: data.大者,
          小者: data.小者,
          impossible: data.impossible,
        });
      }
    }
  }

  // 按模板类型处理
  for (const template of enabledTemplates) {
    const rendered = renderTemplate(template, {
      characters,
      interactionList,
      allDamages,
      currentWorldview,
      settings: settingsStore.settings,
    });
    
    if (rendered) {
      contentParts.push(rendered);
    }
  }

  if (contentParts.length === 0) return false;

  // 根据设置决定是否使用紧凑格式
  const separator = settingsStore.settings.compactPromptFormat ? '\n' : '\n\n';
  const content = contentParts.join(separator);

  // 注入提示词
  injectPromptContent(content, settingsStore.settings.injectDepth);
  settingsStore.log('已注入提示词');
  
  return true;
}

/**
 * 渲染单个模板
 */
function renderTemplate(
  template: PromptTemplate,
  context: {
    characters: Array<{ name: string; context: PromptContext; originalHeight: number; damageData?: DamageCalculation }>;
    interactionList: Array<{ 大者: string; 小者: string; impossible: Array<{ action: string; reason: string; alternative: string }> }>;
    allDamages: Array<{ name: string; damageData: DamageCalculation }>;
    currentWorldview: { name: string };
    settings: {
      injectInteractionLimits: boolean;
      showVariableUpdateRules: boolean;
      injectWorldviewPrompt: boolean;
      enableDamageCalculation: boolean;
      injectDamagePrompt: boolean;
      showDamagePerCharacter: boolean;
      showDamageSummary: boolean;
      compactPromptFormat: boolean;
    };
  }
): string | null {
  const { characters, interactionList, allDamages, settings } = context;
  
  switch (template.type) {
    case 'header':
    case 'footer':
      // 直接添加，无需插值
      return template.content;

    case 'character':
      // 为每个角色生成内容
      if (characters.length === 0) return null;
      return characters
        .map((char) => interpolate(template.content, char.context))
        .join('\n\n');

    case 'interaction':
      // 生成互动限制内容
      if (interactionList.length === 0 || !settings.injectInteractionLimits) {
        return null;
      }
      const interactionText = formatInteractionLimits(interactionList);
      return interpolate(template.content, { 互动限制列表: interactionText });

    case 'rules':
      // 变量更新规则 - 只在有角色时显示
      if (characters.length === 0 || !settings.showVariableUpdateRules) {
        return null;
      }
      // 用第一个角色名作为示例
      const exampleContext = characters[0]?.context || { 角色名: '角色名' };
      return interpolate(template.content, exampleContext);

    case 'worldview':
      // 世界观设定 - 只在启用时显示
      if (!settings.injectWorldviewPrompt || characters.length === 0) {
        return null;
      }
      // 使用第一个角色的上下文（包含世界观提示词）
      const worldviewContext = characters[0]?.context || {};
      return interpolate(template.content, worldviewContext);

    case 'damage':
      // 损害计算 - 只在启用损害计算并且有损害数据时显示
      if (
        !settings.enableDamageCalculation ||
        !settings.injectDamagePrompt ||
        allDamages.length === 0
      ) {
        return null;
      }
      const damagePrompt = generateAllDamagePrompt(allDamages, {
        showPerCharacter: settings.showDamagePerCharacter,
        showSummary: settings.showDamageSummary,
        compact: settings.compactPromptFormat,
      });
      if (!damagePrompt) return null;
      return interpolate(template.content, { 损害数据: damagePrompt });

    default:
      return null;
  }
}
