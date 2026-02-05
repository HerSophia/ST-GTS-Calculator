# 物品计算 - 计算函数

> `src/core/items.ts` 中的计算函数

---

## 📋 概览

| 函数 | 说明 |
|------|------|
| `calculateItem()` | 计算单个物品的缩放数据 |
| `calculateCharacterItems()` | 计算角色的所有物品 |
| `generateItemsPrompt()` | 生成物品提示词 |
| `formatItemsCompact()` | 格式化为紧凑版本 |

---

## 🔧 calculateItem

主计算函数，计算单个物品在指定缩放倍率下的尺寸和互动可能性。

### 函数签名

```typescript
function calculateItem(
  item: ItemDefinition,
  characterScale: number,
  isCarried: boolean = false
): ItemCalculation
```

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `item` | `ItemDefinition` | - | 物品定义 |
| `characterScale` | `number` | - | 角色的缩放倍率 |
| `isCarried` | `boolean` | `false` | 是否是随身物品（覆盖物品定义中的设置） |

### 返回值

```typescript
interface ItemCalculation {
  /** 原始物品定义 */
  定义: ItemDefinition;
  
  /** 缩放后的尺寸 */
  缩放尺寸: ItemDimensions;
  
  /** 缩放后的尺寸（格式化） */
  缩放尺寸_格式化: Record<string, string>;
  
  /** 对于角色来说像什么 */
  角色视角: ItemRelativeReference[];
  
  /** 对于普通人来说像什么 */
  普通人视角: ItemRelativeReference[];
  
  /** 可能的互动 */
  互动可能性: ItemInteraction[];
  
  /** 特殊效果（基于材质和尺寸） */
  特殊效果?: string[];
}
```

### 子类型定义

#### ItemRelativeReference

```typescript
interface ItemRelativeReference {
  /** 参照物名称 */
  参照物: string;
  /** 相对大小描述 */
  描述: string;
  /** 比例 */
  比例: number;
}
```

#### ItemInteraction

```typescript
interface ItemInteraction {
  /** 互动名称 */
  名称: string;
  /** 是否可行 */
  可行: boolean;
  /** 原因/描述 */
  描述: string;
}
```

### 缩放逻辑

```typescript
// 确定缩放倍率
const scale = isCarried || item.随身携带 ? characterScale : 1;

// 线性尺寸缩放
if (item.原始尺寸.长 !== undefined) {
  scaledDimensions.长 = item.原始尺寸.长 * scale;
}

// 重量按体积（三次方）缩放
if (item.原始尺寸.重量 !== undefined) {
  scaledDimensions.重量 = item.原始尺寸.重量 * Math.pow(scale, 3);
}
```

### 示例

```typescript
import { calculateItem, PRESET_ITEMS } from '@/core';

// 场景 1：100 倍巨大娘携带的手机（随身缩放）
const phone = PRESET_ITEMS['智能手机'];
const calc1 = calculateItem(phone, 100, true);
console.log(calc1.缩放尺寸_格式化.长);  // "15米"
console.log(calc1.缩放尺寸_格式化.重量); // "200吨"

// 场景 2：100 倍巨大娘捡起地上的轿车（不缩放）
const car = PRESET_ITEMS['轿车'];
const calc2 = calculateItem(car, 100, false);
console.log(calc2.缩放尺寸_格式化.长);  // "4.5米"（保持原始尺寸）
console.log(calc2.互动可能性[0]);       // {名称: '单手握持', 可行: true, ...}
```

---

## 🤝 互动判定

`calculateItem()` 会自动计算以下互动的可行性：

### 握持类互动

