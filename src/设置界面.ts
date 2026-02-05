/**
 * 巨大娘计算器 - 设置界面挂载
 * 将 Vue 面板挂载到酒馆扩展设置区域
 */

import { createScriptIdDiv, teleportStyle } from '@util/script';
import Panel from './ui/Panel.vue';
import { initMvuIntegration, cleanupMvuIntegration, exposeGlobalFunctions } from './mvu集成';
import { initExtensions } from './services/extensions';
import { initUpdater } from './services/updater';
import { injectBasePrompts } from './services/prompt';
import { cleanupEventListeners } from './services/variables';
import { initRegexService, cleanupRegexService } from './services/regex';

$(() => {
  // 先创建 Pinia 实例
  const pinia = createPinia();
  const app = createApp(Panel).use(pinia);

  const $app = createScriptIdDiv().appendTo('#extensions_settings2');
  app.mount($app[0]);

  // 初始化各模块
  initModules();

  const { destroy } = teleportStyle();

  $(window).on('pagehide', () => {
    // 清理事件监听器
    cleanupEventListeners();
    cleanupMvuIntegration();
    // 清理正则服务（移除注册的正则）
    void cleanupRegexService();
    
    app.unmount();
    $app.remove();
    destroy();
  });
});

/**
 * 初始化各模块
 */
function initModules(): void {
  console.log('[GiantessCalc] 🚀 开始初始化各模块...');
  
  // 1. 初始化扩展系统（需要在变量事件系统之前，因为事件处理会使用扩展）
  initExtensions();
  
  // 1.5 初始化正则服务（注册隐藏 <gts_update> 标签的正则）
  initRegexService().catch((e) => {
    console.warn('[GiantessCalc] ⚠️ 正则服务初始化失败:', e);
  });
  // 2. 初始化变量事件系统
  initMvuIntegration();
  // 3. 暴露全局函数
  exposeGlobalFunctions();
  // 4. 初始化更新检查（延迟执行，不阻塞启动）
  initUpdater();
  
  // 5. 自动注入基础提示词
  // 使用 setTimeout 确保酒馆助手 API 完全就绪
  setTimeout(() => {
    try {
      const injected = injectBasePrompts();
      if (injected) {
        console.log('[GiantessCalc] ✅ 基础提示词已自动注入');
      } else {
        console.log('[GiantessCalc] ℹ️ 基础提示词注入跳过（无启用的模板或无内容）');
      }
    } catch (e) {
      console.warn('[GiantessCalc] ⚠️ 基础提示词注入失败:', e);
    }
  }, 100);
  
  console.log('[GiantessCalc] ✅ 所有模块初始化完成');
}
