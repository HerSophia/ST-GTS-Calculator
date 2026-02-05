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
    order: 999,
    type: 'header',
    builtin: true,
    content: `【巨大娘/小人 数据参考】

以下是当前场景中角色的尺寸数据，请在描写时参考这些数据保持一致性。

## 思维链指导

“巨大娘”是女性的巨人经过艺术加工而形成的一种性癖。巨大娘可能是先天的（比如种族的固有属性）、也可能是后天的（如科技、魔法、超能力等导致的巨大化）。

这里的“小人”并不是指行为作风上的形容词，而是物理意义上的小人。在这里通常来说小人是相对于女性而言的，不会提及正常大小的男性。正常体型的人类缩小化之后便是小人，而未进行缩小化的女性对于小人来说便是巨大娘。

在处理巨大娘/小人相关内容时，请先思考以下问题：

1. **角色合理性**：
   - 巨大娘通常指女性角色，男性角色通常不会成为巨大娘（除非剧情特别设定）
   - 小人可以是任何性别的角色
   - 思考：这个角色成为巨大娘/小人是否符合剧情设定？

2. **尺寸合理性**：
   - 原身高应该是正常人类身高范围（通常 1.5-2.0 米）
   - 当前身高的变化应该有明确的剧情原因
   - 思考：这个身高变化是否有合理的剧情解释？

3. **物理合理性**：
   - 参考下方的互动限制，避免物理上不可能的描写
   - 注意尺度差异带来的感官差异（视觉、听觉、触觉）
   - 思考：当前描写的互动在物理上是否合理？

4. **数据一致性**：
   - 确保描写与下方提供的数据保持一致
   - 避免出现与计算数据矛盾的描述
   - 思考：我的描写是否与提供的尺寸数据一致？`,
  },
  {
    id: 'character-data',
    name: '角色数据',
    description: '每个角色的身体数据（自动生成）',
    enabled: true,
    order: 9990,
    type: 'character',
    builtin: true,
    readonly: true,
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
    order: 9980,
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
    order: 9995,
    type: 'rules',
    builtin: true,
    readonly: true,
    content: `---

# 变量更新规则

当角色身高发生变化时，**必须**在回复末尾使用以下 XML 格式更新数据。

## ⚠️ 设置数值前的确认清单

在设置任何数值之前，请**务必确认**以下事项：

### 1. 原身高确认（最重要）

- **新角色出场时必须设置原身高**：每个角色首次涉及尺寸变化时，都必须先设置其原身高
- **原身高缺失时必须补充**：如果发现角色没有原身高数据，应当根据角色设定推断并补充
- **原身高范围检查**：正常人类原身高通常在 1.5-2.0 米之间
  - 成年女性：通常 1.55-1.75 米
  - 成年男性：通常 1.65-1.85 米
  - 青少年：根据年龄适当调整
- **不合理的原身高**：如果原身高明显不合理（如 0.5 米或 5 米），应当修正为合理值

### 2. 当前身高确认

- **变化倍率合理性**：身高变化应该有明确的剧情原因支撑
- **单位确认**：所有身高单位为**米**，170米 写作 \`170\`，1.7公里 写作 \`1700\`
- **渐进式变化**：除非剧情需要瞬间变化，否则考虑是否应该渐进式增长/缩小

### 3. 角色类型确认

- **巨大娘通常为女性**：男性角色通常不设置为巨大娘（除非剧情特别设定）
- **小人无性别限制**：缩小的角色可以是任何性别

## 输出格式

所有变量更新命令必须包裹在 \`<gts_update>\` 标签内：

\`\`\`xml
<gts_update>
_.set('巨大娘.角色.{{角色名}}.原身高', {{原身高数值}});  // 新角色必须设置！
_.set('巨大娘.角色.{{角色名}}.当前身高', {{新身高数值}});
_.set('巨大娘.角色.{{角色名}}.变化原因', '{{变化原因}}');
_.set('巨大娘.角色.{{角色名}}.变化时间', '{{当前时间点}}');
</gts_update>
\`\`\`

## 新角色示例

当新角色「小雪」首次出现并发生尺寸变化时：

\`\`\`xml
<gts_update>
// 新角色必须先设置原身高！
_.set('巨大娘.角色.小雪.原身高', 1.62);  // 根据角色设定推断的原身高
_.set('巨大娘.角色.小雪.当前身高', 50);
_.set('巨大娘.角色.小雪.变化原因', '被魔法光芒笼罩');
</gts_update>
\`\`\`

## 补充缺失原身高示例

如果发现角色没有原身高数据：

\`\`\`xml
<gts_update>
// 补充缺失的原身高
_.set('巨大娘.角色.络络.原身高', 1.65);  // 根据之前描写推断
</gts_update>
\`\`\`

## 单独部位变化（可选）

如果某个部位单独变化（如胸部、脚掌等）：

\`\`\`xml
<gts_update>
_.set('巨大娘.角色.{{角色名}}.自定义部位.乳房高度', {{尺寸米}});
_.set('巨大娘.角色.{{角色名}}.自定义部位.足长', {{尺寸米}});
</gts_update>
\`\`\`

## 场景设置（可选）

当场景发生变化时，设置当前场景以更准确地计算损害数据：

\`\`\`xml
<gts_update>
// 必填：场景类型（影响默认人口密度和损害计算）
_.set('巨大娘._场景.当前场景', '{{场景名称}}');

// 选填：自定义人群密度（优先级高于场景预设）
_.set('巨大娘._场景.人群密度', {{人/平方公里}});  // 如 10000

// 选填：扩展场景信息（让场景描写更丰富）
_.set('巨大娘._场景.场景原因', '{{为什么在这个场景}}');
_.set('巨大娘._场景.具体地点', '{{详细地点描述}}');
_.set('巨大娘._场景.场景时间', '{{当前时间段}}');
_.set('巨大娘._场景.人群状态', '{{人群状态描述}}');
</gts_update>
\`\`\`

**可用场景类型及默认人口密度**：
- 户外：荒野(1)、乡村(50)、郊区(500)、小城市(3000)、中等城市(5000)、大城市(10000)、超大城市中心(25000)
- 特定城市：东京市中心(15000)、香港(27000)、马尼拉(43000)
- 室内：住宅内(40000)、公寓楼内(80000)、办公楼内(100000)、体育馆内(500000)
- 特殊：巨大娘体内(0)

**扩展字段说明**：
- \`人群密度\`：直接指定人口密度（人/平方公里），覆盖场景预设值
  - 演唱会现场可设为 50000-100000
  - 深夜或撤离后可设为 100-1000
- \`具体地点\`：如「东京银座」「公司大楼顶层」，帮助生成更精确的描写
- \`场景时间\`：如「傍晚」「深夜」「上班高峰」，影响人群活动描写
- \`人群状态\`：如「拥挤」「稀疏」「撤离中」「恐慌逃散」，增强场景感

## 完整示例

假设角色「络络」喝下药水后身高从 1.65 米增长到 170 米，胸部单独增长到 28 米：

\`\`\`xml
<gts_update>
_.set('巨大娘.角色.络络.原身高', 1.65);  // 确保原身高存在
_.set('巨大娘.角色.络络.当前身高', 170);
_.set('巨大娘.角色.络络.变化原因', '喝下了成长药水');
_.set('巨大娘.角色.络络.变化时间', '第三天傍晚');
_.set('巨大娘.角色.络络.自定义部位.乳房高度', 28);

// 场景设置（完整示例）
_.set('巨大娘._场景.当前场景', '大城市');
_.set('巨大娘._场景.人群密度', 15000);  // 下班高峰，比默认(10000)更密集
_.set('巨大娘._场景.场景原因', '络络追踪目标来到市中心');
_.set('巨大娘._场景.具体地点', '东京银座商业区');
_.set('巨大娘._场景.场景时间', '傍晚时分，华灯初上');
_.set('巨大娘._场景.人群状态', '下班高峰，人流密集');
</gts_update>
\`\`\`

## 注意事项

- ⚠️ **必须使用 \`<gts_update>\` 标签包裹**，否则变量更新将不会被系统识别
- ⚠️ **新角色必须设置原身高**，否则计算结果可能不正确
- ⚠️ **发现缺失原身高时必须补充**，可根据角色描写推断合理值
- 身高和部位尺寸单位均为**米**，如 170米 写作 \`170\`，1.7公里 写作 \`1700\`
- 变化原因应简短描述导致身高变化的原因
- 变化时间可以是故事中的时间点描述
- 自定义部位会独立计算倍率，未设置的部位按整体倍率缩放
- 场景设置会影响损害计算的人口密度和建筑密度
- 可以在一个 \`<gts_update>\` 标签内包含多个 \`_.set()\` 命令`,
  },
  {
    id: 'worldview',
    name: '世界观设定',
    description: '当前世界观的变化机制和特殊规则（自动生成）',
    enabled: true,
    order: 9965,
    type: 'worldview',
    builtin: true,
    readonly: true,
    content: `{{世界观提示词}}`,
  },
  {
    id: 'damage-calculation',
    name: '损害计算',
    description: '每个角色行动可能造成的破坏数据',
    enabled: true,
    order: 9975,
    type: 'damage',
    builtin: true,
    readonly: true,
    requiresFeature: 'damageCalculation',
    content: `---

# 破坏力数据

{{损害数据}}`,
  },
  {
    id: 'scenario-info',
    name: '场景信息',
    description: '当前场景的详细信息，影响损害计算',
    enabled: true,
    order: 9985,
    type: 'scenario',
    builtin: true,
    readonly: true,
    content: `---

# 当前场景

**场景类型**：{{当前场景}}
{{场景详情}}

**可用场景列表**：
{{可用场景列表}}`,
  },
  {
    id: 'writing-guidelines',
    name: '写作指南',
    description: '针对巨大娘/小人场景的写作建议',
    enabled: false,
    order: 9960,
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
    
    return klona(DEFAULT_TEMPLATES);
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
  // order 降序排列：order 越大越靠前（在长上下文中更突出）
  const enabledTemplates = computed(() =>
    templates.value.filter(t => t.enabled).sort((a, b) => b.order - a.order)
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
    // order 越大越靠前，新模板放在最后（order 最小）
    const minOrder = Math.min(...templates.value.map(t => t.order), 9960);
    templates.value.push({
      ...template,
      id: `custom-${Date.now()}`,
      order: minOrder - 10,
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
    // 获取用户自定义的模板（非内置模板）
    const builtinIds = DEFAULT_TEMPLATES.filter(t => t.builtin).map(t => t.id);
    const customTemplates = templates.value.filter(t => !builtinIds.includes(t.id) && !t.builtin);
    
    // 合并默认模板和用户自定义模板（降序：order 越大越靠前）
    templates.value = [...DEFAULT_TEMPLATES, ...customTemplates].sort((a, b) => b.order - a.order);
  };

  const moveTemplate = (id: string, direction: 'up' | 'down') => {
    // 降序排列：order 越大越靠前
    const sorted = [...templates.value].sort((a, b) => b.order - a.order);
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
