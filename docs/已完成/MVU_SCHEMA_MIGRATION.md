# MVU 变量结构迁移计划

> **状态**: ✅ 已完成 (v3.1.0)

## 背景

MVU 要求在世界书中预先定义变量结构，无法动态添加链式键值对。原设计将角色名直接作为顶层键（如 `巨大娘.络络`），与固定键（`_场景`、`_互动限制`）混在一起，导致无法使用 zod schema 验证。

## 新旧结构对比

### 旧结构（不支持 schema）

```yaml
巨大娘:
  络络:                  # 动态角色名 - 无法预定义
    当前身高: 170
  小明:                  # 另一个动态角色名
    当前身高: 0.01
  _场景:
    当前场景: 大城市
  _互动限制: {}
```

### 新结构（支持 schema）

```yaml
巨大娘:
  _场景:
    当前场景: 大城市
    场景原因: ''
  _互动限制: {}
  角色:                  # 新增：所有角色数据放在这里
    络络:                # 动态角色名 - z.record 支持
      当前身高: 170
      原身高: 1.65
    小明:
      当前身高: 0.01
      原身高: 1.70
```

## 变量路径变化

| 用途           | 旧路径                                    | 新路径                                          |
| -------------- | ----------------------------------------- | ----------------------------------------------- |
| 设置角色身高   | `巨大娘.络络.当前身高`                    | `巨大娘.角色.络络.当前身高`                     |
| 设置原身高     | `巨大娘.络络.原身高`                      | `巨大娘.角色.络络.原身高`                       |
| 设置变化原因   | `巨大娘.络络.变化原因`                    | `巨大娘.角色.络络.变化原因`                     |
| 自定义部位     | `巨大娘.络络.自定义部位.乳房高度`         | `巨大娘.角色.络络.自定义部位.乳房高度`          |
| 实际损害       | `巨大娘.络络._实际损害.总伤亡人数`        | `巨大娘.角色.络络._实际损害.总伤亡人数`         |
| 场景设置       | `巨大娘._场景.当前场景`                   | `巨大娘._场景.当前场景`（不变）                 |

## 修改清单

### 1. 新增文件

- [x] `src/schema.ts` - Zod schema 定义

### 2. 已修改的文件

#### 核心服务层

- [x] `src/services/mvu/handler.ts` - 变量路径更新、数据迁移逻辑、类型修复
- [x] `src/services/mvu/history.ts` - 历史记录路径更新，新增 `getCharacterPath()` 函数
- [x] `src/services/worldbook/init-data.ts` - 初始化数据结构更新

#### 类型定义

- [x] `src/types/mvu.ts` - MVU 数据类型更新，新增 `GiantessMvuData` 类型

#### 提示词服务

- [x] `src/services/prompt/injector.ts` - 新增 `PromptDataInput` 类型
- [x] `src/services/prompt/index.ts` - 导出 `PromptDataInput`

#### 初始化

- [x] `src/初始化.ts` - 注册 schema 到 MVU

#### 版本

- [x] `src/version.ts` - 更新到 v3.1.0

### 3. 待更新（后续工作）

#### 文档

- [x] `README.md` - 更新使用示例
- [x] `src/README.md` - 更新变量结构文档
- [x] `src/stores/prompts.ts` - 更新变量更新规则模板

#### 测试

- [x] `tests/services/mvu/handler.test.ts` - 测试数据结构兼容性、角色数据提取、数据迁移逻辑
- [x] `tests/services/mvu/history.test.ts` - 测试身高历史记录的新路径格式
- [x] `tests/setup.ts` - 更新 MVU mock 以支持嵌套路径访问

## 迁移策略

### 向后兼容

`getCharactersFromData()` 函数支持读取新旧两种格式：

```typescript
function getCharactersFromData(
  data: Record<string, unknown>
): Record<string, CharacterMvuData> {
  // 新结构：角色数据在 `角色` 键下
  const newStyleCharacters = data.角色 as Record<string, CharacterMvuData> | undefined;
  if (newStyleCharacters && typeof newStyleCharacters === 'object') {
    return newStyleCharacters;
  }
  
  // 旧结构兼容：过滤掉以 _ 开头的键和特殊键
  const oldStyleCharacters: Record<string, CharacterMvuData> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith('_') && key !== '角色' && typeof value === 'object' && value !== null) {
      oldStyleCharacters[key] = value as CharacterMvuData;
    }
  }
  
  return oldStyleCharacters;
}
```

