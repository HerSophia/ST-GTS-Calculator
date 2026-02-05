# 数据处理机制

> 本文档描述巨大娘计算器如何处理变量数据、实现消息页隔离、以及避免重复处理。

---

## 📋 概述

巨大娘计算器的数据处理系统负责：

1. **监听酒馆事件** - 响应消息生成、切换、编辑等事件
2. **解析 AI 输出** - 从 `<gts_update>` 标签中提取变量更新命令
3. **读写楼层变量** - 将角色数据存储在消息楼层变量中
4. **同步到 Store** - 将变量数据同步到 Pinia Store 供 UI 使用
5. **消息页隔离** - 确保不同消息的数据完全独立
6. **防重复处理** - 避免重复计算和历史记录重复

### 核心模块

| 模块 | 文件 | 职责 |
|------|------|------|
| 事件处理 | `event-handler.ts` | 监听酒馆事件，调度数据处理 |
| 变量读取 | `reader.ts` | 从楼层变量读取数据 |
| 变量写入 | `writer.ts` | 写入数据到楼层变量 |
| 命令解析 | `parser.ts` | 解析 AI 输出中的更新命令 |
| 状态同步 | `sync.ts` | 变量与 Store 双向同步 |

---

## 🔄 数据流架构

### 整体数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                         酒馆事件                                 │
│  GENERATION_ENDED | MESSAGE_SWIPED | MESSAGE_EDITED | ...      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    event-handler.ts                             │
│                 parseAndProcessMessage()                        │
└─────────────────────────────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   parser.ts     │   │   reader.ts     │   │   writer.ts     │
│  解析 AI 输出    │   │  读取楼层变量   │   │  写入楼层变量   │
└─────────────────┘   └─────────────────┘   └─────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        sync.ts                                  │
│              syncVariablesToStore() + 消息页隔离                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Pinia Stores                               │
│  charactersStore (含 currentMessageId 追踪)                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Vue UI                                   │
│              响应式更新界面                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 统一处理入口

所有事件最终都通过 `parseAndProcessMessage()` 函数处理：

```typescript
function parseAndProcessMessage(
  messageId: number | 'latest',
  options: {
    forceParseMessage?: boolean;  // 强制解析消息
    isNewMessage?: boolean;       // 是否为新消息
    useValueComparison?: boolean; // 使用值比较优化
  } = {}
): SyncResult
```

---

## 🔒 消息页数据隔离

### 问题背景

当用户在不同消息页（分支）之间切换时，可能出现：

1. **数据混合** - 消息 A 的角色数据与消息 B 的数据同时存在
2. **角色名冲突** - 同一角色在不同消息中有不同的数据状态
3. **临时数据残留** - 切换后旧消息的数据没有被清除

### 解决方案

在 Store 中追踪当前消息 ID，切换时自动清空旧数据：

```typescript
// src/stores/characters.ts

// 追踪当前关联的消息 ID
const currentMessageId = ref<number | 'latest' | null>(null);

/**
 * 设置当前消息 ID
 * 如果 ID 变化，自动清空所有数据
 */
const setCurrentMessageId = (messageId: number | 'latest' | null): boolean => {
  const previousId = currentMessageId.value;
  
  // 相同 ID，无需处理
  if (previousId === messageId) {
    return false;
  }
  
  // ID 变化，清空旧数据
  characters.value.clear();
  scenario.value = {};
  interactions.value = {};
  currentMessageId.value = messageId;
  
  return true; // 返回 true 表示发生了切换
};
```

### 数据流（含隔离）

```
用户切换消息 (swipe/click)
        ↓
event-handler: handleMessageSwiped(messageId)
        ↓
parseAndProcessMessage(messageId)
        ↓
syncVariablesToStore({ messageId })
        ↓
charactersStore.setCurrentMessageId(messageId)
        ↓
[消息 ID 变化?]
    ↓ 是
清空所有数据 (characters, scenario, interactions)
    ↓
从楼层变量读取新消息的数据
    ↓
填充到 Store
```

### 隔离效果

