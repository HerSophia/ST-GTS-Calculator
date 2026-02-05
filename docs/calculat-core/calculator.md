# 计算函数

> `src/core/calculator.ts` - 核心计算函数

---

## 📋 概览

计算模块提供三个核心函数：

| 函数 | 说明 |
|------|------|
| `calculateGiantessData()` | 计算巨大娘完整身体数据 |
| `calculateTinyData()` | 计算小人（缩小化角色）数据 |
| `determineLevel()` | 根据倍率判断级别 |
| `findSimilarObject()` | 找到最接近的参照物 |

---

## 🔧 determineLevel

根据缩放倍率判断当前级别。

### 函数签名

```typescript
function determineLevel(scale: number): LevelInfo
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `scale` | `number` | 缩放倍率（当前身高 / 原身高） |

### 返回值

```typescript
interface LevelInfo {
  name: string;         // 级别名称
  description: string;  // 级别描述
  type: 'giant' | 'tiny'; // 类型：巨大化或缩小化
  minScale?: number;    // 最小倍率（巨大化）
  maxScale?: number;    // 最大倍率（巨大化）
  scale?: number;       // 代表倍率（缩小化）
}
```

### 判定逻辑

```typescript
if (scale >= 1) {
  // 巨大化：遍历 SIZE_LEVELS 匹配范围
  for (const level of SIZE_LEVELS) {
    if (scale >= level.minScale && scale < level.maxScale) {
      return { ...level, type: 'giant' };
    }
  }
  return { name: '宇宙级', description: '超越可观测宇宙', type: 'giant' };
} else {
  // 缩小化：遍历 TINY_LEVELS 匹配范围
  for (const level of TINY_LEVELS) {
    if (scale <= level.scale * 10 && scale > level.scale / 10) {
      return { ...level, type: 'tiny' };
    }
  }
  return { name: '亚原子级', description: '比原子还小', type: 'tiny' };
}
```

### 示例

```typescript
import { determineLevel } from '@/core';

// 巨大化
determineLevel(1);     // { name: 'Mini级', type: 'giant', ... }
determineLevel(50);    // { name: '十倍', type: 'giant', ... }
determineLevel(150);   // { name: 'Kilo级', type: 'giant', ... }
determineLevel(1e12);  // { name: '星系级_万亿倍', type: 'giant', ... }

// 缩小化
determineLevel(0.5);   // { name: '十分之一', type: 'tiny', ... }
determineLevel(0.01);  // { name: '百分之一', type: 'tiny', ... }
determineLevel(0.001); // { name: '千分之一_毫米级', type: 'tiny', ... }
```

---

## 🔍 findSimilarObject

根据尺寸找到最接近的参照物。

### 函数签名

```typescript
function findSimilarObject(sizeInMeters: number): string
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `sizeInMeters` | `number` | 尺寸（米） |

### 返回值

- 返回描述性字符串，如 `"约等于轿车长度的大小"`
- 如果没有接近的参照物，返回空字符串

### 匹配逻辑

使用对数比较找到最接近的参照物：

```typescript
const ratio = Math.abs(Math.log(sizeInMeters / referenceSize));
```

然后根据比例生成描述：
- 0.8 - 1.2 倍：`"约等于 XXX 的大小"`
- < 1 倍：`"比 XXX 小一些"`
- > 1 倍：`"比 XXX 大一些"`

### 示例

```typescript
import { findSimilarObject } from '@/core';

findSimilarObject(4.5);    // "约等于轿车长度的大小"
findSimilarObject(3.0);    // "比轿车长度小一些"
findSimilarObject(0.003);  // "约等于蚂蚁的大小"
```

---

## 👩‍🦰 calculateGiantessData

计算巨大娘的完整身体数据。

### 函数签名

```typescript
function calculateGiantessData(
  currentHeight: number,
  originalHeight: number = 1.65,
  customParts: Record<string, number> = {}
): GiantessData
```

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `currentHeight` | `number` | - | 当前身高（米） |
| `originalHeight` | `number` | `1.65` | 原身高（米） |
| `customParts` | `Record<string, number>` | `{}` | 自定义部位尺寸 |

