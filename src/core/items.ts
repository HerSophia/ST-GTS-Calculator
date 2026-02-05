/**
 * 巨大娘计算器 - 物品计算模块
 * 计算物品在不同尺度下的相对大小和互动可能性
 */

import type {
  ItemDefinition,
  ItemDimensions,
  ItemCalculation,
  ItemRelativeReference,
  ItemInteraction,
  CharacterItemsCalculation,
  CharacterItems,
} from '../types';
import { formatLength, formatWeight, round } from './formatter';
import { REFERENCE_OBJECTS, BASE_BODY_PARTS } from './constants';

// ==================== 预设物品库 ====================

/**
 * 预设物品尺寸（原始尺寸，单位：米/千克）
 */
export const PRESET_ITEMS: Record<string, ItemDefinition> = {
  // 日用品
  智能手机: {
    名称: '智能手机',
    原始尺寸: { 长: 0.15, 宽: 0.07, 高: 0.008, 重量: 0.2 },
    类型: '日用品',
    材质: '玻璃',
  },
  钥匙: {
    名称: '钥匙',
    原始尺寸: { 长: 0.06, 宽: 0.025, 高: 0.003, 重量: 0.02 },
    类型: '日用品',
    材质: '金属',
  },
  钱包: {
    名称: '钱包',
    原始尺寸: { 长: 0.11, 宽: 0.09, 高: 0.02, 重量: 0.1 },
    类型: '日用品',
    材质: '皮革',
  },
  水杯: {
    名称: '水杯',
    原始尺寸: { 高: 0.2, 直径: 0.07, 重量: 0.3 },
    类型: '日用品',
    材质: '玻璃',
  },
  雨伞: {
    名称: '雨伞',
    原始尺寸: { 长: 0.9, 直径: 1.0, 重量: 0.4 },
    类型: '日用品',
    材质: '金属',
  },

  // 配饰
  戒指: {
    名称: '戒指',
    原始尺寸: { 直径: 0.018, 高: 0.005, 重量: 0.005 },
    类型: '配饰',
    材质: '金属',
  },
  项链: {
    名称: '项链',
    原始尺寸: { 长: 0.45, 宽: 0.002, 重量: 0.02 },
    类型: '配饰',
    材质: '金属',
  },
  耳环: {
    名称: '耳环',
    原始尺寸: { 长: 0.03, 宽: 0.01, 重量: 0.003 },
    类型: '配饰',
    材质: '金属',
  },
  手表: {
    名称: '手表',
    原始尺寸: { 直径: 0.04, 高: 0.01, 重量: 0.08 },
    类型: '配饰',
    材质: '金属',
  },

  // 服装
  高跟鞋: {
    名称: '高跟鞋',
    原始尺寸: { 长: 0.25, 宽: 0.08, 高: 0.12, 重量: 0.3 },
    类型: '服装',
    材质: '皮革',
  },
  运动鞋: {
    名称: '运动鞋',
    原始尺寸: { 长: 0.28, 宽: 0.10, 高: 0.08, 重量: 0.35 },
    类型: '服装',
    材质: '橡胶',
  },

  // 食物
  苹果: {
    名称: '苹果',
    原始尺寸: { 直径: 0.08, 重量: 0.2 },
    类型: '食物',
    材质: '食材',
  },
  汉堡: {
    名称: '汉堡',
    原始尺寸: { 直径: 0.12, 高: 0.08, 重量: 0.25 },
    类型: '食物',
    材质: '食材',
  },
  易拉罐: {
    名称: '易拉罐',
    原始尺寸: { 高: 0.12, 直径: 0.066, 重量: 0.35 },
    类型: '食物',
    材质: '金属',
  },

  // 交通工具
  自行车: {
    名称: '自行车',
    原始尺寸: { 长: 1.8, 宽: 0.6, 高: 1.1, 重量: 12 },
    类型: '交通工具',
    材质: '金属',
  },
  轿车: {
    名称: '轿车',
    原始尺寸: { 长: 4.5, 宽: 1.8, 高: 1.5, 重量: 1500 },
    类型: '交通工具',
    材质: '金属',
  },
  公交车: {
    名称: '公交车',
    原始尺寸: { 长: 12, 宽: 2.5, 高: 3.2, 重量: 12000 },
    类型: '交通工具',
    材质: '金属',
  },

  // 玩具
  玩偶: {
    名称: '玩偶',
    原始尺寸: { 高: 0.3, 宽: 0.15, 重量: 0.2 },
    类型: '玩具',
    材质: '布料',
  },
  积木: {
    名称: '积木',
    原始尺寸: { 长: 0.03, 宽: 0.015, 高: 0.01, 重量: 0.002 },
    类型: '玩具',
    材质: '塑料',
  },
};

// ==================== 参照物查找 ====================

