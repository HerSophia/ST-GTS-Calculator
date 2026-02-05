/**
 * 巨大娘计算器 - MVU 变量结构定义
 * 
 * 使用 zod 4 定义 stat_data.巨大娘 的结构
 * 这个 schema 会被注册到 MVU，用于验证和转换变量
 * 
 * 注意：zod (z) 在酒馆助手环境中是全局可用的，无需导入
 * 
 * @module schema
 */

// zod (z) 是全局变量，无需导入

/**
 * 身高历史记录
 */
const HeightHistorySchema = z.object({
  身高: z.coerce.number(),
  身高_格式化: z.string().prefault(''),
  时间戳: z.coerce.number().prefault(() => Date.now()),
  时间点: z.string().prefault(''),
  原因: z.string().prefault(''),
  变化: z.enum(['增大', '缩小']).optional(),
  变化倍率: z.coerce.number().optional(),
});

/**
 * 实际损害记录（由 LLM 填写）
 */
const ActualDamageSchema = z.object({
  总伤亡人数: z.coerce.number().prefault(0),
  总建筑损毁: z.coerce.number().prefault(0),
  总城市毁灭: z.coerce.number().prefault(0),
  最近行动: z.object({
    描述: z.string(),
    伤亡人数: z.coerce.number().prefault(0),
    建筑损毁: z.coerce.number().prefault(0),
    时间点: z.string().prefault(''),
  }).optional(),
  重大事件: z.array(z.object({
    描述: z.string(),
    伤亡人数: z.coerce.number().prefault(0),
    建筑损毁: z.coerce.number().prefault(0),
    时间点: z.string().prefault(''),
  })).prefault([]),
}).prefault({
  总伤亡人数: 0,
  总建筑损毁: 0,
  总城市毁灭: 0,
  重大事件: [],
});

/**
 * 单个角色的数据结构
 */
const CharacterSchema = z.object({
  /** 当前身高（米） */
  当前身高: z.coerce.number(),
  /** 原始身高（米） */
  原身高: z.coerce.number(),
  /** 变化原因 */
  变化原因: z.string().prefault(''),
  /** 变化时间点 */
  变化时间: z.string().prefault(''),
  /** 自定义部位尺寸（可选，用于单独部位变化） */
  自定义部位: z.record(z.string(), z.coerce.number()).prefault({}),
  /** 计算数据（脚本自动生成，只读） */
  _计算数据: z.any().nullable().prefault(null),
  /** 预估损害数据（脚本自动生成，只读） */
  _损害数据: z.any().nullable().prefault(null),
  /** 实际损害记录（LLM 填写） */
  _实际损害: ActualDamageSchema.optional(),
  /** 身高历史（脚本自动生成，只读） */
  _身高历史: z.array(HeightHistorySchema).prefault([]),
});

/**
 * 场景数据结构
 */
const SceneSchema = z.object({
  /** 当前场景名称 */
  当前场景: z.string().prefault('大城市'),
  /** 场景原因/说明 */
  场景原因: z.string().prefault(''),
});

/**
 * 巨大娘计算器的完整变量结构
 * 
 * 变量路径示例：
 * - `巨大娘._场景.当前场景` - 场景设置
 * - `巨大娘.角色.络络.当前身高` - 角色身高
 * - `巨大娘.角色.络络.自定义部位.乳房高度` - 自定义部位尺寸
 */
export const Schema = z.object({
  /** 场景设置 */
  _场景: SceneSchema.prefault({ 当前场景: '大城市', 场景原因: '' }),
  
  /** 互动限制（脚本自动计算，只读） */
  _互动限制: z.record(z.string(), z.any()).prefault({}),
  
  /** 
   * 角色数据 - 使用 record 支持动态添加角色
   * 键为角色名，值为角色数据
   */
  角色: z.record(
    z.string().describe('角色名'),
    CharacterSchema
  ).prefault({}),
});

// 导出类型（使用 z.infer 从 schema 推导类型）
export type GiantessCalcSchema = z.infer<typeof Schema>;
export type CharacterSchemaType = z.infer<typeof CharacterSchema>;
export type SceneSchemaType = z.infer<typeof SceneSchema>;
export type HeightHistorySchemaType = z.infer<typeof HeightHistorySchema>;
export type ActualDamageSchemaType = z.infer<typeof ActualDamageSchema>;