### 返回值

```typescript
interface GiantessData {
  // 基础信息
  原身高: number;              // 原始身高（米）
  当前身高: number;            // 当前身高（米）
  当前身高_格式化: string;     // 格式化的当前身高
  倍率: number;                // 缩放倍率
  级别: string;                // 级别名称
  级别描述: string;            // 级别描述

  // 身体数据
  身体部位: Record<string, number>;      // 原始数值
  身体部位_格式化: Record<string, string>; // 格式化字符串
  自定义部位: Record<string, number>;    // 自定义部位记录
  自定义部位_倍率: Record<string, number>; // 自定义部位的倍率

  // 相对参照
  眼中的世界: Record<string, number>;      // 参照物相对尺寸（原始）
  眼中的世界_格式化: Record<string, string>; // 参照物相对尺寸（格式化）

  // 描述
  描述: string;                // 综合描述文本

  // 元数据
  _计算时间: number;           // 计算时间戳
  _版本: string;               // 数据版本
}
```

### 计算逻辑

#### 1. 计算倍率

```typescript
const scale = currentHeight / originalHeight;
```

#### 2. 计算身体部位

根据部位类型使用不同的缩放规则：

```typescript
for (const [part, baseValue] of Object.entries(BASE_BODY_PARTS)) {
  // 检查是否有自定义尺寸
  if (customParts[part] !== undefined) {
    // 使用自定义值，并计算其独立倍率
    const customValue = customParts[part];
    const partScale = customValue / (baseValue * (originalHeight / BASE_HEIGHT));
    // 格式化时添加 ⚡ 标记
  }
  // 重量：按立方缩放
  else if (part.includes('重量')) {
    scaledValue = baseValue * Math.pow(scale, 3) * (originalHeight / BASE_HEIGHT);
  }
  // 体积：按立方缩放
  else if (part.includes('容积')) {
    scaledValue = baseValue * Math.pow(scale, 3) * Math.pow(originalHeight / BASE_HEIGHT, 3);
  }
  // 面积：按平方缩放
  else if (part.includes('面积')) {
    scaledValue = baseValue * Math.pow(scale, 2) * Math.pow(originalHeight / BASE_HEIGHT, 2);
  }
  // 普通长度：线性缩放
  else {
    scaledValue = baseValue * scale * (originalHeight / BASE_HEIGHT);
  }
}
```

#### 3. 计算参照物相对尺寸

```typescript
for (const [name, realSize] of Object.entries(REFERENCE_OBJECTS)) {
  const perceivedSize = realSize / scale;
  // 例：100倍巨大娘眼中，1.7米的人类 = 1.7cm
}
```

#### 4. 生成描述

根据级别选择有意义的参照物组合，生成描述文本。

### 示例

```typescript
import { calculateGiantessData } from '@/core';

// 基础计算
const data = calculateGiantessData(170, 1.65);
console.log(data.倍率);                    // 103.03
console.log(data.级别);                    // "Kilo级"
console.log(data.身体部位_格式化.足长);     // "24.29米"
console.log(data.眼中的世界_格式化.普通成年人); // "1.65厘米"

// 带自定义部位
const dataCustom = calculateGiantessData(170, 1.65, {
  乳房高度: 28,  // 胸部单独设为 28 米
  足长: 40,      // 脚掌单独设为 40 米
});
console.log(dataCustom.身体部位_格式化.乳房高度); // "28米 ⚡"
console.log(dataCustom.身体部位_格式化.足长);     // "40米 ⚡"
console.log(dataCustom.自定义部位_倍率.乳房高度); // 约 200
console.log(dataCustom.自定义部位_倍率.足长);     // 约 160
```

---

## 🐜 calculateTinyData

计算小人（缩小化角色）的数据。

### 函数签名

