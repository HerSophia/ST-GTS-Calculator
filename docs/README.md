# 巨大娘计算器 - 文档中心

> 本目录包含巨大娘计算器项目的所有技术文档和开发指南。

---

## 📚 文档索引

### 核心文档

| 文档 | 说明 | 适合读者 |
|------|------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 项目架构设计，分层结构，数据流 | 核心开发者 |
| [API.md](./API.md) | API 参考文档，全局 API、Core API、Service API | 所有开发者 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 协作开发规范，分支策略，提交规范 | 贡献者 |
| [TESTING.md](./TESTING.md) | 测试规范，测试编写指南 | 开发者 |
| [DATA_PROCESSING.md](./DATA_PROCESSING.md) | 数据处理机制，变量流转 | 核心开发者 |

---

### 模块文档

#### 📐 计算核心 (calculat-core)

身体数据计算、格式化、互动限制等核心计算逻辑。

| 文档 | 说明 |
|------|------|
| [README.md](./calculat-core/README.md) | 模块概述 |
| [calculator.md](./calculat-core/calculator.md) | 计算函数详解 |
| [constants.md](./calculat-core/constants.md) | 常量定义 |
| [formatter.md](./calculat-core/formatter.md) | 格式化函数 |
| [interactions.md](./calculat-core/interactions.md) | 互动限制规则 |

#### 💥 损害计算 (damage-core)

巨大娘行动造成的破坏计算。

| 文档 | 说明 |
|------|------|
| [README.md](./damage-core/README.md) | 模块概述 |
| [calculator.md](./damage-core/calculator.md) | 损害计算函数 |
| [constants.md](./damage-core/constants.md) | 人口密度、建筑密度常量 |

#### 📦 物品系统 (items-core)

物品管理和尺寸计算。

| 文档 | 说明 |
|------|------|
| [README.md](./items-core/README.md) | 模块概述 |
| [calculator.md](./items-core/calculator.md) | 物品计算函数 |
| [constants.md](./items-core/constants.md) | 物品类型、材质常量 |

#### 🔌 扩展系统 (extension-system)

可插拔的扩展系统，支持第三方开发。

| 文档 | 说明 |
|------|------|
| [README.md](./extension-system/README.md) | 扩展开发完整指南 |

#### 🔍 正则服务 (regex-service)

消息解析和变量提取。

| 文档 | 说明 |
|------|------|
| [README.md](./regex-service/README.md) | 服务概述 |

---

### 历史文档

`已完成/` 目录包含已完成的重构和迁移文档，作为历史参考。

| 文档 | 说明 |
|------|------|
| [ARCHITECTURE_REFACTOR.md](./已完成/ARCHITECTURE_REFACTOR.md) | v3.0 架构重构记录 |
| [MVU_SCHEMA_MIGRATION.md](./已完成/MVU_SCHEMA_MIGRATION.md) | MVU 变量结构迁移 |
| [VARIABLE_SYSTEM_REFACTOR.md](./已完成/VARIABLE_SYSTEM_REFACTOR.md) | 变量系统重构 |

---

## 🗺️ 文档导航

### 按角色分类

#### 👤 用户

如果你是普通用户，想了解如何使用巨大娘计算器：

1. 阅读 [主 README](../README.md) 了解功能和安装
2. 阅读 [src/README.md](../src/README.md) 了解详细使用方法

#### 👨‍💻 开发者

如果你想参与开发或创建扩展：

1. 阅读 [ARCHITECTURE.md](./ARCHITECTURE.md) 了解项目架构
2. 阅读 [API.md](./API.md) 了解可用 API
3. 阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解协作规范
4. 阅读 [TESTING.md](./TESTING.md) 了解测试规范

#### 🔌 扩展开发者

如果你想创建第三方扩展：

1. 阅读 [extension-system/README.md](./extension-system/README.md) 扩展开发指南
2. 参考内置扩展源码：
   - [损害计算扩展](../src/services/extensions/damage-extension.ts)
   - [物品系统扩展](../src/services/extensions/items-extension.ts)

---

## 📊 项目架构速览

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI Layer (Vue)                           │
│  Panel.vue → panels/* → features/* → components/*               │
├─────────────────────────────────────────────────────────────────┤
│                      Composables Layer                          │
│  useCalculator, useCharacters, useSettings, useDebug, ...       │
├─────────────────────────────────────────────────────────────────┤
│                       Services Layer                            │
│  calculator/, prompt/, mvu/, extensions/, debug/, variables/    │
├─────────────────────────────────────────────────────────────────┤
│                       Stores Layer (Pinia)                      │
│  settings, characters, prompts, worldviews                      │
├─────────────────────────────────────────────────────────────────┤
│                        Core Layer (Pure)                        │
│  calculator, formatter, damage, interactions, constants         │
└─────────────────────────────────────────────────────────────────┘
```

详见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

---

## 📝 文档规范

### 文档格式

- 使用 **Markdown** 格式
- 文件名使用 **UPPER_SNAKE_CASE**（如 `DATA_PROCESSING.md`）或 **kebab-case**（如 `damage-core/`）
- 中文文档，技术术语保持英文

### 文档结构

```markdown
# 标题

> 简短描述

---

## 📋 概述

## 📐 主要内容

## 📚 相关文档

## 📅 更新日志
```

### 更新文档

修改文档时请：

1. 更新文档底部的更新日志
2. 如果是重大变更，更新本索引文件
3. 确保所有链接有效

---

## 🔗 外部链接

- [GitHub 仓库](https://github.com/HerSophia/ST-GTS-Calculator)
- [发布页面](https://github.com/HerSophia/ST-GTS-Calculator/releases)
- [酒馆助手文档](https://n0vi028.github.io/JS-Slash-Runner-Doc/)

---

## 📅 文档更新日志

| 日期 | 变更 |
|------|------|
| 2025-01 | 创建文档索引 |
