# 正则服务模块

> 封装酒馆正则 API，用于管理显示过滤规则

---

## 📋 概述

正则服务模块（Regex Service）是对酒馆正则 API 的封装，主要用于：

1. **隐藏内部标签** - 过滤 `<gts_update>` 等内部命令标签的显示
2. **统一管理** - 集中管理脚本注册的所有正则规则
3. **生命周期控制** - 脚本加载时注册，卸载时清理

---

## 🎯 设计目标

### 核心需求

| 需求 | 说明 | 优先级 |
|------|------|--------|
| 隐藏 `<gts_update>` | AI 输出中的更新命令不应显示给用户 | P0 |
| 自动注册 | 脚本初始化时自动注册正则 | P0 |
| 自动清理 | 脚本卸载时自动移除正则 | P1 |
| 不影响解析 | 正则仅影响显示，不影响 prompt 中的解析 | P0 |

### 非目标

- 不提供通用的正则编辑 UI（使用酒馆自带的正则管理界面）
- 不替换酒馆的正则系统（仅封装和扩展）

---

## 🏗️ 架构设计

### 模块位置

```
src/services/
├── regex/
│   ├── index.ts           # 模块导出
│   ├── constants.ts       # 常量和内置正则配置
│   └── manager.ts         # 正则管理器
└── index.ts               # 添加 regex 导出
```

### 依赖关系

```
┌─────────────────────────────────────────┐
│              UI Layer                   │
│         (SettingsPanel.vue)             │
├─────────────────────────────────────────┤
│            Regex Service                │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  constants  │  │    manager      │   │
│  │  (配置)     │  │  (注册/注销)    │   │
│  └─────────────┘  └─────────────────┘   │
├─────────────────────────────────────────┤
│           Tavern Regex API              │
│  getTavernRegexes / updateTavernRegexesWith  │
└─────────────────────────────────────────┘
```

### 数据流

```
脚本初始化
    ↓
initRegexService()
    ↓
registerBuiltinRegexes()
    ↓
updateTavernRegexesWith() ──→ 酒馆正则系统
    ↓
AI 输出 "<gts_update>..." 
    ↓
酒馆正则过滤 (destination: display)
    ↓
用户看到干净的输出 ✓

同时：
AI 输出 "<gts_update>..."
    ↓
酒馆正则不过滤 (destination: prompt = false)
    ↓
event-handler 正常解析更新命令 ✓
```

---

## 📐 API 设计

### 类型定义

```typescript
// src/types/regex.ts

/**
 * 酒馆正则配置
 * 与全局 TavernRegex 类型兼容
 */
export interface TavernRegexConfig {
  id: string;                              // 唯一标识
  script_name: string;                     // 显示名称
  enabled: boolean;                        // 是否启用
  scope: 'global' | 'character';           // 作用范围
  find_regex: string;                      // 匹配正则
  replace_string: string;                  // 替换内容
  source: {                                // 来源过滤
    user_input: boolean;
    ai_output: boolean;
    slash_command: boolean;
    world_info: boolean;
  };
  destination: {                           // 目标过滤
    display: boolean;                      // 是否影响显示
    prompt: boolean;                       // 是否影响提示词
  };
  run_on_edit: boolean;                    // 编辑时是否运行
  min_depth: number | null;                // 最小深度
  max_depth: number | null;                // 最大深度
}

/** 正则注册选项 */
export interface RegexRegistrationOptions {
  force?: boolean;   // 强制更新已存在的正则
  silent?: boolean;  // 失败时不打印错误
}

/** 正则注册结果 */
export interface RegexRegistrationResult {
  success: boolean;
  isNew: boolean;    // true=新注册, false=已存在
  error?: string;
}

/** 服务状态 */
export interface RegexServiceState {
  initialized: boolean;
  registeredIds: string[];
  lastError?: string;
}
```

### 常量定义

```typescript
// src/services/regex/constants.ts

/** 正则 ID 前缀，用于识别本脚本注册的正则 */
export const REGEX_ID_PREFIX = 'giantess-calc-';

/** 内置正则：隐藏 <gts_update> 标签 */
export const GTS_UPDATE_HIDE_REGEX_ID = `${REGEX_ID_PREFIX}hide-gts-update`;

/**
 * 创建隐藏 <gts_update> 的正则配置
 */
export function createGtsUpdateHideRegex(): TavernRegexConfig {
  return {
    id: GTS_UPDATE_HIDE_REGEX_ID,
    script_name: '巨大娘计算器 - 隐藏更新命令',
    enabled: true,
    scope: 'global',
    // 匹配 <gts_update>...</gts_update> 包括多行内容
    find_regex: '<gts_update>[\\s\\S]*?</gts_update>',
    replace_string: '',
    source: {
      user_input: false,
      ai_output: true,      // ✓ 仅过滤 AI 输出
      slash_command: false,
      world_info: false,
    },
    destination: {
      display: true,        // ✓ 影响显示（隐藏标签）
      prompt: false,        // ✗ 不影响 prompt（需要解析）
    },
    run_on_edit: true,
    min_depth: null,
    max_depth: null,
  };
}

/**
 * 获取所有内置正则配置
 */
export function getBuiltinRegexConfigs(): TavernRegexConfig[] {
  return [
    createGtsUpdateHideRegex(),
    // 未来可以添加更多内置正则
  ];
}
```

