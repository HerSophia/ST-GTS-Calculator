/**
 * 巨大娘计算器 - 更新检查服务
 *
 * 通过 GitHub API 检查是否有新版本
 */

import { compare } from 'compare-versions';
import { VERSION } from '../../version';
import type {
  UpdateCheckResult,
  GitHubReleaseResponse,
} from '../../types/updater';

// GitHub 仓库信息
const GITHUB_OWNER = 'HerSophia';
const GITHUB_REPO = 'ST-GTS-Calculator';

// API 端点
const GITHUB_API_BASE = 'https://api.github.com';

/**
 * 获取 GitHub Release API URL
 */
export function getLatestReleaseApiUrl(): string {
  return `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
}

/**
 * 获取 Release 页面 URL
 */
export function getReleasePageUrl(tag?: string): string {
  if (tag) {
    return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tag/${tag}`;
  }
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
}

/**
 * 解析版本号（移除 v 前缀）
 */
function parseVersion(version: string): string {
  return version.replace(/^v/, '');
}

/**
 * 从 Release body 中提取更新日志
 */
function parseChangelog(body: string): string[] {
  if (!body) return [];

  const lines = body.split('\n');
  const changelog: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // 匹配 markdown 列表项
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      changelog.push(trimmed.slice(2));
    }
  }

  return changelog;
}

/**
 * 从 GitHub API 获取最新 Release 信息
 */
export async function fetchLatestRelease(): Promise<GitHubReleaseResponse | null> {
  try {
    const response = await fetch(getLatestReleaseApiUrl(), {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        // 可选：添加 User-Agent 以符合 GitHub API 要求
        'User-Agent': 'ST-GTS-Calculator-Updater',
      },
    });

    if (!response.ok) {
      console.warn(`[GTS-Updater] GitHub API 返回错误: ${response.status}`);
      return null;
    }

    return (await response.json()) as GitHubReleaseResponse;
  } catch (error) {
    console.warn('[GTS-Updater] 无法连接到 GitHub API:', error);
    return null;
  }
}

/**
 * 检查更新
 *
 * @returns 更新检查结果
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const currentVersion = parseVersion(VERSION);
  const checkedAt = Date.now();

  try {
    const release = await fetchLatestRelease();

    if (!release) {
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        checkedAt,
      };
    }

    const latestVersion = parseVersion(release.tag_name);

    // 使用 compare-versions 比较版本
    // compare 返回: 1 (>) / 0 (=) / -1 (<)
    const hasUpdate = compare(latestVersion, currentVersion, '>');

    // 查找 JSON 文件的下载链接
    const jsonAsset = release.assets.find(
      (asset) =>
        asset.name.endsWith('.json') && asset.name.includes('GTS-Calculator')
    );

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      releaseDate: release.published_at,
      downloadUrl: jsonAsset?.browser_download_url,
      releasePageUrl: getReleasePageUrl(release.tag_name),
      changelog: parseChangelog(release.body),
      checkedAt,
    };
  } catch (error) {
    console.error('[GTS-Updater] 检查更新失败:', error);

    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      checkedAt,
    };
  }
}

/**
 * 获取远程 JSON 配置文件下载 URL
 * 
 * 注意：此函数返回的是 GitHub Release 下载链接
 * 实际使用时应优先使用 checkForUpdates() 返回的 downloadUrl
 * 
 * @param version 版本号，如 '2.7.0' 或 'v2.7.0'
 */
export function getRemoteJsonUrl(version: string): string {
  const tag = version.startsWith('v') ? version : `v${version}`;
  // 使用 GitHub Releases 下载链接
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${tag}/GTS-Calculator-${tag}.json`;
}
