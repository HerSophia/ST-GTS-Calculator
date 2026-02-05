/**
 * 正则服务常量定义
 */

import type { TavernRegexConfig } from '@/types';

/** 正则 ID 前缀，用于识别本脚本注册的正则 */
export const REGEX_ID_PREFIX = 'giantess-calc-';

/** 隐藏 gts_update 标签的正则 ID */
export const GTS_UPDATE_HIDE_REGEX_ID = `${REGEX_ID_PREFIX}hide-gts-update`;

/** 隐藏 gts_update 标签的正则名称 */
export const GTS_UPDATE_HIDE_REGEX_NAME = '巨大娘计算器 - 隐藏更新命令';

/**
 * 创建隐藏 <gts_update> 标签的正则配置
 *
 * 正则说明：
 * - `<gts_update>` - 匹配开始标签
 * - `[\s\S]*?` - 匹配任意字符（包括换行），非贪婪模式
 * - `</gts_update>` - 匹配结束标签
 *
 * destination 配置：
 * - display: true - 在显示时过滤（用户看不到标签）
 * - prompt: false - 不影响 prompt（event-handler 需要解析标签内容）
 */
export function createGtsUpdateHideRegex(): TavernRegexConfig {
  return {
    id: GTS_UPDATE_HIDE_REGEX_ID,
    script_name: GTS_UPDATE_HIDE_REGEX_NAME,
    enabled: true,
    scope: 'global',
    // 匹配 <gts_update>...</gts_update> 及其内容（支持多行）
    // 注意：在 JSON/JS 字符串中需要双重转义
    find_regex: '<gts_update>[\\s\\S]*?</gts_update>',
    replace_string: '',
    source: {
      user_input: false,
      ai_output: true, // 主要作用于 AI 输出
      slash_command: false,
      world_info: false,
    },
    destination: {
      display: true, // 仅在显示时隐藏
      prompt: false, // 不影响 prompt（需要解析更新命令）
    },
    run_on_edit: true,
    min_depth: null, // 所有深度都生效
    max_depth: null,
  };
}

/**
 * 获取所有内置正则配置
 */
export function getBuiltinRegexConfigs(): TavernRegexConfig[] {
  return [createGtsUpdateHideRegex()];
}