### 自动迁移

在 `VARIABLE_UPDATE_ENDED` 事件中，`migrateOldDataFormat()` 函数自动将旧格式数据迁移到新格式：

```typescript
function migrateOldDataFormat(
  variables: Record<string, unknown>,
  prefix: string
): void {
  const data = _.get(variables, `stat_data.${prefix}`) as Record<string, unknown> | undefined;
  if (!data) return;
  
  // 检查是否有旧格式数据（角色直接在顶层）
  const oldCharacters: Record<string, CharacterMvuData> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith('_') && key !== '角色' && typeof value === 'object' && value !== null) {
      const charData = value as CharacterMvuData;
      // 验证是角色数据（有身高相关字段）
      if (charData.当前身高 !== undefined || charData.身高 !== undefined) {
        oldCharacters[key] = charData;
      }
    }
  }
  
  if (Object.keys(oldCharacters).length > 0) {
    // 合并到新格式
    const existingCharacters = (data.角色 as Record<string, CharacterMvuData>) || {};
    const mergedCharacters = { ...existingCharacters, ...oldCharacters };
    
    // 写入新格式
    _.set(variables, `stat_data.${prefix}.角色`, mergedCharacters);
    
    // 删除旧的顶层角色键
    for (const key of Object.keys(oldCharacters)) {
      _.unset(variables, `stat_data.${prefix}.${key}`);
    }
  }
}
```

## Schema 定义

`src/schema.ts` 中定义了完整的变量结构：

```typescript
// zod (z) 是全局变量，无需导入

const CharacterSchema = z.object({
  当前身高: z.coerce.number(),
  原身高: z.coerce.number().prefault(1.65),
  变化原因: z.string().prefault(''),
  变化时间: z.string().prefault(''),
  自定义部位: z.record(z.string(), z.coerce.number()).prefault({}),
  _计算数据: z.any().nullable().prefault(null),
  _损害数据: z.any().nullable().prefault(null),
  _实际损害: ActualDamageSchema.optional(),
  _身高历史: z.array(HeightHistorySchema).prefault([]),
});

const SceneSchema = z.object({
  当前场景: z.string().prefault('大城市'),
  场景原因: z.string().prefault(''),
});

export const Schema = z.object({
  _场景: SceneSchema.prefault({ 当前场景: '大城市', 场景原因: '' }),
  _互动限制: z.record(z.string(), z.any()).prefault({}),
  角色: z.record(
    z.string().describe('角色名'),
    CharacterSchema
  ).prefault({}),
});
```

### Schema 注册

在 `src/初始化.ts` 中注册 schema：

```typescript
import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { Schema } from './schema';

function registerSchema() {
  registerMvuSchema(() => {
    const prefix = '巨大娘';
    return z.object({
      [prefix]: Schema,
    });
  });
}
```

## 新增工具函数

### `getCharacterPath()`

统一获取角色数据路径：

```typescript
export function getCharacterPath(prefix: string, name: string): string {
  return `stat_data.${prefix}.角色.${name}`;
}
```

### `PromptDataInput` 类型

提示词注入的输入类型：

```typescript
export interface PromptDataInput {
  characters: Record<string, CharacterMvuData>;
  interactions?: Record<string, PairwiseInteraction>;
}
```

## 用户指南更新

### 新的 MVU 命令格式

```javascript
// 设置角色数据（注意：角色名前需要加 "角色."）
_.set('巨大娘.角色.络络.当前身高', 170);
_.set('巨大娘.角色.络络.原身高', 1.65);
_.set('巨大娘.角色.络络.变化原因', '喝下药水');

// 自定义部位
_.set('巨大娘.角色.络络.自定义部位.乳房高度', 28);

// 实际损害记录
_.set('巨大娘.角色.络络._实际损害.总伤亡人数', 15000);

// 场景设置（不变）
_.set('巨大娘._场景.当前场景', '大城市');
```

## 完成时间线

1. ✅ **Phase 1**: 实现新 schema 和数据迁移逻辑
2. ✅ **Phase 2**: 更新所有服务层代码
3. ✅ **Phase 3**: 更新文档
4. ✅ **Phase 4**: 更新测试
   - `tests/services/mvu/handler.test.ts` - 23 个测试用例
   - `tests/services/mvu/history.test.ts` - 23 个测试用例
   - `tests/setup.ts` - 改进 MVU mock 支持嵌套路径
5. ✅ **Phase 5**: 发布新版本 v3.1.0
