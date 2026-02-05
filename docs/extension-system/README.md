# 巨大娘计算器 - 扩展系统文档

> 本文档描述扩展系统的架构设计、开发指南和 API 参考，帮助开发者创建自定义扩展。

---

## 📋 概述

扩展系统允许第三方开发者为巨大娘计算器添加新功能，而无需修改核心代码。

### 核心特性

- 🔌 **可插拔设计** - 扩展可以独立注册、启用、禁用
- 🎣 **生命周期钩子** - 在关键节点执行自定义逻辑
- 📝 **内容贡献** - 扩展可以贡献提示词模板、UI 组件等
- 🔗 **依赖管理** - 扩展可以声明对其他扩展的依赖
- 💾 **状态持久化** - 启用状态自动保存和恢复

### 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Extension Manager                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Extension  │  │   Extension  │  │   Extension  │   ...     │
│  │   (Damage)   │  │   (Custom)   │  │   (Custom)   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                         Global API                               │
│              window.GiantessCalc.extensions.*                    │
└─────────────────────────────────────────────────────────────────┘
          ↑                    ↑                    ↑
    内置扩展              第三方扩展           酒馆助手脚本
```

---

## 📦 快速开始

### 注册一个简单扩展

```javascript
// 在其他酒馆助手脚本中
if (window.GiantessCalc?.extensions) {
  window.GiantessCalc.extensions.register({
    id: 'my-extension',
    name: '我的扩展',
    description: '这是一个示例扩展',
    icon: 'fa-solid fa-star',
    defaultEnabled: true,
    
    onInit() {
      console.log('扩展已初始化');
    },
    
    onEnable() {
      console.log('扩展已启用');
    },
    
    onDisable() {
      console.log('扩展已禁用');
    },
  });
}
```

### 等待巨大娘计算器加载

由于酒馆助手脚本的加载顺序不确定，推荐使用以下方式确保正确注册：

```javascript
function registerMyExtension() {
  if (!window.GiantessCalc?.extensions) {
    // 如果还没加载，稍后重试
    setTimeout(registerMyExtension, 100);
    return;
  }
  
  window.GiantessCalc.extensions.register({
    id: 'my-extension',
    name: '我的扩展',
    // ...
  });
}

// 开始注册
registerMyExtension();
```

---

## 🔷 扩展接口定义

### Extension 接口

```typescript
interface Extension {
  // ========== 基本信息（必填） ==========
  
  /** 扩展唯一标识（推荐使用 kebab-case） */
  id: string;
  
  /** 扩展名称（用于 UI 展示） */
  name: string;
  
  /** 扩展描述 */
  description: string;
  
  /** 图标（Font Awesome 类名） */
  icon: string;
  
  // ========== 可选配置 ==========
  
  /** 是否默认启用（默认 false） */
  defaultEnabled?: boolean;
  
  /** 依赖的其他扩展 ID 列表 */
  dependencies?: string[];
  
  // ========== 生命周期钩子 ==========
  
  /** 扩展注册时调用（无论是否启用） */
  onInit?: () => void | Promise<void>;
  
  /** 扩展启用时调用 */
  onEnable?: () => void | Promise<void>;
  
  /** 扩展禁用时调用 */
  onDisable?: () => void | Promise<void>;
  
  // ========== 计算钩子 ==========
  
  /** 角色数据更新后调用 */
  onCharacterUpdate?: (
    character: CharacterData,
    calcData: GiantessData | TinyData
  ) => void | Record<string, unknown>;
  
  /** 提示词注入前调用，可以修改上下文 */
  onBeforePromptInject?: (context: PromptContext) => PromptContext;
  
  /** 提示词注入后调用 */
  onAfterPromptInject?: (promptId: string) => void;
  
  // ========== 内容贡献 ==========
  
  /** 贡献的提示词模板 */
  getPromptTemplates?: () => PromptTemplate[];
  
  /** 贡献追加到主规则模板的规则片段 */
  getRulesContribution?: () => string | null;
  
  /** 贡献的设置项组件（Vue 组件） */
  getSettingsComponent?: () => Component;
  
