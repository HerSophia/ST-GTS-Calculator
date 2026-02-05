/**
 * 巨大娘计算器 - MVU 初始化数据定义
 * 
 * 定义 MVU 变量的完整初始化结构，用于世界书 [InitVar] 条目
 * 
 * @module services/worldbook/init-data
 */

/**
 * MVU 初始化变量的角色数据结构
 */
export interface InitCharacterData {
  当前身高: number;
  原身高: number;
  变化原因: string;
  变化时间: string;
  自定义部位: Record<string, number>;
  _计算数据: null;
  _损害数据: null;
  _实际损害: null;
  _身高历史: never[];
}

/**
 * MVU 初始化变量的场景数据结构
 */
export interface InitSceneData {
  当前场景: string;
  场景原因: string;
}

/**
 * MVU 初始化变量的完整结构（新版：角色数据在 `角色` 键下）
 */
export interface InitMvuData {
  _场景: InitSceneData;
  _互动限制: Record<string, never>;
  角色: Record<string, InitCharacterData>;
}

/**
 * 默认的角色数据初始化值
 */
export const DEFAULT_CHARACTER_DATA: InitCharacterData = {
  当前身高: 1.65,
  原身高: 1.65,
  变化原因: '',
  变化时间: '',
  自定义部位: {},
  _计算数据: null,
  _损害数据: null,
  _实际损害: null,
  _身高历史: [],
};

/**
 * 默认的场景数据初始化值
 */
export const DEFAULT_SCENE_DATA: InitSceneData = {
  当前场景: '大城市',
  场景原因: '',
};

/**
 * 完整的 MVU 初始化数据
 * 这是写入世界书 [InitVar] 条目的内容
 * 
 * 注意：新版结构将角色放在 `角色` 键下，支持动态添加
 */
export const DEFAULT_MVU_INIT_DATA: InitMvuData = {
  _场景: DEFAULT_SCENE_DATA,
  _互动限制: {},
  角色: {},  // 空对象，角色会动态添加
};

/**
 * 生成 YAML 格式的初始化数据
 * 用于写入世界书条目的 content 字段
 * 
 * @param prefix 变量前缀，默认为 "巨大娘"
 * @returns YAML 格式的字符串
 */
export function generateInitYaml(prefix: string = '巨大娘'): string {
  // 使用 YAML 格式，角色数据放在 角色 键下
  return `${prefix}:
  _场景:
    当前场景: 大城市
    场景原因: ''
  _互动限制: {}
  角色: {}
`;
}

/**
 * 获取完整的初始化数据对象
 * 
 * @param prefix 变量前缀
 * @returns 带前缀的初始化数据
 */
export function getInitDataWithPrefix(prefix: string = '巨大娘'): Record<string, InitMvuData> {
  return {
    [prefix]: DEFAULT_MVU_INIT_DATA,
  };
}
