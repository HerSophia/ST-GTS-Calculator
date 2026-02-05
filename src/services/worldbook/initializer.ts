/**
 * 巨大娘计算器 - 世界书初始化服务
 * 
 * 负责创建/检查世界书和 [InitVar] 条目
 * 确保 MVU 变量在脚本加载时被正确初始化
 * 
 * @module services/worldbook/initializer
 */

import type { PartialDeep } from 'type-fest';
import { generateInitYaml } from './init-data';

/** 世界书配置 */
export interface WorldbookConfig {
  /** 世界书名称 */
  worldbookName: string;
  /** 初始化条目名称 */
  entryName: string;
  /** 变量前缀 */
  variablePrefix: string;
}

/** 默认配置 */
export const DEFAULT_CONFIG: WorldbookConfig = {
  worldbookName: '巨大娘计算器_MVU初始化',
  entryName: '[InitVar]',
  variablePrefix: '巨大娘',
};

/** 初始化状态 */
export interface InitializerStatus {
  worldbookExists: boolean;
  entryExists: boolean;
  entryEnabled: boolean;
  initialized: boolean;
  error?: string;
}

/**
 * 检查世界书是否存在
 */
async function checkWorldbookExists(worldbookName: string): Promise<boolean> {
  try {
    const names = getWorldbookNames();
    return names.includes(worldbookName);
  } catch (e) {
    console.error('[GiantessCalc] 检查世界书失败:', e);
    return false;
  }
}

/**
 * 检查条目是否存在
 */
async function checkEntryExists(
  worldbookName: string,
  entryName: string
): Promise<{ exists: boolean; enabled: boolean; uid?: number }> {
  try {
    const entries = await getWorldbook(worldbookName);
    const entry = entries.find(e => e.name === entryName);
    if (entry) {
      return { exists: true, enabled: entry.enabled, uid: entry.uid };
    }
    return { exists: false, enabled: false };
  } catch (e) {
    console.error('[GiantessCalc] 检查条目失败:', e);
    return { exists: false, enabled: false };
  }
}

/**
 * 创建世界书及初始化条目
 * 
 * @param config 配置
 * @returns 是否成功创建
 */
export async function createWorldbookWithInitEntry(
  config: WorldbookConfig = DEFAULT_CONFIG
): Promise<boolean> {
  const { worldbookName, entryName, variablePrefix } = config;
  
  console.log(`[GiantessCalc] 创建世界书: ${worldbookName}`);
  
  try {
    // 生成初始化内容
    const initContent = generateInitYaml(variablePrefix);
    
    // 创建世界书，包含一个禁用的 [InitVar] 条目
    const initEntry: PartialDeep<WorldbookEntry> = {
      name: entryName,
      enabled: false, // 默认禁用，仅作为初始化模板
      content: initContent,
      strategy: {
        type: 'constant', // 常量类型（蓝灯）
        keys: [],
        keys_secondary: { logic: 'and_any', keys: [] },
        scan_depth: 'same_as_global',
      },
      position: {
        type: 'before_character_definition',
        role: 'system',
        depth: 0,
        order: 100,
      },
      probability: 100,
      recursion: {
        prevent_incoming: false,
        prevent_outgoing: false,
        delay_until: null,
      },
      effect: {
        sticky: null,
        cooldown: null,
        delay: null,
      },
    };
    
    const created = await createWorldbook(worldbookName, [initEntry as WorldbookEntry]);
    
    if (created) {
      console.log(`[GiantessCalc] ✅ 世界书创建成功: ${worldbookName}`);
      return true;
    } else {
      console.log(`[GiantessCalc] ⚠️ 世界书已存在: ${worldbookName}`);
      return false;
    }
  } catch (e) {
    console.error('[GiantessCalc] ❌ 创建世界书失败:', e);
    return false;
  }
}

/**
 * 确保初始化条目存在
 * 如果世界书存在但条目不存在，则添加条目
 * 
 * @param config 配置
 * @returns 是否成功确保条目存在
 */
export async function ensureInitEntry(
  config: WorldbookConfig = DEFAULT_CONFIG
): Promise<boolean> {
  const { worldbookName, entryName, variablePrefix } = config;
  
  try {
    const entryStatus = await checkEntryExists(worldbookName, entryName);
    
    if (entryStatus.exists) {
      console.log(`[GiantessCalc] ✅ 初始化条目已存在: ${entryName}`);
      return true;
    }
    
    // 条目不存在，添加
    console.log(`[GiantessCalc] 添加初始化条目: ${entryName}`);
    
    const initContent = generateInitYaml(variablePrefix);
    
    await createWorldbookEntries(worldbookName, [{
      name: entryName,
      enabled: false,
      content: initContent,
      strategy: {
        type: 'constant',
        keys: [],
        keys_secondary: { logic: 'and_any', keys: [] },
        scan_depth: 'same_as_global',
      },
      position: {
        type: 'before_character_definition',
        role: 'system',
        depth: 0,
        order: 100,
      },
      probability: 100,
    }]);
    
    console.log(`[GiantessCalc] ✅ 初始化条目添加成功`);
    return true;
  } catch (e) {
    console.error('[GiantessCalc] ❌ 确保初始化条目失败:', e);
    return false;
  }
}

