# 巨大娘计算器 - 物品计算模块

> 本文档描述 `src/core/items.ts` 物品计算模块，用于管理和计算角色携带的物品。

---

## 📋 模块概览

物品计算模块是一个**可选扩展**，用于管理角色的物品，计算物品在不同尺度下的相对大小，并分析各种互动的可行性。

### 核心功能

| 功能 | 说明 |
|------|------|
| 📦 **物品管理** | 添加、移除角色的物品 |
| 📏 **尺寸计算** | 计算物品随角色缩放后的实际尺寸 |
| 👁️ **相对参照** | 分析物品在角色眼中和普通人眼中的相对大小 |
| 🤝 **互动分析** | 判断握持、穿戴、吞咽等互动是否可行 |
| ⚡ **特殊效果** | 基于材质和尺寸生成特殊物理效果 |

### 模块导出

```typescript
// 常量
export const PRESET_ITEMS: Record<string, ItemDefinition>;

// 主计算函数
export function calculateItem(
  item: ItemDefinition,
  characterScale: number,
  isCarried?: boolean
): ItemCalculation;

export function calculateCharacterItems(
  characterName: string,
  characterScale: number,
  items: CharacterItems
): CharacterItemsCalculation;

// 提示词生成
export function generateItemsPrompt(
  characterName: string,
  itemsCalc: CharacterItemsCalculation
): string;

export function formatItemsCompact(
  itemsCalc: CharacterItemsCalculation
): string;
```

---

## 🎯 设计原则

### 1. 纯函数

与其他计算核心一样，物品计算也是**纯函数**，无副作用。

```typescript
// 相同输入永远产生相同输出
const calc1 = calculateItem(item, 100);
const calc2 = calculateItem(item, 100);
// calc1 深度相等于 calc2
```

### 2. 随身携带机制

物品有两种缩放模式：

| 模式 | 说明 | 典型场景 |
|------|------|----------|
| **随身携带** | 物品随角色一起缩放 | 角色身上的配饰、衣物 |
| **非随身** | 物品保持原始尺寸 | 场景中的物品、被捡起的物品 |

```typescript
// 随身携带的手机会随角色一起变大
const phone = {
  名称: '智能手机',
  原始尺寸: { 长: 0.15 },
  随身携带: true,
};

// 100 倍角色的手机也是 100 倍大小
const calc = calculateItem(phone, 100, true);
// calc.缩放尺寸.长 = 15 米
```

### 3. 多视角分析

计算结果提供两种视角的相对参照：

```
┌─────────────────────────────────────────────────────────────┐
│                      物品相对参照                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  角色视角                      普通人视角                    │
│  ┌──────────┐                  ┌──────────┐                 │
│  │ 物品相对 │                  │ 物品相对 │                 │
│  │ 角色身体 │                  │ 标准参照 │                 │
│  │ 部位大小 │                  │ 物大小   │                 │
│  └──────────┘                  └──────────┘                 │
│                                                             │
│  「约等于角色的手掌」          「约100倍人类身高」           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 快速开始

### 基础使用

```typescript
import { calculateItem, PRESET_ITEMS } from '@/core';

// 使用预设物品
const phone = PRESET_ITEMS['智能手机'];

// 计算 100 倍角色携带的手机
const calc = calculateItem(phone, 100, true);

console.log(calc.缩放尺寸_格式化.长);  // "15米"
console.log(calc.角色视角[0].描述);    // "约等于角色的手掌长"
console.log(calc.互动可能性);          // [{名称: '单手握持', 可行: true, ...}, ...]
```

### 计算角色的所有物品

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
  car: {
    名称: '轿车',
    原始尺寸: { 长: 4.5, 宽: 1.8, 高: 1.5, 重量: 1500 },
    类型: '交通工具',
    材质: '金属',
    随身携带: false,
  },
};

// 计算所有物品
const itemsCalc = calculateCharacterItems('络络', 100, items);

// 生成提示词
const prompt = generateItemsPrompt('络络', itemsCalc);
console.log(prompt);
```

### 判断互动可行性

```typescript
import { calculateItem, PRESET_ITEMS } from '@/core';

// 100 倍巨大娘拿起普通轿车
const car = PRESET_ITEMS['轿车'];
const calc = calculateItem(car, 100, false); // 轿车保持原始尺寸

// 检查互动可能性
for (const interaction of calc.互动可能性) {
  console.log(`${interaction.名称}: ${interaction.可行 ? '✓' : '✗'} - ${interaction.描述}`);
}
// 单手握持: ✓ - 可以轻松单手握住
// 双手握持: ✓ - 可以双手握住
// 指尖捏取: ✓ - 可以用两指轻松捏起
```

---

## 📚 详细文档

- [常量定义](./constants.md) - 预设物品库、物品类型、材质定义
- [计算函数](./calculator.md) - calculateItem()、互动判定、特殊效果

---

## 🔗 相关文档

- [基础计算核心](../calculat-core/README.md) - 身体数据计算
- [损害计算模块](../damage-core/README.md) - 损害计算
- [扩展系统](../extension-system/README.md) - 物品系统扩展说明
- [架构文档](../ARCHITECTURE.md) - 项目整体架构
- [API 文档](../API.md) - 完整 API 参考
