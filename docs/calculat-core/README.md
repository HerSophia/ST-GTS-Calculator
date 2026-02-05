# 巨大娘计算器 - 基础计算核心

> 本文档描述 `src/core/` 目录下的基础计算模块，包括常量定义、计算函数、格式化工具和互动限制系统。

---

## 📋 模块概览

基础计算核心是整个巨大娘计算器的基石，采用**纯函数**设计，**零外部依赖**，可独立测试和使用。

```
src/core/
├── constants.ts      # 常量定义（身体部位、参照物、级别）
├── calculator.ts     # 核心计算函数
├── formatter.ts      # 格式化工具
├── interactions.ts   # 互动限制系统
├── damage.ts         # 损害计算（独立模块，见单独文档）
└── index.ts          # 统一导出
```

| 模块 | 职责 | 主要导出 |
|------|------|----------|
| **constants** | 常量定义 | `BASE_BODY_PARTS`, `REFERENCE_OBJECTS`, `SIZE_LEVELS`, `TINY_LEVELS` |
| **calculator** | 核心计算 | `calculateGiantessData()`, `calculateTinyData()`, `determineLevel()` |
| **formatter** | 格式化 | `formatLength()`, `formatWeight()`, `formatVolume()`, `formatArea()` |
| **interactions** | 互动限制 | `INTERACTION_RULES`, `checkInteractionLimits()`, `generateInteractionPrompt()` |

---

## 🎯 设计原则

### 1. 纯函数

所有计算函数都是**纯函数**：相同输入永远产生相同输出，无副作用。

```typescript
// ✅ 纯函数：无外部依赖，可独立测试
const result1 = calculateGiantessData(170, 1.65);
const result2 = calculateGiantessData(170, 1.65);
// result1 === result2（深度相等）
```

### 2. 零外部依赖

核心模块不依赖：
- ❌ Vue / Pinia
- ❌ 酒馆 API
- ❌ 浏览器 API（除了基础 Math）
- ❌ 其他业务模块

这意味着可以在任何 JavaScript 环境中使用。

### 3. 类型安全

所有函数都有完整的 TypeScript 类型定义，类型定义在 `src/types/` 目录中。

---

## 📦 快速开始

### 导入

```typescript
// 导入所有内容
import * as Core from '@/core';

// 按需导入
import {
  calculateGiantessData,
  calculateTinyData,
  formatLength,
  checkInteractionLimits,
  BASE_BODY_PARTS,
  SIZE_LEVELS,
} from '@/core';
```

### 基础使用

```typescript
import { calculateGiantessData, formatLength } from '@/core';

// 计算 170 米高的巨大娘（原身高 1.65 米）
const data = calculateGiantessData(170, 1.65);

console.log(data.倍率);              // 103.03
console.log(data.级别);              // "Kilo级"
console.log(data.身体部位_格式化.足长); // "24.29米"
console.log(formatLength(170));      // "170米"
```

---

## 📚 详细文档

- [常量定义](./constants.md) - 身体部位、参照物、级别定义
- [计算函数](./calculator.md) - 核心计算 API
- [格式化工具](./formatter.md) - 长度、重量、体积格式化
- [互动限制](./interactions.md) - 互动规则和限制检查

---

## 🔗 相关文档

- [损害计算模块](../damage-core/README.md) - 独立的损害计算系统
- [架构文档](../ARCHITECTURE.md) - 项目整体架构
- [API 文档](../API.md) - 完整 API 参考
