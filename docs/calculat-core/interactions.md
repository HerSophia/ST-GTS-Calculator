# 互动限制系统

> `src/core/interactions.ts` - 互动规则定义与限制检查

---

## 📋 概览

互动限制系统用于判断不同体型角色之间哪些互动在物理上合理，并提供替代方案建议。

| 导出 | 类型 | 说明 |
|------|------|------|
| `INTERACTION_RULES` | 常量 | 互动规则定义 |
| `checkInteractionLimits()` | 函数 | 检查互动限制 |
| `generateInteractionPrompt()` | 函数 | 生成互动限制提示词 |

---

## 📜 INTERACTION_RULES

互动规则定义表，规定每种互动所需的最小体型比例。

### 数据结构

```typescript
interface InteractionRule {
  minRatio: number;      // 最小体型比例（小者/大者）
  description: string;   // 规则说明
  alternatives: string;  // 替代方案
}

export const INTERACTION_RULES: Record<string, InteractionRule> = {
  // 互动名称: 规则定义
};
```

### 手部互动

| 互动 | 最小比例 | 说明 | 替代方案 |
|------|----------|------|----------|
| 手指撩下巴 | 5% | 需要几厘米大小才能精确操作 | 指尖轻触、指甲拨弄 |
| 手掌握住 | 1% | 需要一定大小才能被握住 | 指尖捏住、放在掌心 |
| 双手捧起 | 2% | 需要足够体积才能双手捧起 | 单手掌心、指尖拿起 |
| 拥抱 | 30% | 需要体型相近才能拥抱 | 贴在身上、放在胸口 |
| 亲吻嘴唇 | 2% | 需要至少和嘴唇差不多大 | 舔舐、舌尖触碰、整个含入口中 |

### 足部互动

| 互动 | 最小比例 | 说明 | 替代方案 |
|------|----------|------|----------|
| 踩在脚下_感知 | 0.1% | 需要毫米级才能被感知 | 更小的如同灰尘被无视 |
| 脚趾夹住 | 0.5% | 需要一定大小才能被夹住 | 卡在脚趾缝、粘在脚趾上 |
| 用脚玩弄 | 1% | 需要足够大才能被有意识玩弄 | 无意识踩踏、碾压 |

### 口部互动

| 互动 | 最小比例 | 说明 | 替代方案 |
|------|----------|------|----------|
| 舌头卷起 | 0.5% | 需要一定大小才能被舌头卷起 | 唾液粘住、随唾液吞下 |
| 咀嚼 | 1% | 需要一定大小才值得咀嚼 | 直接吞下、随食物吞咽 |
| 活吞_有感觉 | 0.5% | 需要几毫米才能在吞咽时被感知 | 像灰尘被无意识吞下 |

### 身体互动

| 互动 | 最小比例 | 说明 | 替代方案 |
|------|----------|------|----------|
| 入阴_有感觉 | 0.5% | 需要几毫米才能在阴道内被感知 | 更小的完全无感如同细菌 |
| 入菊_有感觉 | 0.5% | 需要几毫米才能在肛门内被感知 | 更小的完全无感 |
| 乳沟夹住 | 2% | 需要一定大小才能被乳沟夹住 | 藏在褶皱中、粘在皮肤上 |

### 视觉/交流互动

| 互动 | 最小比例 | 说明 | 替代方案 |
|------|----------|------|----------|
| 肉眼可见 | 0.01% | 需要0.1毫米才能被肉眼看见 | 需要放大镜/显微镜 |
| 清晰辨认面容 | 0.1% | 需要1毫米才能辨认面容 | 只能看到小点或模糊轮廓 |
| 听到声音 | 0.1% | 需要毫米级才能发出可听见的声音 | 声音太小完全听不到 |
| 正常对话 | 5% | 需要体型差距不太大才能正常对话 | 需要扩音设备或特殊能力 |

---

## 🔍 checkInteractionLimits

检查两个角色之间的互动限制。

### 函数签名

```typescript
function checkInteractionLimits(
  bigHeight: number,
  smallHeight: number,
  formatLength: (meters: number) => string
): InteractionLimits
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `bigHeight` | `number` | 较大角色的身高（米） |
| `smallHeight` | `number` | 较小角色的身高（米） |
| `formatLength` | `function` | 长度格式化函数 |

### 返回值

```typescript
interface InteractionLimits {
  ratio: number;                    // 体型比例（小/大）
  ratioFormatted: string;           // 格式化的比例（如 "1%" 或 "1/100"）
  smallInBigEyes: string;           // 小者在大者眼中的大小
  possible: string[];               // 可行的互动列表
  impossible: ImpossibleInteraction[]; // 不可行的互动列表
  alternatives: Record<string, string>; // 替代方案映射
}