### 管理器 API

```typescript
// src/services/regex/manager.ts

/**
 * 初始化正则服务
 * 在脚本初始化时调用，注册所有内置正则
 */
export async function initRegexService(): Promise<boolean>;

/**
 * 清理正则服务
 * 在脚本卸载时调用，移除所有本脚本注册的正则
 */
export async function cleanupRegexService(): Promise<void>;

/**
 * 注册单个正则
 */
export async function registerRegex(
  config: TavernRegexConfig,
  options?: RegexRegistrationOptions
): Promise<RegexRegistrationResult>;

/**
 * 注销单个正则
 */
export async function unregisterRegex(
  id: string,
  silent?: boolean
): Promise<boolean>;

/**
 * 注册所有内置正则
 */
export async function registerBuiltinRegexes(
  options?: RegexRegistrationOptions
): Promise<RegexRegistrationResult[]>;

/**
 * 注销所有本脚本注册的正则
 */
export async function unregisterAllRegexes(
  silent?: boolean
): Promise<boolean>;

/**
 * 检查正则是否已注册
 */
export function isRegexRegistered(id: string): boolean;

/**
 * 启用/禁用指定正则
 */
export async function setRegexEnabled(
  id: string,
  enabled: boolean
): Promise<boolean>;

/**
 * 获取本脚本注册的所有正则
 */
export function getRegisteredRegexes(): TavernRegex[];

/**
 * 获取服务状态
 */
export function getRegexServiceState(): RegexServiceState;
```

---

## 🔧 实现细节

### 正则匹配说明

隐藏 `<gts_update>` 的正则：

```regex
<gts_update>[\s\S]*?</gts_update>
```

| 部分 | 说明 |
|------|------|
| `<gts_update>` | 匹配开始标签 |
| `[\s\S]*?` | 匹配任意字符（包括换行），非贪婪 |
| `</gts_update>` | 匹配结束标签 |

**注意**：在 JSON 中需要双重转义：`<gts_update>[\\s\\S]*?</gts_update>`

### 为什么使用 `[\s\S]` 而不是 `.`？

- `.` 默认不匹配换行符
- `<gts_update>` 内容通常是多行的
- `[\s\S]` 匹配所有字符包括换行

### 为什么 `destination.prompt = false`？

```
AI 输出: "角色变大了...<gts_update>_.set(...)</gts_update>"
                                    ↓
┌──────────────────────────────────────────────────┐
│                  酒馆正则系统                     │
├─────────────────────┬────────────────────────────┤
│   显示 (display)    │   提示词 (prompt)          │
│   destination:true  │   destination:false        │
├─────────────────────┼────────────────────────────┤
│ "角色变大了..."      │ "角色变大了...<gts_update> │
│ (标签被过滤)         │  _.set(...)</gts_update>" │
│                     │ (保留标签供解析)            │
└─────────────────────┴────────────────────────────┘
        ↓                        ↓
   用户看到干净输出          event-handler 解析命令
```

### 错误处理策略

```typescript
// 注册失败时的处理
try {
  await registerBuiltinRegexes();
} catch (error) {
  // 1. 记录错误日志
  console.warn('[GiantessCalc] 正则注册失败:', error);
  
  // 2. 不阻断脚本运行
  // 正则只是优化体验，不是核心功能
  
  // 3. 设置状态供调试
  state.lastError = error.message;
}
```

### 幂等性保证

```typescript
// 重复调用 initRegexService() 应该是安全的
export async function initRegexService(): Promise<boolean> {
  if (state.initialized) {
    return true;  // 已初始化，直接返回
  }
  
  // 注册时检查是否已存在
  const results = await registerBuiltinRegexes({ force: false });
  
  state.initialized = true;
  return results.every(r => r.success);
}
```

---

## 🔌 集成点

### 初始化集成

```typescript
// src/设置界面.ts

import { initRegexService, cleanupRegexService } from '@/services';

async function initModules(): Promise<void> {
  // ... 其他初始化
  
  // 初始化正则服务（注册隐藏标签的正则）
  await initRegexService();
  
  // ... 其他初始化
}

async function cleanup(): Promise<void> {
  // 清理正则服务
  await cleanupRegexService();
  
  // ... 其他清理
}
```

