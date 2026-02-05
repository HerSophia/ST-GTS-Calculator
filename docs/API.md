# 巨大娘计算器 - API 文档

> 本文档描述项目对外暴露的 API，包括全局对象、核心函数和服务接口。

---

## 📋 API 概览

项目提供三种级别的 API：

| 级别 | 访问方式 | 适用场景 | 稳定性 |
|------|----------|----------|--------|
| **全局 API** | `window.GiantessCalc.*` | 控制台调试、外部脚本集成 | ⭐⭐⭐ 稳定 |
| **Core API** | `import { ... } from '@/core'` | 脚本内部开发、纯计算需求 | ⭐⭐⭐ 稳定 |
| **Service API** | `import { ... } from '@/services'` | 高级集成、扩展开发 | ⭐⭐ 较稳定 |

---

## 🌐 全局 API

脚本加载后会在 `window` 上暴露 `GiantessCalc` 对象，可在浏览器控制台或其他脚本中直接使用。

### 访问方式

```javascript
// 浏览器控制台
GiantessCalc.calculate(170, 1.65)

// 其他脚本
window.GiantessCalc.formatLength(1500)
```

### API 列表

#### 计算函数

##### `calculate(height, originalHeight)`

计算巨大娘身体数据。

```typescript
GiantessCalc.calculate(height: number, originalHeight: number): GiantessData
```

**参数**：
- `height`: 当前身高（米）
- `originalHeight`: 原始身高（米）

**返回**：`GiantessData` 对象，包含倍率、级别、身体数据、相对参照等。

**示例**：
```javascript
const data = GiantessCalc.calculate(170, 1.65);
console.log(data.倍率);      // 103.03
console.log(data.级别.名称); // "Kilo级"
console.log(data.身体数据);  // { 身高: "170米", 足长: "24.5米", ... }
```

---

##### `calculateTiny(height, originalHeight)`

计算小人（缩小化角色）身体数据。

```typescript
GiantessCalc.calculateTiny(height: number, originalHeight: number): TinyData
```

**参数**：
- `height`: 当前身高（米）
- `originalHeight`: 原始身高（米）

**返回**：`TinyData` 对象，包含缩小倍率、级别、身体数据等。

**示例**：
```javascript
const data = GiantessCalc.calculateTiny(0.017, 1.70);
console.log(data.倍率);      // 0.01
console.log(data.级别.名称); // "百分之一"
console.log(data.身体数据);  // { 身高: "1.7厘米", ... }
```

---

##### `checkInteraction(bigHeight, smallHeight)`

检查两个角色之间的互动限制。

```typescript
GiantessCalc.checkInteraction(
  bigHeight: number, 
  smallHeight: number
): InteractionLimits
```

**参数**：
- `bigHeight`: 较大角色的身高（米）
- `smallHeight`: 较小角色的身高（米）

**返回**：`InteractionLimits` 对象，包含可行和不可行的互动列表。

**示例**：
```javascript
const limits = GiantessCalc.checkInteraction(170, 0.017);
console.log(limits.impossible); // 不可行的互动
console.log(limits.possible);   // 可行的互动
```

---

##### `determineLevel(ratio)`

根据倍率确定级别。

```typescript
GiantessCalc.determineLevel(ratio: number): LevelInfo
```

**参数**：
- `ratio`: 缩放倍率（当前身高/原始身高）

**返回**：`LevelInfo` 对象，包含级别名称、描述和类型。

**示例**：
```javascript
const level = GiantessCalc.determineLevel(100);
console.log(level.name);        // "Kilo级"
console.log(level.description); // "城市踩在脚下"
console.log(level.type);        // "giant"
```

---

#### 格式化函数

##### `formatLength(meters)`

将米数智能转换为人类可读的长度字符串。

```typescript
GiantessCalc.formatLength(meters: number): string
```

**示例**：
```javascript
GiantessCalc.formatLength(0.01)      // "1厘米"
GiantessCalc.formatLength(1.5)       // "1.5米"
GiantessCalc.formatLength(1500)      // "1.5公里"
GiantessCalc.formatLength(1e12)      // "6.68AU"
GiantessCalc.formatLength(1e17)      // "10.57光年"
```

---

##### `formatWeight(kg)`

将千克数智能转换为人类可读的重量字符串。

```typescript
GiantessCalc.formatWeight(kg: number): string
```