```typescript
function calculateTinyData(
  currentHeight: number,
  originalHeight: number = 1.7
): TinyData
```

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `currentHeight` | `number` | - | 当前身高（米） |
| `originalHeight` | `number` | `1.7` | 原身高（米） |

### 返回值

```typescript
interface TinyData {
  // 基础信息
  原身高: number;
  当前身高: number;
  当前身高_格式化: string;
  倍率: number;              // < 1 的小数
  级别: string;
  级别描述: string;

  // 相对参照（正常女性在小人眼中的尺寸）
  眼中的巨大娘: Record<string, number>;
  眼中的巨大娘_格式化: Record<string, string>;

  // 描述
  描述: string;

  // 元数据
  _计算时间: number;
  _版本: string;
}
```

### 计算逻辑

小人数据计算的核心是：**正常人在小人眼中有多大**。

```typescript
for (const [part, baseValue] of Object.entries(BASE_BODY_PARTS)) {
  // 只计算长度类部位
  if (!part.includes('重量') && !part.includes('容积') && !part.includes('面积')) {
    const perceivedSize = baseValue / scale;
    // 例：0.01 倍小人眼中，0.25米的脚掌 = 25米
  }
}
```

### 示例

```typescript
import { calculateTinyData } from '@/core';

const data = calculateTinyData(0.017, 1.7);
console.log(data.倍率);                     // 0.01
console.log(data.级别);                     // "百分之一"
console.log(data.当前身高_格式化);           // "1.7厘米"
console.log(data.眼中的巨大娘_格式化.身高);   // "175米"
console.log(data.眼中的巨大娘_格式化.足长);   // "25米"
console.log(data.眼中的巨大娘_格式化.大脚趾长); // "4.5米"
```

---

## 📝 描述生成

### 巨大娘描述

`generateDescription()` 根据级别选择有意义的参照物：

| 倍率范围 | 参照物 |
|----------|--------|
| < 100 | 人类、轿车、两层楼房 |
| 100 - 10,000 | 人类、十层楼房、埃菲尔铁塔 |
| 10,000 - 1,000,000 | 珠穆朗玛峰、云层、国际空间站 |
| 1,000,000 - 1e9 | 地球、月球 |
| 1e9 - 1e12 | 太阳、地月距离 |
| > 1e12 | 日地距离、银河系 |

### 小人描述

`generateTinyDescription()` 展示正常女性在小人眼中的尺寸：

- 身高
- 脚掌
- 脚趾
- 阴毛（当 scale < 0.01）
- 头发直径（当 scale < 0.01）

---

## 💡 最佳实践

### 1. 缓存计算结果

计算函数是纯函数，可以安全缓存：

```typescript
const cache = new Map<string, GiantessData>();

function getCachedData(height: number, original: number): GiantessData {
  const key = `${height}-${original}`;
  if (!cache.has(key)) {
    cache.set(key, calculateGiantessData(height, original));
  }
  return cache.get(key)!;
}
```

### 2. 判断角色类型

```typescript
function getCharacterType(scale: number): 'giant' | 'tiny' | 'normal' {
  if (scale >= 1.5) return 'giant';
  if (scale <= 0.8) return 'tiny';
  return 'normal';
}

// 根据类型选择计算函数
const scale = currentHeight / originalHeight;
if (getCharacterType(scale) === 'giant') {
  return calculateGiantessData(currentHeight, originalHeight);
} else if (getCharacterType(scale) === 'tiny') {
  return calculateTinyData(currentHeight, originalHeight);
}
```

### 3. 自定义部位的使用场景

```typescript
// 场景1：局部强化（胸部、臀部异常增大）
const enhanced = calculateGiantessData(170, 1.65, {
  乳房高度: 50,  // 胸部特别大
  臀部宽度: 150, // 臀部特别宽
});

// 场景2：局部变化（只有脚变大）
const bigFoot = calculateGiantessData(1.65, 1.65, {
  足长: 2.5,     // 身高不变，但脚掌有 2.5 米
});
```
