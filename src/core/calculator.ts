/**
 * 巨大娘计算器 - 核心计算模块
 */

import type { LevelInfo, GiantessData, TinyData } from '../types';
import {
  BASE_HEIGHT,
  BASE_BODY_PARTS,
  REFERENCE_OBJECTS,
  INSECT_REFERENCES,
  SIZE_LEVELS,
  TINY_LEVELS,
} from './constants';
import { formatLength, formatWeight, formatVolume, formatArea, round } from './formatter';

// 重新导出类型，保持向后兼容
export type { LevelInfo, GiantessData, TinyData };

/**
 * 确定级别
 */
export function determineLevel(scale: number): LevelInfo {
  if (scale >= 1) {
    // 巨大化
    for (const level of SIZE_LEVELS) {
      if (scale >= level.minScale && scale < level.maxScale) {
        return { ...level, type: 'giant' };
      }
    }
    return { name: '宇宙级', description: '超越可观测宇宙', type: 'giant' };
  } else {
    // 缩小化
    for (const level of TINY_LEVELS) {
      if (scale <= level.scale * 10 && scale > level.scale / 10) {
        return { ...level, type: 'tiny' };
      }
    }
    return { name: '亚原子级', description: '比原子还小', type: 'tiny' };
  }
}

/**
 * 找到最接近的参照物
 */
export function findSimilarObject(sizeInMeters: number): string {
  const allObjects = { ...REFERENCE_OBJECTS, ...INSECT_REFERENCES };
  let closest: string | null = null;
  let closestRatio = Infinity;

  for (const [name, size] of Object.entries(allObjects)) {
    const ratio = Math.abs(Math.log(sizeInMeters / size));
    if (ratio < closestRatio) {
      closestRatio = ratio;
      closest = name;
    }
  }

  if (closest && closestRatio < 1) {
    const ratio = sizeInMeters / allObjects[closest];
    if (ratio > 0.8 && ratio < 1.2) {
      return `约等于${closest}的大小`;
    } else if (ratio < 1) {
      return `比${closest}小一些`;
    } else {
      return `比${closest}大一些`;
    }
  }
  return '';
}

/**
 * 生成描述性文本
 */
function generateDescription(
  scale: number,
  level: LevelInfo,
  bodyParts: Record<string, string>,
  objects: Record<string, string>
): string {
  const lines: string[] = [];

  lines.push(`【${level.name}】${level.description}`);
  lines.push('');

  // 根据级别选择有意义的参照物
  if (scale < 100) {
    lines.push(`在她眼中：`);
    lines.push(`- 普通人类：${objects.普通成年人}`);
    lines.push(`- 轿车：${objects.轿车长度}`);
    lines.push(`- 两层楼房：${objects.两层楼房}`);
  } else if (scale < 10000) {
    lines.push(`在她眼中：`);
    lines.push(`- 普通人类：${objects.普通成年人}`);
    lines.push(`- 十层楼房：${objects.十层楼房}`);
    lines.push(`- 埃菲尔铁塔：${objects.埃菲尔铁塔}`);
  } else if (scale < 1000000) {
    lines.push(`在她眼中：`);
    lines.push(`- 珠穆朗玛峰：${objects.珠穆朗玛峰}`);
    lines.push(`- 云层：${objects.云层高度}`);
    lines.push(`- 国际空间站：${objects.国际空间站轨道}`);
  } else if (scale < 1e9) {
    lines.push(`在她眼中：`);
    lines.push(`- 地球直径：${objects.地球直径}`);
    lines.push(`- 月球直径：${objects.月球直径}`);
  } else if (scale < 1e12) {
    lines.push(`在她眼中：`);
    lines.push(`- 太阳直径：${objects.太阳直径}`);
    lines.push(`- 地月距离：${objects.地月距离}`);
  } else {
    lines.push(`在她眼中：`);
    lines.push(`- 日地距离：${objects.日地距离_1AU}`);
    if (scale > 1e16) {
      lines.push(`- 银河系：${objects.银河系直径}`);
    }
  }

  lines.push('');
  lines.push(`关键身体数据：`);
  lines.push(`- 身高：${bodyParts.身高}`);
  lines.push(`- 足长：${bodyParts.足长}`);
  lines.push(`- 手掌：${bodyParts.手掌长}`);

  return lines.join('\n');
}

/**
 * 计算巨大娘的完整数据
 * @param currentHeight 当前身高（米）
 * @param originalHeight 原身高（米）
 * @param customParts 自定义部位尺寸（可选），键为部位名，值为绝对尺寸（米）
 */