**示例**：
```javascript
GiantessCalc.formatWeight(0.5)       // "500克"
GiantessCalc.formatWeight(75)        // "75公斤"
GiantessCalc.formatWeight(1500)      // "1.5吨"
GiantessCalc.formatWeight(1e12)      // "1万亿吨"
```

---

##### `formatVolume(m3)`

将立方米数智能转换为人类可读的体积字符串。

```typescript
GiantessCalc.formatVolume(m3: number): string
```

**示例**：
```javascript
GiantessCalc.formatVolume(0.001)     // "1升"
GiantessCalc.formatVolume(1)         // "1立方米"
GiantessCalc.formatVolume(1e9)       // "1立方公里"
```

---

#### 常量

##### `BASE_BODY_PARTS`

身体部位基准尺寸（相对于 1.65m 标准身高）。

```typescript
GiantessCalc.BASE_BODY_PARTS: Record<string, number>
```

**示例**：
```javascript
console.log(GiantessCalc.BASE_BODY_PARTS);
// {
//   足长: 0.238,
//   足宽: 0.089,
//   手掌长: 0.175,
//   乳房高度: 0.12,
//   ...
// }
```

---

##### `REFERENCE_OBJECTS`

参照物尺寸（米）。

```typescript
GiantessCalc.REFERENCE_OBJECTS: Record<string, number>
```

**示例**：
```javascript
console.log(GiantessCalc.REFERENCE_OBJECTS);
// {
//   普通人类: 1.65,
//   轿车: 4.5,
//   公交车: 12,
//   东京塔: 333,
//   珠穆朗玛峰: 8848,
//   地球直径: 12742000,
//   太阳直径: 1392700000,
//   ...
// }
```

---

##### `SIZE_LEVELS`

巨大化级别定义。

```typescript
GiantessCalc.SIZE_LEVELS: SizeLevel[]
```

**示例**：
```javascript
console.log(GiantessCalc.SIZE_LEVELS);
// [
//   { name: "Mini级", minScale: 1, maxScale: 10, description: "几米到十几米" },
//   { name: "十倍", minScale: 10, maxScale: 100, description: "建筑如玩具" },
//   { name: "Kilo级", minScale: 100, maxScale: 1000, description: "城市踩在脚下" },
//   ...
// ]
```

---

##### `INTERACTION_RULES`

互动规则定义。

```typescript
GiantessCalc.INTERACTION_RULES: Record<string, InteractionRule>
```

**示例**：
```javascript
console.log(GiantessCalc.INTERACTION_RULES['手掌握住']);
// {
//   minRatio: 0.01,
//   description: "需要小者有一定大小才能被手掌握住",
//   alternatives: "可以用指尖捏住、放在掌心"
// }
```

---

#### 配置与版本

##### `VERSION`

当前版本号。

```typescript
GiantessCalc.VERSION: string  // 例如 "3.1.0"
```

---

##### `CONFIG`

当前配置（只读 getter）。

```typescript
GiantessCalc.CONFIG: Settings
```

**示例**：
```javascript
console.log(GiantessCalc.CONFIG.precision);           // 2
console.log(GiantessCalc.CONFIG.autoInject);          // true
console.log(GiantessCalc.CONFIG.enableDamageCalculation); // false
```

---

#### 调试功能

##### `debug.getMvuInfo()`

获取 MVU 状态信息。

```typescript
GiantessCalc.debug.getMvuInfo(): MvuDebugInfo
```

**返回**：
```javascript
{
  mvuAvailable: true,
  variablePrefix: "巨大娘",
  hasStatData: true,
  hasGiantessData: true,
  registeredCharacters: ["络络", "小明"],
  rawData: { ... }
}
```

---

##### `debug.injectTestData(name, height, originalHeight)`

注入测试数据（用于调试）。

```typescript
GiantessCalc.debug.injectTestData(
  name: string,
  height: number,
  originalHeight: number
): TestInjectionResult
```

**示例**：
```javascript
// 注入巨大娘测试数据
GiantessCalc.debug.injectTestData('测试角色', 100, 1.65);

// 注入小人测试数据
GiantessCalc.debug.injectTestData('小人', 0.01, 1.65);
```

---

##### `debug.clearTestData(name?)`

清除测试数据。

```typescript
GiantessCalc.debug.clearTestData(name?: string): void
```

**示例**：
```javascript
// 清除指定角色
GiantessCalc.debug.clearTestData('测试角色');

// 清除所有
GiantessCalc.debug.clearTestData();
```

