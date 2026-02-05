# 损害计算 - 计算函数

> `src/core/damage.ts` 中的计算函数

---

## 📋 概览

| 函数 | 说明 |
|------|------|
| `calculateDamage()` | 主计算函数，计算完整损害数据 |
| `generateDamagePrompt()` | 生成损害提示词 |
| `formatDamageCompact()` | 格式化为紧凑版本 |

---

## 🔧 calculateDamage

主计算函数，根据身高和场景计算完整的损害数据。

### 函数签名

```typescript
function calculateDamage(
  currentHeight: number,
  originalHeight: number = 1.65,
  scenario: keyof typeof POPULATION_DENSITY = '大城市'
): DamageCalculation
```

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `currentHeight` | `number` | - | 当前身高（米） |
| `originalHeight` | `number` | `1.65` | 原身高（米） |
| `scenario` | `string` | `'大城市'` | 场景名称 |

### 返回值

```typescript
interface DamageCalculation {
  // 基础信息
  身高: number;                    // 当前身高（米）
  身高_格式化: string;             // 格式化的身高
  倍率: number;                    // 缩放倍率

  // 足迹数据
  足迹: FootprintImpact;

  // 单步损害
  单步损害: StepDamage;

  // 各场景伤亡对比
  各场景伤亡: Record<string, { 伤亡: number; 格式化: string }>;

  // 宏观破坏（达到城市级以上才有）
  宏观破坏: MacroDestruction | null;

  // 破坏力等级
  破坏力等级: string;
  破坏力描述: string;

  // 特殊物理效应
  特殊效应: string[];

  // 元数据
  _计算时间: number;
}
```

### 子类型定义

#### FootprintImpact

```typescript
interface FootprintImpact {
  足迹面积: number;          // 平方米
  足迹面积_格式化: string;
  足迹直径: number;          // 等效直径（米）
  足迹直径_格式化: string;
}
```

#### StepDamage

```typescript
interface StepDamage {
  小人伤亡: {
    最小估计: number;
    最大估计: number;
    格式化: string;
    描述: string;
  };
  建筑损毁: {
    最小估计: number;
    最大估计: number;
    格式化: string;
    描述: string;
  };
  街道损毁: {
    数量: number;
    格式化: string;
  };
  城区损毁: {
    数量: number;
    格式化: string;
    等级: string;  // '无' | '部分城区' | '多个城区' | '大片城区'
  };
}
```

#### MacroDestruction

```typescript
interface MacroDestruction {
  等级: 'city' | 'country' | 'continent' | 'planet' | 'star' | 'galaxy' | 'universe';
  等级名称: string;
  描述: string;

  城市: { 数量: number; 格式化: string } | null;
  国家: { 数量: number; 格式化: string } | null;
  大陆: { 数量: number; 格式化: string } | null;
  行星: { 数量: number; 格式化: string } | null;
  恒星: { 数量: number; 格式化: string } | null;
  星系: { 数量: number; 格式化: string } | null;
}
```

### 计算逻辑

#### 1. 足迹计算

```typescript
// 足长约为身高的 1/7
const footLength = currentHeight / 7;
// 足宽约为足长的 0.4
const footWidth = footLength * 0.4;
// 足迹面积
const footprintArea = footLength * footWidth; // 平方米
const footprintAreaKm2 = footprintArea / 1e6; // 平方公里
```

#### 2. 伤亡计算

```typescript
// 获取场景人口密度
const popDensity = POPULATION_DENSITY[scenario];

// 最大伤亡（假设无人逃生）
const maxCasualties = footprintAreaKm2 * popDensity;

// 最小伤亡（假设 80% 逃生）
const minCasualties = maxCasualties * 0.2;
```

#### 3. 建筑损毁计算

```typescript
// 获取场景建筑密度
const buildDensity = BUILDING_DENSITY[scenario];

// 最大损毁
const maxBuildings = footprintAreaKm2 * buildDensity;

// 最小损毁（边缘建筑可能只是损坏）
const minBuildings = maxBuildings * 0.5;
```

#### 4. 破坏力等级判定

