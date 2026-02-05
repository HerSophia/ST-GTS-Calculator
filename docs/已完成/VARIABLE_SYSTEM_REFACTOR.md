# 变量系统重构方案

> 从 MVU 事件驱动迁移到酒馆原生事件 + 直接变量操作

---

## 📊 重构进度

| 阶段 | 状态 | 说明 |
|------|------|------|
| **阶段一：创建新服务** | ✅ 完成 | 2024-01-XX |
| ├─ 类型定义 (`types/variables.ts`) | ✅ 完成 | 新增 9 个类型 |
| ├─ 变量读取 (`reader.ts`) | ✅ 完成 | 7 个导出函数 |
| ├─ 变量写入 (`writer.ts`) | ✅ 完成 | 10 个导出函数 |
| ├─ AI 输出解析 (`parser.ts`) | ✅ 完成 | 8 个导出函数 |
| ├─ 状态同步 (`sync.ts`) | ✅ 完成 | 5 个导出函数 |
| ├─ 事件处理 (`event-handler.ts`) | ✅ 完成 | 监听 7 个事件 |
| └─ 统一导出 (`index.ts`) | ✅ 完成 | 模块入口 |
| **阶段二：并行运行** | ✅ 完成 | 新旧系统并行监听 |
| ├─ 修改 handler.ts | ✅ 完成 | 调用 initVariableEventListeners() |
| ├─ 添加对比日志 | ✅ 完成 | `[NEW]` 前缀区分 |
| ├─ 导出到 services/index.ts | ✅ 完成 | 60+ 个导出项 |
| └─ syncOnInit: false | ✅ 完成 | 让 MVU 系统主导 |
| **阶段三：切换到新系统** | ✅ 完成 | 新系统成为主系统 |
| ├─ syncOnInit: true | ✅ 完成 | 新系统自动同步 |
| ├─ 禁用 MVU 事件监听 | ✅ 完成 | 不再监听 VARIABLE_UPDATE_ENDED |
| ├─ 移除 [NEW] 日志前缀 | ✅ 完成 | 新系统成为主系统 |
| └─ 更新 handler.ts | ✅ 完成 | 简化初始化流程 |
| **阶段四：清理** | ✅ 完成 | 2024-01 |
| ├─ 删除 `mvu/history.ts` | ✅ 完成 | 功能已迁移到 writer.ts |
| ├─ 添加 `addHeightHistoryInternal` | ✅ 完成 | 批量操作版本 |
| ├─ 更新 `mvu/index.ts` | ✅ 完成 | 从 variables 重导出 |
| ├─ 更新 `test-injector.ts` | ✅ 完成 | 使用新函数 |
| └─ 更新文档和注释 | ✅ 完成 | 标记废弃模块 |

### 已创建的文件

```
src/
├── types/
│   └── variables.ts          ✅ 新增
└── services/
    └── variables/
        ├── index.ts          ✅ 新增
        ├── reader.ts         ✅ 新增
        ├── writer.ts         ✅ 新增
        ├── parser.ts         ✅ 新增
        ├── sync.ts           ✅ 新增
        └── event-handler.ts  ✅ 新增
```

### 下一步工作

1. **为新模块添加单元测试**
   - `tests/services/variables/reader.test.ts`
   - `tests/services/variables/writer.test.ts`
   - `tests/services/variables/parser.test.ts`
   - `tests/services/variables/sync.test.ts`
   - `tests/services/variables/event-handler.test.ts`

2. **可选优化**
   - 考虑将 `handler.ts` 重命名或重构为更简洁的入口
   - 统一错误处理和日志格式

### 保留的 MVU 命名（向后兼容）

以下命名保留是为了 API 兼容性，实际已使用新系统：

| 命名 | 说明 |
|------|------|
| `initMvuIntegration` | 入口函数，调用 `initVariableEventListeners` |
| `getMvuDebugInfo` | 调试信息，从楼层变量读取 |
| `refreshCharactersFromMvu` | 内部调用 `syncVariablesToStore` |
| `calculateFromMvuData` | 从 MVU 数据格式计算 |
| `types/mvu.ts` | 数据结构定义（与变量格式一致） |

---

## 1. 问题背景

### 1.1 MVU 的问题

