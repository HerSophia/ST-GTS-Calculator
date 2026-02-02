/**
 * 巨大娘计算器 - 扩展系统
 * 
 * @module services/extensions
 */

export { extensionManager } from './manager';
export { damageExtension, DAMAGE_EXTENSION_ID, generateDamagePromptForCharacter } from './damage-extension';

import { extensionManager } from './manager';
import { damageExtension } from './damage-extension';
import { useSettingsStore } from '../../stores/settings';

/**
 * 注册所有内置扩展
 */
export function registerBuiltinExtensions(): void {
  // 注册损害计算扩展
  extensionManager.register(damageExtension);
  
  // 未来可以在这里注册更多内置扩展
  // extensionManager.register(voreExtension);
  // extensionManager.register(growthExtension);
  
  console.log('[Extensions] 已注册所有内置扩展');
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
}
