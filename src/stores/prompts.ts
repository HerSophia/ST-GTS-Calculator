/**
 * 巨大娘计算器 - 提示词管理 Store（精简版）
 * 只负责模板状态管理
 * 
 * @module stores/prompts
 */

import type { PromptTemplate } from '../types';

// 重新导出类型
export type { PromptTemplate };

/**
 * 默认提示词模板
 */
export const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'header',
    name: '头部说明',
    description: '提示词的开头部分',
    enabled: true,
    order: 0,
    type: 'header',
    builtin: true,
    content: `【巨大娘/小人 数据参考】

以下是当前场景中角色的尺寸数据，请在描写时参考这些数据保持一致性。`,
  },
  {
    id: 'character-data',
    name: '角色数据',
    description: '每个角色的身体数据（自动生成）',
    enabled: true,
    order: 10,
    type: 'character',
    builtin: true,
    content: `## {{角色名}}

**基础信息**
- 当前身高：{{当前身高_格式化}}（{{倍率}}倍，{{级别}}）
- 原始身高：{{原身高_格式化}}

**身体数据**
{{身体数据}}
{{自定义部位}}
**相对参照**
{{相对参照}}

{{描述}}`,
  },
  {
    id: 'interaction-limits',
    name: '互动限制',
    description: '角色之间的互动限制说明',
    enabled: true,
    order: 20,
    type: 'interaction',
    builtin: true,
    content: `---

# 互动物理限制

以下互动在当前体型差距下**物理上不合理**，请避免或使用替代方案：

{{互动限制列表}}`,
  },
  {
    id: 'variable-update-rules',
    name: '变量更新规则',
    description: '指导 AI 如何更新角色数据变量',
    enabled: true,
    order: 30,
    type: 'rules',
    builtin: true,
    content: `---

# 变量更新规则

当角色身高发生变化时，请在回复末尾使用以下格式更新数据：

\`\`\`
_.set('巨大娘.{{角色名}}.当前身高', {{新身高数值}});
_.set('巨大娘.{{角色名}}.变化原因', '{{变化原因}}');
_.set('巨大娘.{{角色名}}.变化时间', '{{当前时间点}}');
\`\`\`

**单独部位变化**（可选）：
如果某个部位单独变化（如胸部、脚掌等），使用以下格式：

\`\`\`
_.set('巨大娘.{{角色名}}.自定义部位.乳房高度', {{尺寸米}});
_.set('巨大娘.{{角色名}}.自定义部位.足长', {{尺寸米}});
\`\`\`

**场景设置**（可选）：
当场景发生变化时，可以设置当前场景以更准确地计算损害数据：

\`\`\`
_.set('巨大娘._场景.当前场景', '{{场景名称}}');
_.set('巨大娘._场景.场景原因', '{{为什么在这个场景}}');
\`\`\`

可用场景列表：
- **户外场景**：荒野、乡村、郊区、小城市、中等城市、大城市、超大城市中心、东京市中心、香港、马尼拉
- **室内场景**：住宅内、公寓楼内、办公楼内、体育馆内
- **特殊场景**：巨大娘体内（小人进入巨大娘身体内部）

**注意事项**：
- 身高和部位尺寸单位均为**米**，如 170米 写作 \`170\`，1.7公里 写作 \`1700\`
- 变化原因应简短描述导致身高变化的原因
- 变化时间可以是故事中的时间点描述
- 自定义部位会独立计算倍率，未设置的部位按整体倍率缩放
- 场景设置会影响损害计算的人口密度和建筑密度`,
  },
  {
    id: 'worldview',
    name: '世界观设定',
    description: '当前世界观的变化机制和特殊规则（自动生成）',
    enabled: true,
    order: 35,
    type: 'worldview',
    builtin: true,
    content: `{{世界观提示词}}`,
  },
  {
    id: 'damage-calculation',
    name: '损害计算',
    description: '每个角色行动可能造成的破坏数据',
    enabled: true,
    order: 25,
    type: 'damage',
    builtin: true,
    requiresFeature: 'damageCalculation',
    content: `---

# 破坏力数据

{{损害数据}}`,
  },
  {
    id: 'writing-guidelines',
    name: '写作指南',
    description: '针对巨大娘/小人场景的写作建议',
    enabled: false,
    order: 40,
    type: 'footer',
    builtin: true,
    content: `---

# 写作建议

1. **尺度感知**：注意描写时的比例关系，小人在巨大娘眼中可能只是一个小点
2. **感官差异**：巨大娘可能听不到小人的声音，小人可能被巨大娘的脚步声震耳欲聋
3. **互动真实性**：考虑物理上是否可行，避免不合理的互动描写
4. **视角切换**：可以在巨大娘视角和小人视角之间切换，增加沉浸感`,
  },
];

