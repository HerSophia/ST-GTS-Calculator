/**
 * 巨大娘计算器 - 初始化模块
 * 等待依赖就绪并初始化各模块
 */

// 直接导入 MVU，让脚本自己初始化 MVU
import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate@beta/artifact/bundle.js';

import { VERSION } from './version';

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
  console.log('[GiantessCalc] 脚本初始化开始...');

  // MVU 已通过 import 自动初始化，无需等待
  console.log('[GiantessCalc] MVU 已通过内置导入初始化');

  // 注意：MVU 集成和全局函数暴露已移至 设置界面.ts
  // 因为它们需要在 Pinia 创建之后才能调用

  console.log(`[GiantessCalc] ✅ 脚本预初始化完成 v${VERSION}`);
}
