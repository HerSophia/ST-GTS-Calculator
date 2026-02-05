/**
 * 巨大娘计算器 - 楼层内前端UI扩展
 *
 * 在消息楼层中用 iframe 显示角色的身高体型数据
 * 通过修改正则的 replace_string 来切换隐藏/显示行为
 *
 * @module services/extensions/message-display-extension
 */

import type { Extension, PromptTemplate } from '../../types';
import { GTS_UPDATE_HIDE_REGEX_NAME, createGtsUpdateHideRegex } from '../regex/constants';
import { registerRegex } from '../regex';
// 使用 ?raw 导入 HTML 文件内容
import messageDisplayHtml from './message-display.html?raw';

// 调试：检查 HTML 是否正确导入
console.log('[MessageDisplayExtension] HTML 模块已加载, 长度:', messageDisplayHtml?.length ?? 'undefined');

/**
 * 扩展 ID
 */
export const MESSAGE_DISPLAY_EXTENSION_ID = 'message-display';

/**
 * 生成 iframe 替换内容
 * 酒馆助手要求 iframe HTML 内容需要用三个反引号包裹
 */
function generateIframeReplaceString(): string {
  return '```\n' + messageDisplayHtml + '\n```';
}

/**
 * 确保正则存在，如果不存在则创建
 */
async function ensureRegexExists(): Promise<boolean> {
  // 检查 API 是否可用
  if (typeof getTavernRegexes !== 'function') {
    console.error('[MessageDisplayExtension] getTavernRegexes 不可用');
    return false;
  }
  
  try {
    const regexes = getTavernRegexes({ scope: 'global' });
    const exists = regexes.some((r) => r.script_name === GTS_UPDATE_HIDE_REGEX_NAME);
    
    if (!exists) {
      console.log('[MessageDisplayExtension] 正则不存在，正在创建...');
      // 创建正则
      const config = createGtsUpdateHideRegex();
      const result = await registerRegex(config, { force: true });
      if (result.success) {
        console.log('[MessageDisplayExtension] ✅ 正则已创建');
        return true;
      } else {
        console.error('[MessageDisplayExtension] ❌ 创建正则失败:', result.error);
        return false;
      }
    }
    
    return true;
  } catch (e) {
    console.error('[MessageDisplayExtension] 检查正则失败:', e);
    return false;
  }
}

/**
 * 使用 updateTavernRegexesWith 修改正则的 replace_string
 * @param showIframe 是否显示 iframe（true = 显示，false = 隐藏）
 */
async function setRegexReplaceString(showIframe: boolean): Promise<void> {
  console.log('[MessageDisplayExtension] setRegexReplaceString 被调用, showIframe:', showIframe);
  
  // 检查 API 是否可用
  if (typeof updateTavernRegexesWith !== 'function') {
    console.error('[MessageDisplayExtension] updateTavernRegexesWith 不可用');
    return;
  }
  
  // 确保正则存在
  const regexExists = await ensureRegexExists();
  if (!regexExists) {
    console.error('[MessageDisplayExtension] 无法确保正则存在，操作取消');
    return;
  }
  
  const newReplaceString = showIframe ? generateIframeReplaceString() : '';
  console.log('[MessageDisplayExtension] 新的 replace_string 长度:', newReplaceString.length);
  
  try {
    let found = false;
    await updateTavernRegexesWith(
      (regexes) => {
        console.log('[MessageDisplayExtension] 当前正则数量:', regexes.length);
        return regexes.map((regex) => {
          if (regex.script_name === GTS_UPDATE_HIDE_REGEX_NAME) {
            found = true;
            console.log('[MessageDisplayExtension] 找到目标正则:', regex.script_name);
            return { ...regex, replace_string: newReplaceString };
          }
          return regex;
        });
      },
      { scope: 'global' },
    );
    
    if (found) {
      console.log(`[MessageDisplayExtension] ✅ 正则 replace_string 已更新为: ${showIframe ? 'iframe 内容 (' + newReplaceString.length + ' 字符)' : '空字符串'}`);
    } else {
      console.warn('[MessageDisplayExtension] ⚠️ 未找到目标正则（这不应该发生）:', GTS_UPDATE_HIDE_REGEX_NAME);
    }
  } catch (e) {
    console.error('[MessageDisplayExtension] 更新正则 replace_string 失败:', e);
  }
}

/**
 * 楼层内前端UI扩展定义
 */
export const messageDisplayExtension: Extension = {
  id: MESSAGE_DISPLAY_EXTENSION_ID,
  name: '楼层数据显示',
  description: '在消息楼层内直接显示角色身高体型数据',
  icon: 'fa-solid fa-eye',
  defaultEnabled: false,

  onInit() {
    console.log('[MessageDisplayExtension] 初始化');
  },

  async onEnable() {
    console.log('[MessageDisplayExtension] 启用楼层数据显示');

    try {
      // 修改正则的 replace_string 为 iframe 内容
      await setRegexReplaceString(true);
      console.log('[MessageDisplayExtension] 启用完成');
    } catch (e) {
      console.error('[MessageDisplayExtension] 启用失败:', e);
    }
  },

  async onDisable() {
    console.log('[MessageDisplayExtension] 禁用楼层数据显示');

    try {
      // 修改正则的 replace_string 为空（隐藏模式）
      await setRegexReplaceString(false);
      console.log('[MessageDisplayExtension] 禁用完成');
    } catch (e) {
      console.error('[MessageDisplayExtension] 禁用失败:', e);
    }
  },

  getPromptTemplates(): PromptTemplate[] {
    return [];
  },
};
