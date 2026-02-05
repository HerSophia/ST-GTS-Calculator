/**
 * 巨大娘计算器 - AI 输出解析服务
 * 
 * 职责：
 * - 从 AI 输出中解析变量更新命令
 * - 解析 <gts_update> XML 标签中的 _.set() 命令
 * - 应用解析的更新到变量
 * 
 * @module services/variables/parser
 */

import type { ParsedUpdate, WriteOptions, ValueComparisonResult } from '../../types/variables';
import { useSettingsStore } from '../../stores/settings';
import { _internal_readRawVariables } from './reader';

/**
 * 解析值字符串为实际值
 * 支持：数字、字符串、布尔值、null、对象、数组
 * 
 * @param valueStr 值字符串
 * @returns 解析后的值
 */
export function parseValue(valueStr: string): unknown {
  const trimmed = valueStr.trim();
  
  // 数字
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }
  
  // 字符串（单引号或双引号）
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  
  // 布尔值
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  
  // null / undefined
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;
  
  // 尝试解析 JSON（对象或数组）
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // 解析失败，返回原字符串
      return trimmed;
    }
  }
  
  // 默认返回原字符串
  return trimmed;
}

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
 * 
 * @param text AI 输出文本
 * @returns 解析的更新命令数组
 */
export function parseGtsUpdateCommands(text: string): ParsedUpdate[] {
  const updates: ParsedUpdate[] = [];
  
  // 匹配 <gts_update>...</gts_update> 标签
  const tagRegex = /<gts_update>([\s\S]*?)<\/gts_update>/gi;
  let tagMatch;
  
  while ((tagMatch = tagRegex.exec(text)) !== null) {
    const commands = tagMatch[1];
    
    // 匹配 _.set('path', value) 或 _.set("path", value)
    // 支持多行值（如对象）
    const setRegex = /_.set\(['"]([^'"]+)['"],\s*([^)]+(?:\{[^}]*\})?[^)]*)\)/g;
    let setMatch;
    
    while ((setMatch = setRegex.exec(commands)) !== null) {
      const path = setMatch[1];
      const valueStr = setMatch[2].trim();
      
      // 移除末尾的分号（如果有）
      const cleanValueStr = valueStr.replace(/;\s*$/, '');
      
      try {
        const value = parseValue(cleanValueStr);
        updates.push({ path, value });
      } catch (error) {
        console.warn(`[GiantessCalc] 解析值失败: ${cleanValueStr}`, error);
      }
    }
  }
  
  return updates;
}

/**
 * 从 AI 输出中解析独立的 _.set() 命令（不在 gts_update 标签内）
 * 用于兼容旧格式或用户直接使用的命令
 * 
 * @param text AI 输出文本
 * @returns 解析的更新命令数组
 */
export function parseStandaloneSetCommands(text: string): ParsedUpdate[] {
  const updates: ParsedUpdate[] = [];
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;
  
  // 移除 gts_update 标签内的内容，避免重复解析
  const textWithoutTags = text.replace(/<gts_update>[\s\S]*?<\/gts_update>/gi, '');
  
  // 匹配包含前缀的 _.set() 命令
  // 如：_.set('巨大娘.角色.络络.当前身高', 500)
  const setRegex = new RegExp(
    `_.set\\(['"]${prefix}\\.([^'"]+)['"],\\s*([^)]+)\\)`,
    'g'
  );
  
  let match;
  while ((match = setRegex.exec(textWithoutTags)) !== null) {
    const subPath = match[1];
    const valueStr = match[2].trim().replace(/;\s*$/, '');
    
    try {
      const value = parseValue(valueStr);
      // 完整路径包含前缀
      updates.push({ path: `${prefix}.${subPath}`, value });
    } catch (error) {
      console.warn(`[GiantessCalc] 解析独立命令失败: ${match[0]}`, error);
    }
  }
  
  return updates;
}

/**
 * 解析所有变量更新命令（包括标签内和独立的）
 * 
 * @param text AI 输出文本
 * @returns 解析的更新命令数组（去重）
 */
