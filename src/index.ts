/**
 * 巨大娘计算器 - 酒馆助手脚本入口
 * 基于 tavern_helper_template 模板
 *
 * 模块结构：
 * - core/          核心计算逻辑（constants, formatter, calculator, interactions）
 * - ui/            Vue 组件（Panel, Result, CharacterList）
 * - settings.ts    Pinia store，管理脚本配置
 * - characters.ts  Pinia store，管理角色数据
 * - mvu集成.ts     MVU 变量监听和提示词注入
 * - 设置界面.ts    挂载 Vue 面板到扩展设置区
 * - 初始化.ts      初始化流程
 * - version.ts     版本信息
 */

import './初始化';
import './设置界面';