---

##### `debug.logs`

调试日志列表（只读 getter）。

```typescript
GiantessCalc.debug.logs: DebugLogEntry[]
```

---

##### `debug.clearLogs()`

清空调试日志。

```typescript
GiantessCalc.debug.clearLogs(): void
```

---

#### 更新功能

##### `updater.checkForUpdates()`

检查是否有新版本。

```typescript
GiantessCalc.updater.checkForUpdates(): Promise<UpdateCheckResult>
```

**返回**：
```javascript
{
  hasUpdate: true,
  currentVersion: "3.0.0",
  latestVersion: "3.1.0",
  releaseUrl: "https://github.com/.../releases/tag/v3.1.0",
  releaseNotes: "..."
}
```

---

##### `updater.getReleasePageUrl()`

获取发布页面 URL。

```typescript
GiantessCalc.updater.getReleasePageUrl(): string
```

---

## 🔶 Core API

Core 层提供**纯函数**，无副作用，可用于脚本内部开发。

### 导入方式

```typescript
import {
  calculateGiantessData,
  calculateTinyData,
  determineLevel,
  formatLength,
  formatWeight,
  formatVolume,
  checkInteractionLimits,
  calculateDamage,
  BASE_BODY_PARTS,
  REFERENCE_OBJECTS,
  SIZE_LEVELS,
  TINY_LEVELS,
  INTERACTION_RULES,
  POPULATION_DENSITY,
} from '@/core';
```

### 计算函数

#### `calculateGiantessData(height, originalHeight, customParts?)`

计算巨大娘完整身体数据。

```typescript
function calculateGiantessData(
  height: number,
  originalHeight: number,
  customParts?: Record<string, number>
): GiantessData
```

**参数**：
- `height`: 当前身高（米）
- `originalHeight`: 原始身高（米）
- `customParts`: 自定义部位尺寸（可选）

**返回**：
```typescript
interface GiantessData {
  倍率: number;                           // 缩放倍率
  级别: LevelInfo;                        // 级别信息
  身体数据: Record<string, string>;       // 格式化的身体部位数据
  身体数据_原始: Record<string, number>;  // 原始数值（米）
  相对参照: Record<string, string>;       // 参照物相对大小
  自定义部位?: Record<string, number>;    // 自定义部位
  自定义部位_倍率?: Record<string, number>; // 自定义部位的倍率
}
```

**示例**：
```typescript
// 基础计算
const data = calculateGiantessData(170, 1.65);

// 带自定义部位
const dataWithCustom = calculateGiantessData(170, 1.65, {
  乳房高度: 28,  // 胸部单独设为 28 米
  足长: 40,      // 脚掌单独设为 40 米
});
```

---

#### `calculateTinyData(height, originalHeight)`

计算小人（缩小化角色）身体数据。

```typescript
function calculateTinyData(
  height: number,
  originalHeight: number
): TinyData
```

**返回**：
```typescript
interface TinyData {
  倍率: number;                      // 缩小倍率（< 1）
  级别: LevelInfo;                   // 级别信息
  身体数据: Record<string, string>;  // 格式化的身体部位数据
  危险参照: Record<string, string>;  // 相对于小人的危险物
}
```

---

#### `checkInteractionLimits(bigHeight, smallHeight, formatter?)`

检查互动限制。

```typescript
function checkInteractionLimits(
  bigHeight: number,
  smallHeight: number,
  formatter?: (m: number) => string
): InteractionLimits
```

**返回**：
```typescript
interface InteractionLimits {
  sizeRatio: number;                    // 尺寸比例
  impossible: ImpossibleInteraction[];  // 不可行的互动
  possible: string[];                   // 可行的互动
}

interface ImpossibleInteraction {
  name: string;          // 互动名称
  reason: string;        // 不可行原因
  alternatives: string;  // 替代方案
}
```

---

#### `calculateDamage(footLength, footWidth, scenario?)`

计算巨大娘行动造成的损害。

```typescript
function calculateDamage(
  footLength: number,
  footWidth: number,
  scenario?: keyof typeof POPULATION_DENSITY
): DamageCalculation
```

**参数**：
- `footLength`: 足长（米）
- `footWidth`: 足宽（米）
- `scenario`: 场景名称（默认 "大城市"）