| 场景 | 行为 |
|------|------|
| 首次加载消息 | `setCurrentMessageId` 返回 `true`，Store 初始化 |
| 切换到不同消息 | 清空旧数据，加载新消息数据 |
| 同一消息多次同步 | `setCurrentMessageId` 返回 `false`，数据保留 |
| 聊天切换 | `clearAll()` 完全重置，包括消息 ID |

### API

```typescript
// 获取当前消息 ID
charactersStore.getCurrentMessageId(): number | 'latest' | null

// 设置消息 ID（自动处理隔离）
charactersStore.setCurrentMessageId(messageId): boolean

// 完全清空（包括消息 ID）
charactersStore.clearAll(): void
```

---

## 📡 事件处理机制

### 监听的酒馆事件

| 事件 | 触发时机 | 处理策略 |
|------|----------|----------|
| `GENERATION_ENDED` | LLM 生成完成 | **必须解析** - 新消息必须解析其中的命令 |
| `MESSAGE_SWIPED` | 消息分支切换 | **变量优先** - 有数据直接同步，无数据解析消息 |
| `MESSAGE_EDITED` | 消息编辑完成 | **强制解析** - 用户可能添加新命令 |
| `MESSAGE_UPDATED` | 消息内容更新 | **变量优先 + 防抖** |
| `MESSAGE_DELETED` | 消息删除 | **变量优先** - 回退到最新消息 |
| `CHAT_CHANGED` | 聊天切换 | **完全重置** - 清空后延迟加载 |
| `GENERATION_AFTER_COMMANDS` | 生成前 | 重新注入提示词 |

### 处理策略详解

#### 变量优先策略

```typescript
function parseAndProcessMessage(messageId, options) {
  // 1. 检查变量中是否有有效数据
  const hasExistingData = hasValidCharacterData(messageId);
  
  // 2. 决定是否解析消息
  const shouldParse = 
    options.forceParseMessage ||  // 强制解析
    options.isNewMessage ||       // 新消息
    !hasExistingData;             // 变量无数据
  
  if (!shouldParse) {
    // 变量优先：直接同步到 Store
    return syncVariablesToStore({ messageId });
  }
  
  // 3. 需要解析消息
  const content = getMessageContent(messageId);
  if (content && hasUpdateCommands(content)) {
    extractAndApplyUpdates(content, { messageId });
  }
  
  return fullDataProcess({ messageId });
}
```

#### 各事件处理器

```typescript
// 新消息：必须解析
function handleGenerationEnded(messageId: number): void {
  parseAndProcessMessage(messageId, { isNewMessage: true });
}

// 分支切换：变量优先
function handleMessageSwiped(messageId: number): void {
  parseAndProcessMessage(messageId);
}

// 编辑完成：强制解析 + 值比较
function handleMessageEdited(messageId: number): void {
  parseAndProcessMessage(messageId, { 
    forceParseMessage: true,
    useValueComparison: true,  // 只应用有变化的更新
  });
}

// 聊天切换：完全重置
function handleChatChanged(chatFileName: string): void {
  charactersStore.clearAll();  // 清空所有数据（含消息 ID）
  setTimeout(() => {
    parseAndProcessMessage('latest');
  }, 100);
}
```

---

## 🛡️ 防重复处理

### 问题场景

| 场景 | 问题 |
|------|------|
| 页面刷新 | 已处理的消息被重新解析 |
| 多次触发事件 | 同一消息被多次处理 |
| 历史记录 | 相同身高被重复记录 |

### 解决方案

#### 1. 变量优先策略

如果楼层变量中已有角色数据，跳过消息解析：

```typescript
function hasValidCharacterData(messageId: number | 'latest'): boolean {
  const data = _internal_readGiantessData({ messageId });
  if (!data) return false;
  
  const characters = _internal_extractCharacters(data);
  if (Object.keys(characters).length === 0) return false;
  
  // 检查是否有有效身高数据
  for (const charData of Object.values(characters)) {
    if (charData.当前身高 && charData.当前身高 > 0) {
      return true;
    }
  }
  
  return false;
}
```

#### 2. 重算检查

只在身高变化时重新计算：

