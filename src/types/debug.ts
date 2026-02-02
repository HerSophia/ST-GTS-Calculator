/**
 * 巨大娘计算器 - 调试相关类型定义
 */

/**
 * 调试信息中的角色数据
 */
export interface DebugCharacterInfo {
  name: string;
  当前身高?: number;
  当前身高_格式化?: string;
  原身高?: number;
  倍率?: number;
  级别?: string;
  类型: '巨大娘' | '小人' | '未知';
  有计算数据: boolean;
  有损害数据: boolean;
  有实际损害: boolean;
  有身高历史: boolean;
  历史记录数?: number;
  自定义部位?: Record<string, number>;
  /** 预估损害（系统自动计算） */
  预估损害?: {
    破坏力等级: string;
    单步伤亡: string;
    场景: string;
  };
  /** 实际损害（LLM 或用户记录） */
  实际损害?: {
    总伤亡人数?: number;
    总伤亡人数_格式化?: string;
    总建筑损毁?: number;
    最近行动?: string;
    重大事件数?: number;
  };
}

/**
 * MVU 调试信息
 */
export interface MvuDebugInfo {
  mvuAvailable: boolean;
  mvuVersion: string | null;
  prefix: string;
  settings: {
    enabled: boolean;
    autoInject: boolean;
    enableDamageCalculation: boolean;
    damageScenario: string;
    injectWorldviewPrompt: boolean;
  };
  scenario: {
    current: string;
    source: '默认设置' | 'MVU变量';
    reason?: string;
  };
  worldview: {
    id: string;
    name: string;
  };
  messageVariables: {
    hasStatData: boolean;
    hasGiantessData: boolean;
    hasScenarioData: boolean;
    hasInteractionData: boolean;
    giantessCharacters: string[];
    characterDetails: DebugCharacterInfo[];
    rawData: unknown;
  };
  scriptVariables: unknown;
  timestamp: string;
  error?: string;
}