当前系统使用 MVU 库的 `VARIABLE_UPDATE_ENDED` 事件来监听变量更新。但在实际使用中发现：

1. **消息页切换（Swipe）后**：MVU 事件不会触发，导致变量状态与 UI 不同步
2. **编辑消息后**：同样的问题，变量更新不能立即反映到界面
3. **用户体验差**：用户需要额外操作才能看到正确的数据

### 1.2 解决思路

放弃 MVU 的事件机制，改为：
1. 使用酒馆助手的**原生变量 API** 直接读写变量
2. 监听酒馆的**原生事件**来触发变量同步
3. 保持现有的数据结构，确保向后兼容

---

## 2. 技术方案

### 2.1 可用的酒馆事件

根据 `@types/iframe/event.d.ts`，以下事件可用于变量同步：

| 事件 | 触发时机 | 参数 | 用途 |
|------|----------|------|------|
| `MESSAGE_SWIPED` | 切换消息分支后 | `message_id: number` | 从新消息读取变量 |
| `MESSAGE_EDITED` | 用户编辑消息完成后 | `message_id: number` | 重新解析变量 |
| `MESSAGE_UPDATED` | 任何消息内容更新后 | `message_id: number` | 通用更新检测 |
| `MESSAGE_DELETED` | 消息删除后 | `message_id: number` | 清理相关状态 |
| `MESSAGE_SWIPE_DELETED` | 消息分支删除后 | `{messageId, swipeId, newSwipeId}` | 处理分支删除 |
| `GENERATION_ENDED` | LLM 生成完成后 | `message_id: number` | 解析 AI 输出，写入变量 |
| `CHAT_CHANGED` | 切换聊天后 | `chat_file_name: string` | 重置状态，加载新聊天数据 |

### 2.2 可用的变量 API

根据 `@types/function/variables.d.ts`：

```typescript
// 读取楼层变量
getVariables({ type: 'message', message_id: number | 'latest' }): Record<string, any>

// 替换楼层变量
replaceVariables(variables: Record<string, any>, { type: 'message', message_id?: number }): void

// 更新楼层变量（推荐）
updateVariablesWith(
  updater: (variables: Record<string, any>) => Record<string, any>,
  { type: 'message', message_id?: number }
): Record<string, any>

// 插入或修改变量
insertOrAssignVariables(variables: Record<string, any>, option): Record<string, any>

// 删除变量
deleteVariable(variable_path: string, option): { variables, delete_occurred }
```

### 2.3 数据结构（保持不变）

```yaml
# 楼层变量 (type: 'message')
stat_data:
  巨大娘:                    # 变量前缀（可配置）
    _场景:                   # 当前场景设置
      当前场景: "大城市"
      场景原因: "角色来到市中心"
    _互动限制:               # 多角色互动限制（自动计算）
      络络_小明: {...}
    角色:                    # 所有角色数据
      络络:
        当前身高: 170
        原身高: 1.65
        变化原因: "喝下药水"
        自定义部位: {...}
        _计算数据: {...}     # 自动生成
        _损害数据: {...}     # 自动生成
        _身高历史: [...]     # 自动记录
```

---

## 3. 架构设计

### 3.1 新的服务层结构

```
src/services/
├── variables/                    # 新的变量服务（替代 mvu/）
│   ├── index.ts                  # 统一导出
│   ├── reader.ts                 # 变量读取
│   ├── writer.ts                 # 变量写入
│   ├── parser.ts                 # AI 输出解析
│   ├── event-handler.ts          # 事件处理（核心）
│   └── sync.ts                   # 状态同步
├── mvu/                          # 保留，作为兼容层
│   ├── index.ts
│   └── history.ts                # 身高历史（可复用）
└── ...
```

### 3.2 核心模块职责

#### 3.2.1 `event-handler.ts` - 事件处理器（核心）

