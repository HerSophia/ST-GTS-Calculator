# 巨大娘计算器 - 损害计算模块

> 本文档描述 `src/core/damage.ts` 损害计算模块，用于估算巨大娘行动可能造成的破坏。

---

## 📋 模块概览

损害计算模块是一个**可选扩展**，用于根据巨大娘的尺寸和当前场景，估算每一步可能造成的人员伤亡、建筑损毁等破坏效果。

### 核心功能

| 功能 | 说明 |
|------|------|
| 🦶 **足迹计算** | 根据身高计算足迹面积和直径 |
| 👥 **伤亡估算** | 基于场景人口密度估算每步伤亡 |
| 🏢 **建筑损毁** | 基于场景建筑密度估算损毁数量 |
| 🌍 **宏观破坏** | 城市/国家/大陆/行星/恒星/星系级破坏 |
| ⚡ **特殊效应** | 地震、海啸、引力场等物理效应 |

### 模块导出

```typescript
// 常量
export const POPULATION_DENSITY: Record<string, number>;
export const BUILDING_DENSITY: Record<string, number>;
export const GEOGRAPHIC_SCALES: Record<string, { size: number; description: string }>;
export const CELESTIAL_DATA: { ... };

// 辅助函数
export function formatLargeNumber(num: number): string;
export function formatCasualties(min: number, max: number): string;

// 计算选项接口
export interface DamageCalculationOptions {
  scenario?: keyof typeof POPULATION_DENSITY;  // 场景类型
  customPopulationDensity?: number;            // 自定义人群密度（人/km²）
  customBuildingDensity?: number;              // 自定义建筑密度（栋/km²）
}

// 主计算函数
export function calculateDamage(
  currentHeight: number,
  originalHeight?: number,
  scenarioOrOptions?: string | DamageCalculationOptions
): DamageCalculation;

// 提示词生成
export function generateDamagePrompt(characterName: string, damage: DamageCalculation): string;
export function formatDamageCompact(damage: DamageCalculation): string;

// 类型（重新导出）
export type { FootprintImpact, StepDamage, MacroDestruction, DamageCalculation };
```

---

## 🎯 设计原则

### 1. 纯函数

与基础计算核心一样，损害计算也是**纯函数**，无副作用。

```typescript
// 相同输入永远产生相同输出
const damage1 = calculateDamage(170, 1.65, '大城市');
const damage2 = calculateDamage(170, 1.65, '大城市');
// damage1 深度相等于 damage2
```

### 2. 场景驱动

损害计算高度依赖**场景设置**，不同场景的人口密度和建筑密度差异巨大：

| 场景 | 人口密度 (人/km²) | 单步伤亡估算 |
|------|------------------|-------------|
| 荒野 | 1 | 几乎无 |
| 乡村 | 50 | 极少 |
| 大城市 | 10,000 | 数百至数千 |
| 马尼拉 | 43,000 | 数千至数万 |
| 体育馆内 | 500,000 | 极高 |

### 3. 分层计算

计算分为三个层次：

```
┌─────────────────────────────────────────────────────────────┐
│                    宏观破坏 (Macro)                          │
│  城市/国家/大陆/行星/恒星/星系/宇宙级                          │
├─────────────────────────────────────────────────────────────┤
│                    单步损害 (Step)                           │
│  人员伤亡、建筑损毁、街道损毁、城区损毁                         │
├─────────────────────────────────────────────────────────────┤
│                    足迹影响 (Footprint)                      │
│  足迹面积、足迹直径                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 快速开始

### 基础使用

```typescript
import { calculateDamage, generateDamagePrompt } from '@/core';

// 计算 170 米高巨大娘在大城市的损害
const damage = calculateDamage(170, 1.65, '大城市');

console.log(damage.破坏力等级);                    // "建筑级"
console.log(damage.足迹.足迹面积_格式化);          // "58.78平方米"
console.log(damage.单步损害.小人伤亡.格式化);      // "118-588人"
console.log(damage.单步损害.建筑损毁.格式化);      // "0.07-0.14栋"

// 生成提示词
const prompt = generateDamagePrompt('络络', damage);
console.log(prompt);
```

### 不同场景对比

```typescript
import { calculateDamage } from '@/core';

const height = 1000; // 1公里高
const original = 1.65;

// 不同场景的损害对比
const scenarios = ['荒野', '大城市', '马尼拉'] as const;

for (const scenario of scenarios) {
  const damage = calculateDamage(height, original, scenario);
  console.log(`${scenario}: ${damage.单步损害.小人伤亡.格式化}`);
}
// 荒野: 0-0人
// 大城市: 10万-50万人
// 马尼拉: 43万-215万人
```

### 自定义人群密度

LLM 可以通过设置 `人群密度` 来覆盖场景预设值，适合特殊情况：

```typescript
import { calculateDamage } from '@/core';

// 演唱会现场，人群密度极高
const concertDamage = calculateDamage(50, 1.65, {
  scenario: '体育馆内',
  customPopulationDensity: 80000,  // 演唱会比默认更拥挤
});

// 深夜撤离后的城市
const evacuatedDamage = calculateDamage(170, 1.65, {
  scenario: '大城市',
  customPopulationDensity: 500,    // 大部分人已撤离
});

console.log(concertDamage.单步损害.小人伤亡.格式化);   // 极高伤亡
console.log(evacuatedDamage.单步损害.小人伤亡.格式化); // 极低伤亡
```

---

## 📚 详细文档

- [常量定义](./constants.md) - 人口密度、建筑密度、地理尺度、天体数据
- [计算函数](./calculator.md) - calculateDamage() 和辅助函数
- [格式化函数](./formatter.md) - 大数字、伤亡人数格式化

---

## 🔗 相关文档

- [基础计算核心](../calculat-core/README.md) - 身体数据计算
- [架构文档](../ARCHITECTURE.md) - 项目整体架构
- [API 文档](../API.md) - 完整 API 参考