  /** 贡献的角色卡片额外内容（Vue 组件） */
  getCharacterCardExtra?: () => Component;
  
  /**
   * 判断是否应该为该角色显示卡片内容
   * @param context 角色卡片上下文
   * @returns 是否显示
   */
  shouldShowCardContent?: (context: CharacterCardContext) => boolean;
  
  /** 贡献的调试面板内容（Vue 组件） */
  getDebugPanelExtra?: () => Component;
}
```

---

## 🎣 生命周期钩子

### 钩子调用时机

```
┌─────────────────────────────────────────────────────────────────┐
│                        扩展生命周期                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  注册扩展                                                        │
│      │                                                          │
│      ▼                                                          │
│  ┌──────────┐                                                   │
│  │ onInit() │ ← 注册时立即调用（无论是否启用）                    │
│  └──────────┘                                                   │
│      │                                                          │
│      ▼                                                          │
│  检查 defaultEnabled                                             │
│      │                                                          │
│      ├─── true ────┐                                            │
│      │             ▼                                            │
│      │     ┌────────────┐                                       │
│      │     │ onEnable() │ ← 启用时调用                          │
│      │     └────────────┘                                       │
│      │             │                                            │
│      └─── false ───┴─────────────────────────────────────────┐  │
│                                                              │  │
│                    等待用户操作                               │  │
│                          │                                   │  │
│      ┌───────────────────┼───────────────────┐               │  │
│      │                   │                   │               │  │
│      ▼                   ▼                   ▼               │  │
│  用户启用            角色更新           提示词注入             │  │
│      │                   │                   │               │  │
│      ▼                   ▼                   ▼               │  │
│  onEnable()    onCharacterUpdate()   onBeforePromptInject()  │  │
│      │                   │           onAfterPromptInject()   │  │
│      │                   │                   │               │  │
│      └───────────────────┴───────────────────┘               │  │
│                          │                                   │  │
│                      用户禁用                                 │  │
│                          │                                   │  │
│                          ▼                                   │  │
│                  ┌─────────────┐                             │  │
│                  │ onDisable() │ ← 禁用时调用                 │  │
│                  └─────────────┘                             │  │
│                                                              │  │
└──────────────────────────────────────────────────────────────┴──┘
```

### onInit()

在扩展注册时立即调用，无论扩展是否启用。适合进行一次性的初始化操作。

```javascript
onInit() {
  // 初始化资源
  this.myResource = loadResource();
  console.log('扩展已初始化');
}
```

**注意**：
- 此钩子在扩展注册时同步调用
- 不要在此处执行耗时操作
- 如果抛出异常，扩展仍会被注册，但会打印错误日志

### onEnable()

在扩展启用时调用。可以是用户手动启用，或者 `defaultEnabled: true` 时自动启用。

```javascript
onEnable() {
  // 启动后台服务
  this.startService();
  // 注册事件监听
  this.registerEventListeners();
  console.log('扩展已启用');
}
```

**注意**：
- 如果扩展有依赖，只有当所有依赖都启用后才会调用
- 如果此钩子抛出异常，扩展会被标记为禁用状态

### onDisable()

在扩展禁用时调用。

```javascript
onDisable() {
  // 停止后台服务
  this.stopService();
  // 移除事件监听
  this.removeEventListeners();
  // 清理资源
  this.cleanup();
  console.log('扩展已禁用');
}
```

**注意**：
- 如果有其他扩展依赖此扩展，禁用会失败
- 即使此钩子抛出异常，扩展也会被标记为禁用状态

### shouldShowCardContent(context)

判断是否应该为该角色显示卡片内容。**只对已启用的扩展调用**。

```javascript
shouldShowCardContent(context) {
  // 只对巨大娘（倍率 >= 10）显示
  if (!context.calcData || context.calcData.倍率 < 10) {
    return false;
  }
  // 只在卡片展开时显示
  if (!context.expanded) {
    return false;
  }
  return true;
}
```

**CharacterCardContext 结构**：

```typescript
interface CharacterCardContext {
  /** 角色数据 */
  character: CharacterData;
  /** 计算数据 */
  calcData: GiantessData | TinyData | null;
  /** 是否展开 */
  expanded: boolean;
}
```

**注意**：
- 如果不实现此方法，默认会显示（只要 `getCharacterCardExtra` 返回了组件）
- 返回 `false` 时，对应的卡片组件不会被渲染
- 可以根据角色类型、倍率、展开状态等条件决定是否显示

---

### onCharacterUpdate(character, calcData)

在角色数据更新后调用。**只对已启用的扩展调用**。

```javascript
onCharacterUpdate(character, calcData) {
  console.log(`角色 ${character.name} 更新了`);
  console.log(`当前身高: ${character.currentHeight}米`);
  console.log(`倍率: ${calcData.倍率}`);
  
  // 可以返回额外数据，会被写入 MVU 变量
  return {
    _我的扩展数据: {
      someValue: 123,
      computed: calcData.倍率 * 2,
    },
  };
}
```

**参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| `character` | `CharacterData` | 角色基本信息 |
| `calcData` | `GiantessData \| TinyData` | 计算结果 |

**CharacterData 结构**：

```typescript
interface CharacterData {
  name: string;           // 角色名称
  currentHeight: number;  // 当前身高（米）
  originalHeight: number; // 原始身高（米）
  changeReason?: string;  // 变化原因
  changeTime?: string;    // 变化时间
  customParts?: Record<string, number>; // 自定义部位尺寸
  calcData?: CalcData;    // 计算结果
  damageData?: DamageCalculation; // 损害数据
  actualDamage?: ActualDamage; // 实际损害记录
  heightHistory?: HeightRecord[]; // 身高历史
}
```

**返回值**：
- 返回 `void` 表示不需要额外数据
- 返回 `Record<string, unknown>` 会被合并到角色的 MVU 变量中

### onBeforePromptInject(context)

在提示词注入前调用，可以修改提示词上下文。**只对已启用的扩展调用**。

```javascript
onBeforePromptInject(context) {
  // 修改上下文
  context.extraContent = context.extraContent || '';
  context.extraContent += '\n\n## 我的扩展添加的内容\n...';
  
  // 必须返回修改后的上下文
  return context;
}
```

**PromptContext 结构**：

```typescript
interface PromptContext {
  characters: CharacterData[];  // 所有角色
  worldview?: Worldview;        // 当前世界观
  scenario?: string;            // 当前场景
  extraContent?: string;        // 额外内容
}
```

### onAfterPromptInject(promptId)

在提示词注入后调用。**只对已启用的扩展调用**。

```javascript
onAfterPromptInject(promptId) {
  console.log(`提示词已注入，条目 ID: ${promptId}`);
  // 可以在这里做一些后处理
}
```

---

## 📝 内容贡献

扩展可以向系统贡献各种内容，这些内容会在扩展启用时生效。

### getPromptTemplates()

贡献提示词模板，会出现在提示词管理面板中。

```javascript
getPromptTemplates() {
  return [
    {
      id: 'my-extension-prompt',      // 唯一 ID
      name: '我的提示词',              // 显示名称
      description: '这是我的提示词',   // 描述
      enabled: true,                   // 是否默认启用
      order: 9950,                     // 排序（越大越靠前）
      type: 'custom',                  // 类型
      builtin: false,                  // 是否内置
      readonly: false,                 // 是否只读
      requiresFeature: null,           // 依赖的功能开关
      content: `## 我的提示词内容

这里是提示词内容，支持模板变量：
- {{角色名}}
- {{当前身高}}
- {{倍率}}
`,
    },
  ];
}
```

**PromptTemplate 字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | ✅ | 唯一标识符 |
| `name` | `string` | ✅ | 显示名称 |
| `description` | `string` | ✅ | 描述 |
| `enabled` | `boolean` | ✅ | 是否启用 |
| `order` | `number` | ✅ | 排序权重（越大越靠前） |
| `type` | `string` | ✅ | 类型：header/character/interaction/worldview/damage/rules/footer/custom |
| `builtin` | `boolean` | - | 是否内置模板 |
| `readonly` | `boolean` | - | 是否只读 |
| `requiresFeature` | `string` | - | 依赖的功能开关 |
| `content` | `string` | ✅ | 模板内容 |

**可用的模板变量**：

| 变量 | 说明 |
|------|------|
| `{{角色名}}` | 角色名称 |
| `{{当前身高}}` | 当前身高（数值） |
| `{{当前身高_格式化}}` | 当前身高（格式化字符串） |
| `{{原身高}}` | 原始身高（数值） |
| `{{原身高_格式化}}` | 原始身高（格式化字符串） |
| `{{倍率}}` | 缩放倍率 |
| `{{级别}}` | 级别名称 |
| `{{描述}}` | 级别描述 |
| `{{身体数据}}` | 格式化的身体部位数据 |
| `{{相对参照}}` | 格式化的相对参照物 |
| `{{互动限制列表}}` | 格式化的互动限制列表 |
| `{{损害数据}}` | 格式化的损害计算数据 |
| `{{世界观提示词}}` | 当前世界观的完整提示词 |
| `{{世界观名称}}` | 当前世界观名称 |

### getRulesContribution()

贡献追加到主规则模板的规则片段。这些规则会被追加到「变量更新规则」模板的末尾。

```javascript
getRulesContribution() {
  return `## 我的扩展规则

当满足某些条件时，可以使用以下命令：

\`\`\`xml
<gts_update>
_.set('巨大娘.角色.{{角色名}}._我的数据', { value: 123 });
</gts_update>
\`\`\`
`;
}
```

**注意**：
- 返回 `null` 表示不贡献规则
- 规则内容应该是 Markdown 格式
- 规则会按扩展启用顺序追加

### getSettingsComponent()

贡献设置项组件，会显示在扩展面板中。

```javascript
import { defineComponent, h } from 'vue';