| 互动 | 判定条件 | 描述 |
|------|----------|------|
| 单手握持 | `物品尺寸 / 手掌长 ≤ 0.8` | 可以轻松单手握住 |
| 单手握持 | `0.8 < 物品尺寸 / 手掌长 ≤ 1.5` | 可以单手握住，但需要用力 |
| 单手握持 | `物品尺寸 / 手掌长 > 1.5` | ❌ 物品太大，无法单手握住 |
| 双手握持 | `物品尺寸 / 手掌长 ≤ 3` | 可以双手握住 |
| 双手握持 | `物品尺寸 / 手掌长 > 3` | ❌ 物品太大，双手也无法握住 |
| 指尖捏取 | `物品尺寸 / 手掌长 ≤ 0.3` | 可以用两指轻松捏起 |
| 指尖捏取 | `0.3 < 物品尺寸 / 手掌长 ≤ 0.5` | 可以用手指捏住 |
| 指尖捏取 | `物品尺寸 / 手掌长 > 0.5` | ❌ 物品太大，无法用手指捏取 |

### 食物类互动（仅当 `类型 === '食物'`）

| 互动 | 判定条件 | 描述 |
|------|----------|------|
| 一口吞下 | `物品尺寸 / 嘴巴宽度 ≤ 0.5` | 可以一口吞下 |
| 咬食 | `0.5 < 物品尺寸 / 嘴巴宽度 ≤ 1.5` | 需要分几口吃完 |
| 咬食 | `物品尺寸 / 嘴巴宽度 > 1.5` | ❌ 物品太大，无法直接咬食 |

### 穿戴类互动（仅当 `类型 === '配饰'` 或 `'服装'`）

| 情况 | 判定结果 |
|------|----------|
| 随身携带的物品 | ✓ 随身物品，已随角色一起缩放，可正常穿戴 |
| 外来物品，尺寸合适 | ✓ 尺寸合适，可以穿戴 |
| 外来物品，太小 | ❌ 物品太小，无法穿戴 |
| 外来物品，太大 | ❌ 物品太大，无法穿戴 |

### 判定逻辑代码

```typescript
function calculateInteractions(
  item: ItemDefinition,
  scaledDimensions: ItemDimensions,
  characterScale: number
): ItemInteraction[] {
  const interactions: ItemInteraction[] = [];
  
  // 角色的手掌尺寸
  const handLength = BASE_BODY_PARTS.手掌长 * characterScale;
  
  // 物品的主要尺寸（取最大维度）
  const itemMainSize = Math.max(
    scaledDimensions.长 || 0,
    scaledDimensions.宽 || 0,
    scaledDimensions.高 || 0,
    scaledDimensions.直径 || 0
  );
  
  // 物品与手掌的比例
  const handRatio = itemMainSize / handLength;
  
  // 单手握持判定
  if (handRatio <= 0.8) {
    interactions.push({
      名称: '单手握持',
      可行: true,
      描述: '可以轻松单手握住',
    });
  } else if (handRatio <= 1.5) {
    interactions.push({
      名称: '单手握持',
      可行: true,
      描述: '可以单手握住，但需要用力',
    });
  } else {
    interactions.push({
      名称: '单手握持',
      可行: false,
      描述: `物品太大，无法单手握住（物品约${handRatio.toFixed(1)}倍于手掌）`,
    });
  }
  
  // ... 其他互动判定
  return interactions;
}
```

---

## ⚡ 特殊效果

基于材质和尺寸计算特殊物理效果。

### 材质相关效果

```typescript
function calculateSpecialEffects(
  item: ItemDefinition,
  scaledDimensions: ItemDimensions,
  characterScale: number
): string[] {
  const effects: string[] = [];
  
  const itemMainSize = Math.max(
    scaledDimensions.长 || 0,
    scaledDimensions.宽 || 0,
    scaledDimensions.高 || 0,
    scaledDimensions.直径 || 0
  );
  
  // 玻璃材质
  if (item.材质 === '玻璃' && itemMainSize > 10) {
    effects.push('玻璃材质在巨大尺寸下可能因自重碎裂');
  }
  
  // 金属材质
  if (item.材质 === '金属' && scaledDimensions.重量 && scaledDimensions.重量 > 1000) {
    effects.push('金属物品重量巨大，落地会造成严重冲击');
  }
  
  // 液体材质
  if (item.材质 === '液体' && scaledDimensions.重量 && scaledDimensions.重量 > 100) {
    effects.push('液体量巨大，倾倒会形成洪水');
  }
  
  return effects;
}
```

