/**
 * 正则管理器
 * 负责注册、更新和管理酒馆正则
 */

import type {
  TavernRegexConfig,
  RegexRegistrationOptions,
  RegexRegistrationResult,
  RegexServiceState,
} from '@/types';
import { REGEX_ID_PREFIX, getBuiltinRegexConfigs } from './constants';

/** 服务状态 */
const state: RegexServiceState = {
  initialized: false,
  registeredIds: [],
  lastError: undefined,
};

/**
 * 检查酒馆正则 API 是否可用
 */
function isApiAvailable(): boolean {
  return (
    typeof getTavernRegexes === 'function' && typeof updateTavernRegexesWith === 'function'
  );
}

/**
 * 检查正则是否已存在
 */
export function isRegexRegistered(id: string): boolean {
  if (!isApiAvailable()) return false;

  try {
    const regexes = getTavernRegexes({ scope: 'global' });
    return regexes.some((r) => r.id === id);
  } catch {
    return false;
  }
}

/**
 * 注册单个正则
 */
export async function registerRegex(
  config: TavernRegexConfig,
  options: RegexRegistrationOptions = {},
): Promise<RegexRegistrationResult> {
  const { force = false, silent = false } = options;

  if (!isApiAvailable()) {
    const error = '酒馆正则 API 不可用';
    if (!silent) {
      console.warn(`[GiantessCalc] ${error}`);
    }
    return { success: false, isNew: false, error };
  }

  try {
    // 检查是否已存在
    const exists = isRegexRegistered(config.id);

    if (exists && !force) {
      return {
        success: true,
        isNew: false,
      };
    }

    // 使用 updateTavernRegexesWith 添加或更新正则
    await updateTavernRegexesWith(
      (regexes) => {
        // 如果强制更新，先移除旧的
        const filtered = force ? regexes.filter((r) => r.id !== config.id) : regexes;

        // 检查是否已存在（再次检查，以防并发）
        if (!force && filtered.some((r) => r.id === config.id)) {
          return regexes; // 不做任何更改
        }

        // 添加新正则（类型兼容）
        return [...filtered, config as unknown as TavernRegex];
      },
      { scope: 'global' },
    );

    // 更新状态
    if (!state.registeredIds.includes(config.id)) {
      state.registeredIds.push(config.id);
    }

    return {
      success: true,
      isNew: !exists,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    state.lastError = errorMsg;

    if (!silent) {
      console.error(`[GiantessCalc] 注册正则失败 (${config.id}):`, errorMsg);
    }

    return {
      success: false,
      isNew: false,
      error: errorMsg,
    };
  }
}

/**
 * 注销单个正则
 */
export async function unregisterRegex(id: string, silent = false): Promise<boolean> {
  if (!isApiAvailable()) {
    return false;
  }

  try {
    await updateTavernRegexesWith((regexes) => regexes.filter((r) => r.id !== id), {
      scope: 'global',
    });

    // 更新状态
    state.registeredIds = state.registeredIds.filter((rid) => rid !== id);

    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    state.lastError = errorMsg;

    if (!silent) {
      console.error(`[GiantessCalc] 注销正则失败 (${id}):`, errorMsg);
    }

    return false;
  }
}

/**
 * 注册所有内置正则
 */
export async function registerBuiltinRegexes(
  options: RegexRegistrationOptions = {},
): Promise<RegexRegistrationResult[]> {
  const configs = getBuiltinRegexConfigs();
  const results: RegexRegistrationResult[] = [];

  for (const config of configs) {
    const result = await registerRegex(config, options);
    results.push(result);
  }

  return results;
}

/**
 * 注销所有本脚本注册的正则
 */
export async function unregisterAllRegexes(silent = false): Promise<boolean> {
  if (!isApiAvailable()) {
    return false;
  }

  try {
    await updateTavernRegexesWith(
      (regexes) => regexes.filter((r) => !r.id.startsWith(REGEX_ID_PREFIX)),
      { scope: 'global' },
    );

    state.registeredIds = [];
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    state.lastError = errorMsg;

    if (!silent) {
      console.error('[GiantessCalc] 注销所有正则失败:', errorMsg);
    }

    return false;
  }
}

/**
 * 启用/禁用指定正则
 */
export async function setRegexEnabled(id: string, enabled: boolean): Promise<boolean> {
  if (!isApiAvailable()) {
    return false;
  }

  try {
    await updateTavernRegexesWith(
      (regexes) =>
        regexes.map((r) => {
          if (r.id === id) {
            return { ...r, enabled };
          }
          return r;
        }),
      { scope: 'global' },
    );

    return true;
  } catch (error) {
    console.error(`[GiantessCalc] 设置正则状态失败 (${id}):`, error);
    return false;
  }
}

/**
 * 获取本脚本注册的所有正则
 */
export function getRegisteredRegexes(): TavernRegex[] {
  if (!isApiAvailable()) {
    return [];
  }

  try {
    const regexes = getTavernRegexes({ scope: 'global' });
    return regexes.filter((r) => r.id.startsWith(REGEX_ID_PREFIX));
  } catch {
    return [];
  }
}

/**
 * 获取服务状态
 */
export function getRegexServiceState(): RegexServiceState {
  return { ...state };
}

/**
 * 初始化正则服务
 * 注册所有内置正则
 */
export async function initRegexService(): Promise<boolean> {
  // 幂等性：已初始化则直接返回
  if (state.initialized) {
    return true;
  }

  // 检查 API 可用性
  if (!isApiAvailable()) {
    console.warn('[GiantessCalc] 酒馆正则 API 不可用，跳过正则注册');
    state.initialized = true;
    return false;
  }

  try {
    // 注册内置正则（不强制更新，避免覆盖用户修改）
    const results = await registerBuiltinRegexes({ silent: true });
    const allSuccess = results.every((r) => r.success);

    if (allSuccess) {
      console.log('[GiantessCalc] 正则服务初始化完成');
    } else {
      console.warn('[GiantessCalc] 部分正则注册失败:', results);
    }

    state.initialized = true;
    return allSuccess;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[GiantessCalc] 正则服务初始化失败:', errorMsg);
    state.lastError = errorMsg;
    state.initialized = true; // 标记为已初始化，避免重复尝试
    return false;
  }
}

/**
 * 清理正则服务
 * 注销所有本脚本注册的正则
 */
export async function cleanupRegexService(): Promise<void> {
  await unregisterAllRegexes(true);
  state.initialized = false;
  state.registeredIds = [];
  state.lastError = undefined;
}
