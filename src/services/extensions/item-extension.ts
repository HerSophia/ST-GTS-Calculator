/**
 * 巨大娘计算器 - 物品系统扩展
 *
 * 将物品系统功能封装为扩展
 *
 * @module services/extensions/item-extension
 */

import { defineComponent, h, ref, type Component } from 'vue';
import type {
  Extension,
  CharacterData,
  PromptTemplate,
  GiantessData,
  TinyData,
  CharacterItems,
  CharacterItemsCalculation,
  CharacterCardContext,
  ItemCalculation,
  ItemType,
} from '../../types';
import {
  calculateCharacterItems,
  generateItemsPrompt,
  PRESET_ITEMS,
} from '../../core/items';

/**
 * 物品系统扩展 ID
 */
export const ITEMS_EXTENSION_ID = 'items-system';

/**
 * 从角色数据中获取物品列表
 */
function getCharacterItems(character: CharacterData): CharacterItems | null {
  // 从 MVU 数据中读取物品
  // 物品存储在 角色._物品 字段中
  const items = (character as unknown as Record<string, unknown>)._物品;
  if (!items || typeof items !== 'object') {
    return null;
  }
  return items as CharacterItems;
}

/**
 * 物品系统扩展定义
 */
export const itemsExtension: Extension = {
  id: ITEMS_EXTENSION_ID,
  name: '物品系统',
  description: '管理和计算角色携带的物品，提供尺寸对比和互动可能性分析',
  icon: 'fa-solid fa-box',
  defaultEnabled: false, // 默认不启用，需要用户手动开启

  onInit() {
    console.log('[ItemsExtension] 初始化');
  },

  onEnable() {
    console.log('[ItemsExtension] 物品系统已启用');
  },

  onDisable() {
    console.log('[ItemsExtension] 物品系统已禁用');
  },

  /**
   * 角色数据更新时计算物品
   */
  onCharacterUpdate(
    character: CharacterData,
    calcData: GiantessData | TinyData
  ): Record<string, unknown> | void {
    const items = getCharacterItems(character);

    if (!items || Object.keys(items).length === 0) {
      return;
    }

    try {
      const itemsCalc = calculateCharacterItems(
        character.name,
        calcData.倍率,
        items
      );

      console.log(`[ItemsExtension] 已计算 ${character.name} 的物品数据:`, {
        物品数量: Object.keys(items).length,
      });

      // 返回要写入 MVU 变量的额外数据
      return {
        _物品计算: itemsCalc,
      };
    } catch (e) {
      console.error('[ItemsExtension] 计算物品数据失败:', e);
      return;
    }
  },

  /**
   * 判断是否应该显示物品卡片内容
   */
  shouldShowCardContent(context: CharacterCardContext): boolean {
    const character = context.character;
    const itemsCalc = (character as unknown as Record<string, unknown>)
      ._物品计算 as CharacterItemsCalculation | undefined;
    return !!itemsCalc && Object.keys(itemsCalc.物品 || {}).length > 0;
  },

  /**
   * 贡献角色卡片的物品数据展示组件
   */
  getCharacterCardExtra(): Component {
    return defineComponent({
      name: 'ItemsCardContent',
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
        const expandedItems = ref(new Set<string>());

        const toggleItem = (itemId: string) => {
          if (expandedItems.value.has(itemId)) {
            expandedItems.value.delete(itemId);
          } else {
            expandedItems.value.add(itemId);
          }
          // 触发响应式更新
          expandedItems.value = new Set(expandedItems.value);
        };

        const getItemIcon = (type?: ItemType): string => {
          const iconMap: Record<string, string> = {
            '日用品': 'fa-solid fa-mobile-screen',
            '配饰': 'fa-solid fa-gem',
            '服装': 'fa-solid fa-shirt',
            '食物': 'fa-solid fa-burger',
            '家具': 'fa-solid fa-couch',
            '交通工具': 'fa-solid fa-car',
            '建筑': 'fa-solid fa-building',
            '自然物': 'fa-solid fa-tree',
            '玩具': 'fa-solid fa-puzzle-piece',
            '武器': 'fa-solid fa-gun',
            '工具': 'fa-solid fa-wrench',
            '其他': 'fa-solid fa-box',
          };
          return iconMap[type || '其他'] || 'fa-solid fa-box';
        };

        const getMainSize = (item: ItemCalculation): string => {
          const formatted = item.缩放尺寸_格式化;
          if (formatted.长) return formatted.长;
          if (formatted.高) return formatted.高;
          if (formatted.直径) return formatted.直径;
          const first = Object.values(formatted)[0];
          return first || '-';
        };

        return () => {
          const itemsCalc = (props.character as unknown as Record<string, unknown>)
            ._物品计算 as CharacterItemsCalculation | undefined;

          if (!itemsCalc || Object.keys(itemsCalc.物品 || {}).length === 0) {
            return null;
          }

          const itemCount = Object.keys(itemsCalc.物品).length;

          return h('div', { class: 'gc-ext-items-section' }, [
            // 标题行
            h('div', { class: 'gc-ext-section-title' }, [
              h('i', { class: 'fa-solid fa-box' }),
              h('span', ' 携带物品'),
              h('span', { class: 'gc-ext-badge items' }, `${itemCount}件`),
            ]),
            // 物品列表
            h(
              'div',
              { class: 'gc-ext-items-list' },
              Object.entries(itemsCalc.物品).map(([itemId, item]) => {
                const isExpanded = expandedItems.value.has(itemId);
                return h(
                  'div',
                  {
                    class: ['gc-ext-item-card', { expanded: isExpanded }],
                    onClick: () => toggleItem(itemId),
                  },
                  [
                    // 物品头部
                    h('div', { class: 'gc-ext-item-header' }, [
                      h('i', { class: getItemIcon(item.定义.类型) }),
                      h('div', { class: 'gc-ext-item-info' }, [
                        h('div', { class: 'gc-ext-item-name' }, [
                          item.定义.名称,
                          item.定义.随身携带
                            ? h('i', {
                                class: 'fa-solid fa-link gc-ext-carried-tag',
                                title: '随身携带',
                              })
                            : null,
                        ]),
                        h('div', { class: 'gc-ext-item-type' }, [
                          item.定义.类型 || '其他',
                          item.定义.材质 ? ` · ${item.定义.材质}` : '',
                        ]),
                      ]),
                      h('span', { class: 'gc-ext-item-size' }, getMainSize(item)),
                      h('i', {
                        class: `fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} gc-ext-item-chevron`,
                      }),
                    ]),
                    // 展开详情
                    isExpanded
                      ? h(
                          'div',
                          {
                            class: 'gc-ext-item-details',
                            onClick: (e: Event) => e.stopPropagation(),
                          },
                          [
                            // 尺寸信息
                            h('div', { class: 'gc-ext-item-dims' }, [
                              ...Object.entries(item.缩放尺寸_格式化).map(([k, v]) =>
                                h('span', { class: 'gc-ext-dim-tag' }, `${k}: ${v}`)
                              ),
                            ]),
                            // 互动可能性
                            item.互动可能性.length > 0
                              ? h('div', { class: 'gc-ext-item-interactions' }, [
                                  ...item.互动可能性.slice(0, 4).map((inter) =>
                                    h(
                                      'div',
                                      {
                                        class: [
                                          'gc-ext-interaction',
                                          inter.可行 ? 'possible' : 'impossible',
                                        ],
                                      },
                                      [
                                        h('i', {
                                          class: inter.可行
                                            ? 'fa-solid fa-check'
                                            : 'fa-solid fa-xmark',
                                        }),
                                        h('span', inter.名称),
                                      ]
                                    )
                                  ),
                                ])
                              : null,
                          ]
                        )
                      : null,
                  ]
                );
              })
            ),
          ]);
        };
      },
    });
  },

  /**
   * 贡献物品相关的提示词模板
   */
  getPromptTemplates(): PromptTemplate[] {
    return [
      {
        id: 'items-data',
        name: '物品数据',
        description: '角色携带物品的尺寸和互动数据',
        enabled: true,
        order: 9970, // order 越大越靠前
        type: 'items',
        builtin: true,
        readonly: true,
        requiresFeature: 'itemsSystem',
        content: `---

# 物品数据

{{物品数据}}`,
      },
      {
        id: 'items-rules',
        name: '物品描写指南',
        description: '指导 AI 如何描写物品互动',
        enabled: false, // 默认不启用
        order: 9950,
        type: 'footer',
        builtin: true,
        readonly: true,
        requiresFeature: 'itemsSystem',
        content: `## 物品描写指南

在描写角色与物品互动时，请注意：

1. **尺寸感**：根据物品的缩放尺寸，准确描写物品在角色手中的相对大小
2. **材质反馈**：不同材质的物品有不同的触感和重量感
3. **互动限制**：遵循物品的互动可能性，不可行的互动需要替代方案
4. **特殊效果**：考虑巨大化物品可能产生的物理效应`,
      },
    ];
  },

  /**
   * 贡献追加到主规则的物品记录规则
   */
  getRulesContribution(): string | null {
    return `## 物品管理

当角色获得、使用或失去物品时，可以更新物品数据：

### 添加物品

\`\`\`xml
<gts_update>
_.set('巨大娘.角色.{{角色名}}._物品.{{物品ID}}', {
  名称: '{{物品名称}}',
  原始尺寸: {
    长: {{长度米}},
    宽: {{宽度米}},
    高: {{高度米}},
    重量: {{重量千克}}
  },
  类型: '{{物品类型}}',
  材质: '{{材质}}',
  随身携带: true  // 是否随角色一起缩放
});
</gts_update>
\`\`\`

### 移除物品

\`\`\`xml
<gts_update>
_.unset('巨大娘.角色.{{角色名}}._物品.{{物品ID}}');
</gts_update>
\`\`\`

### 物品类型选项
日用品、配饰、服装、食物、家具、交通工具、建筑、自然物、玩具、武器、工具、其他

### 材质选项
金属、玻璃、塑料、木材、布料、皮革、橡胶、石材、混凝土、食材、液体、其他

**注意**：
- 随身携带的物品会随角色一起缩放
- 非随身物品保持原始尺寸`;
  },
};

/**
 * 为角色生成物品提示词
 */
export function generateItemsPromptForCharacter(
  characterName: string,
  character: CharacterData
): string | null {
  const itemsCalc = (character as unknown as Record<string, unknown>)
    ._物品计算 as CharacterItemsCalculation | undefined;

  if (!itemsCalc || Object.keys(itemsCalc.物品).length === 0) {
    return null;
  }

  return generateItemsPrompt(characterName, itemsCalc);
}

/**
 * 获取预设物品列表
 */
export function getPresetItems(): typeof PRESET_ITEMS {
  return PRESET_ITEMS;
}