```typescript
function needsRecalculation(
  charData: CharacterMvuData,
  existingCalcData: CalculationData | undefined
): boolean {
  if (!existingCalcData) return true;
  
  const currentHeight = charData.当前身高 || charData.身高;
  const originalHeight = charData.原身高 || charData.原始身高;
  
  // 检查身高是否变化
  const existingRatio = existingCalcData.倍率;
  const newRatio = currentHeight / originalHeight;
  
  return Math.abs(existingRatio - newRatio) > 0.001;
}
```

#### 3. 历史记录去重

添加历史前检查最后一条记录：

```typescript
function addHeightHistory(
  name: string,
  newHeight: number,
  reason: string,
  timestamp: string,
  options: WriteOptions
): void {
  // 读取现有历史
  const history = getExistingHistory(name, options);
  const lastRecord = history[history.length - 1];
  
  // 身高相同则跳过
  if (lastRecord && lastRecord.身高 === newHeight) {
    return;
  }
  
  // 追加新记录
  history.push({
    身高: newHeight,
    身高_格式化: formatLength(newHeight),
    时间点: timestamp,
    原因: reason,
    变化: lastRecord ? (newHeight > lastRecord.身高 ? '增大' : '缩小') : undefined,
  });
}
```

#### 4. 处理状态追踪

记录消息是否已被处理：

```typescript
interface ProcessingState {
  最后处理消息ID?: number | 'latest';
  最后处理时间?: number;
  内容哈希?: string;       // 检测编辑
  已处理角色?: string[];
}

function isMessageAlreadyProcessed(
  messageId: number | 'latest',
  contentHash?: string
): boolean {
  const state = _internal_readProcessingState({ messageId });
  if (!state) return false;
  
  if (state.最后处理消息ID !== messageId) return false;
  
  // 内容变化则需重新处理
  if (contentHash && state.内容哈希 !== contentHash) {
    return false;
  }
  
  return true;
}
```

#### 5. 值比较优化（编辑场景）

编辑消息时，只应用有变化的更新：

```typescript
function filterChangedUpdates(
  updates: ParsedUpdate[],
  options: ReadOptions
): ParsedUpdate[] {
  const data = _internal_readGiantessData(options);
  
  return updates.filter(update => {
    const existingValue = getValueFromPath(data, update.path);
    return !deepEqual(existingValue, update.value);
  });
}
```

---

## 📝 追加型数据处理

### 追加型数据

| 数据 | 结构 | 特点 |
|------|------|------|
| `_身高历史` | 数组 | 需要不断追加新记录 |
| `_实际损害.重大事件` | 数组 | 需要不断追加新事件 |

### 去重策略

#### 身高历史

- **去重键**：身高值
- **策略**：与最后一条记录比较，相同则跳过

#### 通用追加函数

```typescript
function appendToArray<T extends Record<string, unknown>>(
  path: string,
  item: T,
  dedupeKey: keyof T | ((item: T) => string),
  options: WriteOptions
): boolean {
  const array = getExistingArray<T>(path, options);
  
  // 计算去重键
  const getKey = typeof dedupeKey === 'function'
    ? dedupeKey
    : (i: T) => String(i[dedupeKey]);
  
  const itemKey = getKey(item);
  const exists = array.some(a => getKey(a) === itemKey);
  
  if (exists) {
    return false; // 已存在，跳过
  }
  
  array.push(item);
  writeArray(path, array, options);
  return true;
}
```

### 消息分支与历史

```
消息 #10:
  分支 A: 身高 100m → 200m → 300m  (历史: [100, 200, 300])
  分支 B: 身高 100m → 150m          (历史: [100, 150])
```

- 楼层变量按分支存储，历史自然隔离 ✅
- 切换分支时，消息页隔离机制确保 Store 数据完全替换 ✅

---

## 🔧 完整处理流程

### fullDataProcess()

```typescript
function fullDataProcess(options: ReadOptions & WriteOptions): SyncResult {
  const { messageId = 'latest' } = options;
  
  // 1. 处理角色更新（计算、历史、扩展）
  const hasUpdates = processCharacterUpdates({ messageId });
  
  // 2. 同步到 Store（含消息页隔离）
  const syncResult = syncVariablesToStore({ messageId });
  
  // 3. 注入提示词
  if (hasUpdates || syncResult.characterCount > 0) {
    reinjectPromptsIfNeeded();
  }
  
  return syncResult;
}
```