getSettingsComponent() {
  return defineComponent({
    name: 'MyExtensionSettings',
    setup() {
      const enabled = ref(true);
      
      return () => h('div', [
        h('label', [
          h('input', {
            type: 'checkbox',
            checked: enabled.value,
            onChange: (e) => { enabled.value = e.target.checked; },
          }),
          '启用某个功能',
        ]),
      ]);
    },
  });
}
```

**注意**：
- 组件应该是一个 Vue 3 组件
- 推荐使用 `defineComponent` + `h` 函数（渲染函数）
- 也可以使用 SFC 格式，但需要构建工具支持

### getCharacterCardExtra()

贡献角色卡片的额外内容，会显示在每个角色卡片的详情区域中。

```javascript
import { defineComponent, h, ref } from 'vue';

getCharacterCardExtra() {
  return defineComponent({
    name: 'MyCharacterExtra',
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
      const localState = ref(false);
      
      return () => h('div', { class: 'gc-ext-my-section' }, [
        // 标题行
        h('div', { class: 'gc-ext-section-title' }, [
          h('i', { class: 'fa-solid fa-star' }),
          h('span', ' 我的扩展数据'),
          h('span', { class: 'gc-ext-badge' }, '自定义'),
        ]),
        // 内容
        h('div', { class: 'gc-ext-grid' }, [
          h('div', { class: 'gc-ext-item' }, [
            h('div', { class: 'gc-ext-label' }, '倍率'),
            h('div', { class: 'gc-ext-value' }, props.calcData?.倍率 || '-'),
          ]),
          h('div', { class: 'gc-ext-item' }, [
            h('div', { class: 'gc-ext-label' }, '自定义值'),
            h('div', { class: 'gc-ext-value' }, 
              props.character._我的扩展数据?.someValue || '无'
            ),
          ]),
        ]),
      ]);
    },
  });
}
```

**组件 Props**：

| Prop | 类型 | 说明 |
|------|------|------|
| `character` | `CharacterData` | 完整的角色数据对象 |
| `calcData` | `GiantessData \| TinyData \| null` | 计算结果数据 |
| `expanded` | `boolean` | 角色卡片是否处于展开状态 |

**推荐的 CSS 类名**（与内置扩展保持一致）：

| 类名 | 用途 |
|------|------|
| `gc-ext-*-section` | 扩展区块容器 |
| `gc-ext-section-title` | 区块标题 |
| `gc-ext-badge` | 标题右侧的徽章 |
| `gc-ext-grid` | 数据网格布局 |
| `gc-ext-item` | 网格项 |
| `gc-ext-label` | 数据标签 |
| `gc-ext-value` | 数据值 |

**注意**：
- 组件应该是轻量级的，避免复杂计算
- 使用 `gc-ext-` 前缀的 CSS 类名可获得内置样式支持
- 组件内的样式使用全局 CSS（不能使用 `scoped`）

### getDebugPanelExtra()

贡献调试面板的额外内容。

```javascript
getDebugPanelExtra() {
  return defineComponent({
    name: 'MyDebugExtra',
    setup() {
      const debugData = ref(null);
      
      const loadData = () => {
        debugData.value = { /* ... */ };
      };
      
      return () => h('div', { class: 'my-debug' }, [
        h('button', { onClick: loadData }, '加载调试数据'),
        debugData.value && h('pre', JSON.stringify(debugData.value, null, 2)),
      ]);
    },
  });
}
```

---

## 🔗 依赖管理

扩展可以声明对其他扩展的依赖。

### 声明依赖

```javascript
window.GiantessCalc.extensions.register({
  id: 'my-advanced-extension',
  name: '高级扩展',
  dependencies: ['damage-calculation', 'another-extension'],
  // ...
});
```

### 依赖规则

1. **启用时**：只有当所有依赖都已启用，扩展才能被启用
2. **禁用时**：如果有其他扩展依赖此扩展，则无法禁用
3. **注册时**：依赖的扩展不需要先注册，但启用时需要存在

### 检查依赖

```javascript
const canEnable = window.GiantessCalc.extensions.canEnable('my-advanced-extension');
if (!canEnable.success) {
  console.log('无法启用:', canEnable.reason);
  console.log('缺失的依赖:', canEnable.missingDependencies);
}
```

---

## 📚 API 参考

### 全局 API

扩展系统通过 `window.GiantessCalc.extensions` 暴露 API。

#### register(extension)

注册一个扩展。

```javascript
window.GiantessCalc.extensions.register(extension: Extension): void
```

**参数**：
- `extension`: 扩展定义对象

**示例**：
```javascript
window.GiantessCalc.extensions.register({
  id: 'my-extension',
  name: '我的扩展',
  description: '描述',
  icon: 'fa-solid fa-star',
});
```

#### get(id)

获取指定扩展。

```javascript
window.GiantessCalc.extensions.get(id: string): Extension | undefined
```

#### getAll()

获取所有已注册的扩展。

```javascript
window.GiantessCalc.extensions.getAll(): Extension[]
```

#### getEnabled()

获取所有已启用的扩展。

```javascript
window.GiantessCalc.extensions.getEnabled(): Extension[]
```

#### enable(id)

启用指定扩展。

```javascript
window.GiantessCalc.extensions.enable(id: string): boolean
```

**返回**：是否成功启用

#### disable(id)

禁用指定扩展。

```javascript
window.GiantessCalc.extensions.disable(id: string): boolean
```

**返回**：是否成功禁用

#### toggle(id)

切换扩展的启用状态。

```javascript
window.GiantessCalc.extensions.toggle(id: string): boolean
```

**返回**：切换后的启用状态

#### isEnabled(id)

检查扩展是否启用。

```javascript
window.GiantessCalc.extensions.isEnabled(id: string): boolean
```

#### getInfo(id)

获取扩展的详细信息。

```javascript
window.GiantessCalc.extensions.getInfo(id: string): ExtensionInfo | null

