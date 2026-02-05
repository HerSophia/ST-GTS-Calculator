/**
 * 巨大娘计算器 - 扩展系统
 * 
 * @module services/extensions
 */

export { extensionManager } from './manager';
export { damageExtension, DAMAGE_EXTENSION_ID, generateDamagePromptForCharacter } from './damage-extension';
export { itemsExtension, ITEMS_EXTENSION_ID, generateItemsPromptForCharacter, getPresetItems } from './item-extension';
export { messageDisplayExtension, MESSAGE_DISPLAY_EXTENSION_ID } from './message-display-extension';

import { extensionManager } from './manager';
import { damageExtension } from './damage-extension';
import { itemsExtension } from './item-extension';
import { messageDisplayExtension } from './message-display-extension';
import { useSettingsStore } from '../../stores/settings';

/**
 * 注册所有内置扩展
 */
export function registerBuiltinExtensions(): void {
  console.log('[Extensions] 开始注册内置扩展...');
  
  // 注册损害计算扩展
  extensionManager.register(damageExtension);
  console.log('[Extensions] - 损害计算扩展已注册');
  
  // 注册物品系统扩展
  extensionManager.register(itemsExtension);
  console.log('[Extensions] - 物品系统扩展已注册');
  
  // 注册楼层数据显示扩展
  extensionManager.register(messageDisplayExtension);
  console.log('[Extensions] - 楼层数据显示扩展已注册');
  
  // 未来可以在这里注册更多内置扩展
  // extensionManager.register(voreExtension);
  // extensionManager.register(growthExtension);
  
  console.log('[Extensions] 已注册所有内置扩展，共', extensionManager.getAll().length, '个');
}

/**
 * 初始化扩展系统
 * 应该在 Pinia store 初始化之后调用
 */
export function initExtensions(): void {
  // 注册内置扩展
  registerBuiltinExtensions();
  
  // 从设置中恢复启用状态
  try {
    const settingsStore = useSettingsStore();
    
    // 如果用户之前启用了损害计算，自动启用扩展
    if (settingsStore.settings.enableDamageCalculation) {
      extensionManager.enable('damage-calculation');
    }
    
    // 如果用户之前启用了物品系统，自动启用扩展
    if (settingsStore.settings.enableItemsSystem) {
      extensionManager.enable('items-system');
    }
    
    // 如果用户之前启用了楼层数据显示，自动启用扩展
    if (settingsStore.settings.enableMessageDisplay) {
      extensionManager.enable('message-display');
    }
    
    // 初始化默认启用的扩展
    extensionManager.initDefaults();
    
    console.log('[Extensions] 扩展系统初始化完成');
  } catch (e) {
    console.error('[Extensions] 初始化失败:', e);
  }
}

/**
 * 同步设置和扩展状态
 * 当设置变化时调用，确保扩展状态与设置一致
 */
export function syncExtensionsWithSettings(): void {
  const settingsStore = useSettingsStore();
  
  // 同步损害计算扩展状态
  if (settingsStore.settings.enableDamageCalculation) {
    extensionManager.enable('damage-calculation');
  } else {
    extensionManager.disable('damage-calculation');
  }
  
  // 同步物品系统扩展状态
  if (settingsStore.settings.enableItemsSystem) {
    extensionManager.enable('items-system');
  } else {
    extensionManager.disable('items-system');
  }
  
  // 同步楼层数据显示扩展状态
  if (settingsStore.settings.enableMessageDisplay) {
    extensionManager.enable('message-display');
  } else {
    extensionManager.disable('message-display');
  }
}