**返回**：
```typescript
interface DamageCalculation {
  footprint: FootprintImpact;      // 足迹影响
  stepDamage: StepDamage;          // 每步损害
  macroDestruction: MacroDestruction; // 宏观破坏力
  scenario: string;                // 当前场景
  specialEffects: string[];        // 特殊物理效应
}
```

---

### 格式化函数

#### `formatLength(meters, useAstronomical?)`

```typescript
function formatLength(meters: number, useAstronomical?: boolean): string
```

智能转换长度单位，支持：
- 微米、毫米、厘米、米、公里
- AU（天文单位）、光年

---

#### `formatWeight(kg)`

```typescript
function formatWeight(kg: number): string
```

智能转换重量单位，支持：
- 克、公斤、吨
- 万吨、亿吨、万亿吨

---

#### `formatVolume(m3)`

```typescript
function formatVolume(m3: number): string
```

智能转换体积单位，支持：
- 毫升、升、立方米、立方公里

---

#### `formatArea(m2)`

```typescript
function formatArea(m2: number): string
```

智能转换面积单位，支持：
- 平方厘米、平方米、公顷、平方公里

---

### 常量

#### `BASE_BODY_PARTS`

身体部位基准尺寸表（相对于 1.65m 标准女性）。

```typescript
const BASE_BODY_PARTS: Record<string, number> = {
  // 垂直高度
  身高: 1.65,
  眼睛高度: 1.535,
  肩膀高度: 1.36,
  // 足部
  足长: 0.238,
  足宽: 0.089,
  大脚趾长: 0.028,
  // 手部
  手掌长: 0.175,
  手掌宽: 0.077,
  手指长: 0.067,
  // 胸部
  乳房高度: 0.12,
  乳房宽度: 0.14,
  // ... 更多部位
};
```

---

#### `REFERENCE_OBJECTS`

参照物尺寸表（米）。

```typescript
const REFERENCE_OBJECTS: Record<string, number> = {
  // 日常物品
  普通人类: 1.65,
  轿车: 4.5,
  公交车: 12,
  足球场: 105,
  // 建筑
  东京塔: 333,
  帝国大厦: 443,
  哈利法塔: 828,
  // 地理
  珠穆朗玛峰: 8848,
  马里亚纳海沟: 10994,
  // 天文
  地球直径: 12742000,
  月球直径: 3474000,
  太阳直径: 1392700000,
  // ... 更多参照物
};
```

---

#### `SIZE_LEVELS`

巨大化级别定义。

```typescript
const SIZE_LEVELS: SizeLevel[] = [
  { name: 'Mini级', minScale: 1, maxScale: 10, description: '几米到十几米' },
  { name: '十倍', minScale: 10, maxScale: 100, description: '建筑如玩具' },
  { name: 'Kilo级', minScale: 100, maxScale: 1000, description: '城市踩在脚下' },
  { name: '千倍', minScale: 1000, maxScale: 10000, description: '山脉如石子' },
  { name: 'Mega级', minScale: 10000, maxScale: 1000000, description: '触及云层到行星尺度' },
  { name: 'Giga级', minScale: 1000000, maxScale: 1000000000, description: '星球如玩具' },
  { name: 'Tera级', minScale: 1000000000, maxScale: 1000000000000, description: '恒星系穿行' },
];
```

---

#### `TINY_LEVELS`

缩小化级别定义。

```typescript
const TINY_LEVELS: TinyLevel[] = [
  { name: '十分之一', scale: 0.1, description: '如宠物' },
  { name: '百分之一', scale: 0.01, description: '如虫子' },
  { name: '毫米级', scale: 0.001, description: '蚂蚁如猛兽' },
  { name: '微米级', scale: 0.000001, description: '细胞尺度' },
  { name: '纳米级', scale: 0.000000001, description: '分子尺度' },
];
```

---

#### `POPULATION_DENSITY`

人口密度参考表（人/平方公里）。

```typescript
const POPULATION_DENSITY: Record<string, number> = {
  荒野: 1,
  乡村: 50,
  郊区: 500,
  小城市: 3000,
  中等城市: 5000,
  大城市: 10000,
  超大城市中心: 25000,
  东京市中心: 15000,
  香港: 27000,
  马尼拉: 43000,
  // 室内场景
  住宅内: 40000,
  公寓楼内: 80000,
  办公楼内: 100000,
  体育馆内: 500000,
  // 特殊
  巨大娘体内: 0,
};
```

---

## 🔵 Service API

Service 层提供**业务逻辑封装**，适合高级集成和扩展开发。

### 导入方式