interface ExtensionInfo {
  extension: Extension;
  enabled: boolean;
  canDisable: boolean;
  canEnable: boolean;
  missingDependencies?: string[];
}
```

#### getAllInfo()

获取所有扩展的详细信息。

```javascript
window.GiantessCalc.extensions.getAllInfo(): ExtensionInfo[]
```

---

## 🎯 开发指南

### 最佳实践

#### 1. 使用唯一的 ID

推荐使用 `作者名-扩展名` 的格式避免冲突：

```javascript
{
  id: 'myname-awesome-extension',
  // ...
}
```

#### 2. 在 onDisable 中清理资源

确保扩展禁用时正确清理：

```javascript
onEnable() {
  this.timer = setInterval(() => { /* ... */ }, 1000);
  window.addEventListener('resize', this.handleResize);
},

onDisable() {
  if (this.timer) {
    clearInterval(this.timer);
    this.timer = null;
  }
  window.removeEventListener('resize', this.handleResize);
}
```

#### 3. 使用前缀避免数据冲突

在 MVU 变量中使用唯一前缀：

```javascript
onCharacterUpdate(character, calcData) {
  return {
    _myExtension_data: {  // 使用前缀
      value: 123,
    },
  };
}
```

#### 4. 优雅降级

检查依赖的功能是否可用：

```javascript
onCharacterUpdate(character, calcData) {
  // 检查损害数据是否存在
  if (!character.damageData) {
    return; // 优雅降级
  }
  
  // 使用损害数据
  const damage = character.damageData;
  // ...
}
```

#### 5. 提供有意义的日志

使用统一的日志前缀：

```javascript
const LOG_PREFIX = '[MyExtension]';

