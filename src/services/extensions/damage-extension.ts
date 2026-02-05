/**
 * 巨大娘计算器 - 损害计算扩展
 *
 * 将损害计算功能封装为扩展
 *
 * @module services/extensions/damage-extension
 */

import { defineComponent, h, type Component } from 'vue';
import type {
  Extension,
  CharacterData,
  PromptTemplate,
  GiantessData,
  TinyData,
  CharacterCardContext,
} from '../../types';
import { calculateDamage, generateDamagePrompt } from '../../core/damage';
import { useSettingsStore } from '../../stores/settings';
import { useCharactersStoreBase } from '../../stores/characters';

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
    const charactersStore = useCharactersStoreBase();
    
    // 获取场景：优先使用 Store 中的场景，否则使用设置中的默认场景
    let scenario = settingsStore.settings.damageScenario;
    const storeScenario = charactersStore.getCurrentScenario();
    if (storeScenario) {
      scenario = storeScenario;
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
        order: 9975, // order 越大越靠前
        type: 'damage',
        builtin: true,
        readonly: true,
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
        order: 9955, // order 越大越靠前
        type: 'footer',
        builtin: true,
        readonly: true,
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

  /**
   * 判断是否应该显示损害卡片内容
   */
  shouldShowCardContent(context: CharacterCardContext): boolean {
    // 只有巨大娘（倍率 >= 1）且有损害数据时才显示
    const character = context.character;
    if (!character.damageData) return false;
    if (!character.calcData || character.calcData.倍率 < 1) return false;
    return true;
  },

  /**
   * 贡献角色卡片的损害数据展示组件
   */
  getCharacterCardExtra(): Component {
    return defineComponent({
      name: 'DamageCardContent',
      props: {
        character: {
          type: Object,
          required: true,
        },
        calcData: {
          type: Object,
          default: null,
        },
        expanded: {
          type: Boolean,
          default: false,
        },
      },
      setup(props) {
        return () => {
          const damageData = props.character?.damageData;
          if (!damageData) return null;

          // 渲染损害数据卡片
          return h(
            'div',
            {
              class: 'gc-ext-damage-section',
            },
            [
              // 标题行
              h('div', { class: 'gc-ext-section-title' }, [
                h('i', { class: 'fa-solid fa-explosion' }),
                h('span', ' 破坏力数据'),
                h('span', { class: 'gc-ext-badge damage' }, damageData.破坏力等级),
              ]),
              // 数据网格
              h('div', { class: 'gc-ext-grid' }, [
                h('div', { class: 'gc-ext-item' }, [
                  h('div', { class: 'gc-ext-label' }, '足迹面积'),
                  h('div', { class: 'gc-ext-value' }, damageData.足迹?.足迹面积_格式化 || '-'),
                ]),
                h('div', { class: 'gc-ext-item' }, [
                  h('div', { class: 'gc-ext-label' }, '单步伤亡'),
                  h(
                    'div',
                    { class: 'gc-ext-value casualties' },
                    damageData.单步损害?.小人伤亡?.格式化 || '-'
                  ),
                ]),
                h('div', { class: 'gc-ext-item' }, [
                  h('div', { class: 'gc-ext-label' }, '建筑损毁'),
                  h(
                    'div',
                    { class: 'gc-ext-value buildings' },
                    damageData.单步损害?.建筑损毁?.格式化 || '-'
                  ),
                ]),
                damageData.单步损害?.城区损毁?.数量 > 0
                  ? h('div', { class: 'gc-ext-item' }, [
                      h('div', { class: 'gc-ext-label' }, '城区损毁'),
                      h(
                        'div',
                        { class: 'gc-ext-value' },
                        damageData.单步损害.城区损毁.格式化
                      ),
                    ])
                  : null,
              ]),
              // 宏观破坏
              damageData.宏观破坏
                ? h('div', { class: 'gc-ext-macro' }, [
                    h('div', { class: 'gc-ext-macro-title' }, [
                      h('i', { class: 'fa-solid fa-globe' }),
                      h('span', ` 宏观破坏力: ${damageData.宏观破坏.等级名称}`),
                    ]),
                    h(
                      'div',
                      { class: 'gc-ext-macro-list' },
                      [
                        damageData.宏观破坏.城市?.格式化,
                        damageData.宏观破坏.国家?.格式化,
                        damageData.宏观破坏.大陆?.格式化,
                        damageData.宏观破坏.行星?.格式化,
                        damageData.宏观破坏.恒星?.格式化,
                        damageData.宏观破坏.星系?.格式化,
                      ]
                        .filter(Boolean)
                        .map((text) => h('span', text))
                    ),
                  ])
                : null,
              // 特殊效应
              damageData.特殊效应?.length > 0
                ? h('div', { class: 'gc-ext-effects' }, [
                    h('div', { class: 'gc-ext-effects-title' }, [
                      h('i', { class: 'fa-solid fa-bolt' }),
                      h('span', ' 物理效应'),
                    ]),
                    h(
                      'div',
                      { class: 'gc-ext-effects-list' },
                      damageData.特殊效应.slice(0, 4).map((effect: string) =>
                        h('span', { class: 'gc-ext-effect-tag' }, effect)
                      )
                    ),
                  ])
                : null,
            ]
          );
        };
      },
    });
  },

  /**
   * 贡献追加到主规则的损害记录规则
   */
  getRulesContribution(): string | null {
    return `## 实际损害记录（可选）

当巨大娘造成实际破坏时，可以记录累计损害数据：

\`\`\`xml
<gts_update>
_.set('巨大娘.角色.{{角色名}}._实际损害.总伤亡人数', {{累计数字}});
_.set('巨大娘.角色.{{角色名}}._实际损害.总建筑损毁', {{累计数字}});
_.set('巨大娘.角色.{{角色名}}._实际损害.最近行动', {
  描述: '{{行动描述}}',
  伤亡人数: {{本次伤亡}},
  建筑损毁: {{本次损毁}}
});
</gts_update>
\`\`\`

**注意**：
- 系统计算的是「预估损害」（基于足迹和密度）
- 此处记录的是「实际损害」（根据剧情发展）
- 实际损害可能高于或低于预估，取决于具体情节`;
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