### 尺寸相关效果

| 物品尺寸 | 效果 |
|----------|------|
| > 100m | 物品已达到建筑级别尺寸 |
| > 1km | 物品可能影响局部气候 |
| > 10km | 物品产生可观测的引力场 |

### 类型相关效果

| 类型 | 角色倍率 | 效果 |
|------|----------|------|
| 交通工具 | > 10 | 交通工具已成为玩具大小，可单手把玩 |
| 建筑 | > 100 | 建筑物如同积木般微小 |

---

## 👁️ 相对参照

### 角色视角

将物品尺寸与角色（缩放后的）身体部位进行对比：

```typescript
function findBodyPartReferences(
  itemSize: number,
  characterScale: number
): ItemRelativeReference[] {
  // 角色缩放后的身体部位尺寸
  const scaledParts: Record<string, number> = {};
  for (const [name, size] of Object.entries(BASE_BODY_PARTS)) {
    scaledParts[name] = size * characterScale;
  }
  
  // 找到最相近的 3 个部位
  // 返回描述如 "约等于角色的手掌长"
}
```

### 普通人视角

将物品尺寸与标准参照物进行对比：

```typescript
function findSimilarReferences(
  sizeMeters: number,
  count: number = 3
): ItemRelativeReference[] {
  // 合并参照物和身体部位
  const allRefs = {
    ...REFERENCE_OBJECTS,
    '人类手掌': BASE_BODY_PARTS.手掌长,
    '人类身高': BASE_BODY_PARTS.身高,
  };
  
  // 找到最相近的参照物
  // 返回描述如 "约100倍人类身高大小"
}
```

---

## 📝 calculateCharacterItems

计算角色的所有物品。

### 函数签名

```typescript
function calculateCharacterItems(
  characterName: string,
  characterScale: number,
  items: CharacterItems
): CharacterItemsCalculation
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `characterName` | `string` | 角色名称 |
| `characterScale` | `number` | 角色缩放倍率 |
| `items` | `CharacterItems` | 物品列表（键为物品 ID） |

### 返回值

```typescript
interface CharacterItemsCalculation {
  /** 角色名 */
  角色名: string;
  /** 角色倍率 */
  倍率: number;
  /** 各物品的计算结果 */
  物品: Record<string, ItemCalculation>;
}
```

### 示例

```typescript
import { calculateCharacterItems } from '@/core';

const items = {
  phone: { 名称: '手机', 原始尺寸: { 长: 0.15 }, 随身携带: true },
  car: { 名称: '轿车', 原始尺寸: { 长: 4.5 }, 随身携带: false },
};

const result = calculateCharacterItems('络络', 100, items);

console.log(result.物品.phone.缩放尺寸_格式化.长); // "15米"
console.log(result.物品.car.缩放尺寸_格式化.长);   // "4.5米"
```

---

## 📝 generateItemsPrompt

生成物品提示词，用于注入到 AI 提示词中。

### 函数签名

```typescript
function generateItemsPrompt(
  characterName: string,
  itemsCalc: CharacterItemsCalculation
): string
```

### 输出示例

```typescript
import { calculateCharacterItems, generateItemsPrompt } from '@/core';

const items = {
  phone: {
    名称: '智能手机',
    原始尺寸: { 长: 0.15, 宽: 0.07, 高: 0.008, 重量: 0.2 },
    类型: '日用品',
    材质: '玻璃',
    随身携带: true,
  },
};

const itemsCalc = calculateCharacterItems('络络', 100, items);
const prompt = generateItemsPrompt('络络', itemsCalc);

console.log(prompt);
```

**输出**：

```
【络络的物品】

