/**
 * 巨大娘计算器 - 物品系统类型定义
 */

/**
 * 物品尺寸（单位：米）
 */
export interface ItemDimensions {
  /** 长度 */
  长?: number;
  /** 宽度 */
  宽?: number;
  /** 高度 */
  高?: number;
  /** 直径（用于圆形物品） */
  直径?: number;
  /** 重量（千克） */
  重量?: number;
}

/**
 * 物品类型
 */
export type ItemType =
  | '日用品'      // 手机、钥匙、钱包等
  | '配饰'        // 戒指、项链、耳环等
  | '服装'        // 衣服、鞋子等
  | '食物'        // 食物、饮料等
  | '家具'        // 桌椅、床等
  | '交通工具'    // 车、船、飞机等
  | '建筑'        // 房屋、大厦等
  | '自然物'      // 树、石头等
  | '玩具'        // 玩具、模型等
  | '武器'        // 武器类
  | '工具'        // 工具类
  | '其他';

/**
 * 物品材质（影响互动描写）
 */
export type ItemMaterial =
  | '金属'
  | '玻璃'
  | '塑料'
  | '木材'
  | '布料'
  | '皮革'
  | '橡胶'
  | '石材'
  | '混凝土'
  | '食材'
  | '液体'
  | '其他';

/**
 * 物品定义（用户/LLM 输入）
 */
export interface ItemDefinition {
  /** 物品名称 */
  名称: string;
  /** 原始尺寸 */
  原始尺寸: ItemDimensions;
  /** 物品类型 */
  类型?: ItemType;
  /** 材质 */
  材质?: ItemMaterial;
  /** 描述 */
  描述?: string;
  /** 是否随身携带（随角色一起缩放） */
  随身携带?: boolean;
}

/**
 * 物品相对参照
 */
export interface ItemRelativeReference {
  /** 参照物名称 */
  参照物: string;
  /** 相对大小描述 */
  描述: string;
  /** 比例 */
  比例: number;
}

/**
 * 物品互动可能性
 */
export interface ItemInteraction {
  /** 互动名称 */
  名称: string;
  /** 是否可行 */
  可行: boolean;
  /** 原因/描述 */
  描述: string;
}

/**
 * 计算后的物品数据
 */
export interface ItemCalculation {
  /** 原始物品定义 */
  定义: ItemDefinition;
  /** 缩放后的尺寸 */
  缩放尺寸: ItemDimensions;
  /** 缩放后的尺寸（格式化） */
  缩放尺寸_格式化: Record<string, string>;
  /** 对于角色来说像什么 */
  角色视角: ItemRelativeReference[];
  /** 对于普通人来说像什么 */
  普通人视角: ItemRelativeReference[];
  /** 可能的互动 */
  互动可能性: ItemInteraction[];
  /** 特殊效果（基于材质和尺寸） */
  特殊效果?: string[];
}

/**
 * 角色的物品集合
 */
export interface CharacterItems {
  /** 物品列表（键为物品 ID） */
  [itemId: string]: ItemDefinition;
}

/**
 * 角色物品计算结果
 */
export interface CharacterItemsCalculation {
  /** 角色名 */
  角色名: string;
  /** 角色倍率 */
  倍率: number;
  /** 各物品的计算结果 */
  物品: Record<string, ItemCalculation>;
}

/**
 * 预设物品库
 */
export interface PresetItem {
  /** 物品 ID */
  id: string;
  /** 物品定义 */
  definition: ItemDefinition;
}