```typescript
/**
 * 初始化事件监听
 * 替代原来的 initMvuIntegration()
 */
export function initVariableEventListeners(): void {
  // 1. 消息分支切换 - 读取新分支的变量
  eventOn(tavern_events.MESSAGE_SWIPED, handleMessageSwiped);
  
  // 2. 消息编辑完成 - 重新解析变量
  eventOn(tavern_events.MESSAGE_EDITED, handleMessageEdited);
  
  // 3. 消息更新（通用）- 检查变量变化
  eventOn(tavern_events.MESSAGE_UPDATED, handleMessageUpdated);
  
  // 4. 消息删除 - 清理状态
  eventOn(tavern_events.MESSAGE_DELETED, handleMessageDeleted);
  
  // 5. LLM 生成完成 - 解析输出，写入变量
  eventOn(tavern_events.GENERATION_ENDED, handleGenerationEnded);
  
  // 6. 聊天切换 - 重置状态
  eventOn(tavern_events.CHAT_CHANGED, handleChatChanged);
  
  // 7. 生成前 - 确保提示词注入
  eventOn(tavern_events.GENERATION_AFTER_COMMANDS, handleBeforeGeneration);
}
```

#### 3.2.2 `reader.ts` - 变量读取

```typescript
/**
 * 从指定消息楼层读取巨大娘数据
 */
export function readGiantessData(
  messageId: number | 'latest' = 'latest'
): GiantessMvuData | null {
  const variables = getVariables({ type: 'message', message_id: messageId });
  const prefix = useSettingsStore().settings.variablePrefix;
  return _.get(variables, `stat_data.${prefix}`) as GiantessMvuData | null;
}

/**
 * 从数据中提取角色列表
 */
export function extractCharacters(
  data: GiantessMvuData
): Record<string, CharacterMvuData> {
  // 支持新旧格式
  if (data.角色) return data.角色;
  
  // 旧格式兼容
  const characters: Record<string, CharacterMvuData> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith('_') && key !== '角色' && typeof value === 'object') {
      characters[key] = value as CharacterMvuData;
    }
  }
  return characters;
}
```

#### 3.2.3 `writer.ts` - 变量写入

```typescript
/**
 * 写入角色计算数据到指定消息楼层
 */
export function writeCharacterCalcData(
  name: string,
  calcData: GiantessCalculation | TinyCalculation,
  messageId: number | 'latest' = 'latest'
): void {
  const prefix = useSettingsStore().settings.variablePrefix;
  const path = `stat_data.${prefix}.角色.${name}._计算数据`;
  
  updateVariablesWith(
    (variables) => {
      _.set(variables, path, calcData);
      return variables;
    },
    { type: 'message', message_id: messageId }
  );
}

/**
 * 批量更新角色数据
 */
export function batchUpdateCharacters(
  updates: Array<{ name: string; data: Partial<CharacterMvuData> }>,
  messageId: number | 'latest' = 'latest'
): void {
  const prefix = useSettingsStore().settings.variablePrefix;
  
  updateVariablesWith(
    (variables) => {
      for (const { name, data } of updates) {
        const basePath = `stat_data.${prefix}.角色.${name}`;
        for (const [key, value] of Object.entries(data)) {
          _.set(variables, `${basePath}.${key}`, value);
        }
      }
      return variables;
    },
    { type: 'message', message_id: messageId }
  );
}
```

#### 3.2.4 `parser.ts` - AI 输出解析

```typescript
/**
 * 从 AI 输出中解析变量更新命令
 * 
 * 支持的格式：
 * ```xml
 * <gts_update>
 * _.set('巨大娘.角色.络络.当前身高', 500);
 * _.set('巨大娘.角色.络络.变化原因', '喝下成长药水');
 * </gts_update>
 * ```
 */
export function parseGtsUpdateCommands(text: string): ParsedUpdate[] {
  const regex = /<gts_update>([\s\S]*?)<\/gts_update>/g;
  const updates: ParsedUpdate[] = [];
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    const commands = match[1];
    // 解析 _.set() 命令
    const setRegex = /_.set\(['"]([^'"]+)['"],\s*([^)]+)\)/g;
    let setMatch;
    while ((setMatch = setRegex.exec(commands)) !== null) {
      const path = setMatch[1];
      const valueStr = setMatch[2].trim();
      updates.push({ path, value: parseValue(valueStr) });
    }
  }
  
  return updates;
}

/**
 * 应用解析的更新到变量
 */
export function applyParsedUpdates(
  updates: ParsedUpdate[],
  messageId: number | 'latest' = 'latest'
): void {
  if (updates.length === 0) return;
  
  updateVariablesWith(
    (variables) => {
      for (const { path, value } of updates) {
        // 路径转换：'巨大娘.角色.络络.当前身高' -> 'stat_data.巨大娘.角色.络络.当前身高'
        const fullPath = path.startsWith('stat_data.') ? path : `stat_data.${path}`;
        _.set(variables, fullPath, value);
      }
      return variables;
    },
    { type: 'message', message_id: messageId }
  );
}
```