/**
 * 根据尺寸查找相近的参照物
 */
function findSimilarReferences(
  sizeMeters: number,
  count: number = 3
): ItemRelativeReference[] {
  const references: ItemRelativeReference[] = [];
  
  // 合并参照物和身体部位
  const allRefs: Record<string, number> = {
    ...REFERENCE_OBJECTS,
    '人类手掌': BASE_BODY_PARTS.手掌长,
    '人类脚掌': BASE_BODY_PARTS.足长,
    '人类手指': BASE_BODY_PARTS.手指长,
    '人类身高': BASE_BODY_PARTS.身高,
  };
  
  // 计算每个参照物的相似度
  const sorted = Object.entries(allRefs)
    .map(([name, size]) => ({
      name,
      size,
      ratio: sizeMeters / size,
      diff: Math.abs(Math.log10(sizeMeters / size)),
    }))
    .sort((a, b) => a.diff - b.diff);
  
  // 取前 N 个
  for (let i = 0; i < Math.min(count, sorted.length); i++) {
    const ref = sorted[i];
    let 描述: string;
    
    if (ref.ratio >= 0.8 && ref.ratio <= 1.2) {
      描述 = `约等于${ref.name}`;
    } else if (ref.ratio > 1) {
      描述 = `约${round(ref.ratio, 1)}倍${ref.name}大小`;
    } else {
      描述 = `约${ref.name}的${round(ref.ratio * 100, 1)}%`;
    }
    
    references.push({
      参照物: ref.name,
      描述,
      比例: round(ref.ratio, 2),
    });
  }
  
  return references;
}

/**
 * 查找物品相对于角色身体部位的参照
 */
function findBodyPartReferences(
  itemSize: number,
  characterScale: number
): ItemRelativeReference[] {
  const references: ItemRelativeReference[] = [];
  
  // 角色缩放后的身体部位尺寸
  const scaledParts: Record<string, number> = {};
  for (const [name, size] of Object.entries(BASE_BODY_PARTS)) {
    scaledParts[name] = size * characterScale;
  }
  
  // 与物品尺寸比较
  const sorted = Object.entries(scaledParts)
    .filter(([name]) => !name.includes('重量') && !name.includes('容积') && !name.includes('面积'))
    .map(([name, size]) => ({
      name,
      size,
      ratio: itemSize / size,
      diff: Math.abs(Math.log10(itemSize / size)),
    }))
    .sort((a, b) => a.diff - b.diff);
  
  // 取最相近的几个
  for (let i = 0; i < Math.min(3, sorted.length); i++) {
    const ref = sorted[i];
    let 描述: string;
    
    if (ref.ratio >= 0.8 && ref.ratio <= 1.2) {
      描述 = `约等于角色的${ref.name}`;
    } else if (ref.ratio > 1) {
      描述 = `约角色${ref.name}的${round(ref.ratio, 1)}倍`;
    } else {
      描述 = `约角色${ref.name}的${round(ref.ratio * 100, 1)}%`;
    }
    
    references.push({
      参照物: `角色${ref.name}`,
      描述,
      比例: round(ref.ratio, 2),
    });
  }
  
  return references;
}

// ==================== 互动计算 ====================

/**
 * 计算物品的互动可能性
 */