### syncVariablesToStore()

```typescript
function syncVariablesToStore(options: ReadOptions): SyncResult {
  const { messageId = 'latest' } = options;
  
  // 关键：消息页隔离
  const messageChanged = charactersStore.setCurrentMessageId(messageId);
  if (messageChanged) {
    debugLog('消息 ID 变化，已清空旧数据');
  }
  
  // 读取楼层变量
  const data = _internal_readGiantessData(options);
  if (!data) {
    return { success: false, characterCount: 0 };
  }
  
  // 同步场景
  const scenarioData = _internal_extractScenario(data);
  if (scenarioData) {
    charactersStore.setScenario(scenarioData);
  }
  
  // 同步互动限制
  const interactions = _internal_extractInteractions(data);
  if (interactions) {
    charactersStore.setInteractions(interactions);
  }
  
  // 同步角色数据
  const characters = _internal_extractCharacters(data);
  for (const [name, charData] of Object.entries(characters)) {
    // 计算并设置角色数据...
    charactersStore.setCharacter(name, processedData);
  }
  
  return { success: true, characterCount };
}
```

---

## 📊 变量结构

### 楼层变量结构

```yaml
stat_data:
  巨大娘:                         # 变量前缀
    _场景:
      当前场景: "大城市"
      场景原因: "角色来到市中心"
    _互动限制:
      络络_小明: { ... }
    _处理状态:
      最后处理消息ID: 10
      最后处理时间: 1704067200000
      内容哈希: "abc123"
    角色:
      络络:
        当前身高: 170
        原身高: 1.65
        变化原因: "喝下药水"
        变化时间: "第三天"
        自定义部位:
          乳房高度: 28
        _计算数据: { ... }
        _损害数据: { ... }
        _身高历史:
          - 身高: 1.65
            时间点: "开始"
          - 身高: 170
            时间点: "第三天"
            原因: "喝下药水"
            变化: "增大"
```

### Store 状态

```typescript
interface CharactersStoreState {
  characters: Map<string, CharacterData>;
  scenario: ScenarioData;
  interactions: Record<string, PairwiseInteraction>;
  currentMessageId: number | 'latest' | null;  // 消息页隔离关键
}
```

---

## 🧪 测试用例

### 消息页隔离测试

```typescript
describe('消息页数据隔离', () => {
  it('切换消息 ID 应该清空角色数据', () => {
    const store = useCharactersStoreBase();
    store.setCurrentMessageId(1);
    store.setCharacter('角色A', mockCharacter);
    expect(store.characters.size).toBe(1);
    
    // 切换消息
    const result = store.setCurrentMessageId(2);
    
    expect(result).toBe(true);
    expect(store.characters.size).toBe(0);
  });

  it('相同消息 ID 不应该清空数据', () => {
    const store = useCharactersStoreBase();
    store.setCurrentMessageId(1);
    store.setCharacter('角色', mockCharacter);
    
    const result = store.setCurrentMessageId(1);
    
    expect(result).toBe(false);
    expect(store.characters.size).toBe(1);
  });
});
```

### 防重复测试

```typescript
describe('防重复处理', () => {
  it('身高历史不应重复记录相同身高', () => {
    addHeightHistory('络络', 100, '变大', '第一天');
    addHeightHistory('络络', 100, '再次', '第二天'); // 应跳过
    
    const history = getHistory('络络');
    expect(history.length).toBe(1);
  });

  it('变量优先应跳过消息解析', () => {
    // 设置已有数据
    setExistingData({ 络络: { 当前身高: 100 } });
    
    parseAndProcessMessage(1);
    
    expect(parseMessageCalled).toBe(false);
  });
});
```

---

## 📚 相关文档

- [架构文档](../ARCHITECTURE.md) - 项目整体架构
- [变量系统重构](./VARIABLE_SYSTEM_REFACTOR.md) - 变量服务设计详情
- [API 文档](../API.md) - Variables Service API

---

## 📅 文档更新日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2025-01 | v2.0 | 重写为正式文档，添加消息页隔离机制 |
| 2024-01 | v1.0 | 初始设计文档 |