onInit() {
  console.log(`${LOG_PREFIX} 初始化`);
},

onEnable() {
  console.log(`${LOG_PREFIX} 已启用`);
},

onCharacterUpdate(character) {
  console.log(`${LOG_PREFIX} 处理角色: ${character.name}`);
}
```

### 调试技巧

#### 查看已注册的扩展

```javascript
console.table(window.GiantessCalc.extensions.getAllInfo());
```

#### 手动触发角色更新

```javascript
// 获取当前角色数据
const characters = window.GiantessCalc.debug.getMvuInfo().registeredCharacters;

// 查看某个扩展的处理结果
const ext = window.GiantessCalc.extensions.get('my-extension');
const result = ext.onCharacterUpdate?.(character, calcData);
console.log('扩展返回:', result);
```

#### 测试提示词贡献

```javascript
const ext = window.GiantessCalc.extensions.get('my-extension');
const templates = ext.getPromptTemplates?.();
console.log('提示词模板:', templates);
```

---

## 📦 内置扩展

### 损害计算扩展 (damage-calculation)

计算巨大娘行动可能造成的破坏。

**ID**：`damage-calculation`

**功能**：
- 计算足迹影响范围
- 估算人员伤亡
- 估算建筑损毁
- 计算宏观破坏力等级
- 生成特殊物理效应提示

**贡献的数据**：
```javascript
{
  _损害数据: {
    足迹: {
      长度: number,
      宽度: number,
      面积: number,
      覆盖街道: number,
    },
    每步伤亡: number,
    每步建筑损毁: number,
    破坏力等级: string,
    特殊效应: string[],
  }
}
```

**贡献的提示词模板**：
- `damage-calculation`: 损害计算数据
- `damage-rules`: 损害描写指南（默认禁用）

---

### 物品系统扩展 (items-system)

管理和计算角色携带的物品，提供尺寸对比和互动可能性分析。

**ID**：`items-system`

**功能**：
- 管理角色物品列表
- 计算物品随角色缩放后的尺寸
- 分析物品与角色的相对大小
- 判断各种互动的可行性（握持、穿戴、吞咽等）
- 生成基于材质和尺寸的特殊效果

**贡献的数据**：
```javascript
{
  _物品: {
    [物品ID]: {
      名称: string,
      原始尺寸: {
        长?: number,
        宽?: number,
        高?: number,
        直径?: number,
        重量?: number,
      },
      类型?: string,    // 日用品/配饰/服装/食物/交通工具等
      材质?: string,    // 金属/玻璃/塑料/布料等
      随身携带?: boolean, // 是否随角色缩放
    }
  },
  _物品计算: {
    角色名: string,
    倍率: number,
    物品: {
      [物品ID]: {
        定义: ItemDefinition,
        缩放尺寸: ItemDimensions,
        缩放尺寸_格式化: Record<string, string>,
        角色视角: ItemRelativeReference[],
        普通人视角: ItemRelativeReference[],
        互动可能性: ItemInteraction[],
        特殊效果?: string[],
      }
    }
  }
}
```

**贡献的提示词模板**：
- `items-data`: 物品数据
- `items-rules`: 物品描写指南（默认禁用）

**物品类型选项**：
| 类型 | 说明 |
|------|------|
| 日用品 | 手机、钥匙、钱包等 |
| 配饰 | 戒指、项链、耳环等 |
| 服装 | 衣服、鞋子等 |
| 食物 | 食物、饮料等 |
| 家具 | 桌椅、床等 |
| 交通工具 | 车、船、飞机等 |
| 建筑 | 房屋、大厦等 |
| 自然物 | 树、石头等 |
| 玩具 | 玩具、模型等 |
| 武器 | 武器类 |
| 工具 | 工具类 |
| 其他 | 其他物品 |

**材质选项**：
| 材质 | 特殊效果 |
|------|----------|
| 金属 | 重量巨大时落地会造成严重冲击 |
| 玻璃 | 巨大尺寸下可能因自重碎裂 |
| 液体 | 量巨大时倾倒会形成洪水 |
| 其他 | 塑料、木材、布料、皮革、橡胶、石材、混凝土、食材 |

**互动可能性计算**：
| 互动 | 判定条件 | 描述 |
|------|----------|------|
| 单手握持 | 物品尺寸 ≤ 手掌长度 × 1.5 | 可以单手握住 |
| 双手握持 | 物品尺寸 ≤ 手掌长度 × 3 | 可以双手握住 |
| 指尖捏取 | 物品尺寸 ≤ 手掌长度 × 0.5 | 可以用手指捏住 |
| 一口吞下 | 物品尺寸 ≤ 嘴巴宽度 × 0.5（仅食物） | 可以一口吞下 |
| 穿戴 | 尺寸匹配（仅配饰/服装） | 可以穿戴 |

---

## 📋 类型定义

完整的 TypeScript 类型定义：

```typescript
// 扩展定义
interface Extension {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultEnabled?: boolean;
  dependencies?: string[];
  
