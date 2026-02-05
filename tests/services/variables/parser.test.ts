/**
 * AI 输出解析服务测试
 * 
 * 测试从 AI 输出中解析变量更新命令的功能
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mvuMock, variablesMock } from '../../setup';
import {
  parseValue,
  parseGtsUpdateCommands,
  parseStandaloneSetCommands,
  parseAllUpdateCommands,
  hasUpdateCommands,
  getAffectedCharacters,
} from '@/services/variables/parser';
import { useSettingsStore } from '@/stores/settings';

describe('Service: variables/parser', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mvuMock.__reset();
    variablesMock.__reset();
  });

  // ========== parseValue ==========
  describe('parseValue', () => {
    describe('数字解析', () => {
      it('应该解析整数', () => {
        expect(parseValue('123')).toBe(123);
        expect(parseValue('-456')).toBe(-456);
        expect(parseValue('0')).toBe(0);
      });

      it('应该解析小数', () => {
        expect(parseValue('3.14')).toBeCloseTo(3.14);
        expect(parseValue('-0.5')).toBeCloseTo(-0.5);
        expect(parseValue('170.5')).toBeCloseTo(170.5);
      });

      it('应该处理带空格的数字', () => {
        expect(parseValue('  123  ')).toBe(123);
        expect(parseValue('\n456\n')).toBe(456);
      });
    });

    describe('字符串解析', () => {
      it('应该解析单引号字符串', () => {
        expect(parseValue("'hello'")).toBe('hello');
        expect(parseValue("'喝下药水'")).toBe('喝下药水');
      });

      it('应该解析双引号字符串', () => {
        expect(parseValue('"world"')).toBe('world');
        expect(parseValue('"变化原因"')).toBe('变化原因');
      });

      it('应该处理空字符串', () => {
        expect(parseValue("''")).toBe('');
        expect(parseValue('""')).toBe('');
      });
    });

    describe('布尔值解析', () => {
      it('应该解析 true', () => {
        expect(parseValue('true')).toBe(true);
      });

      it('应该解析 false', () => {
        expect(parseValue('false')).toBe(false);
      });
    });

    describe('null/undefined 解析', () => {
      it('应该解析 null', () => {
        expect(parseValue('null')).toBe(null);
      });

      it('应该解析 undefined', () => {
        expect(parseValue('undefined')).toBe(undefined);
      });
    });

    describe('JSON 解析', () => {
      it('应该解析 JSON 对象', () => {
        const result = parseValue('{"name": "test", "value": 123}');
        expect(result).toEqual({ name: 'test', value: 123 });
      });

      it('应该解析 JSON 数组', () => {
        const result = parseValue('[1, 2, 3]');
        expect(result).toEqual([1, 2, 3]);
      });

      it('应该处理无效 JSON 并返回原字符串', () => {
        const result = parseValue('{invalid json}');
        expect(result).toBe('{invalid json}');
      });
    });

    describe('默认行为', () => {
      it('无法匹配的值应该返回原字符串', () => {
        expect(parseValue('some text')).toBe('some text');
        expect(parseValue('abc123')).toBe('abc123');
      });
    });
  });

  // ========== parseGtsUpdateCommands ==========
  describe('parseGtsUpdateCommands', () => {
    describe('基本解析', () => {
      it('应该解析单个 gts_update 标签', () => {
        const text = `
          <gts_update>
          _.set('巨大娘.角色.络络.当前身高', 170);
          </gts_update>
        `;

        const updates = parseGtsUpdateCommands(text);

        expect(updates).toHaveLength(1);
        expect(updates[0]).toEqual({
          path: '巨大娘.角色.络络.当前身高',
          value: 170,
        });
      });

      it('应该解析多个 _.set 命令', () => {
        const text = `
          <gts_update>
          _.set('巨大娘.角色.络络.当前身高', 170);
          _.set('巨大娘.角色.络络.原身高', 1.65);
          _.set('巨大娘.角色.络络.变化原因', '喝下药水');
          </gts_update>
        `;

        const updates = parseGtsUpdateCommands(text);

        expect(updates).toHaveLength(3);
        expect(updates[0].path).toBe('巨大娘.角色.络络.当前身高');
        expect(updates[0].value).toBe(170);
        expect(updates[1].value).toBeCloseTo(1.65);
        expect(updates[2].value).toBe('喝下药水');
      });

      it('应该解析双引号路径', () => {
        const text = `
          <gts_update>
          _.set("巨大娘.角色.络络.当前身高", 200);
          </gts_update>
        `;

        const updates = parseGtsUpdateCommands(text);

        expect(updates).toHaveLength(1);
        expect(updates[0].path).toBe('巨大娘.角色.络络.当前身高');
        expect(updates[0].value).toBe(200);
      });
    });

    describe('多个标签', () => {
      it('应该解析多个 gts_update 标签', () => {
        const text = `
          角色 A 的变化：
          <gts_update>
          _.set('巨大娘.角色.络络.当前身高', 170);
          </gts_update>
          
          角色 B 的变化：
          <gts_update>
          _.set('巨大娘.角色.小明.当前身高', 0.017);
          </gts_update>
        `;

        const updates = parseGtsUpdateCommands(text);

        expect(updates).toHaveLength(2);
        expect(updates[0].path).toContain('络络');
        expect(updates[1].path).toContain('小明');
      });
    });

    describe('边界情况', () => {
      it('应该处理空文本', () => {
        expect(parseGtsUpdateCommands('')).toEqual([]);
      });

      it('应该处理没有 gts_update 标签的文本', () => {
        const text = '这是一段普通的对话文本';
        expect(parseGtsUpdateCommands(text)).toEqual([]);
      });

      it('应该处理空的 gts_update 标签', () => {
        const text = '<gts_update></gts_update>';
        expect(parseGtsUpdateCommands(text)).toEqual([]);
      });

      it('应该处理没有分号的命令', () => {
        const text = `
          <gts_update>
          _.set('巨大娘.角色.络络.当前身高', 170)
          </gts_update>
        `;

        const updates = parseGtsUpdateCommands(text);
        expect(updates).toHaveLength(1);
        expect(updates[0].value).toBe(170);
      });

      it('应该忽略大小写的标签', () => {
        const text = `
          <GTS_UPDATE>
          _.set('巨大娘.角色.络络.当前身高', 170);
          </GTS_UPDATE>
        `;

        const updates = parseGtsUpdateCommands(text);
        expect(updates).toHaveLength(1);
      });
    });
  });

  // ========== parseStandaloneSetCommands ==========
  describe('parseStandaloneSetCommands', () => {
    beforeEach(() => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.variablePrefix = '巨大娘';
    });

    it('应该解析独立的 _.set 命令', () => {
      const text = `
        角色络络喝下了药水...
        _.set('巨大娘.角色.络络.当前身高', 170);
        她感觉身体开始变化...
      `;

      const updates = parseStandaloneSetCommands(text);

      expect(updates).toHaveLength(1);
      expect(updates[0].path).toBe('巨大娘.角色.络络.当前身高');
      expect(updates[0].value).toBe(170);
    });

    it('应该跳过 gts_update 标签内的命令', () => {
      const text = `
        <gts_update>
        _.set('巨大娘.角色.络络.当前身高', 170);
        </gts_update>
        
        _.set('巨大娘.角色.小明.当前身高', 0.017);
      `;

      const updates = parseStandaloneSetCommands(text);

      // 只应该解析标签外的命令
      expect(updates).toHaveLength(1);
      expect(updates[0].path).toContain('小明');
    });

    it('应该只解析包含正确前缀的命令', () => {
      const text = `
        _.set('巨大娘.角色.络络.当前身高', 170);
        _.set('其他变量.数据', 123);
      `;

      const updates = parseStandaloneSetCommands(text);

      expect(updates).toHaveLength(1);
      expect(updates[0].path).toContain('巨大娘');
    });
  });

  // ========== parseAllUpdateCommands ==========
  describe('parseAllUpdateCommands', () => {
    beforeEach(() => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.variablePrefix = '巨大娘';
    });

    it('应该合并标签内和独立的命令', () => {
      const text = `
        <gts_update>
        _.set('巨大娘.角色.络络.当前身高', 170);
        </gts_update>
        
        _.set('巨大娘.角色.小明.当前身高', 0.017);
      `;

      const updates = parseAllUpdateCommands(text);

      expect(updates).toHaveLength(2);
    });

    it('应该去重相同路径的更新（后者覆盖前者）', () => {
      const text = `
        <gts_update>
        _.set('巨大娘.角色.络络.当前身高', 100);
        </gts_update>
        
        _.set('巨大娘.角色.络络.当前身高', 200);
      `;

      const updates = parseAllUpdateCommands(text);

      expect(updates).toHaveLength(1);
      expect(updates[0].value).toBe(200); // 后者覆盖前者
    });
  });

  // ========== hasUpdateCommands ==========
  describe('hasUpdateCommands', () => {
    beforeEach(() => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.variablePrefix = '巨大娘';
    });

    it('应该检测 gts_update 标签', () => {
      const text = '<gts_update>_.set("x", 1);</gts_update>';
      expect(hasUpdateCommands(text)).toBe(true);
    });

    it('应该检测独立的 _.set 命令', () => {
      const text = "_.set('巨大娘.角色.络络.身高', 170)";
      expect(hasUpdateCommands(text)).toBe(true);
    });

    it('应该对普通文本返回 false', () => {
      const text = '这是一段普通的对话文本';
      expect(hasUpdateCommands(text)).toBe(false);
    });

    it('应该对不包含正确前缀的 _.set 返回 false', () => {
      const text = "_.set('其他变量.数据', 123)";
      expect(hasUpdateCommands(text)).toBe(false);
    });
  });

  // ========== getAffectedCharacters ==========
  describe('getAffectedCharacters', () => {
    beforeEach(() => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.variablePrefix = '巨大娘';
    });

    it('应该提取单个角色名', () => {
      const updates = [
        { path: '巨大娘.角色.络络.当前身高', value: 170 },
        { path: '巨大娘.角色.络络.变化原因', value: '喝下药水' },
      ];

      const characters = getAffectedCharacters(updates);

      expect(characters).toEqual(['络络']);
    });

    it('应该提取多个角色名', () => {
      const updates = [
        { path: '巨大娘.角色.络络.当前身高', value: 170 },
        { path: '巨大娘.角色.小明.当前身高', value: 0.017 },
        { path: '巨大娘.角色.小红.当前身高', value: 200 },
      ];

      const characters = getAffectedCharacters(updates);

      expect(characters).toHaveLength(3);
      expect(characters).toContain('络络');
      expect(characters).toContain('小明');
      expect(characters).toContain('小红');
    });

    it('应该去重角色名', () => {
      const updates = [
        { path: '巨大娘.角色.络络.当前身高', value: 170 },
        { path: '巨大娘.角色.络络.原身高', value: 1.65 },
        { path: '巨大娘.角色.络络.变化原因', value: '喝下药水' },
      ];

      const characters = getAffectedCharacters(updates);

      expect(characters).toEqual(['络络']);
    });

    it('应该忽略非角色路径', () => {
      const updates = [
        { path: '巨大娘._场景.当前场景', value: '大城市' },
        { path: '巨大娘._互动限制.络络_小明', value: {} },
      ];

      const characters = getAffectedCharacters(updates);

      expect(characters).toEqual([]);
    });

    it('应该处理空数组', () => {
      expect(getAffectedCharacters([])).toEqual([]);
    });
  });
});
