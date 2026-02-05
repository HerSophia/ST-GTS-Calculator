# 单元测试规范

> 巨大娘计算器项目的单元测试代码风格与注意事项

## 目录

- [测试框架](#测试框架)
- [目录结构](#目录结构)
- [命名规范](#命名规范)
- [测试编写风格](#测试编写风格)
- [各层级测试策略](#各层级测试策略)
- [Mock 规范](#mock-规范)
- [常见模式与反模式](#常见模式与反模式)
- [测试覆盖率](#测试覆盖率)
- [CI 集成](#ci-集成)

## 测试框架

### 技术选型

| 工具 | 用途 | 版本要求 |
| ---- | ---- | -------- |
| **Vitest** | 测试运行器 | ^3.x |
| **@vue/test-utils** | Vue 组件测试 | ^2.x |
| **happy-dom** | DOM 模拟 | ^17.x |
| **@pinia/testing** | Pinia Store 测试 | ^0.1.x |

### 安装依赖

```bash
pnpm add -D vitest @vue/test-utils happy-dom @pinia/testing
```

### 配置文件

在项目根目录创建 `vitest.config.ts`：

```typescript
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.vue',
        'src/index.ts',
        'src/初始化.ts',
        'src/设置界面.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@util': resolve(__dirname, 'util'),
    },
  },
});
```

### package.json 脚本

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## 目录结构

测试文件与源文件分离，放在 `tests/` 目录下，镜像 `src/` 的结构：

```text
tests/
├── core/                           # Core 层测试（重点）
│   ├── calculator.test.ts          # 计算函数测试
│   ├── formatter.test.ts           # 格式化函数测试
│   ├── damage.test.ts              # 损害计算测试
│   ├── interactions.test.ts        # 互动限制测试
│   └── constants.test.ts           # 常量验证测试
│
├── stores/                         # Store 层测试
│   ├── settings.test.ts            # 设置 Store 测试
│   ├── characters.test.ts          # 角色 Store 测试
│   └── prompts.test.ts             # 提示词 Store 测试
│
├── services/                       # Services 层测试
│   ├── calculator/
│   │   └── character-calculator.test.ts
│   ├── prompt/
│   │   └── builder.test.ts
│   └── extensions/
│       └── manager.test.ts
│
├── composables/                    # Composables 层测试
│   ├── useCalculator.test.ts
│   └── useSettings.test.ts
│
├── fixtures/                       # 测试数据
│   ├── characters.ts               # 角色测试数据
│   ├── scenarios.ts                # 场景测试数据
│   └── mvu-data.ts                 # MVU 模拟数据
│
├── mocks/                          # Mock 模块
│   ├── mvu.ts                      # MVU 库 Mock
│   ├── tavern.ts                   # 酒馆 API Mock
│   └── pinia.ts                    # Pinia 测试辅助
│
└── setup.ts                        # 全局测试配置
```

## 命名规范

### 文件命名

| 类型 | 命名格式 | 示例 |
| ---- | -------- | ---- |
| 单元测试 | `{模块名}.test.ts` | `calculator.test.ts` |
| 集成测试 | `{功能}.integration.test.ts` | `mvu-sync.integration.test.ts` |
| 测试数据 | `{领域}.ts` | `characters.ts` |
| Mock 文件 | `{模块}.ts` | `mvu.ts` |

### 测试描述命名

使用**中文描述**，遵循 `Given-When-Then` 或 `Should-When` 模式：

```typescript
describe('calculateGiantessData', () => {
  describe('当输入有效身高时', () => {
    it('应该正确计算身体各部位尺寸', () => {
      // ...
    });

    it('应该计算正确的变化倍率', () => {
      // ...
    });
  });

  describe('当身高为极端值时', () => {
    it('应该处理零身高的边界情况', () => {
      // ...
    });

    it('应该处理负数身高的边界情况', () => {
      // ...
    });
  });
});
```

### 测试变量命名

```typescript
// ✅ 好的命名 - 清晰表达测试意图
const defaultHeight = 1.65;
const giantHeight = 170;
const expectedScale = 170 / 1.65;
const mockCharacter = createMockCharacter({ name: '络络' });

// ❌ 不好的命名 - 含义模糊
const h = 1.65;
const val = 170;
const x = 170 / 1.65;
const data = {};
```

## 测试编写风格

### 基本结构 - AAA 模式

每个测试用例遵循 **Arrange-Act-Assert** 模式，用空行分隔：

```typescript
it('应该正确计算巨大娘数据', () => {
  // Arrange - 准备测试数据
  const currentHeight = 170; // 米
  const originalHeight = 1.65; // 米

  // Act - 执行被测函数
  const result = calculateGiantessData(currentHeight, originalHeight);

  // Assert - 验证结果
  expect(result.scale).toBeCloseTo(103.03, 1);
  expect(result.level.name).toBe('百倍');
  expect(result.bodyParts).toBeDefined();
});
```

### 数值断言

对于浮点数计算，使用 `toBeCloseTo` 而非 `toBe`：

```typescript
// ✅ 好 - 允许浮点精度误差
expect(result.scale).toBeCloseTo(103.03, 2); // 精确到小数点后2位

// ❌ 不好 - 可能因浮点精度问题失败
expect(result.scale).toBe(103.0303030303);
```

### 测试隔离

每个测试必须相互独立，使用 `beforeEach` 重置状态：

```typescript
import { setActivePinia, createPinia } from 'pinia';

describe('useSettings', () => {
  beforeEach(() => {
    // 每个测试前重置 Pinia
    setActivePinia(createPinia());
  });

  it('测试1...', () => { /* ... */ });
  it('测试2...', () => { /* ... */ });
});
```

### 测试数据工厂

使用工厂函数创建测试数据，避免重复：

```typescript
// tests/fixtures/characters.ts
import type { Character } from '@/types';

export function createMockCharacter(overrides: Partial<Character> = {}): Character {
  return {
    name: '测试角色',
    currentHeight: 170,
    originalHeight: 1.65,
    reason: '测试原因',
    ...overrides,
  };
}

export function createMockGiantess(scale: number = 100): Character {
  return createMockCharacter({
    name: '巨大娘',
    currentHeight: 1.65 * scale,
    originalHeight: 1.65,
  });
}

export function createMockTiny(scale: number = 0.01): Character {
  return createMockCharacter({
    name: '小人',
    currentHeight: 1.70 * scale,
    originalHeight: 1.70,
  });
}
```

### 参数化测试

对于多组输入输出，使用 `it.each`：

```typescript
describe('formatLength', () => {
  it.each([
    [0.001, '1毫米'],
    [0.01, '1厘米'],
    [1, '1米'],
    [1000, '1公里'],
    [1000000, '1000公里'],
  ])('formatLength(%d) 应该返回 %s', (meters, expected) => {
    expect(formatLength(meters)).toBe(expected);
  });
});
```

### 快照测试（谨慎使用）

仅对稳定的复杂输出使用快照测试：

```typescript
import { formatBodyParts } from '@/core/formatter';

it('身体部位格式化输出应该匹配快照', () => {
  const bodyParts = calculateBodyParts(170, 1.65);
  const formatted = formatBodyParts(bodyParts);

  // 快照文件存储在 __snapshots__ 目录
  expect(formatted).toMatchSnapshot();
});
```

## 各层级测试策略

### Core 层（重点测试）

Core 层是纯函数，**必须达到 90%+ 覆盖率**。

```typescript
// tests/core/calculator.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateGiantessData,
  calculateTinyData,
  determineLevel,
  findSimilarObject,
} from '@/core/calculator';

describe('Core: calculator', () => {
  describe('determineLevel', () => {
    it.each([
      [1, 'Mini级'],
      [10, '十倍'],
      [100, '百倍'],
      [1000, '千倍'],
      [10000, 'Mega级'],
      [1000000, 'Giga级'],
    ])('倍率 %d 应该返回级别 %s', (scale, expectedLevel) => {
      const result = determineLevel(scale);
      expect(result.name).toBe(expectedLevel);
    });

    it.each([
      [0.1, '十分之一'],
      [0.01, '百分之一'],
      [0.001, '毫米级'],
    ])('缩小倍率 %d 应该返回级别 %s', (scale, expectedLevel) => {
      const result = determineLevel(scale);
      expect(result.name).toBe(expectedLevel);
    });
  });

  describe('calculateGiantessData', () => {
    it('应该计算正确的身体部位数据', () => {
      const result = calculateGiantessData(170, 1.65);

      expect(result.scale).toBeCloseTo(103.03, 1);
      expect(result.bodyParts.身高).toBe(170);
      expect(result.bodyParts.足长).toBeGreaterThan(20);
    });

    it('应该包含相对参照物', () => {
      const result = calculateGiantessData(170, 1.65);

      expect(result.references).toBeDefined();
      expect(Object.keys(result.references).length).toBeGreaterThan(0);
    });

    it('应该处理自定义部位', () => {
      const customParts = { 足长: 50 };
      const result = calculateGiantessData(170, 1.65, customParts);

      expect(result.bodyParts.足长).toBe(50);
      expect(result.customParts).toContain('足长');
    });
  });
});
```

### Stores 层

测试 Store 的状态变更和 getters：

```typescript
// tests/stores/settings.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSettingsStore } from '@/stores/settings';

describe('Store: settings', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应该有正确的默认值', () => {
    const store = useSettingsStore();

    expect(store.enabled).toBe(true);
    expect(store.variablePrefix).toBe('巨大娘');
    expect(store.debug).toBe(false);
  });

  it('updateSettings 应该正确更新设置', () => {
    const store = useSettingsStore();

    store.updateSettings({ debug: true, precision: 3 });

    expect(store.debug).toBe(true);
    expect(store.precision).toBe(3);
  });

  it('resetSettings 应该恢复默认值', () => {
    const store = useSettingsStore();
    store.updateSettings({ debug: true });

    store.resetSettings();

    expect(store.debug).toBe(false);
  });
});
```

### Services 层

测试业务逻辑协调，需要 Mock 依赖：

```typescript
// tests/services/calculator/character-calculator.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CharacterCalculator } from '@/services/calculator/character-calculator';
import { createMockCharacter } from '../../fixtures/characters';

describe('Service: CharacterCalculator', () => {
  let calculator: CharacterCalculator;

  beforeEach(() => {
    calculator = new CharacterCalculator();
  });

  it('应该计算单个角色的完整数据', () => {
    const character = createMockCharacter({
      currentHeight: 170,
      originalHeight: 1.65,
    });

    const result = calculator.calculate(character);

    expect(result.calcData).toBeDefined();
    expect(result.calcData.scale).toBeCloseTo(103.03, 1);
  });

  it('应该处理多角色互动限制', () => {
    const giantess = createMockCharacter({ name: '巨大娘', currentHeight: 170 });
    const tiny = createMockCharacter({ name: '小人', currentHeight: 0.017 });

    const result = calculator.calculateInteractions([giantess, tiny]);

    expect(result.interactions).toBeDefined();
    expect(result.interactions['巨大娘_小人']).toBeDefined();
  });
});
```

### Composables 层

测试 Vue 响应式逻辑：

```typescript
// tests/composables/useCalculator.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCalculator } from '@/composables/useCalculator';

describe('Composable: useCalculator', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('quickCalc 应该返回响应式计算结果', () => {
    const { currentHeight, originalHeight, result, calculate } = useCalculator();

    currentHeight.value = 170;
    originalHeight.value = 1.65;
    calculate();

    expect(result.value).toBeDefined();
    expect(result.value?.scale).toBeCloseTo(103.03, 1);
  });
});
```

### UI 组件层（可选）

组件测试主要验证渲染和交互，非核心需求：

```typescript
// tests/ui/components/GcSwitch.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import GcSwitch from '@/ui/components/GcSwitch.vue';

describe('Component: GcSwitch', () => {
  it('应该正确渲染开关状态', () => {
    const wrapper = mount(GcSwitch, {
      props: { modelValue: true },
    });

    expect(wrapper.classes()).toContain('gc-switch--active');
  });

  it('点击时应该触发 update:modelValue 事件', async () => {
    const wrapper = mount(GcSwitch, {
      props: { modelValue: false },
    });

    await wrapper.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([true]);
  });
});
```

## Mock 规范

### MVU Mock

```typescript
// tests/mocks/mvu.ts
import { vi } from 'vitest';

export function createMvuMock() {
  const store = new Map<string, unknown>();

  return {
    _: {
      get: vi.fn((path: string, defaultValue?: unknown) => {
        return store.get(path) ?? defaultValue;
      }),
      set: vi.fn((path: string, value: unknown) => {
        store.set(path, value);
      }),
      has: vi.fn((path: string) => store.has(path)),
      del: vi.fn((path: string) => store.delete(path)),
    },
    // 辅助方法
    __store: store,
    __reset: () => store.clear(),
  };
}

// 使用示例
describe('MVU 集成测试', () => {
  let mvuMock: ReturnType<typeof createMvuMock>;

  beforeEach(() => {
    mvuMock = createMvuMock();
    vi.stubGlobal('_', mvuMock._);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});
```

### 酒馆 API Mock

```typescript
// tests/mocks/tavern.ts
import { vi } from 'vitest';

export function createTavernMock() {
  return {
    TH: {
      getChat: vi.fn(() => ({
        messages: [],
        characterName: '测试角色',
      })),
      getCharacter: vi.fn(() => ({
        name: '测试角色',
        avatar: 'avatar.png',
      })),
      getLastChatId: vi.fn(() => 'test-chat-id'),
      saveSettings: vi.fn(),
      loadSettings: vi.fn(() => ({})),
    },
  };
}
```

### 全局 Mock 配置

```typescript
// tests/setup.ts
import { vi } from 'vitest';
import { config } from '@vue/test-utils';
import { createMvuMock } from './mocks/mvu';
import { createTavernMock } from './mocks/tavern';

// 全局 Mock
vi.stubGlobal('_', createMvuMock()._);
vi.stubGlobal('TH', createTavernMock().TH);

// Vue Test Utils 全局配置
config.global.stubs = {
  // 存根复杂组件
  FontAwesomeIcon: true,
};
```

## 常见模式与反模式

### ✅ 好的模式

#### 1. 单一职责测试

```typescript
// ✅ 每个测试只验证一件事
it('应该正确计算身高倍率', () => {
  const result = calculateGiantessData(170, 1.65);
  expect(result.scale).toBeCloseTo(103.03, 1);
});

it('应该返回正确的级别名称', () => {
  const result = calculateGiantessData(170, 1.65);
  expect(result.level.name).toBe('百倍');
});
```

#### 2. 描述性测试名称

```typescript
// ✅ 清晰描述测试场景和预期结果
it('当身高为 170 米时，应该判定为百倍级别', () => { ... });
it('当原身高为 0 时，应该抛出 InvalidInputError', () => { ... });
```

#### 3. 边界值测试

```typescript
// ✅ 测试边界条件
describe('边界值测试', () => {
  it('最小有效身高应该正常计算', () => {
    expect(() => calculateGiantessData(0.001, 1.65)).not.toThrow();
  });

  it('极大身高应该返回宇宙级', () => {
    const result = calculateGiantessData(1e20, 1.65);
    expect(result.level.name).toBe('宇宙级');
  });

  it('零倍率应该抛出错误', () => {
    expect(() => calculateGiantessData(0, 1.65)).toThrow();
  });
});
```

### ❌ 避免的反模式

#### 1. 测试实现细节

```typescript
// ❌ 不好 - 测试内部实现
it('应该调用 formatLength 函数', () => {
  const spy = vi.spyOn(formatter, 'formatLength');
  calculateGiantessData(170, 1.65);
  expect(spy).toHaveBeenCalled();
});

// ✅ 好 - 测试行为结果
it('应该返回格式化的身高字符串', () => {
  const result = calculateGiantessData(170, 1.65);
  expect(result.bodyParts.身高_formatted).toBe('170米');
});
```

#### 2. 测试过于宽泛

```typescript
// ❌ 不好 - 一个测试验证太多东西
it('应该正确计算所有数据', () => {
  const result = calculateGiantessData(170, 1.65);
  expect(result.scale).toBe(...);
  expect(result.level).toBe(...);
  expect(result.bodyParts.身高).toBe(...);
  expect(result.bodyParts.足长).toBe(...);
  // ... 50 more assertions
});
```

#### 3. 硬编码魔法数字

```typescript
// ❌ 不好 - 难以理解的魔法数字
it('测试', () => {
  const result = calculateGiantessData(170, 1.65);
  expect(result.bodyParts.足长).toBe(27.3);
});

// ✅ 好 - 解释数值含义
it('足长应该约为身高的 16%', () => {
  const height = 170;
  const originalHeight = 1.65;
  const expectedFootLength = height * 0.16; // 人体比例约 16%

  const result = calculateGiantessData(height, originalHeight);
  
  expect(result.bodyParts.足长).toBeCloseTo(expectedFootLength, 0);
});
```

#### 4. 测试之间有依赖

```typescript
// ❌ 不好 - 测试依赖前一个测试的状态
let sharedResult: GiantessData;

it('计算数据', () => {
  sharedResult = calculateGiantessData(170, 1.65);
});

it('验证级别', () => {
  expect(sharedResult.level.name).toBe('百倍'); // 依赖上一个测试
});

// ✅ 好 - 每个测试独立
it('应该返回百倍级别', () => {
  const result = calculateGiantessData(170, 1.65);
  expect(result.level.name).toBe('百倍');
});
```

## 测试覆盖率

### 覆盖率目标

| 层级 | 行覆盖率 | 分支覆盖率 | 说明 |
| ---- | -------- | ---------- | ---- |
| **Core** | ≥90% | ≥85% | 核心计算逻辑，必须高覆盖 |
| **Stores** | ≥80% | ≥70% | 状态管理逻辑 |
| **Services** | ≥75% | ≥65% | 业务协调逻辑 |
| **Composables** | ≥70% | ≥60% | UI 逻辑层 |
| **UI Components** | 不强制要求 | - | 视觉组件可选测试 |

### 生成覆盖率报告

```bash
# 生成覆盖率报告
pnpm test:coverage

# 报告输出到 coverage/ 目录
# 打开 coverage/index.html 查看详细报告
```

### 覆盖率配置

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.vue',
        'src/**/index.ts',        // 纯导出文件
        'src/初始化.ts',           // 副作用入口
        'src/设置界面.ts',         // Vue 挂载
      ],
      thresholds: {
        'src/core/**': {
          lines: 90,
          branches: 85,
        },
        'src/stores/**': {
          lines: 80,
          branches: 70,
        },
      },
    },
  },
});
```

## CI 集成

### GitHub Actions 配置

```yaml
# .github/workflows/test.yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - run: pnpm install

      - run: pnpm test:run

      - run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true
```

### PR 检查

- 所有测试必须通过
- 覆盖率不能低于阈值
- 新代码必须有对应测试

## 附录：测试速查表

### 常用断言

```typescript
// 相等性
expect(value).toBe(expected);          // 严格相等 (===)
expect(value).toEqual(expected);        // 深度相等
expect(value).toBeCloseTo(num, digits); // 浮点数近似

// 真值
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeNull();

// 数字
expect(value).toBeGreaterThan(num);
expect(value).toBeLessThan(num);
expect(value).toBeGreaterThanOrEqual(num);

// 字符串
expect(str).toContain('substring');
expect(str).toMatch(/regex/);

// 数组/对象
expect(arr).toContain(item);
expect(arr).toHaveLength(n);
expect(obj).toHaveProperty('key', value);

// 异常
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(ErrorClass);
expect(() => fn()).toThrow('error message');
```

### Mock 速查

```typescript
// 创建 Mock 函数
const mockFn = vi.fn();
const mockFn = vi.fn(() => 'return value');
const mockFn = vi.fn().mockReturnValue('value');
const mockFn = vi.fn().mockResolvedValue('async value');

// Spy 现有函数
const spy = vi.spyOn(object, 'method');
spy.mockImplementation(() => 'mocked');

// 验证调用
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledTimes(n);

// 重置
mockFn.mockClear();  // 清除调用记录
mockFn.mockReset();  // 清除调用记录和返回值
vi.restoreAllMocks(); // 恢复所有 spy
```

### 异步测试

```typescript
// async/await
it('异步测试', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});

// Promise
it('Promise 测试', () => {
  return asyncFunction().then((result) => {
    expect(result).toBe(expected);
  });
});

// 定时器
it('定时器测试', async () => {
  vi.useFakeTimers();
  
  const callback = vi.fn();
  setTimeout(callback, 1000);
  
  vi.advanceTimersByTime(1000);
  
  expect(callback).toHaveBeenCalled();
  
  vi.useRealTimers();
});
```
