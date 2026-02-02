#!/usr/bin/env node
/**
 * 将构建后的 index.js 内容注入到酒馆助手脚本 JSON 文件中
 * 
 * 用法: node script/inject-to-json.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// 配置
const CONFIG = {
  // 构建输出的 JS 文件路径
  builtJsPath: path.join(rootDir, 'dist', 'index.js'),
  // 目标 JSON 文件路径
  targetJsonPath: path.join(rootDir, 'json', '酒馆助手脚本-巨大娘计算器.json'),
};

function main() {
  console.log('[inject-to-json] 开始注入脚本内容...');

  // 检查构建输出是否存在
  if (!fs.existsSync(CONFIG.builtJsPath)) {
    console.error(`[inject-to-json] 错误: 找不到构建输出文件 ${CONFIG.builtJsPath}`);
    console.error('[inject-to-json] 请先运行 pnpm build 构建项目');
    process.exit(1);
  }

  // 检查目标 JSON 是否存在
  if (!fs.existsSync(CONFIG.targetJsonPath)) {
    console.error(`[inject-to-json] 错误: 找不到目标 JSON 文件 ${CONFIG.targetJsonPath}`);
    process.exit(1);
  }

  // 读取构建后的 JS 内容
  const jsContent = fs.readFileSync(CONFIG.builtJsPath, 'utf-8');
  console.log(`[inject-to-json] 已读取 JS 文件 (${jsContent.length} 字符)`);

  // 读取并解析目标 JSON
  const jsonContent = fs.readFileSync(CONFIG.targetJsonPath, 'utf-8');
  const jsonData = JSON.parse(jsonContent);
  console.log(`[inject-to-json] 已读取 JSON 文件: ${jsonData.name || '未命名'}`);

  // 注入 content 字段
  jsonData.content = jsContent;

  // 写回 JSON 文件（保持格式化）
  const updatedJson = JSON.stringify(jsonData, null, 2);
  fs.writeFileSync(CONFIG.targetJsonPath, updatedJson, 'utf-8');

  console.log(`[inject-to-json] ✅ 成功注入脚本内容到 ${path.relative(rootDir, CONFIG.targetJsonPath)}`);
  console.log(`[inject-to-json] 脚本大小: ${(jsContent.length / 1024).toFixed(2)} KB`);
}

main();
