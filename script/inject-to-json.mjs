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
  // 目标 JSON 文件路径
  targetJsonPath: path.join(rootDir, 'json', '酒馆助手脚本-巨大娘计算器.json'),
  // 可能的构建输出路径（按优先级排序）
  possibleBuildPaths: [
    path.join(rootDir, 'dist', 'index.js'),
    path.join(rootDir, 'dist', 'src', 'index.js'),
  ],
};

/**
 * 在 dist 目录下查找最大的 index.js 文件
 */
function findLargestIndexJs(distDir) {
  if (!fs.existsSync(distDir)) {
    return null;
  }

  let largestFile = null;
  let largestSize = 0;

  function searchDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // 跳过示例相关目录
        if (!['角色卡示例', '脚本示例', '流式楼层界面示例', '前端界面示例'].includes(entry.name)) {
          searchDir(fullPath);
        }
      } else if (entry.name === 'index.js') {
        const stat = fs.statSync(fullPath);
        if (stat.size > largestSize) {
          largestSize = stat.size;
          largestFile = fullPath;
        }
      }
    }
  }

  searchDir(distDir);
  return largestFile;
}

/**
 * 查找构建输出文件
 */
function findBuiltJs() {
  // 首先尝试预定义的路径
  for (const possiblePath of CONFIG.possibleBuildPaths) {
    if (fs.existsSync(possiblePath)) {
      const stat = fs.statSync(possiblePath);
      // 主构建应该大于 100KB
      if (stat.size > 100 * 1024) {
        console.log(`[inject-to-json] 找到构建文件: ${path.relative(rootDir, possiblePath)}`);
        return possiblePath;
      }
    }
  }

  // 如果预定义路径都不存在，搜索最大的 index.js
  console.log('[inject-to-json] 预定义路径未找到，搜索 dist 目录...');
  const distDir = path.join(rootDir, 'dist');
  const found = findLargestIndexJs(distDir);
  
  if (found) {
    console.log(`[inject-to-json] 找到最大的 index.js: ${path.relative(rootDir, found)}`);
    return found;
  }

  return null;
}

function main() {
  console.log('[inject-to-json] 开始注入脚本内容...');

  // 查找构建输出
  const builtJsPath = findBuiltJs();
  
  if (!builtJsPath) {
    console.error('[inject-to-json] 错误: 在 dist 目录中找不到构建输出文件');
    console.error('[inject-to-json] 请先运行 pnpm build 构建项目');
    
    // 列出 dist 目录内容用于调试
    const distDir = path.join(rootDir, 'dist');
    if (fs.existsSync(distDir)) {
      console.log('[inject-to-json] dist 目录内容:');
      function listDir(dir, indent = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            console.log(`${indent}📁 ${entry.name}/`);
            listDir(fullPath, indent + '  ');
          } else {
            const stat = fs.statSync(fullPath);
            console.log(`${indent}📄 ${entry.name} (${(stat.size / 1024).toFixed(1)} KB)`);
          }
        }
      }
      listDir(distDir);
    } else {
      console.log('[inject-to-json] dist 目录不存在');
    }
    
    process.exit(1);
  }

  // 检查目标 JSON 是否存在
  if (!fs.existsSync(CONFIG.targetJsonPath)) {
    console.error(`[inject-to-json] 错误: 找不到目标 JSON 文件 ${CONFIG.targetJsonPath}`);
    process.exit(1);
  }

  // 读取构建后的 JS 内容
  const jsContent = fs.readFileSync(builtJsPath, 'utf-8');
  console.log(`[inject-to-json] 已读取 JS 文件 (${(jsContent.length / 1024).toFixed(2)} KB)`);

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
