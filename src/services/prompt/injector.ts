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
  CharacterItemsCalculation,
} from '../../types';

/**
 * 用于提示词注入的数据输入类型
 * 包含角色数据和可选的互动限制
 */
export interface PromptDataInput {
  /** 角色数据映射 */
  characters: Record<string, CharacterMvuData>;
  /** 互动限制（可选） */
  interactions?: Record<string, PairwiseInteraction>;
}
import { useSettingsStore } from '../../stores/settings';
import { usePromptsStore } from '../../stores/prompts';
import { useWorldviewsStore } from '../../stores/worldviews';
import {
  interpolate,
  formatInteractionLimits,
  buildCharacterContext,
  generateAllDamagePrompt,
  generateWorldviewPrompt,
  formatScenarioDetails,
  generateScenarioList,
} from './builder';
import { useCharactersStoreBase } from '../../stores/characters';
import { extensionManager } from '../extensions/manager';
import { generateItemsPrompt } from '../../core/items';

/** 当前注入的提示词 ID */
let injectedPromptId: string | null = null;

/** 用于生成唯一 ID 的计数器 */
let promptIdCounter = 0;

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
    console.log('[GiantessCalc] 🗑️ 取消之前的提示词注入:', injectedPromptId);
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
  
  // 生成新的 ID（使用时间戳和计数器确保唯一性）
  promptIdCounter++;
  injectedPromptId = `giantess-data-${Date.now()}-${promptIdCounter}`;
  
  console.log('[GiantessCalc] 💉 准备注入提示词:', {
    id: injectedPromptId,
    depth: depth,
    contentLength: content.length,
    contentPreview: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
  });
  
  // 构建注入配置
  // 使用 user 角色，这样在长上下文中会更靠近对话
  const injectionConfig: InjectionPrompt = {
    id: injectedPromptId,
    role: 'user',
    position: 'in_chat',
    depth: depth,
    content: content,
    should_scan: false,
  };
  
  console.log('[GiantessCalc] 📝 注入配置:', JSON.stringify(injectionConfig, null, 2));
  
  try {
    // 注入提示词
    const result = injectPrompts([injectionConfig]);
    console.log('[GiantessCalc] ✅ injectPrompts 调用成功, 返回:', result);
  } catch (e) {
    console.error('[GiantessCalc] ❌ injectPrompts 调用失败:', e);
    throw e;
  }
  
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
 * 注入基础提示词（不依赖角色数据）
 * 用于在没有角色数据时仍然注入 header、footer、worldview、rules 等模板
 * 
 * @returns 是否成功注入
 */
export function injectBasePrompts(): boolean {
  const settingsStore = useSettingsStore();
  const promptsStore = usePromptsStore();
  const worldviewsStore = useWorldviewsStore();
  const charactersStore = useCharactersStoreBase();
  
  const enabledTemplates = promptsStore.enabledTemplates;
  if (enabledTemplates.length === 0) {
    console.log('[GiantessCalc] ⚠️ injectBasePrompts: 没有启用的模板');
    return false;
  }

  console.log('[GiantessCalc] 📋 injectBasePrompts: 尝试注入基础模板（无角色数据）');

  const contentParts: string[] = [];
  const currentWorldview = worldviewsStore.currentWorldview;
  const currentScenario = charactersStore.scenario;

  // 按模板类型处理（没有角色数据）
  for (const template of enabledTemplates) {
    const rendered = renderTemplate(template, {
      characters: [],
      interactionList: [],
      allDamages: [],
      allItems: [],
      currentWorldview,
      currentScenario,
      settings: settingsStore.settings,
    });
    
    if (rendered) {
      contentParts.push(rendered);
    }
  }

  if (contentParts.length === 0) {
    console.log('[GiantessCalc] ⚠️ injectBasePrompts: 没有生成任何内容，跳过注入');
    return false;
  }

  // 根据设置决定是否使用紧凑格式
  const separator = settingsStore.settings.compactPromptFormat ? '\n' : '\n\n';
  const content = contentParts.join(separator);

  console.log('[GiantessCalc] 📦 injectBasePrompts: 准备注入基础提示词', {
    模板数量: enabledTemplates.length,
    生成内容数: contentParts.length,
    内容长度: content.length,
    注入深度: settingsStore.settings.injectDepth,
  });

  // 注入提示词
  const promptId = injectPromptContent(content, settingsStore.settings.injectDepth);
  settingsStore.log('已注入基础提示词（无角色数据）');
  
  console.log('[GiantessCalc] ✅ injectBasePrompts: 注入成功, ID:', promptId);
  
  return true;
}

