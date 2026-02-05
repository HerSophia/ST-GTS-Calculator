/**
 * 巨大娘计算器 - 更新器类型定义
 */

/** 版本信息 */
export interface VersionInfo {
  /** 版本号 */
  version: string;
  /** 发布日期 */
  releaseDate: string;
  /** 下载链接 */
  downloadUrl: string;
  /** 更新日志 */
  changelog: string[];
}

/** 更新检查结果 */
export interface UpdateCheckResult {
  /** 是否有更新 */
  hasUpdate: boolean;
  /** 当前版本 */
  currentVersion: string;
  /** 最新版本 */
  latestVersion: string;
  /** 发布日期 */
  releaseDate?: string;
  /** 下载链接 */
  downloadUrl?: string;
  /** Release 页面链接 */
  releasePageUrl?: string;
  /** 更新日志 */
  changelog?: string[];
  /** 检查时间 */
  checkedAt: number;
}

/** 更新器设置 */
export interface UpdaterSettings {
  /** 是否启用自动检查更新 */
  autoCheck: boolean;
  /** 检查更新间隔（毫秒），默认 24 小时 */
  checkInterval: number;
  /** 上次检查时间 */
  lastCheckTime: number;
  /** 是否已忽略当前最新版本 */
  ignoredVersion?: string;
}

/** 更新器状态 */
export interface UpdaterState {
  /** 是否正在检查 */
  checking: boolean;
  /** 检查结果 */
  result: UpdateCheckResult | null;
  /** 错误信息 */
  error: string | null;
}

/** GitHub Release 资产 */
export interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
  download_count: number;
}

/** GitHub Release 响应 */
export interface GitHubReleaseResponse {
  tag_name: string;
  name: string;
  html_url: string;
  published_at: string;
  body: string;
  assets: GitHubReleaseAsset[];
}
