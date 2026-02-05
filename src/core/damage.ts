/**
 * 巨大娘计算器 - 损害计算模块
 * 计算巨大娘行动可能造成的破坏
 */

import type {
  FootprintImpact,
  StepDamage,
  MacroDestruction,
  DamageCalculation,
} from '../types';
import { formatLength, formatArea, round } from './formatter';
import { REFERENCE_OBJECTS } from './constants';

// 重新导出类型，保持向后兼容
export type { FootprintImpact, StepDamage, MacroDestruction, DamageCalculation };

// ==================== 常量定义 ====================

/**
 * 人口密度参考（人/平方公里）
 */
export const POPULATION_DENSITY: Record<string, number> = {
  荒野: 1,
  乡村: 50,
  郊区: 500,
  小城市: 3000,
  中等城市: 5000,
  大城市: 10000,
  超大城市中心: 25000,
  东京市中心: 15000,
  香港: 27000,
  马尼拉: 43000, // 世界最密集之一
  // 特殊室内场景
  住宅内: 40000, // 约 0.04 人/平方米，相当于 100 平米住宅 4 人
  公寓楼内: 80000, // 约 0.08 人/平方米，密集住宅
  办公楼内: 100000, // 约 0.1 人/平方米，工作时间的办公室
  体育馆内: 500000, // 约 0.5 人/平方米，演唱会等密集场合
  // 特殊场景
  巨大娘体内: 0, // 体内场景，伤亡计算方式不同
};

/**
 * 建筑密度参考（建筑数/平方公里）
 */
export const BUILDING_DENSITY: Record<string, number> = {
  荒野: 0,
  乡村: 20,
  郊区: 200,
  小城市: 500,
  中等城市: 800,
  大城市: 1200,
  超大城市中心: 2000,
  // 室内场景（已在建筑内部，无建筑损毁）
  住宅内: 0,
  公寓楼内: 0,
  办公楼内: 0,
  体育馆内: 0,
  巨大娘体内: 0,
};

/**
 * 地理尺度参考
 */
export const GEOGRAPHIC_SCALES: Record<string, { size: number; description: string }> = {
  // 街道级别
  街道: { size: 0.01, description: '一条普通街道' },
  街区: { size: 0.05, description: '一个居民街区' },
  
  // 城区级别  
  小型城区: { size: 1, description: '约1平方公里的城区' },
  中型城区: { size: 5, description: '约5平方公里的城区' },
  大型城区: { size: 20, description: '约20平方公里的城区' },
  
  // 城市级别
  小城市: { size: 50, description: '小型城市' },
  中等城市: { size: 200, description: '中等城市' },
  大城市: { size: 600, description: '大型城市' },
  超大城市: { size: 2000, description: '超大城市（如东京都市圈）' },
  
  // 国家级别
  小国: { size: 1000, description: '小型国家' },
  中等国家: { size: 100000, description: '中等国家' },
  大国: { size: 1000000, description: '大型国家' },
  
  // 大陆级别
  小型大陆: { size: 10000000, description: '如澳大利亚' },
  大型大陆: { size: 50000000, description: '如亚欧大陆' },
  
  // 星球级别
  地球表面积: { size: 510000000, description: '地球总表面积' },
  地球陆地: { size: 150000000, description: '地球陆地面积' },
};

/**
 * 天体数据
 */
export const CELESTIAL_DATA = {
  // 地球
  地球: {
    直径: 12742000,
    人口: 8000000000,
    城市数量: 10000,
  },
  // 太阳系
  太阳系: {
    行星数量: 8,
    矮行星数量: 5,
    卫星数量: 200,
  },
  // 银河系
  银河系: {
    直径: 100000 * 9.461e15, // 光年转米
    恒星数量: 200000000000, // 2000亿
    行星估计: 100000000000, // 1000亿
  },
  // 可观测宇宙
  可观测宇宙: {
    直径: 93000000000 * 9.461e15, // 930亿光年
    星系数量: 2000000000000, // 2万亿
  },
};

// ==================== 辅助函数 ====================

/**
 * 格式化大数字
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1e12) {
    return `${round(num / 1e12)}万亿`;
  }
  if (num >= 1e8) {
    return `${round(num / 1e8)}亿`;
  }
  if (num >= 1e4) {
    return `${round(num / 1e4)}万`;
  }
  if (num >= 1000) {
    return `${round(num / 1000)}千`;
  }
  return `${round(num)}`;
}

/**
 * 格式化伤亡人数
 */
