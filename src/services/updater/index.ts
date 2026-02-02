/**
 * 巨大娘计算器 - 更新服务
 *
 * @module services/updater
 */

import { checkForUpdates } from './checker';

// 存储 key
const STORAGE_KEY = 'giantessCalc_updater';

// 默认设置
const DEFAULT_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 小时

/**
 * 初始化更新检查
 *
 * 在应用启动时调用，延迟检查更新避免阻塞启动
 */
export function initUpdater(): void {
  // 延迟 5 秒检查，避免影响页面加载
  setTimeout(async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const settings = stored ? JSON.parse(stored) : {};

      // 如果禁用了自动检查，直接返回
      if (settings.autoCheck === false) {
        console.log('[GTS-Updater] 自动检查已禁用');
        return;
      }

      // 检查是否需要检查更新
      const now = Date.now();
      const lastCheck = settings.lastCheckTime || 0;
      const interval = settings.checkInterval || DEFAULT_CHECK_INTERVAL;

      if (now - lastCheck < interval) {
        console.log('[GTS-Updater] 距离上次检查不足 24 小时，跳过');
        return;
      }

      console.log('[GTS-Updater] 开始检查更新...');
      const result = await checkForUpdates();

      if (result.hasUpdate) {
        console.log(
          `[GTS-Updater] 发现新版本 v${result.latestVersion}（当前 v${result.currentVersion}）`
        );
        // 使用 toastr 提示用户（如果可用）
        if (typeof toastr !== 'undefined') {
          toastr.info(
            `发现新版本 v${result.latestVersion}，请在设置中查看详情`,
            '巨大娘计算器',
            { timeOut: 5000 }
          );
        }
      } else {
        console.log('[GTS-Updater] 当前已是最新版本');
      }

      // 更新最后检查时间
      settings.lastCheckTime = now;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('[GTS-Updater] 检查更新失败:', error);
    }
  }, 5000);
}

export {
  checkForUpdates,
  fetchLatestRelease,
  getLatestReleaseApiUrl,
  getReleasePageUrl,
  getJsDelivrUrl,
  getRemoteScriptUrl,
  getRemoteJsonUrl,
} from './checker';
