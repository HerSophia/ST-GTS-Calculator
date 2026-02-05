# 格式化工具

> `src/core/formatter.ts` - 长度、重量、体积、面积的智能格式化

---

## 📋 概览

格式化模块提供智能单位转换，将数值转换为人类可读的字符串。

| 函数 | 说明 |
|------|------|
| `formatLength()` | 长度格式化（支持天文单位） |
| `formatWeight()` | 重量格式化 |
| `formatVolume()` | 体积格式化 |
| `formatArea()` | 面积格式化 |
| `round()` | 四舍五入工具 |
| `setPrecision()` | 设置全局精度 |
| `getPrecision()` | 获取全局精度 |

---

## ⚙️ 精度控制

### setPrecision / getPrecision

控制格式化输出的小数位数。

```typescript
let precision = 2; // 默认值

function setPrecision(p: number): void {
  precision = p;
}

function getPrecision(): number {
  return precision;
}
```

### round

四舍五入到指定精度。

```typescript
function round(value: number, p: number = precision): number
```

**示例**：

```typescript
import { round, setPrecision } from '@/core';

round(3.14159);       // 3.14（使用默认精度 2）
round(3.14159, 3);    // 3.142
round(3.14159, 0);    // 3

setPrecision(4);
round(3.14159);       // 3.1416
```

---

## 📏 formatLength

智能转换长度单位，支持从皮米到光年的完整范围。

### 函数签名

```typescript
function formatLength(meters: number, useAstronomical: boolean = true): string
```

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `meters` | `number` | - | 长度（米） |
| `useAstronomical` | `boolean` | `true` | 是否使用天文单位（AU、光年） |

### 单位范围

| 范围 | 单位 | 示例 |
|------|------|------|
| < 1e-9 | 皮米 | `"1.7皮米"` |
| 1e-9 - 1e-6 | 纳米 | `"1.7纳米"` |
| 1e-6 - 1e-3 | 微米 | `"1.7微米"` |
| 1e-3 - 0.01 | 毫米 | `"1.7毫米"` |
| 0.01 - 1 | 厘米 | `"17厘米"` |
| 1 - 1000 | 米 | `"170米"` |
| ≥ 1000 | 公里 | `"1.7公里"` |
| ≥ 1 AU | AU | `"1.5AU"`（天文单位） |
| ≥ 1 光年 | 光年 | `"4.3光年"` |

### 天文单位常量

```typescript
const LIGHT_YEAR = 9460730472580800;  // 光年（米）
const AU = 149597870700;               // 天文单位（米）
```

### 转换逻辑

```typescript
function formatLength(meters: number, useAstronomical = true): string {
  const abs = Math.abs(meters);

  // 天文单位（如果启用）
  if (useAstronomical) {
    if (abs >= LIGHT_YEAR * 1000) {
      return `${round(meters / LIGHT_YEAR)}光年`;
    }
    if (abs >= LIGHT_YEAR) {
      return `${round(meters / LIGHT_YEAR, 3)}光年`;
    }
    if (abs >= AU) {
      return `${round(meters / AU)}AU`;
    }
  }

  // 常规单位
  if (abs >= 1000) return `${round(meters / 1000)}公里`;
  if (abs >= 1) return `${round(meters)}米`;
  if (abs >= 0.01) return `${round(meters * 100)}厘米`;
  if (abs >= 0.001) return `${round(meters * 1000)}毫米`;
  if (abs >= 0.000001) return `${round(meters * 1000000)}微米`;
  if (abs >= 0.000000001) return `${round(meters * 1000000000)}纳米`;
  return `${round(meters * 1000000000000)}皮米`;
}
```

### 示例

```typescript
import { formatLength } from '@/core';

// 微小尺度
formatLength(0.000000001);   // "1纳米"
formatLength(0.000001);      // "1微米"
formatLength(0.001);         // "1毫米"
formatLength(0.01);          // "1厘米"

// 人类尺度
formatLength(1.65);          // "1.65米"
formatLength(170);           // "170米"
formatLength(1500);          // "1.5公里"

// 地理尺度
formatLength(8848);          // "8.85公里"
formatLength(12742000);      // "12742公里"

// 天文尺度
formatLength(149597870700);            // "1AU"
formatLength(9460730472580800);        // "1光年"
formatLength(9460730472580800 * 4.3);  // "4.3光年"

// 禁用天文单位
formatLength(149597870700, false);     // "149597870.7公里"
```

---

## ⚖️ formatWeight

智能转换重量单位。

### 函数签名

```typescript
function formatWeight(kg: number): string
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `kg` | `number` | 重量（千克） |

### 单位范围

| 范围 | 单位 | 示例 |
|------|------|------|
| < 1000 | 千克 | `"75千克"` |
| 1,000 - 1e6 | 吨 | `"1.5吨"` |
| 1e6 - 1e9 | 百万吨 | `"5百万吨"` |
| 1e9 - 1e12 | 十亿吨 | `"2十亿吨"` |
| ≥ 1e12 | 万亿吨 | `"1万亿吨"` |

### 示例

```typescript
import { formatWeight } from '@/core';

