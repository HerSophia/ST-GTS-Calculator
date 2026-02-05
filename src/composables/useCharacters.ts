/**
 * 角色管理逻辑 Composable
 * 处理角色列表和损害数据
 */
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useCharactersStore, type CharacterData } from '../characters';
import { useSettingsStore } from '../settings';

/**
 * 判断角色是否为巨大娘
 */
function isGiantCharacter(c: CharacterData): boolean {
  return c.currentHeight / c.originalHeight >= 1;
}

/**
 * 判断角色是否为小人
 */
function isTinyCharacter(c: CharacterData): boolean {
  return c.currentHeight / c.originalHeight < 1;
}

export function useCharacters() {
  const charactersStore = useCharactersStore();
  const settingsStore = useSettingsStore();
  
  const { characters } = storeToRefs(charactersStore);
  const { settings } = storeToRefs(settingsStore);

  /**
   * 刷新角色数据
   */
  const refreshCharacters = () => {
    charactersStore.refresh();
  };

  /**
   * 重新计算损害数据
   */
  const recalculateDamage = () => {
    charactersStore.recalculateDamage();
  };

  /**
   * 获取损害汇总（响应式）
   */
  const damageSummary = computed(() => charactersStore.getDamageSummary());

  /**
   * 角色数组
   */
  const characterList = computed((): CharacterData[] => 
    Array.from(characters.value.values())
  );

  /**
   * 巨大娘角色列表
   */
  const giantCharacters = computed(() => 
    characterList.value.filter(isGiantCharacter)
  );

  /**
   * 小人角色列表
   */
  const tinyCharacters = computed(() => 
    characterList.value.filter(isTinyCharacter)
  );

  /**
   * 角色总数
   */
  const characterCount = computed(() => characters.value.size);

  /**
   * 是否启用损害计算
   */
  const isDamageEnabled = computed(() => settings.value.enableDamageCalculation);

  /**
   * 格式化损害范围
   */
  const formatDamageRange = (min: number, max: number): string => {
    const formatNum = (n: number): string => {
      if (n >= 1e8) return `${(n / 1e8).toFixed(1)}亿`;
      if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`;
      if (n >= 1000) return `${(n / 1000).toFixed(1)}千`;
      return Math.round(n).toString();
    };
    
    if (min === 0 && max === 0) return '0';
    if (min === max) return formatNum(min);
    return `${formatNum(min)}-${formatNum(max)}`;
  };

  return {
    // 状态
    characters,
    characterList,
    giantCharacters,
    tinyCharacters,
    characterCount,
    damageSummary,
    isDamageEnabled,
    // 方法
    refreshCharacters,
    recalculateDamage,
    formatDamageRange,
  };
}
