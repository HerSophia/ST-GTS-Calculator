/**
 * 巨大娘计算器 - 初始化模块
 * 注入必要的外部资源并暴露全局 API
 */

import { VERSION } from './version';
import { exposeGlobalFunctions } from './services/global-api';

$(() => {
  init();
});

function injectFontAwesome() {
  if (!document.getElementById('font-awesome-css')) {
    const link = document.createElement('link');
    link.id = 'font-awesome-css';
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);
  }
}

function init() {
  injectFontAwesome();
  
  // 暴露全局 API，使其可在控制台和其他脚本中使用
  exposeGlobalFunctions();
  
  console.log(`[GiantessCalc] ✅ 脚本初始化完成 v${VERSION}`);
}