interface ImpossibleInteraction {
  action: string;       // 互动名称
  reason: string;       // 不可行原因
  alternative: string;  // 替代方案
}
```

### 检查逻辑

```typescript
function checkInteractionLimits(
  bigHeight: number,
  smallHeight: number,
  formatLength: (meters: number) => string
): InteractionLimits {
  const ratio = smallHeight / bigHeight;

  const possible: string[] = [];
  const impossible: ImpossibleInteraction[] = [];
  const alternatives: Record<string, string> = {};

  for (const [action, rule] of Object.entries(INTERACTION_RULES)) {
    if (ratio >= rule.minRatio) {
      possible.push(action);
    } else {
      impossible.push({
        action,
        reason: rule.description,
        alternative: rule.alternatives,
      });
      alternatives[action] = rule.alternatives;
    }
  }

  return {
    ratio,
    ratioFormatted: ratio >= 0.01 
      ? `${round(ratio * 100)}%` 
      : `1/${round(1 / ratio)}`,
    smallInBigEyes: formatLength(smallHeight),
    possible,
    impossible,
    alternatives,
  };
}
```

### 示例

```typescript
import { checkInteractionLimits, formatLength } from '@/core';

// 100 倍巨大娘 vs 正常人
const limits1 = checkInteractionLimits(165, 1.65, formatLength);
console.log(limits1.ratio);          // 0.01 (1%)
console.log(limits1.ratioFormatted); // "1%"
console.log(limits1.possible);       // ["手掌握住", "用脚玩弄", ...]
console.log(limits1.impossible);     // [{action: "拥抱", reason: "...", ...}, ...]

// 1000 倍巨大娘 vs 正常人
const limits2 = checkInteractionLimits(1650, 1.65, formatLength);
console.log(limits2.ratio);          // 0.001 (0.1%)
console.log(limits2.ratioFormatted); // "1/1000"

// 万倍巨大娘 vs 正常人
const limits3 = checkInteractionLimits(16500, 1.65, formatLength);
console.log(limits3.ratio);          // 0.0001 (0.01%)
console.log(limits3.impossible.length); // 大部分互动不可行
```

---

## 📝 generateInteractionPrompt

生成互动限制的提示词文本，用于注入到 AI 提示词中。

### 函数签名

```typescript
function generateInteractionPrompt(
  bigName: string,
  smallName: string,
  limits: InteractionLimits
): string
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `bigName` | `string` | 较大角色的名称 |
| `smallName` | `string` | 较小角色的名称 |
| `limits` | `InteractionLimits` | 互动限制数据 |

### 返回值

返回格式化的提示词文本字符串。

### 输出示例

```typescript
import { checkInteractionLimits, generateInteractionPrompt, formatLength } from '@/core';

const limits = checkInteractionLimits(165, 1.65, formatLength);
const prompt = generateInteractionPrompt('络络', '小明', limits);

console.log(prompt);
```

**输出**：

```
【络络与小明的互动限制】
体型比例：小明是络络的1%
小明在络络眼中约1.65厘米大小

以下互动在物理上不合理，请避免或使用替代方案：
- 拥抱：需要双方体型相近才能拥抱
  → 替代：可以将小者贴在身上、放在胸口
- 手指撩下巴：需要小者至少有几厘米大，否则手指无法精确操作
  → 替代：可以用指尖轻触、用指甲拨弄
- 正常对话：需要双方体型差距不太大才能正常对话
  → 替代：需要扩音设备或特殊能力才能交流
...
```

### 无限制时的输出

当体型差距较小（大部分互动都可行）时：

```typescript
const limits = checkInteractionLimits(3.3, 1.65, formatLength); // 2 倍
const prompt = generateInteractionPrompt('络络', '小明', limits);

// 输出：
// "络络与小明的体型差距不大，可以进行大多数正常互动。"
```

---

## 💡 使用场景

### 1. 基础互动检查