export function calculateGiantessData(
  currentHeight: number,
  originalHeight: number = 1.65,
  customParts: Record<string, number> = {}
): GiantessData {
  const scale = currentHeight / originalHeight;
  const level = determineLevel(scale);

  // 记录自定义部位及其倍率
  const customPartsRecord: Record<string, number> = {};
  const customPartsScale: Record<string, number> = {};

  // 计算身体部位数据
  const bodyParts: Record<string, number> = {};
  const bodyPartsFormatted: Record<string, string> = {};

  for (const [part, baseValue] of Object.entries(BASE_BODY_PARTS)) {
    // 检查是否有自定义尺寸
    if (customParts[part] !== undefined) {
      const customValue = customParts[part];
      const partScale = customValue / (baseValue * (originalHeight / BASE_HEIGHT));
      
      customPartsRecord[part] = customValue;
      customPartsScale[part] = round(partScale);
      
      bodyParts[part] = round(customValue);
      
      // 根据部位类型选择格式化方式
      if (part.includes('重量')) {
        bodyPartsFormatted[part] = formatWeight(customValue) + ' ⚡';
      } else if (part.includes('容积')) {
        bodyPartsFormatted[part] = formatVolume(customValue) + ' ⚡';
      } else if (part.includes('面积')) {
        bodyPartsFormatted[part] = formatArea(customValue) + ' ⚡';
      } else {
        bodyPartsFormatted[part] = formatLength(customValue, customValue > 1e10) + ' ⚡';
      }
      continue;
    }
    
    // 特殊处理重量（按立方缩放）
    if (part.includes('重量')) {
      const scaledValue = baseValue * Math.pow(scale, 3) * (originalHeight / BASE_HEIGHT);
      bodyParts[part] = round(scaledValue);
      bodyPartsFormatted[part] = formatWeight(scaledValue);
    }
    // 特殊处理体积（按立方缩放）
    else if (part.includes('容积')) {
      const scaledValue =
        baseValue * Math.pow(scale, 3) * Math.pow(originalHeight / BASE_HEIGHT, 3);
      bodyParts[part] = round(scaledValue, 6);
      bodyPartsFormatted[part] = formatVolume(scaledValue);
    }
    // 特殊处理面积（按平方缩放）
    else if (part.includes('面积')) {
      const scaledValue =
        baseValue * Math.pow(scale, 2) * Math.pow(originalHeight / BASE_HEIGHT, 2);
      bodyParts[part] = round(scaledValue, 6);
      bodyPartsFormatted[part] = formatArea(scaledValue);
    }
    // 普通长度（按线性缩放）
    else {
      const scaledValue = baseValue * scale * (originalHeight / BASE_HEIGHT);
      bodyParts[part] = round(scaledValue);
      bodyPartsFormatted[part] = formatLength(scaledValue, scale > 1e10);
    }
  }

  // 计算参考物在她眼中的相对尺寸
  const objectsInHerEyes: Record<string, number> = {};
  const objectsFormatted: Record<string, string> = {};

  for (const [name, realSize] of Object.entries(REFERENCE_OBJECTS)) {
    const perceivedSize = realSize / scale;
    objectsInHerEyes[name] = round(perceivedSize, 4);
    objectsFormatted[name] = formatLength(perceivedSize, false);
  }

  // 添加昆虫参照
  for (const [name, realSize] of Object.entries(INSECT_REFERENCES)) {
    const perceivedSize = realSize / scale;
    objectsInHerEyes[name] = round(perceivedSize, 8);
    objectsFormatted[name] = formatLength(perceivedSize, false);
  }

  // 生成描述性文本
  const description = generateDescription(scale, level, bodyPartsFormatted, objectsFormatted);

  return {
    原身高: originalHeight,
    当前身高: currentHeight,
    当前身高_格式化: formatLength(currentHeight, scale > 1e10),
    倍率: round(scale),
    级别: level.name,
    级别描述: level.description,

    身体部位: bodyParts,
    身体部位_格式化: bodyPartsFormatted,
    自定义部位: customPartsRecord,
    自定义部位_倍率: customPartsScale,

    眼中的世界: objectsInHerEyes,
    眼中的世界_格式化: objectsFormatted,

    描述: description,

    _计算时间: Date.now(),
    _版本: '1.3',
  };
}

/**
 * 生成小人描述
 */
function generateTinyDescription(
  scale: number,
  level: LevelInfo,
  giantessBody: Record<string, string>
): string {
  const lines: string[] = [];

  lines.push(`【${level.name}】${level.description}`);
  lines.push('');
  lines.push(`正常女性在他眼中：`);
  lines.push(`- 身高：${giantessBody.身高}`);
  lines.push(`- 脚掌：${giantessBody.足长}`);
  lines.push(`- 脚趾：${giantessBody.大脚趾长}`);

  if (scale < 0.01) {
    lines.push(`- 阴毛：${giantessBody.阴毛长}`);
    lines.push(`- 毛发直径：${giantessBody.头发直径}`);
  }

  return lines.join('\n');
}

/**
 * 计算小人数据（被缩小的人）
 */
export function calculateTinyData(currentHeight: number, originalHeight: number = 1.7): TinyData {
  const scale = currentHeight / originalHeight;
  const level = determineLevel(scale);

  // 计算正常女性在小人眼中的相对尺寸
  const giantessInHisEyes: Record<string, number> = {};
  const giantessFormatted: Record<string, string> = {};

  for (const [part, baseValue] of Object.entries(BASE_BODY_PARTS)) {
    if (!part.includes('重量') && !part.includes('容积') && !part.includes('面积')) {
      const perceivedSize = baseValue / scale;
      giantessInHisEyes[part] = round(perceivedSize);
      giantessFormatted[part] = formatLength(perceivedSize, false);
    }
  }

  const description = generateTinyDescription(scale, level, giantessFormatted);

  return {
    原身高: originalHeight,
    当前身高: currentHeight,
    当前身高_格式化: formatLength(currentHeight, false),
    倍率: round(scale, 6),
    级别: level.name,
    级别描述: level.description,

    眼中的巨大娘: giantessInHisEyes,
    眼中的巨大娘_格式化: giantessFormatted,

    描述: description,

    _计算时间: Date.now(),
    _版本: '1.2',
  };
}