function calculateInteractions(
  item: ItemDefinition,
  scaledDimensions: ItemDimensions,
  characterScale: number
): ItemInteraction[] {
  const interactions: ItemInteraction[] = [];
  
  // 角色的手掌尺寸
  const handLength = BASE_BODY_PARTS.手掌长 * characterScale;
  
  // 物品的主要尺寸（取最大维度）
  const itemMainSize = Math.max(
    scaledDimensions.长 || 0,
    scaledDimensions.宽 || 0,
    scaledDimensions.高 || 0,
    scaledDimensions.直径 || 0
  );
  
  // 物品与手掌的比例
  const handRatio = itemMainSize / handLength;
  
  // 判断各种互动
  
  // 1. 单手握持
  if (handRatio <= 0.8) {
    interactions.push({
      名称: '单手握持',
      可行: true,
      描述: '可以轻松单手握住',
    });
  } else if (handRatio <= 1.5) {
    interactions.push({
      名称: '单手握持',
      可行: true,
      描述: '可以单手握住，但需要用力',
    });
  } else {
    interactions.push({
      名称: '单手握持',
      可行: false,
      描述: `物品太大，无法单手握住（物品约${round(handRatio, 1)}倍于手掌）`,
    });
  }
  
  // 2. 双手握持
  if (handRatio <= 3) {
    interactions.push({
      名称: '双手握持',
      可行: true,
      描述: '可以双手握住',
    });
  } else {
    interactions.push({
      名称: '双手握持',
      可行: false,
      描述: `物品太大，双手也无法握住`,
    });
  }
  
  // 3. 指尖捏取
  if (handRatio <= 0.3) {
    interactions.push({
      名称: '指尖捏取',
      可行: true,
      描述: '可以用两指轻松捏起',
    });
  } else if (handRatio <= 0.5) {
    interactions.push({
      名称: '指尖捏取',
      可行: true,
      描述: '可以用手指捏住',
    });
  } else {
    interactions.push({
      名称: '指尖捏取',
      可行: false,
      描述: '物品太大，无法用手指捏取',
    });
  }
  
  // 4. 吞咽（如果是食物）
  if (item.类型 === '食物') {
    const mouthWidth = BASE_BODY_PARTS.嘴巴宽度 * characterScale;
    const mouthRatio = itemMainSize / mouthWidth;
    
    if (mouthRatio <= 0.5) {
      interactions.push({
        名称: '一口吞下',
        可行: true,
        描述: '可以一口吞下',
      });
    } else if (mouthRatio <= 1.5) {
      interactions.push({
        名称: '咬食',
        可行: true,
        描述: '需要分几口吃完',
      });
    } else {
      interactions.push({
        名称: '咬食',
        可行: false,
        描述: '物品太大，无法直接咬食',
      });
    }
  }
  
  // 5. 穿戴（如果是配饰或服装）
  if (item.类型 === '配饰' || item.类型 === '服装') {
    // 假设物品会随角色一起缩放
    if (item.随身携带) {
      interactions.push({
        名称: '穿戴',
        可行: true,
        描述: '随身物品，已随角色一起缩放，可正常穿戴',
      });
    } else if (handRatio >= 0.8 && handRatio <= 1.2) {
      // 外来物品，尺寸合适
      interactions.push({
        名称: '穿戴',
        可行: true,
        描述: '尺寸合适，可以穿戴',
      });
    } else if (handRatio < 0.8) {
      // 外来物品，太小
      interactions.push({
        名称: '穿戴',
        可行: false,
        描述: '物品太小，无法穿戴',
      });
    } else {
      // 外来物品，太大
      interactions.push({
        名称: '穿戴',
        可行: false,
        描述: '物品太大，无法穿戴',
      });
    }
  }
  
  return interactions;
}

// ==================== 特殊效果 ====================

/**
 * 计算物品的特殊效果
 */
function calculateSpecialEffects(
  item: ItemDefinition,
  scaledDimensions: ItemDimensions,
  characterScale: number
): string[] {
  const effects: string[] = [];
  
  const itemMainSize = Math.max(
    scaledDimensions.长 || 0,
    scaledDimensions.宽 || 0,
    scaledDimensions.高 || 0,
    scaledDimensions.直径 || 0
  );
  
  // 基于材质的特殊效果
  if (item.材质 === '玻璃' && itemMainSize > 10) {
    effects.push('玻璃材质在巨大尺寸下可能因自重碎裂');
  }
  
  if (item.材质 === '金属' && scaledDimensions.重量 && scaledDimensions.重量 > 1000) {
    effects.push('金属物品重量巨大，落地会造成严重冲击');
  }
  
  if (item.材质 === '液体' && scaledDimensions.重量 && scaledDimensions.重量 > 100) {
    effects.push('液体量巨大，倾倒会形成洪水');
  }
  
  // 基于尺寸的特殊效果
  if (itemMainSize > 100) {
    effects.push('物品已达到建筑级别尺寸');
  }
  if (itemMainSize > 1000) {
    effects.push('物品可能影响局部气候');
  }
  if (itemMainSize > 10000) {
    effects.push('物品产生可观测的引力场');
  }
  
  // 基于物品类型的特殊效果
  if (item.类型 === '交通工具' && characterScale > 10) {
    effects.push('交通工具已成为玩具大小，可单手把玩');
  }
  if (item.类型 === '建筑' && characterScale > 100) {
    effects.push('建筑物如同积木般微小');
  }
  
  return effects;
}

// ==================== 主计算函数 ====================

/**
 * 计算单个物品的缩放数据
 * @param item 物品定义
 * @param characterScale 角色的缩放倍率
 * @param isCarried 是否是随身物品（随角色一起缩放）
 */
