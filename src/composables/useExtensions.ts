/**
 * 扩展系统逻辑 Composable
 * 处理扩展功能的开关和配置
 */
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore, DAMAGE_SCENARIOS } from '../settings';
import { useCharactersStore } from '../characters';
import { syncExtensionsWithSettings } from '../services/extensions';

export function useExtensions() {
  const settingsStore = useSettingsStore();
  const charactersStore = useCharactersStore();
  const { settings } = storeToRefs(settingsStore);

  /**
   * 损害计算是否启用
   */
  const isDamageEnabled = computed({
    get: () => settings.value.enableDamageCalculation,
    set: (value: boolean) => {
      settings.value.enableDamageCalculation = value;
      onDamageToggle(value);
    },
  });

  /**
   * 损害计算开关变化处理
   */
  const onDamageToggle = (enabled: boolean) => {
    // 同步扩展状态
    syncExtensionsWithSettings();
    
    if (enabled) {
      // 开启时重新计算所有角色的损害
      charactersStore.recalculateDamage();
      toastr.success('损害计算已启用');
    } else {
      toastr.info('损害计算已禁用');
    }
  };

  /**
   * 获取损害汇总
   */
  const damageSummary = computed(() => charactersStore.getDamageSummary());

  /**
   * 损害场景选项
   */
  const damageScenarios = DAMAGE_SCENARIOS;

  /**
   * 当前损害场景
   */
  const currentScenario = computed({
    get: () => settings.value.damageScenario,
    set: (value: string) => {
      settings.value.damageScenario = value;
      // 场景变化时重新计算
      if (settings.value.enableDamageCalculation) {
        charactersStore.recalculateDamage();
      }
    },
  });

  /**
   * 是否注入损害提示词
   */
  const injectDamagePrompt = computed({
    get: () => settings.value.injectDamagePrompt,
    set: (value: boolean) => {
      settings.value.injectDamagePrompt = value;
    },
  });

  /**
   * 是否显示特殊效应
   */
  const showSpecialEffects = computed({
    get: () => settings.value.showSpecialEffects,
    set: (value: boolean) => {
      settings.value.showSpecialEffects = value;
    },
  });

  /**
   * 是否按角色显示损害
   */
  const showDamagePerCharacter = computed({
    get: () => settings.value.showDamagePerCharacter,
    set: (value: boolean) => {
      settings.value.showDamagePerCharacter = value;
    },
  });

  /**
   * 是否显示损害汇总
   */
  const showDamageSummary = computed({
    get: () => settings.value.showDamageSummary,
    set: (value: boolean) => {
      settings.value.showDamageSummary = value;
    },
  });

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
    isDamageEnabled,
    damageSummary,
    damageScenarios,
    currentScenario,
    injectDamagePrompt,
    showSpecialEffects,
    showDamagePerCharacter,
    showDamageSummary,
    // 方法
    onDamageToggle,
    formatDamageRange,
  };
}