/**
 * 从 MVU 变量构建并注入提示词
 * 
 * @param data 提示词数据输入（可选）
 *   - characters: 角色数据映射
 *   - interactions: 互动限制（可选）
 * @returns 是否成功注入
 */
export function buildAndInjectPrompt(
  data?: PromptDataInput | null
): boolean {
  // 如果没有数据或数据为空，使用基础注入
  if (!data || Object.keys(data.characters).length === 0) {
    console.log('[GiantessCalc] 📋 buildAndInjectPrompt: 没有角色数据，尝试注入基础模板');
    return injectBasePrompts();
  }
  
  const { characters: giantessData, interactions } = data;
  const settingsStore = useSettingsStore();
  const promptsStore = usePromptsStore();
  const worldviewsStore = useWorldviewsStore();
  const charactersStore = useCharactersStoreBase();
  
  const enabledTemplates = promptsStore.enabledTemplates;
  if (enabledTemplates.length === 0) return false;

  const contentParts: string[] = [];
  const currentWorldview = worldviewsStore.currentWorldview;
  const currentScenario = charactersStore.scenario;

  // 收集角色数据和损害数据
  const characters: Array<{
    name: string;
    context: PromptContext;
    originalHeight: number;
    damageData?: DamageCalculation;
    itemsCalc?: CharacterItemsCalculation;
  }> = [];
  const allDamages: Array<{ name: string; damageData: DamageCalculation }> = [];
  const allItems: Array<{ name: string; itemsCalc: CharacterItemsCalculation }> = [];
  
  for (const [name, data] of Object.entries(giantessData)) {
    if (name.startsWith('_')) continue;
    const calcData = data._计算数据;
    const damageData = data._损害数据;
    const originalHeight = data.原身高 || data.原始身高 || 1.65;
    
    if (calcData) {
      const itemsCalc = data._物品计算;
      
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
        itemsCalc,
      });
      
      if (damageData) {
        allDamages.push({ name, damageData });
      }
      
      if (itemsCalc && Object.keys(itemsCalc.物品).length > 0) {
        allItems.push({ name, itemsCalc });
      }
    }
  }

  // 收集互动限制数据
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
      allItems,
      currentWorldview,
      currentScenario,
      settings: settingsStore.settings,
    });
    
    if (rendered) {
      contentParts.push(rendered);
    }
  }

  if (contentParts.length === 0) {
    console.log('[GiantessCalc] ⚠️ buildAndInjectPrompt: 没有生成任何内容，跳过注入');
    return false;
  }

  // 根据设置决定是否使用紧凑格式
  const separator = settingsStore.settings.compactPromptFormat ? '\n' : '\n\n';
  const content = contentParts.join(separator);

  console.log('[GiantessCalc] 📦 buildAndInjectPrompt: 准备注入提示词', {
    模板数量: enabledTemplates.length,
    内容长度: content.length,
    注入深度: settingsStore.settings.injectDepth,
  });

  // 注入提示词
  const promptId = injectPromptContent(content, settingsStore.settings.injectDepth);
  settingsStore.log('已注入提示词');
  
  console.log('[GiantessCalc] ✅ buildAndInjectPrompt: 注入成功, ID:', promptId);
  
  return true;
}

/**
 * 渲染单个模板
 */
