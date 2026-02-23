# Play Guide 扩展实现计划

## 概述

实现一个名为「玩法指导」的内置扩展（`play-guide`），允许用户：
1. 开启/关闭内置的玩法指导提示词
2. 添加自定义的指导提示词
3. 基于预设模板快速创建指导提示词

## 设计思路

### 扩展定位

玩法指导扩展通过 `getPromptTemplates()` 贡献提示词模板，为 AI 提供场景玩法的引导，例如：
- **基础玩法指导**（内置）：如何描写巨大娘/小人互动场景的基本原则
- **感官描写指导**（内置）：如何描写不同尺度下的感官体验
- **用户自定义指导**：用户可以根据自己的偏好添加额外指导

### 与现有扩展的模式保持一致

参考 `damage-extension.ts` 和 `item-extension.ts` 的实现模式：
- Extension 对象定义在独立文件中
- 通过 `index.ts` 注册到 extensionManager
- 通过 settings store 中的 flag 控制启用/禁用
- 在 `syncExtensionsWithSettings()` 中同步状态

### 自定义指导的存储

用户自定义的指导提示词存储在**脚本变量**中（与 settings 同级），通过一个独立的 key 管理。扩展在 `getPromptTemplates()` 中同时返回内置模板和用户自定义模板。

---

## 文件变更清单

### 1. 新增文件

| 文件 | 说明 |
|------|------|
| `src/services/extensions/play-guide-extension.ts` | 扩展主体实现 |
| `tests/services/extensions/play-guide-extension.test.ts` | 扩展单元测试 |

### 2. 修改文件

| 文件 | 变更内容 |
|------|----------|
| `src/types/settings.ts` | Settings 接口新增 `enablePlayGuide: boolean` 和 `injectPlayGuidePrompt: boolean` |
| `src/stores/settings.ts` | Settings schema 新增对应字段及默认值 |
| `src/services/extensions/index.ts` | 导出 playGuideExtension 并在 `registerBuiltinExtensions()` 中注册，在 `initExtensions()` 和 `syncExtensionsWithSettings()` 中同步 |
| `src/composables/useExtensions.ts` | 新增 play-guide 相关的 computed 属性和方法 |

---

## 详细实现

### Step 1: 类型定义 — `src/types/settings.ts`

在 `Settings` 接口的扩展计算系统区域新增：

```typescript
// 玩法指导设置
enablePlayGuide: boolean;
injectPlayGuidePrompt: boolean;
```

### Step 2: Settings Store — `src/stores/settings.ts`

在 Settings zod schema 中新增：

```typescript
// 玩法指导设置
enablePlayGuide: z.boolean().default(false),
injectPlayGuidePrompt: z.boolean().default(true),
```

### Step 3: 扩展主体 — `src/services/extensions/play-guide-extension.ts`

**核心结构：**

```typescript
export const PLAY_GUIDE_EXTENSION_ID = 'play-guide';

// 内置指导模板定义
const BUILTIN_GUIDES = [...];  // 预设的指导提示词内容

// 可供用户选择的指导模板
export const GUIDE_TEMPLATES = [...]; // 用户创建新指导时的起始模板

// 自定义指导的存储管理
function loadCustomGuides(): PlayGuideItem[] { ... }
function saveCustomGuides(guides: PlayGuideItem[]): void { ... }

export const playGuideExtension: Extension = {
  id: PLAY_GUIDE_EXTENSION_ID,
  name: '玩法指导',
  description: '提供内置和自定义的玩法指导提示词，帮助 AI 更好地描写场景',
  icon: 'fa-solid fa-compass',
  defaultEnabled: false,

  onInit() { ... },
  onEnable() { ... },
  onDisable() { ... },

  getPromptTemplates() {
    // 返回内置 + 用户自定义的指导模板
    return [...builtinTemplates, ...customTemplates];
  },

  getSettingsComponent() {
    // 返回 Vue 组件：列表显示所有指导、添加/编辑/删除自定义指导、模板选择
    return defineComponent({ ... });
  },
};
```

**内置指导提示词内容（示例）：**

1. **基础互动指导** (`play-guide-basic`)
   - 巨大娘/小人互动的基本描写原则
   - 体型差异下的物理互动指导
   - 感官差异的描写提示