```typescript
import {
  // Calculator Service
  getCharacterType,
  calculateCharacterData,
  calculateFullCharacterData,
  checkInteraction,
  
  // Prompt Service
  buildAndInjectPrompt,
  injectPromptContent,
  uninjectPrompt,
  
  // Variables Service
  readGiantessData,
  readCharacterData,
  writeCharacterCalcData,
  syncVariablesToStore,
  parseGtsUpdateCommands,
} from '@/services';
```

### Calculator Service

#### `getCharacterType(scale)`

判断角色类型。

```typescript
function getCharacterType(scale: number): 'giant' | 'tiny' | 'normal'
```

**判断逻辑**：
- `scale >= 1.5` → `'giant'`
- `scale <= 0.8` → `'tiny'`
- 其他 → `'normal'`

---

#### `calculateCharacterData(currentHeight, originalHeight, customParts?)`

统一计算接口，自动判断是巨大娘还是小人。

```typescript
function calculateCharacterData(
  currentHeight: number,
  originalHeight: number,
  customParts?: Record<string, number>
): GiantessData | TinyData
```

---

#### `calculateFullCharacterData(currentHeight, originalHeight, options?)`

完整计算，包括损害数据。

```typescript
function calculateFullCharacterData(
  currentHeight: number,
  originalHeight: number,
  options?: {
    customParts?: Record<string, number>;
    enableDamage?: boolean;
    damageScenario?: string;
  }
): CalculationResult

interface CalculationResult {
  type: 'giant' | 'tiny' | 'normal';
  scale: number;
  calcData: GiantessData | TinyData | null;
  damageData: DamageCalculation | null;
}
```

---

#### `needsRecalculation(character, rawData)`

检查角色是否需要重新计算。

```typescript
function needsRecalculation(
  character: CharacterData,
  rawData: CharacterMvuData
): boolean
```

---

### Prompt Service

#### `buildAndInjectPrompt(characters, options?)`

构建并注入提示词到 Lorebook。

```typescript
function buildAndInjectPrompt(
  characters: CharacterDataForInjection[],
  options?: {
    injectInteractions?: boolean;
    injectWorldview?: boolean;
    injectDamage?: boolean;
  }
): string | null  // 返回注入的条目 ID，失败返回 null
```

---

#### `injectPromptContent(content, options?)`

直接注入自定义提示词内容。

```typescript
function injectPromptContent(
  content: string,
  options?: {
    entryId?: string;
    depth?: number;
  }
): string  // 返回条目 ID
```

---

#### `uninjectPrompt(entryId?)`

移除已注入的提示词。

```typescript
function uninjectPrompt(entryId?: string): boolean
```

---

### Variables Service

#### `readGiantessData()`

读取当前楼层的巨大娘数据。

```typescript
function readGiantessData(): GiantessVariableData | null
```

---

#### `readCharacterData(name)`

读取指定角色的数据。

```typescript
function readCharacterData(name: string): CharacterFullData | null

interface CharacterFullData {
  当前身高?: number;
  原身高?: number;
  变化原因?: string;
  变化时间?: string;
  自定义部位?: Record<string, number>;
  _计算数据?: CalculationData;
  _损害数据?: DamageCalculation;
  _身高历史?: HeightRecord[];
}
```

---

#### `writeCharacterCalcData(name, calcData)`

写入角色计算数据到楼层变量。

```typescript
function writeCharacterCalcData(
  name: string,
  calcData: CalculationData
): void
```

---

#### `syncVariablesToStore()`

将楼层变量同步到 Pinia Store。

```typescript
function syncVariablesToStore(): SyncResult

interface SyncResult {
  success: boolean;
  charactersUpdated: string[];
  errors: string[];
}
```

---

#### `parseGtsUpdateCommands(text)`

解析 AI 输出中的 `<gts_update>` 命令。

```typescript
function parseGtsUpdateCommands(text: string): ParsedUpdate[]

interface ParsedUpdate {
  characterName: string;
  field: string;
  value: unknown;
}
```

**示例**：
```typescript
const updates = parseGtsUpdateCommands(`
<gts_update>
_.set('巨大娘.角色.络络.当前身高', 500);
_.set('巨大娘.角色.络络.变化原因', '喝下药水');
</gts_update>
`);

console.log(updates);
// [
//   { characterName: '络络', field: '当前身高', value: 500 },
//   { characterName: '络络', field: '变化原因', value: '喝下药水' }
// ]
```

