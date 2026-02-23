/**
 * 提示词构建服务测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import {
  interpolate,
  formatBodyData,
  formatRelativeReferences,
  formatInteractionLimits,
  generateWorldviewPrompt,
  buildCharacterContext,
  generateAllDamagePrompt,
} from '@/services/prompt/builder';
import type { Worldview, DamageCalculation, PromptContext } from '@/types';
import { calculateGiantessData, calculateTinyData, calculateDamage } from '@/core';

describe('Service: prompt/builder', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // ========== interpolate ==========
  // interpolate 使用 [^}]+ 正则，支持中文/英文/数字/下划线等所有变量名
  describe('interpolate', () => {
    describe('基本变量替换', () => {
      it('应该替换单个英文变量', () => {
        const template = 'Hello, {{name}}!';
        const context = { name: 'World' } as unknown as Partial<PromptContext>;
        
        const result = interpolate(template, context);
        
        expect(result).toBe('Hello, World!');
      });

      it('应该替换多个变量', () => {
        const template = '{{name}} height is {{height}}, original is {{original}}.';
        const context = {
          name: 'Alice',
          height: '170m',
          original: '1.65m',
        } as unknown as Partial<PromptContext>;
        
        const result = interpolate(template, context);
        
        expect(result).toBe('Alice height is 170m, original is 1.65m.');
      });

      it('应该处理数字值', () => {
        const template = 'Scale is {{scale}}';
        const context = { scale: 103.03 } as unknown as Partial<PromptContext>;
        
        const result = interpolate(template, context);
        
        expect(result).toBe('Scale is 103.03');
      });

      it('应该支持下划线变量名', () => {
        const template = '{{current_height_formatted}}';
        const context = { current_height_formatted: '170米' } as unknown as Partial<PromptContext>;
        
        const result = interpolate(template, context);
        
        expect(result).toBe('170米');
      });
    });

    describe('未匹配变量处理', () => {
      it('应该保留未匹配的英文占位符', () => {
        const template = '{{known}} and {{unknown}}';
        const context = { known: 'value' } as unknown as Partial<PromptContext>;
        
        const result = interpolate(template, context);
        
        expect(result).toBe('value and {{unknown}}');
      });

      it('中文变量名应该被正确替换', () => {
        const template = '{{角色名}}';
        const context = { 角色名: '络络' } as unknown as Partial<PromptContext>;
        
        const result = interpolate(template, context);
        
        expect(result).toBe('络络');
      });

      it('空上下文应该保留所有占位符', () => {
        const template = '{{var1}}{{var2}}';
        
        const result = interpolate(template, {});
        
        expect(result).toBe('{{var1}}{{var2}}');
      });
    });

    describe('边界情况', () => {
      it('应该处理空字符串模板', () => {
        const result = interpolate('', { name: 'test' } as unknown as Partial<PromptContext>);
        
        expect(result).toBe('');
      });

      it('应该处理没有占位符的模板', () => {
        const template = '这是纯文本内容';
        
        const result = interpolate(template, { name: 'test' } as unknown as Partial<PromptContext>);
        
        expect(result).toBe('这是纯文本内容');
      });

      it('应该处理 undefined 值', () => {
        const template = '{{name}}';
        const context = { name: undefined } as unknown as Partial<PromptContext>;
        
        const result = interpolate(template, context);
        
        // undefined 不会被替换
        expect(result).toBe('{{name}}');
      });
    });
  });

  // ========== formatBodyData ==========
  describe('formatBodyData', () => {
    describe('分类格式化', () => {
      it('应该按分类组织身体数据', () => {
        const bodyParts = {
          身高: 170,
          肩膀高度: 140,
          足长: 27.3,
          足宽: 10.2,
          手掌长: 19.5,
          乳房高度: 25,
        };
        
        const result = formatBodyData(bodyParts);
        
        // 应该包含分类标题
        expect(result).toContain('身体尺寸');
        expect(result).toContain('足部');
        expect(result).toContain('手部');
        expect(result).toContain('胸部');
      });

      it('应该格式化长度值', () => {
        const bodyParts = {
          身高: 170,
          足长: 27.3,
        };
        
        const result = formatBodyData(bodyParts);
        
        // 应该包含格式化的长度（170米 或 170m 等格式）
        const hasFormattedHeight = result.includes('170米') || result.includes('170');
        expect(hasFormattedHeight).toBe(true);
      });
    });

    describe('空数据处理', () => {
      it('应该处理空对象', () => {
        const result = formatBodyData({});
        
        expect(result).toBe('');
      });

      it('应该只显示有数据的分类', () => {
        const bodyParts = {
          足长: 27.3,  // 只有足部数据
        };
        
        const result = formatBodyData(bodyParts);
        
        expect(result).toContain('足部');
        expect(result).not.toContain('身体尺寸');
        expect(result).not.toContain('手部');
      });
    });
  });

  // ========== formatRelativeReferences ==========
  describe('formatRelativeReferences', () => {
    it('应该格式化参照物列表', () => {
      const references = {
        人类: '如蚂蚁',
        汽车: '如玩具车',
        建筑: '如积木',
      };
      
      const result = formatRelativeReferences(references);
      
      expect(result).toContain('人类');
      expect(result).toContain('如蚂蚁');
      expect(result).toContain('汽车');
      expect(result).toContain('如玩具车');
    });

    it('应该每个参照物占一行', () => {
      const references = {
        物品A: '描述A',
        物品B: '描述B',
      };
      
      const result = formatRelativeReferences(references);
      const lines = result.split('\n');
      
      expect(lines.length).toBe(2);
    });

    it('应该处理空对象', () => {
      const result = formatRelativeReferences({});
      
      expect(result).toBe('');
    });
  });

  // ========== formatInteractionLimits ==========
  describe('formatInteractionLimits', () => {
    it('应该格式化互动限制', () => {
      const interactions = [
        {
          大者: '巨大娘',
          小者: '小人',
          impossible: [
            { action: '握手', reason: '体型差距过大', alternative: '用指尖轻触' },
            { action: '拥抱', reason: '会被压扁', alternative: '放在掌心' },
          ],
        },
      ];
      
      const result = formatInteractionLimits(interactions);
      
      expect(result).toContain('巨大娘');
      expect(result).toContain('小人');
      expect(result).toContain('握手');
      expect(result).toContain('体型差距过大');
      expect(result).toContain('用指尖轻触');
    });

    it('应该跳过没有限制的互动', () => {
      const interactions = [
        {
          大者: '角色A',
          小者: '角色B',
          impossible: [],  // 空限制
        },
      ];
      
      const result = formatInteractionLimits(interactions);
      
      expect(result).toBe('');
    });

    it('应该处理多对互动', () => {
      const interactions = [
        {
          大者: 'A',
          小者: 'B',
          impossible: [{ action: '动作1', reason: '原因1', alternative: '替代1' }],
        },
        {
          大者: 'B',
          小者: 'C',
          impossible: [{ action: '动作2', reason: '原因2', alternative: '替代2' }],
        },
      ];
      
      const result = formatInteractionLimits(interactions);
      
      expect(result).toContain('A ↔ B');
      expect(result).toContain('B ↔ C');
    });
  });

  // ========== generateWorldviewPrompt ==========
  describe('generateWorldviewPrompt', () => {
    const mockWorldview: Worldview = {
      id: 'test',
      name: '测试世界观',
      icon: '🧪',
      description: '这是一个测试世界观',
      mechanism: '通过测试机制变化',
      bodyCharacteristics: '身体保持测试特性',
      limitations: ['限制1', '限制2'],
      specialRules: ['规则1'],
      writingTips: ['建议1', '建议2'],
      builtin: false,
    };

    it('应该生成完整的世界观提示词', () => {
      const result = generateWorldviewPrompt(mockWorldview);
      
      expect(result).toContain('测试世界观');
      expect(result).toContain('这是一个测试世界观');
      expect(result).toContain('通过测试机制变化');
      expect(result).toContain('身体保持测试特性');
    });

    it('应该包含限制与代价', () => {
      const result = generateWorldviewPrompt(mockWorldview);
      
      expect(result).toContain('限制与代价');
      expect(result).toContain('限制1');
      expect(result).toContain('限制2');
    });

    it('应该包含特殊规则', () => {
      const result = generateWorldviewPrompt(mockWorldview);
      
      expect(result).toContain('特殊规则');
      expect(result).toContain('规则1');
    });

    it('应该包含写作建议', () => {
      const result = generateWorldviewPrompt(mockWorldview);
      
      expect(result).toContain('写作建议');
      expect(result).toContain('建议1');
    });

    it('当限制为「无」时不应该显示限制部分', () => {
      const noLimitWorldview: Worldview = {
        ...mockWorldview,
        limitations: ['无'],
      };
      
      const result = generateWorldviewPrompt(noLimitWorldview);
      
      expect(result).not.toContain('限制与代价');
    });

    it('当限制为空时不应该显示限制部分', () => {
      const noLimitWorldview: Worldview = {
        ...mockWorldview,
        limitations: [],
      };
      
      const result = generateWorldviewPrompt(noLimitWorldview);
      
      expect(result).not.toContain('限制与代价');
    });
  });

  // ========== buildCharacterContext ==========
  describe('buildCharacterContext', () => {
    describe('巨大娘上下文', () => {
      it('应该构建完整的角色上下文', () => {
        const calcData = calculateGiantessData(170, 1.65);
        
        const context = buildCharacterContext('络络', calcData, 1.65);
        
        expect(context.角色名).toBe('络络');
        expect(context.当前身高).toBe(170);
        expect(context.当前身高_格式化).toBeDefined();
        expect(context.原身高).toBe(1.65);
        expect(context.倍率).toBeCloseTo(103.03, 1);
        expect(context.级别).toBeDefined();
        expect(context.身体数据).toBeDefined();
        expect(context.相对参照).toBeDefined();
      });

      it('当有自定义部位时应该包含自定义部位信息', () => {
        const customParts = { 足长: 50 };
        const calcData = calculateGiantessData(170, 1.65, customParts);
        
        const context = buildCharacterContext('络络', calcData, 1.65);
        
        expect(context.自定义部位).toContain('自定义部位');
        expect(context.自定义部位).toContain('足长');
      });

      it('当有世界观时应该包含世界观提示词', () => {
        const calcData = calculateGiantessData(170, 1.65);
        const worldview: Worldview = {
          id: 'test',
          name: '测试世界观',
          icon: '🧪',
          description: '描述',
          mechanism: '机制',
          bodyCharacteristics: '特性',
          limitations: [],
          specialRules: [],
          writingTips: [],
          builtin: false,
        };
        
        const context = buildCharacterContext('络络', calcData, 1.65, {
          worldview,
        });
        
        expect(context.世界观提示词).toContain('测试世界观');
        expect(context.世界观名称).toBe('测试世界观');
      });
    });

    describe('小人上下文', () => {
      it('应该构建小人角色上下文', () => {
        const calcData = calculateTinyData(0.017, 1.70);
        
        const context = buildCharacterContext('小明', calcData, 1.70);
        
        expect(context.角色名).toBe('小明');
        expect(context.当前身高).toBe(0.017);
        expect(context.倍率).toBeCloseTo(0.01, 2);
      });
    });

    describe('损害数据', () => {
      it('当启用损害计算时应该包含损害数据', () => {
        const calcData = calculateGiantessData(170, 1.65);
        const damageData = calculateDamage(170, 1.65, '大城市');
        
        const context = buildCharacterContext('络络', calcData, 1.65, {
          damageData,
          enableDamageCalculation: true,
        });
        
        expect(context.损害数据).toBeDefined();
        expect(context.损害数据.length).toBeGreaterThan(0);
      });

      it('当禁用损害计算时损害数据应该为空', () => {
        const calcData = calculateGiantessData(170, 1.65);
        const damageData = calculateDamage(170, 1.65, '大城市');
        
        const context = buildCharacterContext('络络', calcData, 1.65, {
          damageData,
          enableDamageCalculation: false,
        });
        
        expect(context.损害数据).toBe('');
      });
    });
  });

  // ========== generateAllDamagePrompt ==========
  describe('generateAllDamagePrompt', () => {
    const createMockDamageData = (height: number): { name: string; damageData: DamageCalculation } => {
      return {
        name: `角色${height}`,
        damageData: calculateDamage(height, 1.65, '大城市'),
      };
    };

    describe('空数据处理', () => {
      it('当没有角色数据时应该返回空字符串', () => {
        const result = generateAllDamagePrompt([]);
        
        expect(result).toBe('');
      });
    });

    describe('单角色', () => {
      it('应该生成单个角色的损害提示词', () => {
        const damages = [createMockDamageData(170)];
        
        const result = generateAllDamagePrompt(damages);
        
        expect(result).toContain('角色170');
        expect(result).toContain('破坏力等级');
      });
    });

    describe('多角色', () => {
      it('应该生成多个角色的损害提示词', () => {
        const damages = [
          createMockDamageData(170),
          createMockDamageData(1700),
        ];
        
        const result = generateAllDamagePrompt(damages);
        
        expect(result).toContain('角色170');
        expect(result).toContain('角色1700');
      });

      it('当启用汇总时应该包含总计信息', () => {
        const damages = [
          createMockDamageData(170),
          createMockDamageData(1700),
        ];
        
        const result = generateAllDamagePrompt(damages, {
          showSummary: true,
        });
        
        expect(result).toContain('总计损害');
        expect(result).toContain('参与角色数');
      });

      it('当禁用汇总时不应该包含总计信息', () => {
        const damages = [
          createMockDamageData(170),
          createMockDamageData(1700),
        ];
        
        const result = generateAllDamagePrompt(damages, {
          showSummary: false,
        });
        
        expect(result).not.toContain('总计损害');
      });
    });

    describe('显示选项', () => {
      it('当禁用按角色显示时应该只显示汇总', () => {
        const damages = [
          createMockDamageData(170),
          createMockDamageData(1700),
        ];
        
        const result = generateAllDamagePrompt(damages, {
          showPerCharacter: false,
          showSummary: true,
        });
        
        // 应该只有汇总，没有单独的角色数据
        expect(result).toContain('总计损害');
      });

      it('紧凑模式应该生成更短的输出', () => {
        const damages = [createMockDamageData(170)];
        
        const normalResult = generateAllDamagePrompt(damages, {
          compact: false,
        });
        const compactResult = generateAllDamagePrompt(damages, {
          compact: true,
        });
        
        // 紧凑模式通常更短
        expect(compactResult.length).toBeLessThanOrEqual(normalResult.length);
      });
    });
  });
});