#### 3.2.5 `sync.ts` - 状态同步

```typescript
/**
 * 从变量同步数据到 Store
 * 这是核心同步函数，在各种事件触发时调用
 */
export function syncVariablesToStore(
  messageId: number | 'latest' = 'latest'
): SyncResult {
  const settingsStore = useSettingsStore();
  const charactersStore = useCharactersStore();
  
  const data = readGiantessData(messageId);
  if (!data) {
    charactersStore.clearAll();
    return { success: false, characterCount: 0 };
  }
  
  const characters = extractCharacters(data);
  let count = 0;
  
  for (const [name, charData] of Object.entries(characters)) {
    const currentHeight = charData.当前身高 || charData.身高;
    const originalHeight = charData.原身高 || charData.原始身高 || 1.65;
    
    if (currentHeight && currentHeight > 0) {
      // 计算数据
      const scale = currentHeight / originalHeight;
      const calcData = scale >= 1
        ? calculateGiantessData(currentHeight, originalHeight, charData.自定义部位)
        : calculateTinyData(currentHeight, originalHeight);
      
      // 更新 Store
      charactersStore.setCharacter(name, {
        name,
        currentHeight,
        originalHeight,
        changeReason: charData.变化原因,
        changeTime: charData.变化时间,
        calcData,
        damageData: charData._损害数据,
        actualDamage: charData._实际损害,
        history: charData._身高历史 || [],
      });
      count++;
    }
  }
  
  settingsStore.debugLog(`✅ 同步完成: ${count} 个角色`);
  return { success: true, characterCount: count };
}

/**
 * 从 Store 同步数据回变量（反向同步）
 * 用于用户通过 UI 修改数据时
 */
export function syncStoreToVariables(
  messageId: number | 'latest' = 'latest'
): void {
  const charactersStore = useCharactersStore();
  const updates: Array<{ name: string; data: Partial<CharacterMvuData> }> = [];
  
  for (const [name, char] of Object.entries(charactersStore.characters)) {
    updates.push({
      name,
      data: {
        当前身高: char.currentHeight,
        原身高: char.originalHeight,
        变化原因: char.changeReason,
        变化时间: char.changeTime,
        _计算数据: char.calcData,
        _损害数据: char.damageData,
      },
    });
  }
  
  batchUpdateCharacters(updates, messageId);
}
```

---

## 4. 事件处理流程

### 4.1 消息分支切换 (`MESSAGE_SWIPED`)

```typescript
function handleMessageSwiped(messageId: number): void {
  console.log(`[GiantessCalc] 📄 消息分支切换: ${messageId}`);
  
  // 从新分支读取变量并同步到 Store
  const result = syncVariablesToStore(messageId);
  
  if (result.success && result.characterCount > 0) {
    // 重新注入提示词（如果启用）
    reinjectPromptsIfNeeded();
  }
}
```

### 4.2 消息编辑完成 (`MESSAGE_EDITED`)

```typescript
function handleMessageEdited(messageId: number): void {
  console.log(`[GiantessCalc] ✏️ 消息编辑完成: ${messageId}`);
  
  // 消息可能包含变量更新命令，需要解析
  // 注意：编辑后的内容需要从消息中获取
  const messageContent = getMessageContent(messageId);
  
  if (messageContent) {
    // 解析并应用更新
    const updates = parseGtsUpdateCommands(messageContent);
    if (updates.length > 0) {
      applyParsedUpdates(updates, messageId);
    }
  }
  
  // 同步到 Store
  syncVariablesToStore(messageId);
}
```

### 4.3 LLM 生成完成 (`GENERATION_ENDED`)