export function formatCasualties(min: number, max: number): string {
  if (min === max) {
    return formatLargeNumber(min) + '人';
  }
  if (max < 10) {
    return `${round(min)}-${round(max)}人`;
  }
  return `${formatLargeNumber(min)}-${formatLargeNumber(max)}人`;
}

/**
 * 根据伤亡人数生成描述
 */
function getCasualtyDescription(casualties: number): string {
  if (casualties < 1) return '基本无伤亡';
  if (casualties < 10) return '少量伤亡';
  if (casualties < 100) return '数十人伤亡';
  if (casualties < 1000) return '数百人伤亡';
  if (casualties < 10000) return '数千人伤亡，相当于一场严重事故';
  if (casualties < 100000) return '数万人伤亡，相当于一场大型灾难';
  if (casualties < 1000000) return '数十万人伤亡，相当于一场毁灭性灾难';
  if (casualties < 10000000) return '数百万人伤亡，相当于一座大城市人口';
  if (casualties < 100000000) return '数千万人伤亡，相当于一个中等国家人口';
  if (casualties < 1000000000) return '数亿人伤亡，相当于一个大国人口';
  return '数十亿人伤亡，人类文明级别灾难';
}

/**
 * 根据建筑损毁数量生成描述
 */
function getBuildingDescription(buildings: number): string {
  if (buildings < 1) return '基本无损坏';
  if (buildings < 10) return '少量建筑损毁';
  if (buildings < 100) return '数十栋建筑损毁';
  if (buildings < 1000) return '数百栋建筑损毁，约等于一个小区';
  if (buildings < 10000) return '数千栋建筑损毁，约等于一个城区';
  if (buildings < 100000) return '数万栋建筑损毁，约等于一座城市';
  return '数十万栋以上建筑损毁，多座城市被夷平';
}

/**
 * 确定破坏力等级
 */
function determineDestructionLevel(
  heightMeters: number,
  _footprintArea: number
): { level: string; description: string } {
  // 基于身高判断破坏力等级
  if (heightMeters < 10) {
    return { level: '微型', description: '可造成局部破坏，类似小型事故' };
  }
  if (heightMeters < 100) {
    return { level: '建筑级', description: '可轻易破坏建筑物' };
  }
  if (heightMeters < 1000) {
    return { level: '街区级', description: '一步可跨越多个街区' };
  }
  if (heightMeters < 10000) {
    return { level: '城区级', description: '行走即可摧毁整个城区' };
  }
  if (heightMeters < 100000) {
    return { level: '城市级', description: '一脚可踏平一座城市' };
  }
  if (heightMeters < 1000000) {
    return { level: '国家级', description: '跨步可横跨国家' };
  }
  if (heightMeters < REFERENCE_OBJECTS.地球直径) {
    return { level: '大陆级', description: '可轻易横跨大陆' };
  }
  if (heightMeters < REFERENCE_OBJECTS.太阳直径) {
    return { level: '行星级', description: '行星如玩具般大小' };
  }
  if (heightMeters < REFERENCE_OBJECTS.日地距离_1AU) {
    return { level: '恒星级', description: '恒星如灯泡般大小' };
  }
  if (heightMeters < REFERENCE_OBJECTS.光年) {
    return { level: '星系级', description: '可在星系间穿行' };
  }
  return { level: '宇宙级', description: '超越已知宇宙尺度' };
}

/**
 * 计算特殊物理效应
 */
function calculateSpecialEffects(heightMeters: number, _scale: number): string[] {
  const effects: string[] = [];
  
  if (heightMeters >= 100) {
    effects.push('脚步引发局部地震');
  }
  if (heightMeters >= 1000) {
    effects.push('行走产生强风暴');
    effects.push('脚步可引发海啸');
  }
  if (heightMeters >= 10000) {
    effects.push('身体影响局部天气');
    effects.push('呼吸产生飓风');
  }
  if (heightMeters >= 100000) {
    effects.push('头部进入云层/平流层');
    effects.push('体温影响区域气候');
  }
  if (heightMeters >= 1000000) {
    effects.push('身体产生可观测引力场');
    effects.push('可能影响地球自转');
  }
  if (heightMeters >= REFERENCE_OBJECTS.地球直径) {
    effects.push('质量可能形成行星级引力');
    effects.push('存在即可改变轨道');
  }
  if (heightMeters >= REFERENCE_OBJECTS.太阳直径) {
    effects.push('质量接近或超过恒星');
    effects.push('可能引发核聚变反应');
  }
  if (heightMeters >= REFERENCE_OBJECTS.日地距离_1AU) {
    effects.push('引力可撕裂星系结构');
  }
  
  return effects;
}