```typescript
function determineDestructionLevel(heightMeters: number): { level: string; description: string } {
  if (heightMeters < 10) {
    return { level: '微型', description: '可造成局部破坏，类似小型事故' };
  }
  if (heightMeters < 100) {
    return { level: '建筑级', description: '可轻易破坏建筑物' };
  }
  if (heightMeters < 1000) {
    return { level: '街区级', description: '一步可跨越多个街区' };
  }
  if (heightMeters < 10000) {
    return { level: '城区级', description: '行走即可摧毁整个城区' };
  }
  if (heightMeters < 100000) {
    return { level: '城市级', description: '一脚可踏平一座城市' };
  }
  if (heightMeters < 1000000) {
    return { level: '国家级', description: '跨步可横跨国家' };
  }
  if (heightMeters < REFERENCE_OBJECTS.地球直径) {
    return { level: '大陆级', description: '可轻易横跨大陆' };
  }
  if (heightMeters < REFERENCE_OBJECTS.太阳直径) {
    return { level: '行星级', description: '行星如玩具般大小' };
  }
  if (heightMeters < REFERENCE_OBJECTS.日地距离_1AU) {
    return { level: '恒星级', description: '恒星如灯泡般大小' };
  }
  if (heightMeters < REFERENCE_OBJECTS.光年) {
    return { level: '星系级', description: '可在星系间穿行' };
  }
  return { level: '宇宙级', description: '超越已知宇宙尺度' };
}
```

#### 5. 特殊物理效应

```typescript
function calculateSpecialEffects(heightMeters: number): string[] {
  const effects: string[] = [];

  if (heightMeters >= 100) {
    effects.push('脚步引发局部地震');
  }
  if (heightMeters >= 1000) {
    effects.push('行走产生强风暴');
    effects.push('脚步可引发海啸');
  }
  if (heightMeters >= 10000) {
    effects.push('身体影响局部天气');
    effects.push('呼吸产生飓风');
  }
  if (heightMeters >= 100000) {
    effects.push('头部进入云层/平流层');
    effects.push('体温影响区域气候');
  }
  if (heightMeters >= 1000000) {
    effects.push('身体产生可观测引力场');
    effects.push('可能影响地球自转');
  }
  if (heightMeters >= REFERENCE_OBJECTS.地球直径) {
    effects.push('质量可能形成行星级引力');
    effects.push('存在即可改变轨道');
  }
  if (heightMeters >= REFERENCE_OBJECTS.太阳直径) {
    effects.push('质量接近或超过恒星');
    effects.push('可能引发核聚变反应');
  }
  if (heightMeters >= REFERENCE_OBJECTS.日地距离_1AU) {
    effects.push('引力可撕裂星系结构');
  }

  return effects;
}
```

### 示例

```typescript
import { calculateDamage } from '@/core';

// 100 米高巨大娘
const damage100m = calculateDamage(100, 1.65, '大城市');
console.log(damage100m.破坏力等级);        // "建筑级"
console.log(damage100m.特殊效应);          // ["脚步引发局部地震"]

// 1 公里高巨大娘
const damage1km = calculateDamage(1000, 1.65, '大城市');
console.log(damage1km.破坏力等级);         // "街区级"
console.log(damage1km.特殊效应);           // ["脚步引发局部地震", "行走产生强风暴", "脚步可引发海啸"]

// 100 公里高巨大娘
const damage100km = calculateDamage(100000, 1.65, '大城市');
console.log(damage100km.破坏力等级);       // "城市级"
console.log(damage100km.宏观破坏?.等级名称); // "城市级"

// 地球直径级别
const damageEarth = calculateDamage(12742000, 1.65);
console.log(damageEarth.破坏力等级);       // "行星级"
console.log(damageEarth.宏观破坏?.行星?.格式化); // "可轻易摧毁1个地球大小的行星"
```

---

## 📝 generateDamagePrompt

生成损害提示词，用于注入到 AI 提示词中。

### 函数签名

```typescript
function generateDamagePrompt(
  characterName: string,
  damage: DamageCalculation
): string
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `characterName` | `string` | 角色名称 |
| `damage` | `DamageCalculation` | 计算结果 |

### 返回值

格式化的提示词字符串。

### 输出示例

```typescript
import { calculateDamage, generateDamagePrompt } from '@/core';

