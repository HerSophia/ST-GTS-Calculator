/**
 * useCharacters Composable 测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupTestPinia } from '../mocks/pinia';
import { useCharacters } from '@/composables/useCharacters';
// useCharactersStore 在 src/characters.ts 中，不是 stores/characters.ts
import { useCharactersStore } from '@/characters';
import { useSettingsStore } from '@/stores/settings';
import type { CharacterData } from '@/types';

describe('Composable: useCharacters', () => {
  beforeEach(() => {
    setupTestPinia();
    vi.clearAllMocks();
  });

  /**
   * 创建测试角色数据
   */
  function createTestCharacter(overrides: Partial<CharacterData> = {}): CharacterData {
    return {
      name: '测试角色',
      currentHeight: 170,
      originalHeight: 1.65,
      changeReason: '测试原因',
      calcData: undefined,
      damageData: undefined,
      actualDamage: undefined,
      customParts: {},
      ...overrides,
    };
  }

  describe('初始状态', () => {
    it('应该有正确的默认值', () => {
      const {
        characters,
        characterList,
        giantCharacters,
        tinyCharacters,
        characterCount,
        isDamageEnabled,
      } = useCharacters();

      expect(characters.value.size).toBe(0);
      expect(characterList.value).toEqual([]);
      expect(giantCharacters.value).toEqual([]);
      expect(tinyCharacters.value).toEqual([]);
      expect(characterCount.value).toBe(0);
      expect(isDamageEnabled.value).toBe(false);
    });
  });

  describe('characterList computed', () => {
    it('应该将 Map 转换为数组', () => {
      const charactersStore = useCharactersStore();
      const char1 = createTestCharacter({ name: '角色1' });
      const char2 = createTestCharacter({ name: '角色2' });
      charactersStore.characters.set('角色1', char1);
      charactersStore.characters.set('角色2', char2);

      const { characterList } = useCharacters();

      expect(characterList.value).toHaveLength(2);
      expect(characterList.value.map(c => c.name)).toContain('角色1');
      expect(characterList.value.map(c => c.name)).toContain('角色2');
    });
  });

  describe('giantCharacters / tinyCharacters computed', () => {
    it('应该正确分类巨大娘和小人', () => {
      const charactersStore = useCharactersStore();
      const giantess = createTestCharacter({ 
        name: '巨大娘', 
        currentHeight: 165, // 100倍
        originalHeight: 1.65 
      });
      const tiny = createTestCharacter({ 
        name: '小人', 
        currentHeight: 0.017, // 约1%
        originalHeight: 1.70 
      });
      const normal = createTestCharacter({ 
        name: '普通人', 
        currentHeight: 1.65, // 1倍
        originalHeight: 1.65 
      });
      
      charactersStore.characters.set('巨大娘', giantess);
      charactersStore.characters.set('小人', tiny);
      charactersStore.characters.set('普通人', normal);

      const { giantCharacters, tinyCharacters } = useCharacters();

      // 巨大娘和普通人（倍率>=1）都算作巨大娘
      expect(giantCharacters.value).toHaveLength(2);
      expect(giantCharacters.value.map(c => c.name)).toContain('巨大娘');
      expect(giantCharacters.value.map(c => c.name)).toContain('普通人');
      
      // 小人（倍率<1）
      expect(tinyCharacters.value).toHaveLength(1);
      expect(tinyCharacters.value[0].name).toBe('小人');
    });

    it('边界情况：倍率刚好为 1 应该归类为巨大娘', () => {
      const charactersStore = useCharactersStore();
      const char = createTestCharacter({ 
        name: '正常体型', 
        currentHeight: 1.65, 
        originalHeight: 1.65 
      });
      charactersStore.characters.set('正常体型', char);

      const { giantCharacters, tinyCharacters } = useCharacters();

      expect(giantCharacters.value).toHaveLength(1);
      expect(tinyCharacters.value).toHaveLength(0);
    });
  });

  describe('characterCount computed', () => {
    it('应该返回角色总数', () => {
      const charactersStore = useCharactersStore();
      const { characterCount } = useCharacters();

      expect(characterCount.value).toBe(0);

      charactersStore.characters.set('角色1', createTestCharacter({ name: '角色1' }));
      expect(characterCount.value).toBe(1);

      charactersStore.characters.set('角色2', createTestCharacter({ name: '角色2' }));
      expect(characterCount.value).toBe(2);
    });
  });

  describe('isDamageEnabled computed', () => {
    it('应该反映设置中的损害计算开关状态', () => {
      const settingsStore = useSettingsStore();
      const { isDamageEnabled } = useCharacters();

      expect(isDamageEnabled.value).toBe(false);

      // 直接修改 settings.value 而不是调用 updateSettings
      settingsStore.settings.enableDamageCalculation = true;

      expect(isDamageEnabled.value).toBe(true);
    });
  });

  describe('refreshCharacters', () => {
    it('应该调用 store 的 refresh 方法', () => {
      const charactersStore = useCharactersStore();
      const refreshSpy = vi.spyOn(charactersStore, 'refresh');

      const { refreshCharacters } = useCharacters();
      refreshCharacters();

      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe('recalculateDamage', () => {
    it('应该调用 store 的 recalculateDamage 方法', () => {
      const charactersStore = useCharactersStore();
      const recalcSpy = vi.spyOn(charactersStore, 'recalculateDamage');

      const { recalculateDamage } = useCharacters();
      recalculateDamage();

      expect(recalcSpy).toHaveBeenCalled();
    });
  });

  describe('formatDamageRange', () => {
    it('当 min 和 max 都为 0 时，应该返回 "0"', () => {
      const { formatDamageRange } = useCharacters();
      expect(formatDamageRange(0, 0)).toBe('0');
    });

    it('当 min 等于 max 时，应该只返回一个数值', () => {
      const { formatDamageRange } = useCharacters();
      expect(formatDamageRange(100, 100)).toBe('100');
      expect(formatDamageRange(5000, 5000)).toBe('5.0千');
    });

    it('应该正确格式化千级数值', () => {
      const { formatDamageRange } = useCharacters();
      expect(formatDamageRange(1000, 2000)).toBe('1.0千-2.0千');
    });

    it('应该正确格式化万级数值', () => {
      const { formatDamageRange } = useCharacters();
      expect(formatDamageRange(10000, 50000)).toBe('1.0万-5.0万');
    });

    it('应该正确格式化亿级数值', () => {
      const { formatDamageRange } = useCharacters();
      expect(formatDamageRange(100000000, 200000000)).toBe('1.0亿-2.0亿');
    });

    it('应该正确格式化混合数值', () => {
      const { formatDamageRange } = useCharacters();
      expect(formatDamageRange(500, 10000)).toBe('500-1.0万');
    });
  });

  describe('damageSummary computed', () => {
    it('应该调用 store 的 getDamageSummary 方法', () => {
      const charactersStore = useCharactersStore();
      const getSummarySpy = vi.spyOn(charactersStore, 'getDamageSummary');

      const { damageSummary } = useCharacters();
      // 访问 computed 值以触发计算
      void damageSummary.value;

      expect(getSummarySpy).toHaveBeenCalled();
    });
  });
});
