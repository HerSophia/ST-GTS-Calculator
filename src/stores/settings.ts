/**
 * 巨大娘计算器 - 设置 Store（精简版）
 * 只负责状态管理，不包含业务逻辑
 * 
 * @module stores/settings
 */

/** 可用的人口密度场景 */
export const DAMAGE_SCENARIOS = [
  // 户外场景
  '荒野',
  '乡村',
  '郊区',
  '小城市',
  '中等城市',
  '大城市',
  '超大城市中心',
  '东京市中心',
  '香港',
  '马尼拉',
  // 室内场景
  '住宅内',
  '公寓楼内',
  '办公楼内',
  '体育馆内',
  // 特殊场景
  '巨大娘体内',
] as const;

/** 场景描述（供 LLM 和用户参考） */
export const SCENARIO_DESCRIPTIONS: Record<string, string> = {
  // 户外场景
  '荒野': '无人区、沙漠、深山老林等几乎无人的地方',
  '乡村': '农村、小村庄、田野等人口稀少的地区',
  '郊区': '城市边缘的居住区，人口密度较低',
  '小城市': '小型城镇、县城等',
  '中等城市': '普通地级市、中等规模城市',
  '大城市': '省会城市、大型城市的一般区域',
  '超大城市中心': '北上广深、纽约曼哈顿等超大城市的核心区',
  '东京市中心': '东京都心等极高密度城市区域',
  '香港': '香港般的超高密度城市',
  '马尼拉': '世界上人口最密集的城市区域之一',
  // 室内场景
  '住宅内': '普通家庭住宅内部，约 100 平米住 4 人',
  '公寓楼内': '密集住宅楼内，如学生宿舍、公寓',
  '办公楼内': '工作时间的写字楼、办公室',
  '体育馆内': '演唱会、体育比赛等大型集会场所',
  // 特殊场景
  '巨大娘体内': '小人进入巨大娘身体内部（体内探索场景）',
};

export type DamageScenario = (typeof DAMAGE_SCENARIOS)[number];

/** 设置项 Schema */
const Settings = z
  .object({
    // 功能开关
    enabled: z.boolean().default(true),
    debug: z.boolean().default(false),

    // MVU 集成
    variablePrefix: z.string().default('巨大娘'),
    autoInject: z.boolean().default(true),
    injectDepth: z.number().default(9999),
    injectInteractionLimits: z.boolean().default(true),

    // 计算设置
    precision: z.number().default(2),
    maxHistoryRecords: z.number().default(20),

    // 提示词管理
    showVariableUpdateRules: z.boolean().default(true),
    showWritingGuidelines: z.boolean().default(false),
    compactPromptFormat: z.boolean().default(false),

    // 世界观设置
    injectWorldviewPrompt: z.boolean().default(true),
    allowPartialScaling: z.boolean().default(false),

    // ========== 扩展计算系统 ==========
    // 损害计算设置
    enableDamageCalculation: z.boolean().default(false),
    injectDamagePrompt: z.boolean().default(true),
    damageScenario: z.string().default('大城市'),
    showSpecialEffects: z.boolean().default(true),
    showDamagePerCharacter: z.boolean().default(true),
    showDamageSummary: z.boolean().default(true),

    // 物品系统设置
    enableItemsSystem: z.boolean().default(false),
    injectItemsPrompt: z.boolean().default(true),

    // 楼层数据显示设置
    enableMessageDisplay: z.boolean().default(false),
  })
  .prefault({});

export type SettingsType = z.infer<typeof Settings>;

/** 调试日志条目 */
export interface DebugLogEntry {
  time: string;
  type: 'log' | 'warn' | 'error';
  message: string;
}

/**
 * 设置 Store
 * 
 * 职责：
 * - 管理设置状态
 * - 自动持久化到脚本变量
 * - 提供调试日志收集（TODO: Phase 3 移动到 debug service）
 */
export const useSettingsStore = defineStore('giantess-calculator-settings', () => {
  // ========== 核心状态 ==========
  const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));

  // 自动保存设置到脚本变量
  watchEffect(() => {
    insertOrAssignVariables(klona(settings.value), { type: 'script', script_id: getScriptId() });
  });

  // ========== 简单操作 ==========
  const toggle = () => {
    settings.value.enabled = !settings.value.enabled;
  };

  // ========== 日志功能 ==========
  // TODO: Phase 3 - 移动到 services/debug/logger.ts
  
  const debugLogs = ref<DebugLogEntry[]>([]);
  const maxDebugLogs = 50;

  const addDebugLog = (type: 'log' | 'warn' | 'error', ...args: unknown[]) => {
    if (!settings.value.debug) return;
    
    const time = new Date().toLocaleTimeString();
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    debugLogs.value.push({ time, type, message });
    if (debugLogs.value.length > maxDebugLogs) {
      debugLogs.value.shift();
    }
  };

  // 控制台 + UI 日志
  const log = (...args: unknown[]) => {
    if (settings.value.debug) {
      console.log('[GiantessCalc]', ...args);
    }
  };

  const warn = (...args: unknown[]) => {
    console.warn('[GiantessCalc]', ...args);
  };

  const error = (...args: unknown[]) => {
    console.error('[GiantessCalc]', ...args);
  };

  const debugLog = (...args: unknown[]) => {
    if (settings.value.debug) {
      console.log('[GiantessCalc]', ...args);
      addDebugLog('log', ...args);
    }
  };

  const debugWarn = (...args: unknown[]) => {
    console.warn('[GiantessCalc]', ...args);
    addDebugLog('warn', ...args);
  };

  const debugError = (...args: unknown[]) => {
    console.error('[GiantessCalc]', ...args);
    addDebugLog('error', ...args);
  };

  const clearDebugLogs = () => {
    debugLogs.value = [];
  };

  return {
    // 核心状态
    settings,
    toggle,
    // 日志功能（TODO: Phase 3 移动到 debug service）
    log,
    warn,
    error,
    debugLogs,
    debugLog,
    debugWarn,
    debugError,
    clearDebugLogs,
  };
});
