/**
 * 巨大娘计算器 - 常量定义
 * 基准身高（米）
 */
export const BASE_HEIGHT = 1.75;

/**
 * 身体部位数据（单位：米，基于 1.75m 女性）
 */
export const BASE_BODY_PARTS: Record<string, number> = {
  // 垂直高度
  身高: 1.75,
  眼睛高度: 1.61,
  肩膀高度: 1.40,
  胸部顶端: 1.40,
  胸部底端: 1.23,
  肚脐高度: 1.01,
  臀部高度: 1.01,
  裆部高度: 0.86,
  大腿中部: 0.66,
  小腿肚: 0.45,
  脚踝高度: 0.08,
  大脚趾: 0.02,
  小脚趾: 0.01,

  // 足部
  足长: 0.25,
  足宽: 0.10,
  大脚趾长: 0.045,
  脚趾缝隙: 0.008,

  // 手部
  手掌长: 0.10,
  手掌宽: 0.08,
  手指长: 0.08,
  指尖面积: 0.00007, // 平方米
  指甲厚度: 0.0006,
  指甲宽度: 0.01,

  // 胸部
  乳房高度: 0.14,
  乳房宽度: 0.12,
  乳沟深度: 0.06,
  乳头直径: 0.01,
  单乳重量: 1.06, // kg（特殊：重量）

  // 臀部
  臀部宽度: 0.90,
  臀沟深度: 0.06,
  臀部重量: 26.5, // kg（特殊：重量）

  // 腰部
  腰部宽度: 0.185,
  肚脐直径: 0.015,
  肚脐深度: 0.015,

  // 外阴
  阴阜高度: 0.06,
  阴阜宽度: 0.11,
  大阴唇长: 0.08,
  大阴唇宽: 0.035,
  小阴唇长: 0.05,
  阴蒂长: 0.03,
  阴道口宽: 0.025,

  // 阴道（内部）
  阴道深度_闭合: 0.085,
  阴道深度_扩张: 0.11,
  阴道容积_闭合: 0.0000065, // 立方米
  阴道容积_扩张: 0.0000175,

  // 子宫
  宫颈长: 0.03,
  宫颈直径: 0.022,
  子宫容积: 0.00014, // 立方米
  输卵管长: 0.11,
  输卵管直径: 0.0025,

  // 毛发
  头发直径: 0.00007,
  阴毛直径: 0.00012,
  阴毛长: 0.03,

  // 口腔
  嘴巴宽度: 0.05,
  舌头长: 0.10,
  舌头宽: 0.05,
};

/**
 * 参考物尺寸（单位：米）
 */
export const REFERENCE_OBJECTS: Record<string, number> = {
  // 人类尺度
  普通成年人: 1.70,
  普通男性: 1.75,
  普通女性: 1.65,
  小孩: 1.20,
  婴儿: 0.50,

  // 日常物品
  智能手机: 0.15,
  硬币直径: 0.025,
  硬币厚度: 0.002,
  信用卡: 0.085,
  易拉罐: 0.12,
  矿泉水瓶: 0.22,
  篮球: 0.24,
  足球: 0.22,

  // 家具
  餐桌高度: 0.75,
  椅子高度: 0.45,
  床长度: 2.0,
  沙发长度: 2.5,

  // 交通工具
  轿车长度: 4.5,
  轿车高度: 1.5,
  公交车长度: 12,
  公交车高度: 3.2,
  火车车厢长: 25,
  飞机_客机长: 70,
  航母长度: 330,

  // 建筑
  单层楼高: 3,
  两层楼房: 7,
  十层楼房: 30,
  五十层大楼: 150,
  自由女神像: 46,
  埃菲尔铁塔: 330,
  哈利法塔: 828,

  // 地理（大型）
  云层高度: 2000,
  珠穆朗玛峰: 8848,
  臭氧层高度: 25000,
  国际空间站轨道: 400000,
  大气层顶端: 100000,

  // 天体
  月球直径: 3474000,
  地球直径: 12742000,
  地月距离: 384400000,
  太阳直径: 1392000000,
  土星直径: 116460000,
  木星直径: 139820000,
  日地距离_1AU: 149597870700,
  光年: 9460730472580800,
  银河系直径: 1000000 * 9460730472580800, // 约10万光年
};

/**
 * 昆虫参考（用于小人视角）
 */
export const INSECT_REFERENCES: Record<string, number> = {
  蚂蚁: 0.003,
  蟑螂: 0.03,
  蜜蜂: 0.015,
  苍蝇: 0.007,
  蚊子: 0.006,
  跳蚤: 0.002,
  螨虫: 0.0003,
  细菌: 0.000002,
};

// 类型从 types 模块导入
import type { SizeLevel, TinyLevel } from '../types';

// 重新导出类型，保持向后兼容
export type { SizeLevel, TinyLevel };

export const SIZE_LEVELS: SizeLevel[] = [
  { name: 'Mini级', minScale: 1, maxScale: 10, description: '几米到十几米' },
  { name: '十倍', minScale: 10, maxScale: 100, description: '十几米，建筑如玩具' },
  { name: 'Kilo级', minScale: 100, maxScale: 1000, description: '百米级，城市踩在脚下' },
  { name: '千倍', minScale: 1000, maxScale: 10000, description: '公里级，山脉如石子' },
  { name: 'Mega级_万倍', minScale: 10000, maxScale: 100000, description: '十公里级，触及云层' },
  { name: 'Mega级_十万倍', minScale: 100000, maxScale: 1000000, description: '百公里级，行星尺度' },
  { name: 'Giga级_百万倍', minScale: 1000000, maxScale: 10000000, description: '千公里级，星球如玩具' },
  { name: 'Giga级_千万倍', minScale: 10000000, maxScale: 100000000, description: '万公里级，地球如球' },
  { name: 'Giga级_亿倍', minScale: 100000000, maxScale: 1000000000, description: '十万公里级，地月如近邻' },
  { name: 'Tera级_十亿倍', minScale: 1e9, maxScale: 1e10, description: '百万公里级，恒星如灯泡' },
  { name: 'Tera级_百亿倍', minScale: 1e10, maxScale: 1e11, description: '千万公里级，太阳系穿行' },
  { name: 'Tera级_千亿倍', minScale: 1e11, maxScale: 1e12, description: 'AU级，恒星如尘埃' },
  { name: '星系级_万亿倍', minScale: 1e12, maxScale: 1e13, description: '10AU级' },
  { name: '星系级_十万亿倍', minScale: 1e13, maxScale: 1e16, description: '光年级' },
  { name: '光年级', minScale: 1e16, maxScale: 1e21, description: '星云星系' },
  { name: '宇宙级', minScale: 1e21, maxScale: Infinity, description: '超越可观测宇宙' },
];

export const TINY_LEVELS: TinyLevel[] = [
  { name: '十分之一', scale: 0.1, description: '十几厘米，如宠物' },
  { name: '百分之一', scale: 0.01, description: '不到两厘米，如虫子' },
  { name: '千分之一_毫米级', scale: 0.001, description: '毫米级，蚂蚁如猛兽' },
  { name: '万分之一', scale: 0.0001, description: '肉眼难见' },
  { name: '微米级', scale: 0.000001, description: '细胞尺度' },
  { name: '纳米级', scale: 0.000000001, description: '分子尺度' },
  { name: '皮米级', scale: 0.000000000001, description: '原子尺度' },
];