/**
 * 计算宏观破坏（超大规模）
 */
function calculateMacroDestruction(
  heightMeters: number,
  footprintArea: number // 平方公里
): MacroDestruction | null {
  // 只有达到城市级别以上才计算宏观破坏
  if (heightMeters < 10000) {
    return null;
  }
  
  const result: MacroDestruction = {
    等级: 'city',
    等级名称: '城市级',
    描述: '',
    城市: null,
    国家: null,
    大陆: null,
    行星: null,
    恒星: null,
    星系: null,
  };
  
  // 城市毁灭（假设平均城市200平方公里）
  const avgCitySize = 200; // 平方公里
  if (footprintArea >= 1) {
    const cities = footprintArea / avgCitySize;
    if (cities >= 0.01) {
      result.城市 = {
        数量: cities,
        格式化: cities >= 1 ? `${round(cities)}座城市` : `${round(cities * 100)}%的城市`,
      };
    }
  }
  
  // 国家毁灭（假设平均国家100000平方公里）
  const avgCountrySize = 100000;
  if (footprintArea >= avgCountrySize * 0.1) {
    const countries = footprintArea / avgCountrySize;
    result.等级 = 'country';
    result.等级名称 = '国家级';
    result.国家 = {
      数量: countries,
      格式化: countries >= 1 ? `${round(countries)}个国家` : `${round(countries * 100)}%的国家领土`,
    };
  }
  
  // 大陆毁灭
  const avgContinentSize = 30000000;
  if (footprintArea >= avgContinentSize * 0.1) {
    const continents = footprintArea / avgContinentSize;
    result.等级 = 'continent';
    result.等级名称 = '大陆级';
    result.大陆 = {
      数量: continents,
      格式化: continents >= 1 ? `${round(continents)}个大陆` : `${round(continents * 100)}%的大陆`,
    };
  }
  
  // 行星毁灭（基于身高与地球直径对比）
  if (heightMeters >= REFERENCE_OBJECTS.地球直径 * 0.1) {
    const planetRatio = heightMeters / REFERENCE_OBJECTS.地球直径;
    result.等级 = 'planet';
    result.等级名称 = '行星级';
    result.行星 = {
      数量: Math.pow(planetRatio, 3), // 体积比
      格式化: planetRatio >= 1 
        ? `可轻易摧毁${round(Math.pow(planetRatio, 3))}个地球大小的行星` 
        : `可严重破坏行星表面`,
    };
  }
  
  // 恒星毁灭
  if (heightMeters >= REFERENCE_OBJECTS.太阳直径 * 0.1) {
    const starRatio = heightMeters / REFERENCE_OBJECTS.太阳直径;
    result.等级 = 'star';
    result.等级名称 = '恒星级';
    result.恒星 = {
      数量: Math.pow(starRatio, 3),
      格式化: starRatio >= 1
        ? `可摧毁${formatLargeNumber(Math.pow(starRatio, 3))}个太阳大小的恒星`
        : `可严重影响恒星`,
    };
  }
  
  // 星系毁灭
  const galaxyDiameter = CELESTIAL_DATA.银河系.直径;
  if (heightMeters >= galaxyDiameter * 0.001) {
    const galaxyRatio = heightMeters / galaxyDiameter;
    result.等级 = 'galaxy';
    result.等级名称 = '星系级';
    
    // 估算可影响的恒星数量
    const starsAffected = CELESTIAL_DATA.银河系.恒星数量 * Math.pow(galaxyRatio, 3);
    result.星系 = {
      数量: galaxyRatio >= 1 ? Math.pow(galaxyRatio, 3) : galaxyRatio,
      格式化: galaxyRatio >= 1
        ? `可摧毁${formatLargeNumber(Math.pow(galaxyRatio, 3))}个银河系大小的星系`
        : `一步可毁灭${formatLargeNumber(starsAffected)}颗恒星`,
    };
  }
  
  // 宇宙级
  const universeDiameter = CELESTIAL_DATA.可观测宇宙.直径;
  if (heightMeters >= universeDiameter * 0.01) {
    result.等级 = 'universe';
    result.等级名称 = '宇宙级';
    result.描述 = '已超越可观测宇宙尺度，破坏力无法估量';
  }
  
  // 生成描述
  if (!result.描述) {
    result.描述 = `达到${result.等级名称}破坏力`;
  }
  
  return result;
}

// ==================== 主计算函数 ====================

/**
 * 损害计算选项
 */