export function parseAllUpdateCommands(text: string): ParsedUpdate[] {
  const tagUpdates = parseGtsUpdateCommands(text);
  const standaloneUpdates = parseStandaloneSetCommands(text);
  
  // 合并并去重（后面的覆盖前面的）
  const updateMap = new Map<string, unknown>();
  
  for (const update of [...tagUpdates, ...standaloneUpdates]) {
    updateMap.set(update.path, update.value);
  }
  
  return Array.from(updateMap.entries()).map(([path, value]) => ({ path, value }));
}

/**
 * 应用解析的更新到变量
 * 
 * @param updates 解析的更新命令数组
 * @param options 写入选项
 * @returns 应用的更新数量
 */
export function applyParsedUpdates(
  updates: ParsedUpdate[],
  options: WriteOptions = {}
): number {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  
  if (updates.length === 0) {
    settingsStore.debugLog('⚠️ applyParsedUpdates: 没有更新要应用');
    return 0;
  }
  
  settingsStore.debugLog(`📝 准备应用 ${updates.length} 个变量更新`);
  
  const updaterFn = (variables: Record<string, unknown>) => {
    for (const { path, value } of updates) {
      // 路径转换：'巨大娘.角色.络络.当前身高' -> 'stat_data.巨大娘.角色.络络.当前身高'
      const fullPath = path.startsWith('stat_data.') ? path : `stat_data.${path}`;
      _.set(variables, fullPath, value);
    }
    return variables;
  };
  
  // 尝试使用指定的 messageId
  try {
    updateVariablesWith(
      updaterFn,
      { type: 'message', message_id: messageId }
    );
    settingsStore.debugLog(`✅ 成功应用 ${updates.length} 个变量更新 (messageId: ${messageId})`);
    return updates.length;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 如果是楼层号超出范围的错误，回退到 'latest'
    if (errorMessage.includes('超出了范围') && messageId !== 'latest') {
      settingsStore.debugLog(`⚠️ messageId ${messageId} 超出范围，回退到 'latest'`);
      
      try {
        updateVariablesWith(
          updaterFn,
          { type: 'message', message_id: 'latest' }
        );
        settingsStore.debugLog(`✅ 成功应用 ${updates.length} 个变量更新 (回退到 latest)`);
        return updates.length;
      } catch (fallbackError) {
        settingsStore.debugError('❌ 回退到 latest 也失败:', fallbackError);
        return 0;
      }
    }
    
    settingsStore.debugError(`❌ 应用变量更新失败: ${errorMessage}`);
    return 0;
  }
}

/**
 * 从文本中提取并应用变量更新
 * 一站式函数，结合解析和应用
 * 
 * @param text AI 输出文本
 * @param options 写入选项
 * @returns 应用的更新数量
 */
export function extractAndApplyUpdates(
  text: string,
  options: WriteOptions = {}
): number {
  const settingsStore = useSettingsStore();
  
  settingsStore.debugLog(`📥 extractAndApplyUpdates 开始, options:`, options);
  
  const updates = parseAllUpdateCommands(text);
  
  if (updates.length === 0) {
    settingsStore.debugLog('📥 没有解析到更新命令');
    return 0;
  }
  
  settingsStore.debugLog(`🔍 从文本中解析到 ${updates.length} 个更新命令:`, 
    updates.map(u => `${u.path} = ${JSON.stringify(u.value)}`)
  );
  
  settingsStore.debugLog(`📥 准备调用 applyParsedUpdates...`);
  const result = applyParsedUpdates(updates, options);
  settingsStore.debugLog(`📥 applyParsedUpdates 返回: ${result}`);
  
  return result;
}

/**
 * 检查文本是否包含变量更新命令
 * 
 * @param text 要检查的文本
 * @returns 是否包含更新命令
 */
export function hasUpdateCommands(text: string): boolean {
  // 检查 gts_update 标签
  if (/<gts_update>[\s\S]*?<\/gts_update>/i.test(text)) {
    return true;
  }
  
  // 检查包含前缀的独立 _.set() 命令
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;
  const setRegex = new RegExp(`_.set\\(['"]${prefix}\\.`, 'i');
  
  return setRegex.test(text);
}