function renderTemplate(
  template: PromptTemplate,
  context: {
    characters: Array<{ name: string; context: PromptContext; originalHeight: number; damageData?: DamageCalculation; itemsCalc?: CharacterItemsCalculation }>;
    interactionList: Array<{ 大者: string; 小者: string; impossible: Array<{ action: string; reason: string; alternative: string }> }>;
    allDamages: Array<{ name: string; damageData: DamageCalculation }>;
    allItems: Array<{ name: string; itemsCalc: CharacterItemsCalculation }>;
    currentWorldview: { name: string; prompt?: string };
    currentScenario?: { 当前场景?: string; 场景原因?: string; 具体地点?: string; 场景时间?: string; 人群状态?: string };
    settings: {
      injectInteractionLimits: boolean;
      showVariableUpdateRules: boolean;
      injectWorldviewPrompt: boolean;
      enableDamageCalculation: boolean;
      injectDamagePrompt: boolean;
      showDamagePerCharacter: boolean;
      showDamageSummary: boolean;
      compactPromptFormat: boolean;
      enableItemsSystem: boolean;
      injectItemsPrompt: boolean;
    };
  }
): string | null {
  const { characters, interactionList, allDamages, allItems, currentWorldview, currentScenario, settings } = context;
  
  switch (template.type) {
    case 'header':
    case 'footer':
      // 直接添加，无需插值，也不需要角色数据
      return template.content;

    case 'character':
      // 为每个角色生成内容 - 需要角色数据
      if (characters.length === 0) return null;
      return characters
        .map((char) => interpolate(template.content, char.context))
        .join('\n\n');

    case 'interaction': {
      // 生成互动限制内容 - 需要角色数据
      if (interactionList.length === 0 || !settings.injectInteractionLimits) {
        return null;
      }
      const interactionText = formatInteractionLimits(interactionList);
      return interpolate(template.content, { 互动限制列表: interactionText });
    }

    case 'rules': {
      // 变量更新规则 - 即使没有角色也可以显示（使用占位符）
      if (!settings.showVariableUpdateRules) {
        return null;
      }
      // 用第一个角色名或占位符
      const exampleContext = characters[0]?.context || { 角色名: '角色名' };
      const baseRules = interpolate(template.content, exampleContext);
      
      // 收集扩展贡献的规则片段并追加
      const rulesContributions = extensionManager.collectRulesContributions();
      if (rulesContributions.length > 0) {
        return baseRules + '\n\n' + rulesContributions.join('\n\n');
      }
      return baseRules;
    }

    case 'worldview': {
      // 世界观设定 - 即使没有角色也可以显示
      if (!settings.injectWorldviewPrompt) {
        return null;
      }
      // 使用第一个角色的上下文（包含世界观提示词），或直接使用世界观数据
      let worldviewContext: Partial<PromptContext>;
      if (characters.length > 0 && characters[0]?.context) {
        worldviewContext = characters[0].context;
      } else {
        // 没有角色时，直接生成世界观提示词
        worldviewContext = {
          世界观名称: currentWorldview.name,
          世界观提示词: generateWorldviewPrompt(currentWorldview as Parameters<typeof generateWorldviewPrompt>[0]),
        };
      }
      return interpolate(template.content, worldviewContext);
    }

    case 'damage': {
      // 损害计算 - 需要角色数据和损害数据
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
    }

    case 'items': {
      // 物品数据 - 需要角色数据和物品数据
      if (
        !settings.enableItemsSystem ||
        !settings.injectItemsPrompt ||
        allItems.length === 0
      ) {
        return null;
      }
      // 为每个角色生成物品提示词
      const itemsPrompts = allItems.map(({ name, itemsCalc }) => 
        generateItemsPrompt(name, itemsCalc)
      );
      const itemsText = itemsPrompts.join('\n\n');
      return interpolate(template.content, { 物品数据: itemsText });
    }

    case 'scenario': {
      // 场景信息 - 即使没有角色也可以显示
      const scenarioName = currentScenario?.当前场景 || '未设置';
      const scenarioDetails = formatScenarioDetails(currentScenario);
      const scenarioList = generateScenarioList();
      
      return interpolate(template.content, {
        当前场景: scenarioName,
        场景详情: scenarioDetails,
        可用场景列表: scenarioList,
      });
    }

    default:
      return null;
  }
}
