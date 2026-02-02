/**
 * 巨大娘计算器 - 损害计算相关类型定义
 */

/**
 * 足迹影响数据
 */
export interface FootprintImpact {
  足迹面积: number;
  足迹面积_格式化: string;
  足迹直径: number;
  足迹直径_格式化: string;
}

/**
 * 单步损害数据
 */
export interface StepDamage {
  小人伤亡: {
    最小估计: number;
    最大估计: number;
    格式化: string;
    描述: string;
  };
  建筑损毁: {
    最小估计: number;
    最大估计: number;
    格式化: string;
    描述: string;
  };
  街道损毁: {
    数量: number;
    格式化: string;
  };
  城区损毁: {
    数量: number;
    格式化: string;
    等级: string;
  };
}

/**
 * 宏观破坏数据（超大规模）
 */
export interface MacroDestruction {
  等级: 'city' | 'country' | 'continent' | 'planet' | 'star' | 'galaxy' | 'universe';
  等级名称: string;
  描述: string;
  /** 可毁灭数量（每一步） */
  城市: { 数量: number; 格式化: string } | null;
  国家: { 数量: number; 格式化: string } | null;
  大陆: { 数量: number; 格式化: string } | null;
  行星: { 数量: number; 格式化: string } | null;
  恒星: { 数量: number; 格式化: string } | null;
  星系: { 数量: number; 格式化: string } | null;
}

/**
 * 各场景伤亡数据
 */
export interface ScenarioCasualty {
  伤亡: number;
  格式化: string;
}

/**
 * 完整损害计算结果
 */
export interface DamageCalculation {
  /** 基础信息 */
  身高: number;
  身高_格式化: string;
  倍率: number;
  /** 足迹数据 */
  足迹: FootprintImpact;
  /** 单步损害（基于选定的人口密度场景） */
  单步损害: StepDamage;
  /** 各场景下的单步伤亡 */
  各场景伤亡: Record<string, ScenarioCasualty>;
  /** 宏观破坏（如果达到相应规模） */
  宏观破坏: MacroDestruction | null;
  /** 破坏力等级 */
  破坏力等级: string;
  破坏力描述: string;
  /** 特殊效应（达到一定规模后的物理效应） */
  特殊效应: string[];
  _计算时间: number;
}

/**
 * 实际损害记录（由 LLM 或用户记录）
 */
export interface ActualDamageRecord {
  /** 累计造成的伤亡 */
  总伤亡人数?: number;
  /** 累计损毁的建筑 */
  总建筑损毁?: number;
  /** 累计毁灭的城市 */
  总城市毁灭?: number;

  /** 最近一次行动 */
  最近行动?: {
    描述: string;
    伤亡人数?: number;
    建筑损毁?: number;
    特殊破坏?: string;
    时间点?: string;
  };

  /** 重大事件列表 */
  重大事件?: Array<{
    描述: string;
    伤亡人数?: number;
    建筑损毁?: number;
    时间点?: string;
  }>;

  /** 备注 */
  备注?: string;
}