export interface DamageCalculationOptions {
  /** 场景类型（用于确定默认密度） */
  scenario?: keyof typeof POPULATION_DENSITY;
  /** 自定义人群密度（人/平方公里），优先级高于场景预设 */
  customPopulationDensity?: number;
  /** 自定义建筑密度（栋/平方公里），优先级高于场景预设 */
  customBuildingDensity?: number;
}

/**
 * 计算巨大娘造成的损害
 * @param currentHeight 当前身高（米）
 * @param originalHeight 原身高（米）
 * @param scenarioOrOptions 场景类型或计算选项
 */
export function calculateDamage(
  currentHeight: number,
  originalHeight: number = 1.65,
  scenarioOrOptions: keyof typeof POPULATION_DENSITY | DamageCalculationOptions = '大城市'
): DamageCalculation {
  // 解析参数
  let scenario: keyof typeof POPULATION_DENSITY = '大城市';
  let customPopDensity: number | undefined;
  let customBuildDensity: number | undefined;
  
  if (typeof scenarioOrOptions === 'string') {
    scenario = scenarioOrOptions;
  } else {
    scenario = scenarioOrOptions.scenario || '大城市';
    customPopDensity = scenarioOrOptions.customPopulationDensity;
    customBuildDensity = scenarioOrOptions.customBuildingDensity;
  }
  
  const scale = currentHeight / originalHeight;
  
  // 计算足迹数据
  // 假设足长是身高的 1/7，足宽是足长的 0.4
  const footLength = currentHeight / 7;
  const footWidth = footLength * 0.4;
  const footprintArea = footLength * footWidth; // 平方米
  const footprintAreaKm2 = footprintArea / 1e6; // 平方公里
  const footprintDiameter = Math.sqrt(footprintArea); // 等效直径
  
  const footprint: FootprintImpact = {
    足迹面积: footprintArea,
    足迹面积_格式化: formatArea(footprintArea),
    足迹直径: footprintDiameter,
    足迹直径_格式化: formatLength(footprintDiameter),
  };
  
  // 获取场景的人口密度和建筑密度
  // 自定义密度优先级高于场景预设
  const popDensity = customPopDensity ?? (POPULATION_DENSITY[scenario] || POPULATION_DENSITY['大城市']);
  const buildDensity = customBuildDensity ?? (BUILDING_DENSITY[scenario] || BUILDING_DENSITY['大城市']);
  
  // 计算单步损害
  // 人口伤亡（考虑20%-80%的逃生率，取决于速度和预警）
  const maxCasualties = footprintAreaKm2 * popDensity;
  const minCasualties = maxCasualties * 0.2; // 假设最好情况下80%逃生
  
  // 建筑损毁
  const maxBuildings = footprintAreaKm2 * buildDensity;
  const minBuildings = maxBuildings * 0.5; // 边缘建筑可能只是损坏
  
  // 街道损毁（假设每0.01平方公里有1条主要街道）
  const streets = footprintAreaKm2 / 0.01;
  
  // 城区损毁
  let districtCount = 0;
  let districtLevel = '无';
  if (footprintAreaKm2 >= 0.05) {
    districtCount = footprintAreaKm2 / 1; // 每平方公里约1个城区
    if (districtCount < 1) {
      districtLevel = '部分城区';
    } else if (districtCount < 5) {
      districtLevel = '多个城区';
    } else {
      districtLevel = '大片城区';
    }
  }
  
  const stepDamage: StepDamage = {
    小人伤亡: {
      最小估计: minCasualties,
      最大估计: maxCasualties,
      格式化: formatCasualties(minCasualties, maxCasualties),
      描述: getCasualtyDescription((minCasualties + maxCasualties) / 2),
    },
    建筑损毁: {
      最小估计: minBuildings,
      最大估计: maxBuildings,
      格式化: maxBuildings < 1 
        ? '不到1栋' 
        : `${formatLargeNumber(minBuildings)}-${formatLargeNumber(maxBuildings)}栋`,
      描述: getBuildingDescription((minBuildings + maxBuildings) / 2),
    },
    街道损毁: {
      数量: streets,
      格式化: streets < 1 ? '不到1条' : `约${formatLargeNumber(streets)}条`,
    },
    城区损毁: {
      数量: districtCount,
      格式化: districtCount < 0.1 ? '微乎其微' : `约${round(districtCount, 1)}个`,
      等级: districtLevel,
    },
  };
  
  // 计算各场景下的伤亡
  const scenarioCasualties: Record<string, { 伤亡: number; 格式化: string }> = {};
  for (const [name, density] of Object.entries(POPULATION_DENSITY)) {
    const casualties = footprintAreaKm2 * density * 0.5; // 取中间值
    scenarioCasualties[name] = {
      伤亡: casualties,
      格式化: formatLargeNumber(casualties) + '人',
    };
  }
  
  // 计算宏观破坏
  const macroDestruction = calculateMacroDestruction(currentHeight, footprintAreaKm2);
  
  // 确定破坏力等级
  const { level, description } = determineDestructionLevel(currentHeight, footprintAreaKm2);
  
  // 计算特殊效应
  const specialEffects = calculateSpecialEffects(currentHeight, scale);
  
  return {
    身高: currentHeight,
    身高_格式化: formatLength(currentHeight, scale > 1e10),
    倍率: round(scale),
    
    足迹: footprint,
    单步损害: stepDamage,
    各场景伤亡: scenarioCasualties,
    宏观破坏: macroDestruction,
    
    破坏力等级: level,
    破坏力描述: description,
    特殊效应: specialEffects,
    
    _计算时间: Date.now(),
  };
}

