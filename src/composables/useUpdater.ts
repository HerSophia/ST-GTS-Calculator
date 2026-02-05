/**
 * 巨大娘计算器 - 更新器 Composable
 *
 * 提供更新检查和更新提示的响应式逻辑
 */

import { checkForUpdates, getReleasePageUrl } from '../services/updater';
import type { UpdateCheckResult, UpdaterSettings } from '../types/updater';
import { VERSION } from '../version';

// 默认设置
const DEFAULT_SETTINGS: UpdaterSettings = {
  autoCheck: true,
  checkInterval: 24 * 60 * 60 * 1000, // 24 小时
  lastCheckTime: 0,
  ignoredVersion: undefined,
};

// 存储 key
const STORAGE_KEY = 'giantessCalc_updater';

/**
 * 从 localStorage 加载设置
 */
function loadSettings(): UpdaterSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('[GTS-Updater] 加载设置失败:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * 保存设置到 localStorage
 */
function saveSettings(settings: UpdaterSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('[GTS-Updater] 保存设置失败:', e);
  }
}

/**
 * 更新器 Composable
 */
export function useUpdater() {
  // 响应式状态
  const settings = ref<UpdaterSettings>(loadSettings());
  const checking = ref(false);
  const result = ref<UpdateCheckResult | null>(null);
  const error = ref<string | null>(null);

  // 计算属性
  const hasUpdate = computed(() => {
    if (!result.value) return false;
    // 如果用户忽略了这个版本，则不显示更新
    if (settings.value.ignoredVersion === result.value.latestVersion) {
      return false;
    }
    return result.value.hasUpdate;
  });

  const currentVersion = computed(() => VERSION);

  const latestVersion = computed(() => result.value?.latestVersion || VERSION);

  const downloadUrl = computed(() => result.value?.downloadUrl);

  const releasePageUrl = computed(
    () => result.value?.releasePageUrl || getReleasePageUrl()
  );

  const changelog = computed(() => result.value?.changelog || []);

  const releaseDate = computed(() => {
    if (!result.value?.releaseDate) return '';
    try {
      return new Date(result.value.releaseDate).toLocaleDateString('zh-CN');
    } catch {
      return result.value.releaseDate;
    }
  });

  /**
   * 检查更新
   */
  async function check(): Promise<UpdateCheckResult | null> {
    if (checking.value) return null;

    checking.value = true;
    error.value = null;

    try {
      const checkResult = await checkForUpdates();
      result.value = checkResult;

      // 更新最后检查时间
      settings.value.lastCheckTime = Date.now();
      saveSettings(settings.value);

      return checkResult;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '检查更新失败';
      console.error('[GTS-Updater] 检查更新失败:', e);
      return null;
    } finally {
      checking.value = false;
    }
  }

  /**
   * 检查是否需要自动检查更新
   */
  function shouldAutoCheck(): boolean {
    if (!settings.value.autoCheck) return false;

    const now = Date.now();
    const lastCheck = settings.value.lastCheckTime;
    const interval = settings.value.checkInterval;

    return now - lastCheck >= interval;
  }

  /**
   * 自动检查更新（如果需要）
   */
  async function autoCheckIfNeeded(): Promise<void> {
    if (shouldAutoCheck()) {
      await check();
    }
  }

  /**
   * 忽略当前最新版本
   */
  function ignoreCurrentUpdate(): void {
    if (result.value?.latestVersion) {
      settings.value.ignoredVersion = result.value.latestVersion;
      saveSettings(settings.value);
    }
  }

  /**
   * 清除忽略的版本
   */
  function clearIgnoredVersion(): void {
    settings.value.ignoredVersion = undefined;
    saveSettings(settings.value);
  }

  /**
   * 打开下载页面
   */
  function openDownloadPage(): void {
    const url = downloadUrl.value || releasePageUrl.value;
    window.open(url, '_blank');
  }

  /**
   * 打开 Release 页面
   */
  function openReleasePage(): void {
    window.open(releasePageUrl.value, '_blank');
  }

  /**
   * 切换自动检查
   */
  function toggleAutoCheck(enabled?: boolean): void {
    settings.value.autoCheck = enabled ?? !settings.value.autoCheck;
    saveSettings(settings.value);
  }

  return {
    // 状态
    settings: readonly(settings),
    checking: readonly(checking),
    result: readonly(result),
    error: readonly(error),

    // 计算属性
    hasUpdate,
    currentVersion,
    latestVersion,
    downloadUrl,
    releasePageUrl,
    changelog,
    releaseDate,

    // 方法
    check,
    autoCheckIfNeeded,
    ignoreCurrentUpdate,
    clearIgnoredVersion,
    openDownloadPage,
    openReleasePage,
    toggleAutoCheck,
  };
}