```typescript
function handleGenerationEnded(messageId: number): void {
  console.log(`[GiantessCalc] 🤖 LLM 生成完成: ${messageId}`);
  const settingsStore = useSettingsStore();
  
  if (!settingsStore.settings.enabled) return;
  
  // 获取生成的消息内容
  const messageContent = getMessageContent(messageId);
  if (!messageContent) return;
  
  // 解析 AI 输出中的变量更新命令
  const updates = parseGtsUpdateCommands(messageContent);
  
  if (updates.length > 0) {
    settingsStore.debugLog(`📝 解析到 ${updates.length} 个变量更新`);
    
    // 应用更新到变量
    applyParsedUpdates(updates, messageId);
    
    // 触发计算和同步
    processCharacterUpdates(messageId);
  }
}

/**
 * 处理角色更新：计算、记录历史、同步
 */
function processCharacterUpdates(messageId: number): void {
  const data = readGiantessData(messageId);
  if (!data) return;
  
  const characters = extractCharacters(data);
  const prefix = useSettingsStore().settings.variablePrefix;
  
  updateVariablesWith(
    (variables) => {
      for (const [name, charData] of Object.entries(characters)) {
        const currentHeight = charData.当前身高 || charData.身高;
        const originalHeight = charData.原身高 || 1.65;
        
        if (currentHeight && needsRecalculation(charData)) {
          // 计算数据
          const scale = currentHeight / originalHeight;
          const calcData = scale >= 1
            ? calculateGiantessData(currentHeight, originalHeight, charData.自定义部位)
            : calculateTinyData(currentHeight, originalHeight);
          
          // 写入计算结果
          const charPath = `stat_data.${prefix}.角色.${name}`;
          _.set(variables, `${charPath}._计算数据`, calcData);
          
          // 记录历史
          addHeightHistory(variables, prefix, name, currentHeight, 
            charData.变化原因, charData.变化时间);
          
          // 计算损害（如果启用）
          if (useSettingsStore().settings.enableDamageCalculation && scale >= 1) {
            const damageData = calculateDamage(
              currentHeight, originalHeight,
              useSettingsStore().settings.damageScenario
            );
            _.set(variables, `${charPath}._损害数据`, damageData);
          }
        }
      }
      return variables;
    },
    { type: 'message', message_id: messageId }
  );
  
  // 同步到 Store
  syncVariablesToStore(messageId);
  
  // 重新注入提示词
  reinjectPromptsIfNeeded();
}
```

### 4.4 聊天切换 (`CHAT_CHANGED`)

```typescript
function handleChatChanged(chatFileName: string): void {
  console.log(`[GiantessCalc] 📂 聊天切换: ${chatFileName}`);
  
  const charactersStore = useCharactersStore();
  
  // 清空当前状态
  charactersStore.clearAll();
  
  // 延迟加载新聊天的数据（确保聊天完全加载）
  setTimeout(() => {
    syncVariablesToStore('latest');
    reinjectPromptsIfNeeded();
  }, 100);
}
```

---

## 5. 数据流图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户/AI 交互                              │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────────┐
│ MESSAGE_SWIPED│    │MESSAGE_EDITED │    │ GENERATION_ENDED  │
│   (切换分支)   │    │  (编辑消息)   │    │   (AI 生成完成)   │
└───────┬───────┘    └───────┬───────┘    └─────────┬─────────┘
        │                    │                      │
        ▼                    ▼                      ▼
┌───────────────────────────────────────────────────────────────┐
│                     event-handler.ts                          │
│         handleMessageSwiped / handleMessageEdited /           │
│                   handleGenerationEnded                       │
└───────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────────┐
│   reader.ts   │    │   parser.ts   │    │     writer.ts     │
│ readGiantess  │    │ parseGtsUpdate│    │ writeCharacter    │
│    Data()     │    │  Commands()   │    │    CalcData()     │
└───────┬───────┘    └───────┬───────┘    └─────────┬─────────┘
        │                    │                      │
        └────────────────────┼──────────────────────┘
                             ▼
┌───────────────────────────────────────────────────────────────┐
│                         sync.ts                               │
│            syncVariablesToStore() - 核心同步函数               │
└───────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
┌─────────────────────────┐        ┌─────────────────────────┐
│   Pinia Stores          │        │   楼层变量 (message)     │
│   - charactersStore     │◄──────►│   stat_data.巨大娘.*    │
│   - settingsStore       │        │                         │
└─────────────────────────┘        └─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer                                │
│              Panel.vue / CharacterCard.vue / ...                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 迁移计划