/**
 * 绑定世界书到全局
 * 将世界书添加到全局启用列表中（保留现有的全局世界书）
 * 
 * @param worldbookName 要绑定的世界书名称
 * @returns 是否成功绑定
 */
async function bindWorldbookToGlobal(worldbookName: string): Promise<boolean> {
  try {
    // 获取当前全局启用的世界书列表
    const currentGlobalBooks = getGlobalWorldbookNames();
    
    // 检查是否已经绑定
    if (currentGlobalBooks.includes(worldbookName)) {
      console.log(`[GiantessCalc] ✅ 世界书已在全局列表中: ${worldbookName}`);
      return true;
    }
    
    // 追加新世界书到列表
    const newGlobalBooks = [...currentGlobalBooks, worldbookName];
    await rebindGlobalWorldbooks(newGlobalBooks);
    
    console.log(`[GiantessCalc] ✅ 世界书已绑定到全局: ${worldbookName}`);
    return true;
  } catch (e) {
    console.error('[GiantessCalc] ❌ 绑定世界书到全局失败:', e);
    return false;
  }
}

/**
 * 初始化世界书
 * 
 * 这是主入口函数，会：
 * 1. 检查世界书是否存在
 * 2. 如果不存在，创建世界书和初始化条目
 * 3. 如果存在但条目不存在，添加条目
 * 4. 将世界书绑定到全局（确保 MVU 能读取到）
 * 
 * @param config 配置（可选）
 * @returns 初始化状态
 */
export async function initializeWorldbook(
  config: WorldbookConfig = DEFAULT_CONFIG
): Promise<InitializerStatus> {
  const { worldbookName, entryName } = config;
  const status: InitializerStatus = {
    worldbookExists: false,
    entryExists: false,
    entryEnabled: false,
    initialized: false,
  };
  
  console.log('[GiantessCalc] 🚀 开始初始化 MVU 世界书...');
  
  try {
    // 1. 检查世界书是否存在
    status.worldbookExists = await checkWorldbookExists(worldbookName);
    
    if (!status.worldbookExists) {
      // 2. 创建世界书和条目
      const created = await createWorldbookWithInitEntry(config);
      if (created) {
        status.worldbookExists = true;
        status.entryExists = true;
        status.entryEnabled = false; // 新创建的条目默认禁用
        
        // 2.1 绑定到全局
        await bindWorldbookToGlobal(worldbookName);
        
        status.initialized = true;
        console.log('[GiantessCalc] ✅ MVU 世界书初始化完成（新建并绑定）');
        return status;
      } else {
        status.error = '创建世界书失败';
        return status;
      }
    }
    
    // 3. 世界书存在，检查条目
    const entryStatus = await checkEntryExists(worldbookName, entryName);
    status.entryExists = entryStatus.exists;
    status.entryEnabled = entryStatus.enabled;
    
    if (!status.entryExists) {
      // 4. 条目不存在，添加
      const added = await ensureInitEntry(config);
      if (added) {
        status.entryExists = true;
        
        // 4.1 确保已绑定到全局
        await bindWorldbookToGlobal(worldbookName);
        
        status.initialized = true;
        console.log('[GiantessCalc] ✅ MVU 世界书初始化完成（添加条目并绑定）');
        return status;
      } else {
        status.error = '添加初始化条目失败';
        return status;
      }
    }
    
    // 5. 一切正常，确保已绑定到全局
    await bindWorldbookToGlobal(worldbookName);
    
    status.initialized = true;
    console.log('[GiantessCalc] ✅ MVU 世界书已就绪');
    return status;
    
  } catch (e) {
    status.error = String(e);
    console.error('[GiantessCalc] ❌ MVU 世界书初始化失败:', e);
    return status;
  }
}

/**
 * 获取当前初始化状态（不执行初始化）
 * 
 * @param config 配置
 * @returns 当前状态
 */
export async function getInitializerStatus(
  config: WorldbookConfig = DEFAULT_CONFIG
): Promise<InitializerStatus> {
  const { worldbookName, entryName } = config;
  const status: InitializerStatus = {
    worldbookExists: false,
    entryExists: false,
    entryEnabled: false,
    initialized: false,
  };
  
  try {
    status.worldbookExists = await checkWorldbookExists(worldbookName);
    
    if (status.worldbookExists) {
      const entryStatus = await checkEntryExists(worldbookName, entryName);
      status.entryExists = entryStatus.exists;
      status.entryEnabled = entryStatus.enabled;
      status.initialized = entryStatus.exists;
    }
    
    return status;
  } catch (e) {
    status.error = String(e);
    return status;
  }
}