  onInit?: () => void | Promise<void>;
  onEnable?: () => void | Promise<void>;
  onDisable?: () => void | Promise<void>;
  onCharacterUpdate?: (
    character: CharacterData,
    calcData: GiantessData | TinyData
  ) => void | Record<string, unknown>;
  onBeforePromptInject?: (context: PromptContext) => PromptContext;
  onAfterPromptInject?: (promptId: string) => void;
  
  getPromptTemplates?: () => PromptTemplate[];
  getRulesContribution?: () => string | null;
  getSettingsComponent?: () => Component;
  getCharacterCardExtra?: () => Component;
  getDebugPanelExtra?: () => Component;
}

// 扩展 API
interface ExtensionAPI {
  register(extension: Extension): void;
  get(id: string): Extension | undefined;
  getAll(): Extension[];
  getEnabled(): Extension[];
  enable(id: string): boolean;
  disable(id: string): boolean;
  toggle(id: string): boolean;
  isEnabled(id: string): boolean;
  getInfo(id: string): ExtensionInfo | null;
  getAllInfo(): ExtensionInfo[];
}

// 扩展信息
interface ExtensionInfo {
  extension: Extension;
  enabled: boolean;
  canDisable: boolean;
  canEnable: boolean;
  missingDependencies?: string[];
}
```

---

## 🔄 版本兼容

| 巨大娘计算器版本 | 扩展 API 版本 | 备注 |
|-----------------|--------------|------|
| v3.0.0+ | v1.0 | 初始版本 |
| v3.2.0+ | v1.1 | 添加全局 API |

**向后兼容承诺**：
- 扩展 API 的主版本号变更表示不兼容
- 次版本号变更保持向后兼容

---

## 📚 相关文档

- [架构文档](../ARCHITECTURE.md) - 项目整体架构
- [API 文档](../API.md) - 完整 API 参考
- [协作开发规范](../CONTRIBUTING.md) - 贡献者指南

---

## 📅 文档更新日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2025-01 | v1.0 | 初始文档 |
