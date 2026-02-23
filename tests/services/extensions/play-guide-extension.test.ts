/**
 * 玩法指导扩展测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { extensionManager } from '@/services/extensions/manager';
import {
  playGuideExtension,
  PLAY_GUIDE_EXTENSION_ID,
} from '@/services/extensions/play-guide-extension';
import {
  PLAY_GUIDE_DEFINITIONS,
  getPlayGuideById,
} from '@/services/extensions/play-guide-prompts';
import { useSettingsStore } from '@/stores/settings';
import { variablesMock } from '../../setup';

describe('Service: extensions/play-guide-extension', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    variablesMock.__reset();

    // 清理扩展管理器中可能遗留的状态
    for (const ext of extensionManager.getAll()) {
      if (extensionManager.isEnabled(ext.id)) {
        extensionManager.disable(ext.id);
      }
    }
  });

  // ========== 扩展基本信息 ==========
  describe('扩展基本信息', () => {
    it('应该有正确的 ID', () => {
      expect(playGuideExtension.id).toBe('play-guide');
      expect(PLAY_GUIDE_EXTENSION_ID).toBe('play-guide');
    });

    it('应该有正确的名称和描述', () => {
      expect(playGuideExtension.name).toBe('玩法指导');
      expect(playGuideExtension.description).toContain('玩法指导');
    });

    it('应该有图标', () => {
      expect(playGuideExtension.icon).toBe('fa-solid fa-compass');
    });

    it('默认应该不启用', () => {
      expect(playGuideExtension.defaultEnabled).toBe(false);
    });
  });

  // ========== 生命周期钩子 ==========
  describe('生命周期钩子', () => {
    it('onInit 应该不抛出错误', () => {
      expect(() => playGuideExtension.onInit?.()).not.toThrow();
    });

    it('onEnable 应该不抛出错误', () => {
      expect(() => playGuideExtension.onEnable?.()).not.toThrow();
    });

    it('onDisable 应该不抛出错误', () => {
      expect(() => playGuideExtension.onDisable?.()).not.toThrow();
    });
  });

  // ========== PLAY_GUIDE_DEFINITIONS ==========
  describe('PLAY_GUIDE_DEFINITIONS', () => {
    it('应该包含 Vore 玩法（非占位）', () => {
      const vore = PLAY_GUIDE_DEFINITIONS.find(g => g.id === 'vore');
      expect(vore).toBeDefined();
      expect(vore!.name).toContain('Vore');
      expect(vore!.content).toContain('Vore');
      expect(vore!.placeholder).toBeFalsy();
    });

    it('应该包含多种玩法定义', () => {
      expect(PLAY_GUIDE_DEFINITIONS.length).toBeGreaterThanOrEqual(5);
    });

    it('每个定义应该有 id、name、description、icon、content', () => {
      for (const guide of PLAY_GUIDE_DEFINITIONS) {
        expect(guide.id).toBeTruthy();
        expect(guide.name).toBeTruthy();
        expect(guide.description).toBeTruthy();
        expect(guide.icon).toBeTruthy();
        expect(guide.content).toBeTruthy();
      }
    });


    it('getPlayGuideById 应该返回正确的定义', () => {
      const vore = getPlayGuideById('vore');
      expect(vore).toBeDefined();
      expect(vore!.id).toBe('vore');

      const notExist = getPlayGuideById('not-exist');
      expect(notExist).toBeUndefined();
    });
  });

  // ========== getPromptTemplates ==========
  describe('getPromptTemplates', () => {
    it('应该为每个玩法定义返回一个模板', () => {
      const templates = playGuideExtension.getPromptTemplates!();
      expect(templates.length).toBe(PLAY_GUIDE_DEFINITIONS.length);
    });

    it('所有模板都应该是 guide 类型且 builtin', () => {
      const templates = playGuideExtension.getPromptTemplates!();
      for (const t of templates) {
        expect(t.type).toBe('guide');
        expect(t.builtin).toBe(true);
        expect(t.readonly).toBe(false);
        expect(t.requiresFeature).toBe('playGuide');
      }
    });

    it('模板的 enabled 应该依据 enabledPlayGuides 设置', () => {
      const settingsStore = useSettingsStore();

      // 默认没有启用任何玩法
      let templates = playGuideExtension.getPromptTemplates!();
      expect(templates.every(t => t.enabled === false)).toBe(true);

      // 启用 vore
      settingsStore.settings.enabledPlayGuides = ['vore'];
      templates = playGuideExtension.getPromptTemplates!();

      const voreTemplate = templates.find(t => t.id === 'play-guide-vore');
      expect(voreTemplate).toBeDefined();
      expect(voreTemplate!.enabled).toBe(true);

      // 其他应该仍然是 false
      const others = templates.filter(t => t.id !== 'play-guide-vore');
      expect(others.every(t => t.enabled === false)).toBe(true);
    });

    it('启用多个玩法应该同时生效', () => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.enabledPlayGuides = ['vore', 'gentle', 'crush'];

      const templates = playGuideExtension.getPromptTemplates!();
      const enabledTemplates = templates.filter(t => t.enabled);

      expect(enabledTemplates.length).toBe(3);
      expect(enabledTemplates.map(t => t.id)).toEqual(
        expect.arrayContaining([
          'play-guide-vore',
          'play-guide-gentle',
          'play-guide-crush',
        ])
      );
    });

    it('模板 ID 应该以 play-guide- 为前缀', () => {
      const templates = playGuideExtension.getPromptTemplates!();
      for (const t of templates) {
        expect(t.id).toMatch(/^play-guide-/);
      }
    });

    it('模板的 order 应该在合理范围内', () => {
      const templates = playGuideExtension.getPromptTemplates!();
      for (const t of templates) {
        expect(t.order).toBeGreaterThanOrEqual(9890);
        expect(t.order).toBeLessThanOrEqual(9920);
      }
    });

    it('当有自定义内容时应该优先使用自定义内容', () => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.customPlayGuideContents = {
        vore: '自定义 Vore 提示词内容',
      };

      const templates = playGuideExtension.getPromptTemplates!();
      const voreTemplate = templates.find(t => t.id === 'play-guide-vore');

      expect(voreTemplate).toBeDefined();
      expect(voreTemplate!.content).toBe('自定义 Vore 提示词内容');
    });

    it('没有自定义内容时应该使用默认内容', () => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.customPlayGuideContents = {};

      const templates = playGuideExtension.getPromptTemplates!();
      const voreTemplate = templates.find(t => t.id === 'play-guide-vore');
      const voreDef = PLAY_GUIDE_DEFINITIONS.find(g => g.id === 'vore');

      expect(voreTemplate!.content).toBe(voreDef!.content);
    });

    it('自定义内容只影响指定玩法，不影响其他玩法', () => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.customPlayGuideContents = { vore: '自定义内容' };

      const templates = playGuideExtension.getPromptTemplates!();
      const gentleTemplate = templates.find(t => t.id === 'play-guide-gentle');
      const gentleDef = PLAY_GUIDE_DEFINITIONS.find(g => g.id === 'gentle');

      expect(gentleTemplate!.content).toBe(gentleDef!.content);
    });
  });

  // ========== 自定义玩法指导 ==========
  describe('自定义玩法指导 (customPlayGuides)', () => {
    it('默认没有自定义玩法指导时，模板数量等于内置数量', () => {
      const templates = playGuideExtension.getPromptTemplates!();
      expect(templates.length).toBe(PLAY_GUIDE_DEFINITIONS.length);
    });

    it('添加自定义玩法指导后，模板数量增加', () => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.customPlayGuides = [
        {
          id: 'custom-test-1',
          name: '测试玩法',
          description: '测试用的自定义玩法',
          icon: 'fa-solid fa-scroll',
          content: '自定义测试内容',
        },
      ];

      const templates = playGuideExtension.getPromptTemplates!();
      expect(templates.length).toBe(PLAY_GUIDE_DEFINITIONS.length + 1);
    });

    it('自定义玩法模板应该有正确的属性', () => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.customPlayGuides = [
        {
          id: 'custom-test-1',
          name: '测试玩法',
          description: '测试描述',
          icon: 'fa-solid fa-scroll',
          content: '测试内容',
        },
      ];

      const templates = playGuideExtension.getPromptTemplates!();
      const customTemplate = templates.find(t => t.id === 'play-guide-custom-test-1');

      expect(customTemplate).toBeDefined();
      expect(customTemplate!.name).toBe('测试玩法');
      expect(customTemplate!.description).toBe('测试描述');
      expect(customTemplate!.content).toBe('测试内容');
      expect(customTemplate!.type).toBe('guide');
      expect(customTemplate!.builtin).toBe(false);
      expect(customTemplate!.readonly).toBe(false);
      expect(customTemplate!.requiresFeature).toBe('playGuide');
    });

    it('自定义玩法的 enabled 应该依据 enabledPlayGuides 设置', () => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.customPlayGuides = [
        {
          id: 'custom-test-1',
          name: '测试玩法',
          description: '测试',
          icon: 'fa-solid fa-scroll',
          content: '内容',
        },
      ];

      // 默认不启用
      let templates = playGuideExtension.getPromptTemplates!();
      let customTemplate = templates.find(t => t.id === 'play-guide-custom-test-1');
      expect(customTemplate!.enabled).toBe(false);

      // 启用后
      settingsStore.settings.enabledPlayGuides = ['custom-test-1'];
      templates = playGuideExtension.getPromptTemplates!();
      customTemplate = templates.find(t => t.id === 'play-guide-custom-test-1');
      expect(customTemplate!.enabled).toBe(true);
    });

    it('多个自定义玩法应该都能正常工作', () => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.customPlayGuides = [
        {
          id: 'custom-a',
          name: '玩法A',
          description: '描述A',
          icon: 'fa-solid fa-scroll',
          content: '内容A',
        },
        {
          id: 'custom-b',
          name: '玩法B',
          description: '描述B',
          icon: 'fa-solid fa-scroll',
          content: '内容B',
        },
      ];
      settingsStore.settings.enabledPlayGuides = ['custom-a', 'custom-b', 'vore'];

      const templates = playGuideExtension.getPromptTemplates!();
      expect(templates.length).toBe(PLAY_GUIDE_DEFINITIONS.length + 2);

      const enabledTemplates = templates.filter(t => t.enabled);
      expect(enabledTemplates.length).toBe(3);
      expect(enabledTemplates.map(t => t.id)).toEqual(
        expect.arrayContaining([
          'play-guide-custom-a',
          'play-guide-custom-b',
          'play-guide-vore',
        ])
      );
    });

    it('自定义玩法和内置玩法的自定义内容互不干扰', () => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.customPlayGuides = [
        { id: 'custom-x', name: 'X', description: '', icon: '', content: '自定义X内容' },
      ];
      settingsStore.settings.customPlayGuideContents = { vore: '覆盖的Vore内容' };

      const templates = playGuideExtension.getPromptTemplates!();
      const voreT = templates.find(t => t.id === 'play-guide-vore');
      const customT = templates.find(t => t.id === 'play-guide-custom-x');

      expect(voreT!.content).toBe('覆盖的Vore内容');
      expect(customT!.content).toBe('自定义X内容');
    });
  });

  // ========== 与扩展管理器集成 ==========
  describe('与扩展管理器集成', () => {
    it('应该可以注册到扩展管理器', () => {
      if (!extensionManager.get(PLAY_GUIDE_EXTENSION_ID)) {
        extensionManager.register(playGuideExtension);
      }

      const ext = extensionManager.get(PLAY_GUIDE_EXTENSION_ID);
      expect(ext).toBeDefined();
      expect(ext!.name).toBe('玩法指导');
    });

    it('启用后应该能收集到提示词模板', () => {
      if (!extensionManager.get(PLAY_GUIDE_EXTENSION_ID)) {
        extensionManager.register(playGuideExtension);
      }
      extensionManager.enable(PLAY_GUIDE_EXTENSION_ID);

      const templates = extensionManager.collectPromptTemplates();
      expect(templates.some(t => t.id === 'play-guide-vore')).toBe(true);
    });

    it('禁用后不应该收集到提示词模板', () => {
      if (!extensionManager.get(PLAY_GUIDE_EXTENSION_ID)) {
        extensionManager.register(playGuideExtension);
      }
      extensionManager.enable(PLAY_GUIDE_EXTENSION_ID);
      extensionManager.disable(PLAY_GUIDE_EXTENSION_ID);

      const templates = extensionManager.collectPromptTemplates();
      expect(templates.some(t => t.id === 'play-guide-vore')).toBe(false);
    });
  });
});