/**
 * 获取更新命令涉及的角色名称
 * 
 * @param updates 解析的更新命令数组
 * @returns 角色名称数组
 */
export function getAffectedCharacters(updates: ParsedUpdate[]): string[] {
  const settingsStore = useSettingsStore();
  const prefix = settingsStore.settings.variablePrefix;
  const characters = new Set<string>();
  
  for (const { path } of updates) {
    // 匹配路径模式：{prefix}.角色.{角色名}.xxx
    const match = path.match(new RegExp(`^${prefix}\\.角色\\.([^.]+)`));
    if (match) {
      characters.add(match[1]);
    }
  }
  
  return Array.from(characters);
}

/**
 * 深度比较两个值是否相等
 * 
 * @param a 值 a
 * @param b 值 b
 * @returns 是否相等
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  // 基本类型比较
  if (a === b) return true;
  
  // null/undefined 检查
  if (a == null || b == null) return a === b;
  
  // 类型不同
  if (typeof a !== typeof b) return false;
  
  // 数组和对象要区分 - 一个是数组另一个不是则不相等
  const aIsArray = Array.isArray(a);
  const bIsArray = Array.isArray(b);
  if (aIsArray !== bIsArray) return false;
  
  // 数组比较
  if (aIsArray && bIsArray) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  // 对象比较
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => 
      Object.prototype.hasOwnProperty.call(b, key) && 
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    );
  }
  
  return false;
}

/**
 * 比较解析的更新与现有变量值
 * 用于识别哪些更新实际需要应用
 * 
 * @param updates 解析的更新命令数组
 * @param options 读取选项
 * @returns 比较结果
 */
export function compareUpdatesWithExisting(
  updates: ParsedUpdate[],
  options: { messageId?: number | 'latest' } = {}
): ValueComparisonResult {
  const { messageId = 'latest' } = options;
  const settingsStore = useSettingsStore();
  
  const result: ValueComparisonResult = {
    hasChanges: false,
    newUpdates: [],
    changedUpdates: [],
    unchangedUpdates: [],
  };
  
  if (updates.length === 0) {
    return result;
  }
  
  // 读取现有变量
  const variables = _internal_readRawVariables({ messageId });
  
  for (const update of updates) {
    // 构建完整路径
    const fullPath = update.path.startsWith('stat_data.') 
      ? update.path 
      : `stat_data.${update.path}`;
    
    const existingValue = _.get(variables, fullPath);
    
    if (existingValue === undefined) {
      // 新增的值
      result.newUpdates.push(update);
      result.hasChanges = true;
    } else if (!deepEqual(existingValue, update.value)) {
      // 值有变化
      result.changedUpdates.push(update);
      result.hasChanges = true;
      
      settingsStore.debugLog(`📊 值变化检测: ${update.path}`, {
        existing: existingValue,
        new: update.value,
      });
    } else {
      // 值未变化
      result.unchangedUpdates.push(update);
    }
  }
  
  settingsStore.debugLog(`📊 值比较结果:`, {
    total: updates.length,
    new: result.newUpdates.length,
    changed: result.changedUpdates.length,
    unchanged: result.unchangedUpdates.length,
  });
  
  return result;
}

/**
 * 过滤出需要应用的更新（排除未变化的）
 * 
 * @param updates 解析的更新命令数组
 * @param options 读取选项
 * @returns 需要应用的更新
 */
export function filterChangedUpdates(
  updates: ParsedUpdate[],
  options: { messageId?: number | 'latest' } = {}
): ParsedUpdate[] {
  const comparison = compareUpdatesWithExisting(updates, options);
  return [...comparison.newUpdates, ...comparison.changedUpdates];
}

/**
 * 计算内容的简单哈希值
 * 用于快速检测内容是否变化
 * 
 * @param content 内容字符串
 * @returns 哈希值
 */
export function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}