```typescript
import { checkInteractionLimits, formatLength } from '@/core';

function canInteract(bigHeight: number, smallHeight: number, action: string): boolean {
  const limits = checkInteractionLimits(bigHeight, smallHeight, formatLength);
  return limits.possible.includes(action);
}

// 100 倍巨大娘能否握住正常人？
canInteract(165, 1.65, '手掌握住'); // true (1% >= 1%)

// 1000 倍巨大娘能否握住正常人？
canInteract(1650, 1.65, '手掌握住'); // false (0.1% < 1%)
```

### 2. 获取替代方案

```typescript
import { checkInteractionLimits, formatLength } from '@/core';

function getAlternative(bigHeight: number, smallHeight: number, action: string): string | null {
  const limits = checkInteractionLimits(bigHeight, smallHeight, formatLength);
  return limits.alternatives[action] || null;
}

// 1000 倍巨大娘想握住正常人，应该怎么做？
getAlternative(1650, 1.65, '手掌握住'); 
// "可以用指尖捏住、放在掌心"
```

### 3. 批量检查多对角色

```typescript
import { checkInteractionLimits, formatLength } from '@/core';

const characters = [
  { name: '络络', height: 165 },
  { name: '小明', height: 1.65 },
  { name: '小红', height: 0.017 },
];

// 检查所有角色对之间的互动限制
for (let i = 0; i < characters.length; i++) {
  for (let j = i + 1; j < characters.length; j++) {
    const big = characters[i].height > characters[j].height ? characters[i] : characters[j];
    const small = characters[i].height <= characters[j].height ? characters[i] : characters[j];
    
    const limits = checkInteractionLimits(big.height, small.height, formatLength);
    console.log(`${big.name} vs ${small.name}: ${limits.impossible.length} 种互动不可行`);
  }
}
```

### 4. 与提示词系统集成

```typescript
import { 
  checkInteractionLimits, 
  generateInteractionPrompt, 
  formatLength 
} from '@/core';

function buildInteractionSection(characters: Character[]): string {
  const sections: string[] = [];
  
  // 找出所有需要检查的角色对
  const giants = characters.filter(c => c.scale >= 1.5);
  const tinies = characters.filter(c => c.scale <= 0.8);
  
  for (const giant of giants) {
    for (const tiny of tinies) {
      const limits = checkInteractionLimits(giant.height, tiny.height, formatLength);
      
      // 只有存在限制时才生成提示词
      if (limits.impossible.length > 0) {
        sections.push(generateInteractionPrompt(giant.name, tiny.name, limits));
      }
    }
  }
  
  return sections.join('\n\n');
}
```

---

## 📊 比例阈值速查表

| 比例 | 示例（基于1.65m） | 可行互动数 | 典型场景 |
|------|------------------|------------|----------|
| 30% | 0.5m (50cm) | 几乎全部 | 玩偶大小 |
| 10% | 16.5cm | 大部分 | 手掌大小 |
| 5% | 8.25cm | 较多 | 手指大小 |
| 2% | 3.3cm | 部分 | 指甲大小 |
| 1% | 1.65cm | 少数 | 蚂蚁大小 |
| 0.5% | 8.25mm | 很少 | 跳蚤大小 |
| 0.1% | 1.65mm | 极少 | 沙粒大小 |
| 0.01% | 0.165mm | 几乎没有 | 肉眼难见 |

---

## ⚠️ 注意事项

### 1. 规则是建议而非强制

互动规则基于物理合理性设计，但在某些世界观（如玄幻、魔法）下可以突破这些限制。

```typescript
// 可以在提示词中说明世界观特殊规则
const worldviewNote = `
注意：在本世界观中，角色拥有特殊能力，以下限制可以被突破：
- 即使体型差距巨大，仍可通过魔法实现交流
- 特殊感知能力允许感知微小存在
`;
```

### 2. 比例计算方向

始终使用 `小者身高 / 大者身高`，确保比例 < 1。

```typescript
// ✅ 正确
const ratio = smallHeight / bigHeight; // 0.01

// ❌ 错误（会导致比例 > 1）
const ratio = bigHeight / smallHeight; // 100
```

### 3. 自定义规则

如需添加自定义互动规则：

```typescript
// 扩展规则表
const customRules: Record<string, InteractionRule> = {
  ...INTERACTION_RULES,
  自定义互动: {
    minRatio: 0.03,
    description: '自定义互动的说明',
    alternatives: '替代方案说明',
  },
};

// 使用自定义规则检查
function checkWithCustomRules(bigHeight: number, smallHeight: number) {
  const ratio = smallHeight / bigHeight;
  // ... 使用 customRules 进行检查
}
```
