/**
 * 正则服务相关类型定义
 *
 * 注意：TavernRegex 类型已在 @types/function/tavern_regex.d.ts 中全局声明
 * 这里的类型用于本脚本的正则管理
 */

/**
 * 酒馆正则配置
 * 用于创建新的正则规则，与全局 TavernRegex 类型兼容
 */
export interface TavernRegexConfig {
  /** 唯一标识符 */
  id: string;
  /** 显示名称 */
  script_name: string;
  /** 是否启用 */
  enabled: boolean;
  /** 作用范围 */
  scope: 'global' | 'character';
  /** 匹配正则表达式 */
  find_regex: string;
  /** 替换内容 */
  replace_string: string;
  /** 来源过滤 */
  source: {
    user_input: boolean;
    ai_output: boolean;
    slash_command: boolean;
    world_info: boolean;
  };
  /** 目标过滤 */
  destination: {
    /** 是否影响显示 */
    display: boolean;
    /** 是否影响提示词 */
    prompt: boolean;
  };
  /** 编辑时是否运行 */
  run_on_edit: boolean;
  /** 最小深度 */
  min_depth: number | null;
  /** 最大深度 */
  max_depth: number | null;
}

/** 正则注册选项 */
export interface RegexRegistrationOptions {
  /** 是否强制更新（即使已存在） */
  force?: boolean;
  /** 注册失败时是否静默（不抛出错误） */
  silent?: boolean;
}

/** 正则注册结果 */
export interface RegexRegistrationResult {
  /** 是否成功 */
  success: boolean;
  /** 是否是新注册的（false 表示已存在） */
  isNew: boolean;
  /** 错误信息（如果有） */
  error?: string;
}

/** 正则服务状态 */
export interface RegexServiceState {
  /** 是否已初始化 */
  initialized: boolean;
  /** 已注册的正则 ID 列表 */
  registeredIds: string[];
  /** 最后一次操作的错误 */
  lastError?: string;
}