const damage = calculateDamage(1000, 1.65, '大城市');
const prompt = generateDamagePrompt('络络', damage);

console.log(prompt);
```

**输出**：

```
【络络的破坏力数据】
当前身高：1公里（606.06倍）
破坏力等级：街区级 - 一步可跨越多个街区

【足迹影响】
- 足迹面积：8163.27平方米
- 足迹直径：90.35米

【每一步可能造成的损害】（大城市场景）
- 人员伤亡：1.63万-8.16万人
  数万人伤亡，相当于一场大型灾难
- 建筑损毁：4.9-9.8栋
  少量建筑损毁
- 街道损毁：约816条
- 城区损毁：约8.2个（大片城区）

【特殊物理效应】
- 脚步引发局部地震
- 行走产生强风暴
- 脚步可引发海啸
```

### 宏观破坏输出示例

当达到更大尺度时，会包含宏观破坏信息：

```
【宏观破坏力】行星级
- 城市毁灭：1000座城市
- 国家毁灭：10个国家
- 大陆毁灭：1个大陆
- 行星破坏：可轻易摧毁1个地球大小的行星
```

---

## 📦 formatDamageCompact

格式化为紧凑版本，适合在有限空间内显示。

### 函数签名

```typescript
function formatDamageCompact(damage: DamageCalculation): string
```

### 返回值

用 ` | ` 分隔的紧凑格式字符串。

### 示例

```typescript
import { calculateDamage, formatDamageCompact } from '@/core';

const damage = calculateDamage(1000, 1.65, '大城市');
const compact = formatDamageCompact(damage);

console.log(compact);
// "破坏力:街区级 | 足迹:8163.27平方米 | 单步伤亡:1.63万-8.16万人 | 建筑损毁:4.9-9.8栋 | 效应:脚步引发局部地震/行走产生强风暴"
```

---

## 💡 使用场景

### 1. 实时损害计算

```typescript
import { calculateDamage } from '@/core';

// 角色身高变化时重新计算
function onHeightChange(newHeight: number) {
  const damage = calculateDamage(newHeight, 1.65, currentScenario);
  updateDamageDisplay(damage);
}
```

### 2. 场景切换对比

```typescript
import { calculateDamage } from '@/core';

// 显示不同场景的损害对比
function showScenarioComparison(height: number) {
  const damage = calculateDamage(height);

  for (const [scenario, data] of Object.entries(damage.各场景伤亡)) {
    console.log(`${scenario}: ${data.格式化}`);
  }
}
```

### 3. 提示词注入

```typescript
import { calculateDamage, generateDamagePrompt } from '@/core';
import { injectPromptContent } from '@/services';

function injectDamagePrompt(character: Character) {
  const damage = calculateDamage(
    character.当前身高,
    character.原身高,
    getCurrentScenario()
  );

  const prompt = generateDamagePrompt(character.name, damage);
  injectPromptContent(prompt, { entryId: `damage-${character.name}` });
}
```

### 4. 判断是否需要显示宏观破坏

```typescript
import { calculateDamage } from '@/core';

const damage = calculateDamage(height, original);

if (damage.宏观破坏) {
  // 显示宏观破坏面板
  showMacroDestructionPanel(damage.宏观破坏);
}
```

---

## ⚠️ 注意事项

### 1. 估算精度

损害计算是**粗略估算**，不是精确计算：

- 伤亡人数给出范围（最小~最大），考虑逃生率
- 建筑损毁考虑边缘建筑可能只是损坏
- 实际数字可能因地形、时间等因素差异很大

### 2. 宏观破坏阈值

只有身高 ≥ 10,000 米（10 公里）时才会计算宏观破坏：

```typescript
if (heightMeters < 10000) {
  return null; // 不计算宏观破坏
}
```

### 3. 特殊场景处理

- **巨大娘体内**：人口密度为 0，不计算伤亡
- **室内场景**：建筑密度为 0，不计算建筑损毁

### 4. 极端尺寸

对于宇宙级尺寸（超过可观测宇宙），破坏力描述为"无法估量"。