### 阶段一：创建新服务（保持 MVU 兼容）

1. 创建 `src/services/variables/` 目录
2. 实现核心模块：`reader.ts`, `writer.ts`, `parser.ts`, `sync.ts`
3. 实现事件处理器 `event-handler.ts`
4. 添加单元测试

### 阶段二：并行运行

1. 同时注册 MVU 事件和酒馆事件监听
2. 在新事件处理器中添加日志，验证触发时机
3. 对比两套系统的行为

### 阶段三：切换到新系统

1. 禁用 MVU 事件监听
2. 完全使用酒馆事件
3. 移除 MVU 依赖（保留数据结构兼容）

### 阶段四：清理

1. 移除 MVU 相关代码
2. 更新文档
3. 发布新版本

---

## 7. 向后兼容性

### 7.1 数据结构兼容

- 保持 `stat_data.{prefix}.角色.{name}` 路径结构
- 保持 `_计算数据`, `_身高历史`, `_损害数据` 等字段
- 继续支持旧格式数据自动迁移

### 7.2 API 兼容

```typescript
// 保持全局 API 不变
window.GiantessCalc = {
  calculate,
  calculateTiny,
  checkInteraction,
  formatLength,
  // ...
  
  // 新增：手动触发同步（用于调试）
  sync: {
    fromVariables: () => syncVariablesToStore(),
    toVariables: () => syncStoreToVariables(),
  },
};
```

### 7.3 LLM 提示词兼容

- 继续使用 `<gts_update>` XML 格式
- AI 输出的 `_.set()` 命令仍然有效（通过 parser 解析）

---

## 8. 测试要点

### 8.1 事件触发测试

| 操作 | 期望事件 | 验证点 |
|------|----------|--------|
| 切换消息分支 | `MESSAGE_SWIPED` | 变量立即同步 |
| 编辑消息 | `MESSAGE_EDITED` | 变量立即更新 |
| AI 生成 | `GENERATION_ENDED` | 解析 gts_update |
| 切换聊天 | `CHAT_CHANGED` | 状态重置并加载 |

### 8.2 数据同步测试

1. **变量 → Store**：修改楼层变量，验证 Store 更新
2. **Store → 变量**：通过 UI 修改，验证变量写入
3. **多角色**：多个角色同时更新
4. **历史记录**：身高变化正确记录

### 8.3 边界情况

1. 空聊天（无变量）
2. 旧格式数据迁移
3. 无效的变量更新命令
4. 并发更新（快速切换分支）

---

## 9. 风险与对策

| 风险 | 对策 |
|------|------|
| 事件触发顺序不确定 | 使用防抖，合并短时间内的多次触发 |
| 消息内容获取困难 | 研究酒馆助手的消息 API |
| 性能问题（频繁读写） | 批量操作，缓存计算结果 |
| 数据一致性 | 每次同步前清空 Store |

---

## 10. 时间估计

| 阶段 | 预计时间 |
|------|----------|
| 阶段一：创建新服务 | 2-3 天 |
| 阶段二：并行运行 | 1 天 |
| 阶段三：切换 | 1 天 |
| 阶段四：清理 | 0.5 天 |
| 总计 | 4.5-5.5 天 |

---

## 附录 A：关键代码示例

### 获取消息内容

```typescript
// 可能需要研究酒馆助手的 API 或直接操作 DOM
function getMessageContent(messageId: number): string | null {
  // 方法1：尝试使用酒馆 API（如果有）
  // 方法2：从 chat 数组获取
  // 方法3：从 DOM 获取
  try {
    // 假设可以访问 chat 数组
    const chat = (window as any).chat;
    if (chat && chat[messageId]) {
      return chat[messageId].mes;
    }
  } catch (e) {
    console.warn('获取消息内容失败:', e);
  }
  return null;
}
```

### 防抖同步

```typescript
const debouncedSync = _.debounce((messageId: number | 'latest') => {
  syncVariablesToStore(messageId);
  reinjectPromptsIfNeeded();
}, 100);
```
