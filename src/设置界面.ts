/**
 * 巨大娘计算器 - 设置界面挂载
 * 将 Vue 面板挂载到酒馆扩展设置区域
 */

import { createScriptIdDiv, teleportStyle } from '@util/script';
import Panel from './ui/Panel.vue';
import { initMvuIntegration, exposeGlobalFunctions } from './mvu集成';
import { initExtensions } from './services/extensions';
import { initUpdater } from './services/updater';

$(() => {
  // 先创建 Pinia 实例
  const pinia = createPinia();
  const app = createApp(Panel).use(pinia);

  const $app = createScriptIdDiv().appendTo('#extensions_settings2');
  app.mount($app[0]);

  // Pinia 已创建，现在可以安全地初始化各模块
  // 1. 初始化扩展系统（需要在 MVU 集成之前，因为 MVU handler 会使用扩展）
  initExtensions();
  // 2. 初始化 MVU 集成
  initMvuIntegration();
  // 3. 暴露全局函数
  exposeGlobalFunctions();
  // 4. 初始化更新检查（延迟执行，不阻塞启动）
  initUpdater();

  const { destroy } = teleportStyle();

  $(window).on('pagehide', () => {
    app.unmount();
    $app.remove();
    destroy();
  });
});
