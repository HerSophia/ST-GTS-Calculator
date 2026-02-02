/**
 * 巨大娘计算器 - 损害计算扩展
 * 
 * 将损害计算功能封装为扩展
 * 
 * @module services/extensions/damage-extension
 */

import type { Extension, CharacterData, PromptTemplate, GiantessData, TinyData } from '../../types';
import { calculateDamage, generateDamagePrompt } from '../../core/damage';
import { useSettingsStore } from '../../stores/settings';

/**
 * 损害计算扩展 ID
 */
export const DAMAGE_EXTENSION_ID = 'damage-calculation';

/**
 * 损害计算扩展定义
 */
export const damageExtension: Extension = {
  id: DAMAGE_EXTENSION_ID,
  name: '损害计算',
  description: '计算巨大娘行动可能造成的破坏（伤亡、建筑损毁等）',
  icon: 'fa-solid fa-explosion',
  defaultEnabled: false, // 默认不启用，需要用户手动开启

  onInit() {
    console.log('[DamageExtension] 初始化');
  },

  onEnable() {
    console.log('[DamageExtension] 损害计算已启用');
    // 可以在这里触发重新计算
  },

  onDisable() {
    console.log('[DamageExtension] 损害计算已禁用');
  },

  /**
   * 角色数据更新时计算损害
   */
  onCharacterUpdate(
    character: CharacterData,
    calcData: GiantessData | TinyData
  ): Record<string, unknown> | void {
    // 只对巨大娘计算损害（倍率 >= 1 表示是巨大娘）
    if (calcData.倍率 < 1) {
      return;
    }

    const settingsStore = useSettingsStore();
    
    // 获取场景：优先使用 MVU 变量中的场景，否则使用设置中的默认场景
    let scenario = settingsStore.settings.damageScenario;
    try {
      const variables = getVariables({ type: 'message', message_id: 'latest' });
      const prefix = settingsStore.settings.variablePrefix;
      const scenarioData = _.get(variables, `stat_data.${prefix}._场景`) as
        | { 当前场景?: string }
        | undefined;
      if (scenarioData?.当前场景) {
        scenario = scenarioData.当前场景;
      }
    } catch {
      // 忽略错误，使用默认场景
    }

    try {
      const damageData = calculateDamage(
        character.currentHeight,
        character.originalHeight,
        scenario as Parameters<typeof calculateDamage>[2]
      );

      console.log(`[DamageExtension] 已计算 ${character.name} 的损害数据:`, {
        破坏力等级: damageData.破坏力等级,
        场景: scenario,
      });

      // 返回要写入 MVU 变量的额外数据
      return {
        _损害数据: damageData,
      };
    } catch (e) {
      console.error('[DamageExtension] 计算损害数据失败:', e);
      return;
    }
  },

  /**
   * 贡献损害计算相关的提示词模板
   */
  getPromptTemplates(): PromptTemplate[] {
    return [
      {
        id: 'damage-calculation',
        name: '损害计算',
        description: '每个角色行动可能造成的破坏数据',
        enabled: true,
        order: 25, // 在角色数据之后
        type: 'damage',
        builtin: true,
        requiresFeature: 'damageCalculation',
        content: `---

# 破坏力数据

{{损害数据}}`,
      },
      {
        id: 'damage-rules',
        name: '损害描写指南',
        description: '指导 AI 如何描写破坏场景',
        enabled: false, // 默认不启用
        order: 90,
        type: 'footer',
        builtin: true,
        requiresFeature: 'damageCalculation',
        content: `## 破坏描写指南

在描写巨大娘造成的破坏时，请注意：

1. **规模感**：根据破坏力等级，准确描写破坏范围
2. **细节描写**：
   - 建筑级：描写建筑如何倒塌、碎片如何飞散
   - 城区级：描写整片区域如何被夷平
   - 城市级及以上：描写宏观视角的毁灭景象
3. **特殊效应**：根据身高等级，描写相应的物理效应（地震、海啸等）
4. **伤亡描写**：根据场景和密度，合理描写人员伤亡情况
5. **情感基调**：根据世界观设定，调整描写的情感基调`,
      },
    ];
  },
};

/**
 * 为角色生成损害提示词
 */
export function generateDamagePromptForCharacter(
  characterName: string,
  character: CharacterData
): string | null {
  if (!character.damageData) {
    return null;
  }

  return generateDamagePrompt(characterName, character.damageData);
}