/**
 * 生成损害提示词
 */
export function generateDamagePrompt(
  characterName: string,
  damage: DamageCalculation
): string {
  const lines: string[] = [];
  
  lines.push(`【${characterName}的破坏力数据】`);
  lines.push(`当前身高：${damage.身高_格式化}（${damage.倍率}倍）`);
  lines.push(`破坏力等级：${damage.破坏力等级} - ${damage.破坏力描述}`);
  lines.push('');
  
  lines.push(`【足迹影响】`);
  lines.push(`- 足迹面积：${damage.足迹.足迹面积_格式化}`);
  lines.push(`- 足迹直径：${damage.足迹.足迹直径_格式化}`);
  lines.push('');
  
  lines.push(`【每一步可能造成的损害】（大城市场景）`);
  lines.push(`- 人员伤亡：${damage.单步损害.小人伤亡.格式化}`);
  lines.push(`  ${damage.单步损害.小人伤亡.描述}`);
  lines.push(`- 建筑损毁：${damage.单步损害.建筑损毁.格式化}`);
  lines.push(`  ${damage.单步损害.建筑损毁.描述}`);
  lines.push(`- 街道损毁：${damage.单步损害.街道损毁.格式化}`);
  if (damage.单步损害.城区损毁.数量 > 0) {
    lines.push(`- 城区损毁：${damage.单步损害.城区损毁.格式化}（${damage.单步损害.城区损毁.等级}）`);
  }
  
  // 宏观破坏
  if (damage.宏观破坏) {
    lines.push('');
    lines.push(`【宏观破坏力】${damage.宏观破坏.等级名称}`);
    if (damage.宏观破坏.城市) {
      lines.push(`- 城市毁灭：${damage.宏观破坏.城市.格式化}`);
    }
    if (damage.宏观破坏.国家) {
      lines.push(`- 国家毁灭：${damage.宏观破坏.国家.格式化}`);
    }
    if (damage.宏观破坏.大陆) {
      lines.push(`- 大陆毁灭：${damage.宏观破坏.大陆.格式化}`);
    }
    if (damage.宏观破坏.行星) {
      lines.push(`- 行星破坏：${damage.宏观破坏.行星.格式化}`);
    }
    if (damage.宏观破坏.恒星) {
      lines.push(`- 恒星破坏：${damage.宏观破坏.恒星.格式化}`);
    }
    if (damage.宏观破坏.星系) {
      lines.push(`- 星系破坏：${damage.宏观破坏.星系.格式化}`);
    }
  }
  
  // 特殊效应
  if (damage.特殊效应.length > 0) {
    lines.push('');
    lines.push(`【特殊物理效应】`);
    for (const effect of damage.特殊效应) {
      lines.push(`- ${effect}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * 格式化损害数据为简洁版本（用于提示词注入）
 */
export function formatDamageCompact(damage: DamageCalculation): string {
  const parts: string[] = [];
  
  parts.push(`破坏力:${damage.破坏力等级}`);
  parts.push(`足迹:${damage.足迹.足迹面积_格式化}`);
  parts.push(`单步伤亡:${damage.单步损害.小人伤亡.格式化}`);
  parts.push(`建筑损毁:${damage.单步损害.建筑损毁.格式化}`);
  
  if (damage.宏观破坏) {
    parts.push(`宏观:${damage.宏观破坏.等级名称}`);
  }
  
  if (damage.特殊效应.length > 0) {
    parts.push(`效应:${damage.特殊效应.slice(0, 2).join('/')}`);
  }
  
  return parts.join(' | ');
}
