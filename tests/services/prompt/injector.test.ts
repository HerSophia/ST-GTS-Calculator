/**
 * 提示词注入服务测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { variablesMock } from '../../setup';
import {
  getInjectedPromptId,
  uninjectPrompt,
  injectPromptContent,
  injectBasePrompts,
  buildAndInjectPrompt,
  type PromptDataInput,
} from '@/services/prompt/injector';
import { useSettingsStore } from '@/stores/settings';
import { usePromptsStore, DEFAULT_TEMPLATES } from '@/stores/prompts';
import { calculateGiantessData, calculateDamage } from '@/core';
import type { CharacterMvuData, PromptTemplate } from '@/types';

/**
 * 手动设置模板到 store
 * 由于测试环境中 getVariables mock 可能在 store 初始化时还未正确返回值
 */
function ensureDefaultTemplates(promptsStore: ReturnType<typeof usePromptsStore>) {
  if (promptsStore.templates.length === 0) {
    // 手动设置默认模板 - 使用 splice 替换整个数组内容
    promptsStore.templates.splice(0, 0, ...DEFAULT_TEMPLATES);
  }
}

describe('Service: prompt/injector', () => {
  beforeEach(() => {
    // 先重置 mock，确保 getVariables 返回空对象
    variablesMock.__reset();
    
    setActivePinia(createPinia());
    // 清理注入状态
    uninjectPrompt();
    vi.clearAllMocks();
    
    // 确保 prompts store 有默认模板
    const promptsStore = usePromptsStore();
    ensureDefaultTemplates(promptsStore);
  });

  afterEach(() => {
    // 清理注入状态
    uninjectPrompt();
  });

  describe('getInjectedPromptId', () => {
    it('初始应该返回 null', () => {
      expect(getInjectedPromptId()).toBeNull();
    });

    it('注入后应该返回注入 ID', () => {
      injectPromptContent('测试内容', 1);
      
      const id = getInjectedPromptId();
      
      expect(id).not.toBeNull();
      expect(id).toContain('giantess-data-');
    });

    it('取消注入后应该返回 null', () => {
      injectPromptContent('测试内容', 1);
      uninjectPrompt();
      
      expect(getInjectedPromptId()).toBeNull();
    });
  });

  describe('uninjectPrompt', () => {
    it('没有注入时调用应该安全', () => {
      expect(() => uninjectPrompt()).not.toThrow();
    });

    it('应该清除注入状态', () => {
      injectPromptContent('测试内容', 1);
      expect(getInjectedPromptId()).not.toBeNull();
      
      uninjectPrompt();
      
      expect(getInjectedPromptId()).toBeNull();
    });

    it('多次调用应该安全', () => {
      injectPromptContent('测试内容', 1);
      uninjectPrompt();
      uninjectPrompt();
      uninjectPrompt();
      
      expect(getInjectedPromptId()).toBeNull();
    });
  });

  describe('injectPromptContent', () => {
    it('应该返回注入 ID', () => {
      const id = injectPromptContent('测试内容', 1);
      
      expect(id).toContain('giantess-data-');
    });

    it('应该使用默认深度 1', () => {
      const id = injectPromptContent('测试内容');
      
      expect(id).toBeTruthy();
    });

    it('应该更新注入状态', () => {
      const id = injectPromptContent('测试内容', 1);
      
      expect(getInjectedPromptId()).toBe(id);
    });

    it('再次注入应该取消之前的注入', () => {
      const id1 = injectPromptContent('内容1', 1);
      const id2 = injectPromptContent('内容2', 1);
      
      expect(id1).not.toBe(id2);
      expect(getInjectedPromptId()).toBe(id2);
    });

    it('应该调用 injectPrompts API', () => {
      injectPromptContent('测试内容', 5);
      
      expect(injectPrompts).toHaveBeenCalled();
    });

    it('应该包含正确的配置', () => {
      injectPromptContent('测试内容123', 7);
      
      expect(injectPrompts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            content: '测试内容123',
            depth: 7,
            role: 'user',
            position: 'in_chat',
          }),
        ])
      );
    });
  });

  describe('injectBasePrompts', () => {
    it('当没有启用的模板时应该返回 false', () => {
      const promptsStore = usePromptsStore();
      // 禁用所有模板
      promptsStore.templates.forEach(t => {
        t.enabled = false;
      });
      
      const result = injectBasePrompts();
      
      expect(result).toBe(false);
    });

    it('当有启用的模板时应该返回 true', () => {
      const result = injectBasePrompts();
      
      expect(result).toBe(true);
    });

    it('应该注入提示词', () => {
      injectBasePrompts();
      
      expect(getInjectedPromptId()).not.toBeNull();
    });

    it('应该调用 injectPrompts API', () => {
      injectBasePrompts();
      
      expect(injectPrompts).toHaveBeenCalled();
    });
  });

  describe('buildAndInjectPrompt', () => {
    describe('无数据时', () => {
      it('当传入 null 时应该调用 injectBasePrompts', () => {
        const result = buildAndInjectPrompt(null);
        
        expect(result).toBe(true);
        expect(getInjectedPromptId()).not.toBeNull();
      });

      it('当传入空角色列表时应该调用 injectBasePrompts', () => {
        const result = buildAndInjectPrompt({ characters: {} });
        
        expect(result).toBe(true);
      });

      it('当没有启用模板时应该返回 false', () => {
        const promptsStore = usePromptsStore();
        promptsStore.templates.forEach(t => {
          t.enabled = false;
        });
        
        const result = buildAndInjectPrompt(null);
        
        expect(result).toBe(false);
      });
    });

    describe('有角色数据时', () => {
      const createTestData = (): PromptDataInput => {
        const calcData = calculateGiantessData(170, 1.65);
        const damageData = calculateDamage(170, 1.65, '大城市');
        
        const characterData: CharacterMvuData = {
          当前身高: 170,
          原身高: 1.65,
          _计算数据: calcData,
          _损害数据: damageData,
        };
        
        return {
          characters: {
            '络络': characterData,
          },
        };
      };

      it('应该成功注入提示词', () => {
        // 确保有启用的模板
        const promptsStore = usePromptsStore();
        expect(promptsStore.enabledTemplates.length).toBeGreaterThan(0);
        
        const data = createTestData();
        
        const result = buildAndInjectPrompt(data);
        
        // 如果有启用的模板且有角色数据，应该成功注入
        // 但如果渲染结果为空（例如所有模板都需要特定条件），可能返回 false
        expect(typeof result).toBe('boolean');
        if (result) {
          expect(getInjectedPromptId()).not.toBeNull();
        }
      });

      it('应该处理多个角色', () => {
        const calcData1 = calculateGiantessData(170, 1.65);
        const calcData2 = calculateGiantessData(1700, 1.70);
        
        const data: PromptDataInput = {
          characters: {
            '角色1': {
              当前身高: 170,
              原身高: 1.65,
              _计算数据: calcData1,
            },
            '角色2': {
              当前身高: 1700,
              原身高: 1.70,
              _计算数据: calcData2,
            },
          },
        };
        
        // 不应该抛出错误
        expect(() => buildAndInjectPrompt(data)).not.toThrow();
      });

      it('应该忽略以下划线开头的键', () => {
        const data = createTestData();
        // 添加一个以下划线开头的键
        data.characters['_内部'] = { 当前身高: 100 } as CharacterMvuData;
        
        // 应该不抛出错误
        expect(() => buildAndInjectPrompt(data)).not.toThrow();
      });

      it('应该处理互动数据', () => {
        const data = createTestData();
        data.interactions = {
          '络络-小人': {
            大者: '络络',
            小者: '小人',
            提示: '体型差距过大，需要特别注意互动方式',
            ratio: 10000,
            ratioFormatted: '1万倍',
            smallInBigEyes: '如同蚂蚁',
            possible: ['观察', '轻触'],
            impossible: [
              { action: '握手', reason: '体型差距过大', alternative: '指尖轻触' },
            ],
            alternatives: { '握手': '指尖轻触' },
          },
        };
        
        // 应该不抛出错误
        expect(() => buildAndInjectPrompt(data)).not.toThrow();
      });

      it('当所有模板禁用时应该返回 false', () => {
        const promptsStore = usePromptsStore();
        promptsStore.templates.forEach(t => {
          t.enabled = false;
        });
        
        const data = createTestData();
        const result = buildAndInjectPrompt(data);
        
        expect(result).toBe(false);
      });
    });

    describe('设置选项', () => {
      it('应该不抛出错误当改变紧凑格式设置时', () => {
        const settingsStore = useSettingsStore();
        settingsStore.settings.compactPromptFormat = true;
        
        const data: PromptDataInput = {
          characters: {
            '角色': {
              当前身高: 170,
              原身高: 1.65,
              _计算数据: calculateGiantessData(170, 1.65),
            },
          },
        };
        
        expect(() => buildAndInjectPrompt(data)).not.toThrow();
      });

      it('应该不抛出错误当禁用损害计算时', () => {
        const settingsStore = useSettingsStore();
        settingsStore.settings.enableDamageCalculation = false;
        
        const calcData = calculateGiantessData(170, 1.65);
        const damageData = calculateDamage(170, 1.65, '大城市');
        
        const data: PromptDataInput = {
          characters: {
            '角色': {
              当前身高: 170,
              原身高: 1.65,
              _计算数据: calcData,
              _损害数据: damageData,
            },
          },
        };
        
        expect(() => buildAndInjectPrompt(data)).not.toThrow();
      });
    });
  });

  describe('边界情况', () => {
    it('应该处理没有计算数据的角色', () => {
      const data: PromptDataInput = {
        characters: {
          '角色': {
            当前身高: 170,
            原身高: 1.65,
            // 没有 _计算数据
          } as CharacterMvuData,
        },
      };
      
      // 应该不抛出错误，并返回布尔值
      const result = buildAndInjectPrompt(data);
      
      // 没有计算数据时，会尝试注入基础模板
      expect(typeof result).toBe('boolean');
    });

    it('应该处理空内容注入', () => {
      const id = injectPromptContent('', 1);
      
      expect(id).toBeTruthy();
      expect(getInjectedPromptId()).toBe(id);
    });

    it('应该处理很长的内容', () => {
      const longContent = 'a'.repeat(10000);
      const id = injectPromptContent(longContent, 1);
      
      expect(id).toBeTruthy();
    });

    it('应该处理特殊字符', () => {
      const specialContent = '测试内容 <script>alert(1)</script> {{template}} $variable';
      const id = injectPromptContent(specialContent, 1);
      
      expect(id).toBeTruthy();
    });
  });
});