## 智能手机
类型：日用品 | 材质：玻璃
缩放后尺寸：长:15米 宽:7米 高:80厘米 重量:200吨
角色视角：约等于角色的手掌长
普通人视角：约9倍普通人类大小
可行互动：单手握持、双手握持、指尖捏取
特殊效果：玻璃材质在巨大尺寸下可能因自重碎裂
```

---

## 📦 formatItemsCompact

格式化为紧凑版本，适合在有限空间内显示。

### 函数签名

```typescript
function formatItemsCompact(
  itemsCalc: CharacterItemsCalculation
): string
```

### 返回值

用 ` | ` 分隔的紧凑格式字符串。

### 示例

```typescript
import { calculateCharacterItems, formatItemsCompact } from '@/core';

const items = {
  phone: { 名称: '手机', 原始尺寸: { 长: 0.15, 高: 0.008 }, 随身携带: true },
  car: { 名称: '轿车', 原始尺寸: { 长: 4.5, 高: 1.5 }, 随身携带: false },
};

const itemsCalc = calculateCharacterItems('络络', 100, items);
const compact = formatItemsCompact(itemsCalc);

console.log(compact);
// "手机(长:15米 高:80厘米) | 轿车(长:4.5米 高:1.5米)"
```

---

## 💡 使用场景

### 1. 实时物品计算

```typescript
import { calculateItem } from '@/core';

// 角色倍率变化时重新计算
function onScaleChange(newScale: number) {
  for (const item of characterItems) {
    const calc = calculateItem(item, newScale);
    updateItemDisplay(item.id, calc);
  }
}
```

### 2. 互动可行性检查

```typescript
import { calculateItem } from '@/core';

function canPickUp(item: ItemDefinition, characterScale: number): boolean {
  const calc = calculateItem(item, characterScale, false);
  const pickUp = calc.互动可能性.find(i => i.名称 === '单手握持');
  return pickUp?.可行 ?? false;
}
```

### 3. 提示词注入

```typescript
import { calculateCharacterItems, generateItemsPrompt } from '@/core';
import { injectPromptContent } from '@/services';

function injectItemsPrompt(character: Character) {
  if (!character._物品 || Object.keys(character._物品).length === 0) {
    return;
  }
  
  const itemsCalc = calculateCharacterItems(
    character.name,
    character.倍率,
    character._物品
  );
  
  const prompt = generateItemsPrompt(character.name, itemsCalc);
  injectPromptContent(prompt, { entryId: `items-${character.name}` });
}
```

### 4. 判断是否能吃下

```typescript
import { calculateItem } from '@/core';

function canEat(food: ItemDefinition, characterScale: number): {
  canEat: boolean;
  method: string;
} {
  const calc = calculateItem(food, characterScale, false);
  
  const swallow = calc.互动可能性.find(i => i.名称 === '一口吞下');
  if (swallow?.可行) {
    return { canEat: true, method: '一口吞下' };
  }
  
  const bite = calc.互动可能性.find(i => i.名称 === '咬食');
  if (bite?.可行) {
    return { canEat: true, method: '分几口吃完' };
  }
  
  return { canEat: false, method: '无法直接食用' };
}
```

---

## ⚠️ 注意事项

### 1. 随身携带优先级

`isCarried` 参数会覆盖物品定义中的 `随身携带` 属性：

```typescript
const item = { 名称: '戒指', 随身携带: true };

// 使用物品定义中的设置（随身携带）
calculateItem(item, 100);        // 会缩放
calculateItem(item, 100, true);  // 会缩放

// 强制不缩放
calculateItem(item, 100, false); // 不会缩放
```

### 2. 重量三次方缩放

重量按体积缩放，会产生非常大的数值：

```typescript
// 200g 手机，100 倍缩放
// 重量 = 0.2 * 100³ = 200,000 kg = 200 吨
```

### 3. 主尺寸选取

互动判定使用**最大尺寸维度**：

```typescript
const itemMainSize = Math.max(
  scaledDimensions.长 || 0,
  scaledDimensions.宽 || 0,
  scaledDimensions.高 || 0,
  scaledDimensions.直径 || 0
);
```

### 4. 身体部位基准

互动判定使用 `BASE_BODY_PARTS` 中的基准值（基于 1.65m 标准女性）：

- 手掌长：0.10m
- 嘴巴宽度：0.05m

这些值会乘以 `characterScale` 得到实际尺寸。