export function calculateItem(
  item: ItemDefinition,
  characterScale: number,
  isCarried: boolean = false
): ItemCalculation {
  // 计算缩放后的尺寸
  const scale = isCarried || item.随身携带 ? characterScale : 1;
  
  const scaledDimensions: ItemDimensions = {};
  const scaledFormatted: Record<string, string> = {};
  
  if (item.原始尺寸.长 !== undefined) {
    scaledDimensions.长 = item.原始尺寸.长 * scale;
    scaledFormatted.长 = formatLength(scaledDimensions.长);
  }
  if (item.原始尺寸.宽 !== undefined) {
    scaledDimensions.宽 = item.原始尺寸.宽 * scale;
    scaledFormatted.宽 = formatLength(scaledDimensions.宽);
  }
  if (item.原始尺寸.高 !== undefined) {
    scaledDimensions.高 = item.原始尺寸.高 * scale;
    scaledFormatted.高 = formatLength(scaledDimensions.高);
  }
  if (item.原始尺寸.直径 !== undefined) {
    scaledDimensions.直径 = item.原始尺寸.直径 * scale;
    scaledFormatted.直径 = formatLength(scaledDimensions.直径);
  }
  if (item.原始尺寸.重量 !== undefined) {
    // 重量按体积缩放（三次方）
    scaledDimensions.重量 = item.原始尺寸.重量 * Math.pow(scale, 3);
    scaledFormatted.重量 = formatWeight(scaledDimensions.重量);
  }
  
  // 物品的主要尺寸
  const itemMainSize = Math.max(
    scaledDimensions.长 || 0,
    scaledDimensions.宽 || 0,
    scaledDimensions.高 || 0,
    scaledDimensions.直径 || 0
  );
  
  // 计算相对参照
  const 角色视角 = findBodyPartReferences(itemMainSize, characterScale);
  const 普通人视角 = findSimilarReferences(itemMainSize);
  
  // 计算互动可能性
  const 互动可能性 = calculateInteractions(item, scaledDimensions, characterScale);
  
  // 计算特殊效果
  const 特殊效果 = calculateSpecialEffects(item, scaledDimensions, characterScale);
  
  return {
    定义: item,
    缩放尺寸: scaledDimensions,
    缩放尺寸_格式化: scaledFormatted,
    角色视角,
    普通人视角,
    互动可能性,
    特殊效果: 特殊效果.length > 0 ? 特殊效果 : undefined,
  };
}

/**
 * 计算角色的所有物品
 * @param characterName 角色名
 * @param characterScale 角色倍率
 * @param items 物品列表
 */
export function calculateCharacterItems(
  characterName: string,
  characterScale: number,
  items: CharacterItems
): CharacterItemsCalculation {
  const result: CharacterItemsCalculation = {
    角色名: characterName,
    倍率: characterScale,
    物品: {},
  };
  
  for (const [itemId, item] of Object.entries(items)) {
    result.物品[itemId] = calculateItem(item, characterScale, item.随身携带);
  }
  
  return result;
}

/**
 * 生成物品提示词
 */
export function generateItemsPrompt(
  characterName: string,
  itemsCalc: CharacterItemsCalculation
): string {
  const lines: string[] = [];
  
  lines.push(`【${characterName}的物品】`);
  lines.push('');
  
  for (const [_itemId, calc] of Object.entries(itemsCalc.物品)) {
    const item = calc.定义;
    lines.push(`## ${item.名称}`);
    
    // 尺寸信息
    lines.push(`类型：${item.类型 || '其他'} | 材质：${item.材质 || '未知'}`);
    
    const sizeStr = Object.entries(calc.缩放尺寸_格式化)
      .map(([k, v]) => `${k}:${v}`)
      .join(' ');
    lines.push(`缩放后尺寸：${sizeStr}`);
    
    // 相对参照
    if (calc.角色视角.length > 0) {
      lines.push(`角色视角：${calc.角色视角[0].描述}`);
    }
    if (calc.普通人视角.length > 0) {
      lines.push(`普通人视角：${calc.普通人视角[0].描述}`);
    }
    
    // 互动可能性
    const possibleInteractions = calc.互动可能性.filter(i => i.可行);
    const impossibleInteractions = calc.互动可能性.filter(i => !i.可行);
    
    if (possibleInteractions.length > 0) {
      lines.push(`可行互动：${possibleInteractions.map(i => i.名称).join('、')}`);
    }
    if (impossibleInteractions.length > 0) {
      lines.push(`不可行：${impossibleInteractions.map(i => `${i.名称}(${i.描述})`).join('、')}`);
    }
    
    // 特殊效果
    if (calc.特殊效果 && calc.特殊效果.length > 0) {
      lines.push(`特殊效果：${calc.特殊效果.join('；')}`);
    }
    
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * 格式化物品数据为简洁版本
 */
export function formatItemsCompact(
  itemsCalc: CharacterItemsCalculation
): string {
  const parts: string[] = [];
  
  for (const [_, calc] of Object.entries(itemsCalc.物品)) {
    const item = calc.定义;
    const sizeStr = Object.entries(calc.缩放尺寸_格式化)
      .slice(0, 2)
      .map(([k, v]) => `${k}:${v}`)
      .join(' ');
    parts.push(`${item.名称}(${sizeStr})`);
  }
  
  return parts.join(' | ');
}