/** 全局变量中存储模板的 key */
const GLOBAL_TEMPLATES_KEY = 'giantessCalc_promptTemplates';

/**
 * 提示词 Store
 * 
 * 职责：
 * - 管理提示词模板列表
 * - 自动持久化到全局变量
 * - 提供模板 CRUD 操作
 */
export const usePromptsStore = defineStore('giantess-calculator-prompts', () => {
  // ========== 加载逻辑 ==========
  const loadTemplates = (): PromptTemplate[] => {
    const globalVars = getVariables({ type: 'global' });
    const savedTemplates = globalVars?.[GLOBAL_TEMPLATES_KEY] as PromptTemplate[] | undefined;
    
    if (savedTemplates && Array.isArray(savedTemplates)) {
      // 合并保存的模板和内置模板
      const builtinIds = DEFAULT_TEMPLATES.filter(t => t.builtin).map(t => t.id);
      const customTemplates = savedTemplates.filter(t => !builtinIds.includes(t.id));
      const savedBuiltins = savedTemplates.filter(t => builtinIds.includes(t.id));
      
      const mergedBuiltins = DEFAULT_TEMPLATES.filter(t => t.builtin).map(defaultT => {
        const savedT = savedBuiltins.find(s => s.id === defaultT.id);
        if (savedT) {
          return {
            ...defaultT,
            enabled: savedT.enabled,
            order: savedT.order,
            content: savedT.content,
          };
        }
        return defaultT;
      });
      
      return [...mergedBuiltins, ...customTemplates].sort((a, b) => a.order - b.order);
    }
    
    return [...DEFAULT_TEMPLATES];
  };

  // ========== 核心状态 ==========
  const templates = ref<PromptTemplate[]>(loadTemplates());

  // 自动保存到全局变量
  watchEffect(() => {
    insertOrAssignVariables(
      { [GLOBAL_TEMPLATES_KEY]: klona(templates.value) },
      { type: 'global' }
    );
  });

  // ========== 计算属性 ==========
  const enabledTemplates = computed(() =>
    templates.value.filter(t => t.enabled).sort((a, b) => a.order - b.order)
  );

  // ========== CRUD 操作 ==========
  const toggleTemplate = (id: string) => {
    const template = templates.value.find(t => t.id === id);
    if (template) {
      template.enabled = !template.enabled;
    }
  };

  const updateTemplate = (id: string, updates: Partial<PromptTemplate>) => {
    const index = templates.value.findIndex(t => t.id === id);
    if (index !== -1) {
      templates.value[index] = { ...templates.value[index], ...updates };
    }
  };

  const addTemplate = (template: Omit<PromptTemplate, 'id' | 'order' | 'builtin'>) => {
    const maxOrder = Math.max(...templates.value.map(t => t.order), 0);
    templates.value.push({
      ...template,
      id: `custom-${Date.now()}`,
      order: maxOrder + 10,
      builtin: false,
    });
  };

  const removeTemplate = (id: string) => {
    const template = templates.value.find(t => t.id === id);
    if (template && !template.builtin) {
      templates.value = templates.value.filter(t => t.id !== id);
    }
  };

  const resetToDefaults = () => {
    templates.value = [...DEFAULT_TEMPLATES];
  };

  const moveTemplate = (id: string, direction: 'up' | 'down') => {
    const sorted = [...templates.value].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex(t => t.id === id);
    
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sorted.length - 1) return;
    
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const tempOrder = sorted[index].order;
    sorted[index].order = sorted[swapIndex].order;
    sorted[swapIndex].order = tempOrder;
  };

  const getTemplate = (id: string): PromptTemplate | undefined => {
    return templates.value.find(t => t.id === id);
  };

  return {
    // 核心状态
    templates,
    enabledTemplates,
    // CRUD
    toggleTemplate,
    updateTemplate,
    addTemplate,
    removeTemplate,
    resetToDefaults,
    moveTemplate,
    getTemplate,
  };
});
