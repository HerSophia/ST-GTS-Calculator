/**
 * 巨大娘计算器 - 身高历史记录服务
 * 
 * 职责：
 * - 管理身高历史记录
 * - 添加历史记录到 MVU 变量
 * 
 * @module services/mvu/history
 */

import type { MvuHeightRecord, CharacterMvuData } from '../../types';
import { formatLength } from '../../core';
import { useSettingsStore } from '../../stores/settings';

/**
 * 添加身高历史记录到 MVU 变量
 * 
 * @param variables MVU 变量对象（会被修改）
 * @param prefix 变量前缀
 * @param name 角色名
 * @param newHeight 新身高
 * @param reason 变化原因
 * @param timestamp 时间点
 */
export function addHeightHistory(
  variables: Record<string, unknown>,
  prefix: string,
  name: string,
  newHeight: number,
  reason = '',
  timestamp = ''
): void {
  const historyPath = `stat_data.${prefix}.${name}._身高历史`;
  let history = (_.get(variables, historyPath) as CharacterMvuData['_身高历史']) || [];

  const lastRecord = history[history.length - 1];
  const lastHeight = lastRecord ? lastRecord.身高 : null;

  // 如果身高没变，不记录
  if (lastHeight === newHeight) {
    return;
  }

  const record: MvuHeightRecord = {
    身高: newHeight,
    身高_格式化: formatLength(newHeight, newHeight > 1e10),
    时间戳: Date.now(),
    时间点: timestamp || new Date().toLocaleString(),
    原因: reason,
    变化: lastHeight ? (newHeight > lastHeight ? '增大' as const : '缩小' as const) : undefined,
    变化倍率: lastHeight ? Math.round((newHeight / lastHeight) * 100) / 100 : undefined,
  };

  history.push(record);

  // 限制历史记录数量
  const settingsStore = useSettingsStore();
  const maxRecords = settingsStore.settings.maxHistoryRecords;
  if (history.length > maxRecords) {
    history = history.slice(-maxRecords);
  }

  _.set(variables, historyPath, history);
}

/**
 * 获取角色的身高历史记录
 * 
 * @param variables MVU 变量对象
 * @param prefix 变量前缀
 * @param name 角色名
 * @returns 历史记录数组
 */
export function getHeightHistory(
  variables: Record<string, unknown>,
  prefix: string,
  name: string
): MvuHeightRecord[] {
  const historyPath = `stat_data.${prefix}.${name}._身高历史`;
  return (_.get(variables, historyPath) as MvuHeightRecord[]) || [];
}

/**
 * 清空角色的身高历史记录
 * 
 * @param variables MVU 变量对象（会被修改）
 * @param prefix 变量前缀
 * @param name 角色名
 */
export function clearHeightHistory(
  variables: Record<string, unknown>,
  prefix: string,
  name: string
): void {
  const historyPath = `stat_data.${prefix}.${name}._身高历史`;
  _.set(variables, historyPath, []);
}
