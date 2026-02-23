/**
 * 巨大娘计算器 - 玩法指导扩展
 *
 * 提供多种内置玩法指导提示词，用户可针对每种玩法单独开关
 *
 * @module services/extensions/play-guide-extension
 */

import type { Extension, PromptTemplate } from '../../types';
import { useSettingsStore } from '../../stores/settings';
import { PLAY_GUIDE_DEFINITIONS } from './play-guide-prompts';

/**
 * 玩法指导扩展 ID
 */
export const PLAY_GUIDE_EXTENSION_ID = 'play-guide';

// ========== 扩展定义 ==========

/**
 * 玩法指导扩展定义
 */
export const playGuideExtension: Extension = {
  id: PLAY_GUIDE_EXTENSION_ID,
  name: '玩法指导',
  description: '提供多种内置玩法指导提示词，可针对每种玩法单独开关',
  icon: 'fa-solid fa-compass',
  defaultEnabled: false,

  onInit() {
    console.log('[PlayGuideExtension] 初始化');
  },

  onEnable() {
    console.log('[PlayGuideExtension] 玩法指导已启用');
  },

  onDisable() {
    console.log('[PlayGuideExtension] 玩法指导已禁用');
  },

  /**
   * 贡献玩法指导相关的提示词模板
   *
   * 根据用户在 settings.enabledPlayGuides 中的选择，
   * 为每个启用的玩法生成对应的 PromptTemplate
   */
  getPromptTemplates(): PromptTemplate[] {
    const settingsStore = useSettingsStore();
    const enabledGuides = settingsStore.settings.enabledPlayGuides;
    const customContents = settingsStore.settings.customPlayGuideContents;
    const customGuides = settingsStore.settings.customPlayGuides;
    const templates: PromptTemplate[] = [];

    // 内置玩法指导
    for (let i = 0; i < PLAY_GUIDE_DEFINITIONS.length; i++) {
      const guide = PLAY_GUIDE_DEFINITIONS[i];
      const isEnabled = enabledGuides.includes(guide.id);

      // 优先使用用户自定义内容，否则使用内置默认内容
      const content = customContents[guide.id] ?? guide.content;

      templates.push({
        id: `play-guide-${guide.id}`,
        name: guide.name,
        description: guide.description,
        enabled: isEnabled,
        order: 9910 - i, // 按定义顺序递减
        type: 'guide',
        builtin: true,
        readonly: false,
        requiresFeature: 'playGuide',
        content,
      });
    }

    // 用户自定义玩法指导
    for (let i = 0; i < customGuides.length; i++) {
      const guide = customGuides[i];
      const isEnabled = enabledGuides.includes(guide.id);

      templates.push({
        id: `play-guide-${guide.id}`,
        name: guide.name,
        description: guide.description,
        enabled: isEnabled,
        order: 9900 - PLAY_GUIDE_DEFINITIONS.length - i,
        type: 'guide',
        builtin: false,
        readonly: false,
        requiresFeature: 'playGuide',
        content: guide.content,
      });
    }

    return templates;
  },
};