2. **感官描写指导** (`play-guide-sensory`)
   - 视觉：从不同角度观察的差异
   - 触觉：皮肤接触、温度感知
   - 听觉：声音的放大/缩小效果
   - 嗅觉：气味的浓缩/扩散

**可供用户选择的模板（GUIDE_TEMPLATES）：**

提供几个起始模板让用户快速创建自定义指导：
- 空白模板
- 温柔互动模板
- 冒险探索模板
- 日常生活模板

**自定义指导数据结构：**

```typescript
interface PlayGuideItem {
  id: string;       // 唯一标识
  name: string;     // 指导名称
  content: string;  // 指导内容
  enabled: boolean; // 是否启用
  order: number;    // 排序
}
```

自定义指导存储在全局变量中，key 为 `巨大娘_play_guides`，与 settings 存储方式一致。

### Step 4: 注册扩展 — `src/services/extensions/index.ts`

1. 在导出部分新增：
```typescript
export { playGuideExtension, PLAY_GUIDE_EXTENSION_ID, GUIDE_TEMPLATES } from './play-guide-extension';
```

2. 在 `registerBuiltinExtensions()` 中新增注册调用

3. 在 `initExtensions()` 中检查 `settings.enablePlayGuide` 并启用

4. 在 `syncExtensionsWithSettings()` 中同步状态

### Step 5: Composable 扩展 — `src/composables/useExtensions.ts`

新增以下 computed 属性和方法：

```typescript
// play-guide 相关
const isPlayGuideEnabled = computed({ ... });
const injectPlayGuidePrompt = computed({ ... });
const onPlayGuideToggle = (enabled: boolean) => { ... };
```

### Step 6: 单元测试 — `tests/services/extensions/play-guide-extension.test.ts`

测试用例：
1. 扩展基本信息正确
2. `getPromptTemplates()` 返回内置模板
3. 自定义指导的增删改查
4. 启用/禁用状态正确控制模板返回
5. `getSettingsComponent()` 返回有效的 Vue 组件

---

## 内置指导提示词内容设计

### 1. 基础互动指导

主要内容覆盖：
- 描写尺度差异时的注意事项
- 互动场景的物理合理性提醒
- 情感表达的层次感
- 避免常见描写错误

### 2. 感官描写指导

主要内容覆盖：
- 从巨大娘视角描写小人的感受
- 从小人视角描写巨大娘的感受
- 环境互动的细节描写
- 尺度变化过程中的感官转变

---

## 实现顺序

按照依赖关系，实现顺序为：
1. 类型定义 + Settings Store（基础设施）
2. 扩展主体实现（核心功能）
3. 注册 + 同步逻辑（集成）
4. Composable 扩展（UI 支持）
5. 单元测试（质量保证）

## 注意事项

- 所有内置指导提示词的 `type` 设为 `'custom'`（与 damage/items 扩展一致）
- 内置指导的 `builtin` 设为 `true`，`readonly` 设为 `true`
- 用户自定义指导的 `builtin` 设为 `false`，`readonly` 设为 `false`
- 提示词的 `order` 值设在 9900 附近（在角色数据之后、规则之前）
- 自定义指导的 `requiresFeature` 设为 `'enablePlayGuide'`，确保扩展禁用时不显示
- settings component 使用 `defineComponent` + `h` 渲染函数（与现有扩展保持一致）

## TODO LIST

<!-- LIMCODE_TODO_LIST_START -->
- [ ] Step 1: 在 src/types/settings.ts 的 Settings 接口中新增 enablePlayGuide 和 injectPlayGuidePrompt 字段  `#1`
- [ ] Step 2: 在 src/stores/settings.ts 的 Settings zod schema 中新增对应字段和默认值  `#2`
- [ ] Step 3: 创建 src/services/extensions/play-guide-extension.ts — 扩展主体（ID、内置指导模板、自定义指导存储、getPromptTemplates、getSettingsComponent）  `#3`
- [ ] Step 4: 修改 src/services/extensions/index.ts — 导出、注册、初始化和同步 play-guide 扩展  `#4`
- [ ] Step 5: 修改 src/composables/useExtensions.ts — 新增 play-guide 相关的 computed 和方法  `#5`
- [ ] Step 6: 创建 tests/services/extensions/play-guide-extension.test.ts — 单元测试  `#6`
<!-- LIMCODE_TODO_LIST_END -->
