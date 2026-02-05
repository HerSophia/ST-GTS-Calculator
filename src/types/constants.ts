/**
 * 巨大娘计算器 - 常量相关类型定义
 */

/**
 * 尺寸级别定义（巨大化）
 */
export interface SizeLevel {
  name: string;
  minScale: number;
  maxScale: number;
  description: string;
}

/**
 * 小人级别定义（缩小）
 */
export interface TinyLevel {
  name: string;
  scale: number;
  description: string;
}