formatWeight(65);            // "65千克"
formatWeight(1500);          // "1.5吨"
formatWeight(1000000);       // "1百万吨"
formatWeight(1000000000);    // "1十亿吨"
formatWeight(1000000000000); // "1万亿吨"
```

---

## 📦 formatVolume

智能转换体积单位。

### 函数签名

```typescript
function formatVolume(cubicMeters: number): string
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `cubicMeters` | `number` | 体积（立方米） |

### 单位范围

| 范围 | 单位 | 示例 |
|------|------|------|
| < 1e-6 | 立方毫米 | `"1000立方毫米"` |
| 1e-6 - 0.001 | 毫升 | `"500毫升"` |
| 0.001 - 1 | 升 | `"5升"` |
| 1 - 1e9 | 立方米 | `"100立方米"` |
| ≥ 1e9 | 立方公里 | `"1立方公里"` |

### 示例

```typescript
import { formatVolume } from '@/core';

formatVolume(0.0000001);     // "100立方毫米"
formatVolume(0.0005);        // "500毫升"
formatVolume(0.005);         // "5升"
formatVolume(100);           // "100立方米"
formatVolume(1000000000);    // "1立方公里"
```

---

## 📐 formatArea

智能转换面积单位。

### 函数签名

```typescript
function formatArea(sqMeters: number): string
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `sqMeters` | `number` | 面积（平方米） |

### 单位范围

| 范围 | 单位 | 示例 |
|------|------|------|
| < 0.0001 | 平方毫米 | `"70平方毫米"` |
| 0.0001 - 1 | 平方厘米 | `"50平方厘米"` |
| 1 - 1e6 | 平方米 | `"100平方米"` |
| ≥ 1e6 | 平方公里 | `"1平方公里"` |

### 示例

```typescript
import { formatArea } from '@/core';

formatArea(0.00007);         // "70平方毫米"（指尖面积）
formatArea(0.005);           // "50平方厘米"
formatArea(100);             // "100平方米"
formatArea(1000000);         // "1平方公里"
```

---

## 💡 使用场景

### 1. 身体数据格式化

```typescript
import { formatLength, formatWeight, formatVolume, formatArea } from '@/core';

const scale = 100; // 100 倍巨大娘

// 长度类
const footLength = 0.25 * scale; // 25 米
console.log(formatLength(footLength)); // "25米"

// 重量类（立方缩放）
const breastWeight = 1.06 * Math.pow(scale, 3); // 1,060,000 千克
console.log(formatWeight(breastWeight)); // "1.06百万吨"

// 体积类（立方缩放）
const vaginaVolume = 0.0000175 * Math.pow(scale, 3); // 17,500 立方米
console.log(formatVolume(vaginaVolume)); // "17500立方米"

// 面积类（平方缩放）
const fingertipArea = 0.00007 * Math.pow(scale, 2); // 0.7 平方米
console.log(formatArea(fingertipArea)); // "0.7平方米"
```

### 2. 参照物相对尺寸

```typescript
import { formatLength } from '@/core';

const scale = 100;
const humanHeight = 1.7; // 正常人类身高

const perceivedSize = humanHeight / scale; // 0.017 米
console.log(formatLength(perceivedSize)); // "1.7厘米"
```

### 3. 天文尺度

```typescript
import { formatLength } from '@/core';

const sunDiameter = 1392000000; // 太阳直径
const scale = 1e12; // 万亿倍

// 巨大娘的身高
const height = 1.65 * scale; // 1.65 万亿米
console.log(formatLength(height)); // "11.02AU"

// 太阳在她眼中的大小
const perceivedSun = sunDiameter / scale; // 0.001392 米
console.log(formatLength(perceivedSun)); // "1.39毫米"
```

---

## ⚠️ 注意事项

### 1. 精度问题

默认精度为 2 位小数，某些场景可能需要更高精度：

```typescript
import { round, setPrecision } from '@/core';

// 微小数值需要更高精度
const tinyValue = 0.00000123;
round(tinyValue);      // 0（精度不够）
round(tinyValue, 8);   // 0.00000123

// 或临时修改全局精度
setPrecision(6);
round(tinyValue);      // 0.000001
```

### 2. 负数处理

格式化函数使用 `Math.abs()` 处理负数，但返回值会保留符号：

```typescript
import { formatLength } from '@/core';

// 注意：当前实现不处理负数符号
// 建议在调用前确保输入为正数
const length = Math.abs(someValue);
formatLength(length);
```

### 3. 极端值

对于超出常规范围的值，建议检查后再格式化：

```typescript
import { formatLength } from '@/core';

// 超大值
if (meters > 1e30) {
  return "超出可观测宇宙";
}

// 超小值
if (meters < 1e-15) {
  return "亚原子尺度";
}

return formatLength(meters);
```