### 全局 API 集成

```typescript
// src/services/global-api.ts

import { getRegisteredRegexes, setRegexEnabled, getRegexServiceState } from './regex';

window.GiantessCalc = {
  // ... 其他 API
  
  // 正则管理（调试用）
  regex: {
    getRegistered: getRegisteredRegexes,
    setEnabled: setRegexEnabled,
    getState: getRegexServiceState,
  },
};
```

### 服务导出

```typescript
// src/services/index.ts

export * from './regex';
```

---

## 📊 测试策略

### 单元测试

```typescript
// tests/services/regex/manager.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  initRegexService, 
  isRegexRegistered,
  GTS_UPDATE_HIDE_REGEX_ID 
} from '@/services/regex';

describe('Regex Manager', () => {
  beforeEach(() => {
    // Mock 酒馆 API
    vi.stubGlobal('getTavernRegexes', vi.fn(() => []));
    vi.stubGlobal('updateTavernRegexesWith', vi.fn(async (fn) => fn([])));
  });

  describe('initRegexService', () => {
    it('应该注册内置正则', async () => {
      await initRegexService();
      expect(isRegexRegistered(GTS_UPDATE_HIDE_REGEX_ID)).toBe(true);
    });

    it('重复初始化应该是幂等的', async () => {
      await initRegexService();
      await initRegexService();
      // 不应该报错
    });
  });

  describe('createGtsUpdateHideRegex', () => {
    it('正则应该能匹配 <gts_update> 标签', () => {
      const config = createGtsUpdateHideRegex();
      const regex = new RegExp(config.find_regex);
      
      const testCases = [
        '<gts_update>_.set(...)</gts_update>',
        '<gts_update>\n多行\n内容\n</gts_update>',
        '前面的文字<gts_update>命令</gts_update>后面的文字',
      ];
      
      testCases.forEach(text => {
        expect(regex.test(text)).toBe(true);
      });
    });

    it('destination 配置应该正确', () => {
      const config = createGtsUpdateHideRegex();
      expect(config.destination.display).toBe(true);
      expect(config.destination.prompt).toBe(false);
    });
  });
});
```

### 集成测试（手动）

1. **注册验证**
   - 启用脚本后，检查酒馆正则列表中是否有「巨大娘计算器」正则
   
2. **过滤验证**
   - 让 AI 输出包含 `<gts_update>` 的内容
   - 验证显示中看不到标签
   - 验证变量更新命令被正确解析执行

3. **清理验证**
   - 禁用/卸载脚本后
   - 检查酒馆正则列表中该正则已被移除

---

## 🚀 扩展可能

### 未来可添加的正则

| 正则 | 用途 | 优先级 |
|------|------|--------|
| 隐藏调试标签 | 过滤 `<gts_debug>` 等调试信息 | P2 |
| 格式化输出 | 美化数值显示格式 | P3 |
| 自定义过滤 | 用户自定义的过滤规则 | P3 |

### 设置面板集成（可选）

```vue
<!-- 未来可以在设置面板添加正则开关 -->
<template>
  <GcCard title="显示过滤">
    <GcSwitch
      v-model="hideGtsUpdate"
      label="隐藏更新命令标签"
      description="在显示中隐藏 <gts_update> 标签"
    />
  </GcCard>
</template>
```

---

## 📝 注意事项

### 酒馆 API 可用性

```typescript
// 检查 API 是否可用
if (typeof getTavernRegexes !== 'function') {
  console.warn('[GiantessCalc] 酒馆正则 API 不可用');
  return false;
}
```

### 性能考虑

- `updateTavernRegexesWith` 是慢操作（会重载聊天）
- 应该批量操作，避免频繁调用
- 初始化时一次性注册所有正则

### 冲突处理

- 使用唯一前缀 `giantess-calc-` 避免 ID 冲突
- 不修改其他脚本/用户创建的正则

---

## 📅 实现计划

### Phase 1: 基础实现

- [x] 设计文档
- [x] 类型定义 (`src/types/regex.ts`)
- [x] 常量定义 (`src/services/regex/constants.ts`)
- [x] 管理器实现 (`src/services/regex/manager.ts`)
- [x] 模块导出 (`src/services/regex/index.ts`)

### Phase 2: 集成

- [x] 更新 `src/services/index.ts`
- [x] 更新 `src/types/index.ts`
- [x] 集成到 `src/设置界面.ts`
- [x] 添加到全局 API

### Phase 3: 测试

- [ ] 单元测试
- [ ] 手动集成测试

---

## 📚 相关文档

- [架构文档](../ARCHITECTURE.md) - 项目整体架构
- [酒馆正则 API](@types/function/tavern_regex.d.ts) - 类型定义
- [变量解析](./DATA_PROCESSING.md) - `<gts_update>` 解析流程