---

## 📦 类型定义

所有类型定义都可以从 `@/types` 导入：

```typescript
import type {
  // 计算相关
  GiantessData,
  TinyData,
  LevelInfo,
  CalcData,
  
  // 互动限制
  InteractionRule,
  InteractionLimits,
  ImpossibleInteraction,
  
  // 损害计算
  DamageCalculation,
  FootprintImpact,
  StepDamage,
  MacroDestruction,
  
  // 角色相关
  CharacterData,
  CharacterMvuData,
  HeightRecord,
  
  // 设置
  Settings,
  DamageScenario,
  
  // 扩展
  Extension,
  ExtensionRegistry,
  CharacterCardContext,
  
  // 提示词
  PromptTemplate,
  PromptContext,
  
  // 世界观
  Worldview,
} from '@/types';
```

---

## 🎯 使用场景

### 场景 1：外部脚本集成

```javascript
// 在其他酒馆脚本中使用
if (window.GiantessCalc) {
  const data = GiantessCalc.calculate(heightValue, 1.65);
  console.log(`当前级别: ${data.级别.名称}`);
}
```

### 场景 2：自定义提示词

```typescript
import { buildCharacterContext, injectPromptContent } from '@/services';

const context = buildCharacterContext(character);
const customPrompt = `
## 自定义提示词
${context.bodyData}

特殊规则：...
`;

injectPromptContent(customPrompt);
```

### 场景 3：扩展开发

```typescript
import { extensionManager, calculateFullCharacterData } from '@/services';
import type { Extension, CharacterCardContext } from '@/types';
import { defineComponent, h } from 'vue';

const myExtension: Extension = {
  id: 'my-extension',
  name: '我的扩展',
  description: '这是我的扩展',
  icon: 'fa-solid fa-star',
  
  onCharacterUpdate(character, calcData) {
    // 角色数据更新时的自定义逻辑
    console.log(`${character.name} 更新了`);
    return {
      _myExtensionData: { value: 123 },
    };
  },
  
  // 判断是否应该为该角色显示卡片内容
  shouldShowCardContent(context: CharacterCardContext) {
    return context.character.calcData?.倍率 >= 10;
  },
  
  // 贡献角色卡片额外内容
  getCharacterCardExtra() {
    return defineComponent({
      name: 'MyCardContent',
      props: {
        character: { type: Object, required: true },
        calcData: { type: Object, default: null },
        expanded: { type: Boolean, default: false },
      },
      setup(props) {
        return () => h('div', { class: 'my-section' }, [
          h('div', { class: 'title' }, '我的扩展数据'),
          h('span', `倍率: ${props.calcData?.倍率}`),
        ]);
      },
    });
  },
};

extensionManager.register(myExtension);
```

### 场景 4：纯计算（不依赖 Vue）

```typescript
import {
  calculateGiantessData,
  checkInteractionLimits,
  formatLength,
} from '@/core';

// 纯函数计算，无副作用
const giant = calculateGiantessData(170, 1.65);
const tiny = calculateGiantessData(0.017, 1.70);
const limits = checkInteractionLimits(170, 0.017, formatLength);
```

---

## ⚠️ 注意事项

### API 稳定性

| 标记 | 含义 |
|------|------|
| ⭐⭐⭐ | 稳定，不会破坏性变更 |
| ⭐⭐ | 较稳定，可能有小调整 |
| ⭐ | 实验性，可能会变更 |
| 🔒 | 内部 API，不建议外部使用 |

### 内部 API（不建议使用）

以下 API 为内部实现细节，不建议外部使用：

```typescript
// Variables Service 内部 API（以 _internal_ 前缀标识）
_internal_readGiantessData()
_internal_extractCharacters()
_internal_readRawVariables()

// Store 内部方法
useCharactersStoreBase()  // 使用 useCharacters() composable 代替
```

### 向后兼容

- **全局 API** (`window.GiantessCalc`)：保证向后兼容
- **Core API**：保证向后兼容
- **Service API**：尽量保持兼容，重大变更会在 CHANGELOG 中说明

---

## 📚 相关文档

- [架构文档](./ARCHITECTURE.md) - 项目整体架构
- [使用文档](../src/README.md) - 用户使用指南
- [协作开发规范](./CONTRIBUTING.md) - 贡献者指南

---

## 📅 文档更新日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2025-01 | v1.0 | 初始文档，描述 v3.x API |
