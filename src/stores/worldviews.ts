/**
 * 巨大娘计算器 - 世界观 Store（精简版）
 * 只负责世界观状态管理
 * 
 * @module stores/worldviews
 */

import type { Worldview } from '../types';

// 重新导出类型
export type { Worldview };

/**
 * 内置世界观模板
 */
export const DEFAULT_WORLDVIEWS: Worldview[] = [
  {
    id: 'realistic-physics',
    name: '现实物理',
    icon: 'fa-solid fa-atom',
    description: '遵循物理定律的硬核设定，身体素质随体型指数增长',
    mechanism: `巨大化/缩小化遵循物理定律：
- 身高变为N倍时，体重变为N³倍
- 力量与肌肉横截面积成正比（N²倍）
- 相对力量随体型增大而降低（力量/体重 = 1/N）
- 代谢率、散热等受到平方立方定律影响`,
    bodyCharacteristics: `体型变化后的身体特征：
- 巨大化：相对力量下降，但绝对力量极强；需要更多食物和氧气；体温调节困难
- 缩小化：相对力量增强，可以举起相对体重更重的物体；但绝对力量很弱
- 骨骼密度、肌肉结构会有相应变化以支撑新体型`,
    limitations: [
      '巨大化超过一定程度会有骨骼支撑问题',
      '超小体型会有体温维持困难',
      '需要与体型匹配的食物和水',
      '无法随意控制变化程度',
    ],
    specialRules: [
      '小人可能被踩踏时受到物理伤害',
      '巨人的每一步都会造成地震效果',
      '声音传播受体型影响，小人说话巨人可能听不见',
    ],
    writingTips: [
      '注意描写重量感和震动感',
      '考虑温度差异（小人体温流失快）',
      '描写呼吸、心跳等生理差异',
      '小人视角注意空气流动、气味等感知差异',
    ],
    builtin: true,
    allowPartialScaling: false,
  },
  {
    id: 'fantasy-cultivation',
    name: '玄幻修仙',
    icon: 'fa-solid fa-yin-yang',
    description: '通过灵气、法术或法宝实现体型变化，不受物理定律约束',
    mechanism: `体型变化通过修仙手段实现：
- 服用丹药（巨人丸、缩小丹等）
- 修炼特殊功法（天地同寿诀、芥子纳须弥等）
- 使用法宝（如缩地成寸镜、万丈金身符）
- 先天神通（妖族/神族特有能力）`,
    bodyCharacteristics: `灵气护体下的身体特征：
- 身体强度与修为相关，而非单纯体型
- 可以通过灵气维持正常代谢
- 神识/灵觉可以弥补感官的不足
- 可能有特殊体质（如天生神力、不坏金身）`,
    limitations: [
      '需要消耗灵气/法力维持变化',
      '可能有时间限制或冷却时间',
      '受修为境界限制变化程度',
      '特定材料的法宝/丹药才能触发',
    ],
    specialRules: [
      '高修为者可以保护小人不受物理伤害',
      '可以通过神识交流，不受声音限制',
      '灵气护盾可以防止被踩死',
      '储物空间可以安全存放小人',
    ],
    writingTips: [
      '描写灵气流动的感觉',
      '注意修为差距带来的压制感',
      '可以加入灵宠/契约的设定',
      '体型变化可以结合阵法、秘境等场景',
    ],
    builtin: true,
    allowPartialScaling: true,
    typicalPartOverrides: {
      '乳房高度': 1.5,
      '乳房宽度': 1.5,
      '臀部宽度': 1.3,
    },
  },
  {
    id: 'sci-fi-tech',
    name: '科幻科技',
    icon: 'fa-solid fa-microchip',
    description: '通过纳米技术、基因改造或缩放射线等科技手段实现',
    mechanism: `科技手段实现体型变化：
- 皮姆粒子/缩放射线直接改变原子间距
- 纳米机器人重构身体结构
- 基因改造激活特殊生长因子
- 虚拟现实/意识上传改变感知尺度`,
    bodyCharacteristics: `科技增强下的身体特征：
- 纳米机器维持身体机能稳定
- 植入芯片可以通讯和定位
- 外骨骼或力场可以增强防护
- 可能有能量护盾保护`,
    limitations: [
      '需要能源供给（电池、反应堆等）',
      '设备故障可能导致变化失控',
      '可能有副作用需要定期检查',
      'EMP或特定频率可能干扰',
    ],
    specialRules: [
      '纳米机器人可以提供即时翻译和放大通讯',
      '力场护盾可以保护小人',
      '可以通过芯片感知小人的生命体征',
      '急救纳米可以修复受伤的小人',
    ],
    writingTips: [
      '加入科技感的描写（全息投影、数据流等）',
      '可以有系统界面、数值显示',
      '考虑科技伦理和社会影响',
      '可能有企业、政府等组织介入',
    ],
    builtin: true,
    allowPartialScaling: true,
  },
  {
    id: 'magical-girl',
    name: '魔法少女',
    icon: 'fa-solid fa-wand-magic-sparkles',
    description: '通过变身魔法实现，通常有华丽的变身过程和时间限制',
    mechanism: `魔法变身机制：
- 使用魔法道具（变身器、魔杖等）触发变身
- 念诵咒语或进行特定动作
- 强烈情感触发觉醒
- 与魔法生物契约获得力量`,
    bodyCharacteristics: `魔法变身后的身体特征：
- 获得魔法强化的身体
- 通常会有服装变化（魔法少女服装）
- 可能有翅膀、光环等装饰
- 身体曲线可能更加突出`,
    limitations: [
      '变身有时间限制',
      '魔力耗尽会强制解除变身',
      '变身需要特定条件或道具',
      '可能被特定手段封印能力',
    ],
    specialRules: [
      '魔法可以创造安全空间保护小人',
      '可以用魔法与小人心灵感应',
      '治愈魔法可以恢复受伤的小人',
      '可以将小人变成可爱的配饰携带',
    ],
    writingTips: [
      '加入华丽的变身场景描写',
      '可以有可爱的魔法宠物角色',
      '注重情感和羁绊的描写',
      '可以加入敌对势力或怪物',
    ],
    builtin: true,
    allowPartialScaling: true,
    typicalPartOverrides: {
      '乳房高度': 1.3,
      '乳房宽度': 1.3,
      '臀部宽度': 1.2,
      '腰部宽度': 0.9,
    },
  },
  {
    id: 'monster-girl',
    name: '怪物娘',
    icon: 'fa-solid fa-dragon',
    description: '作为特殊种族天生拥有巨大体型，是种族特性而非后天变化',
    mechanism: `种族特性说明：
- 天生为巨大种族（巨人族、龙娘、泰坦等）
- 或天生为微小种族（妖精、小人国居民等）
- 体型是稳定的种族特征
- 可能可以通过特殊能力暂时改变`,
    bodyCharacteristics: `种族身体特征：
- 身体结构适应了该体型（骨骼更强壮等）
- 可能有种族特有器官（翅膀、尾巴、角等）
- 新陈代谢与体型匹配
- 寿命可能与人类不同`,
    limitations: [
      '体型相对固定，难以大幅改变',
      '可能有种族弱点',
      '繁殖可能有种族限制',
      '社会地位可能受种族影响',
    ],
    specialRules: [
      '对小型生物有天生的保护本能',
      '可能有种族间的契约或主从关系',
      '某些种族有吞食或收养小人的习俗',
      '跨种族恋爱可能有社会阻力',
    ],
    writingTips: [
      '注重种族文化和习俗的描写',
      '可以加入种族间的矛盾或联盟',
      '描写种族特有的身体部位',
      '考虑不同种族的生活方式差异',
    ],
    builtin: true,
    allowPartialScaling: false,
  },
  {
    id: 'supernatural',
    name: '超自然',
    icon: 'fa-solid fa-ghost',
    description: '神力、诅咒、许愿等超自然力量导致的体型变化',
    mechanism: `超自然变化来源：
- 神灵赐福或诅咒
- 许愿（灯神、流星、神龙等）
- 神器/圣物的力量
- 恶魔契约
- 精神力/念力觉醒`,
    bodyCharacteristics: `超自然力量下的身体特征：
- 身体可能违反物理定律（如飘浮、穿透等）
- 可能有神圣/邪恶的气息
- 外表可能有特殊标记（如发光、阴影等）
- 可能有不老不死等特性`,
    limitations: [
      '可能有诅咒代价（如每次变化减少寿命）',
      '可能需要特定条件维持（如月圆之夜）',
      '可能被特定力量克制（如圣水、符咒）',
      '契约可能有隐藏条款',
    ],
    specialRules: [
      '神力可以完全保护契约者',
      '可能有命运牵绊等设定',
      '可以通过仪式赋予小人保护',
      '可能有预言或使命需要完成',
    ],
    writingTips: [
      '可以加入神秘主义元素',
      '描写超自然力量的视觉效果',
      '可以有宗教或神话背景',
      '注意塑造超自然存在的威严感或恐怖感',
    ],
    builtin: true,
    allowPartialScaling: true,
  },
  {
    id: 'dream-fantasy',
    name: '梦境幻想',
    icon: 'fa-solid fa-cloud-moon',
    description: '在梦境、幻想空间或精神世界中的体型变化，不受现实约束',
    mechanism: `梦境/幻想世界规则：
- 进入他人或共享梦境空间
- 精神世界具象化
- 虚拟现实全沉浸体验
- 想象力直接塑造现实`,
    bodyCharacteristics: `梦境中的身体特征：
- 身体可以随意变形
- 不会真正受伤（但可能有心理影响）
- 可以拥有任何想象中的能力
- 外表可以随心情变化`,
    limitations: [
      '醒来后一切重置',
      '梦境可能不稳定',
      '可能受到梦魇/他人干扰',
      '过度沉浸可能影响现实感知',
    ],
    specialRules: [
      '在梦中不会真正死亡',
      '可以创造任何想要的场景',
      '情感会直接影响梦境环境',
      '梦境中的时间流速可能不同',
    ],
    writingTips: [
      '可以有超现实的场景描写',
      '加入象征性和隐喻元素',
      '描写梦境特有的模糊感和跳跃感',
      '可以探索潜意识和内心欲望',
    ],
    builtin: true,
    allowPartialScaling: true,
  },
  {
    id: 'fetish-pure',
    name: '纯粹幻想',
    icon: 'fa-solid fa-heart',
    description: '不考虑设定合理性，专注于场景和感官体验的纯粹描写',
    mechanism: `无需解释的幻想世界：
- 体型变化自然发生，无需理由
- 不需要考虑物理合理性
- 专注于场景和感受
- 一切为了满足幻想`,
    bodyCharacteristics: `理想化的身体特征：
- 完美的身材比例
- 不会有任何不适感（除非剧情需要）
- 身体柔韧性和耐久性超常
- 感官被大幅强化`,
    limitations: [
      '无',
    ],
    specialRules: [
      '小人永远不会真正受伤（除非剧情需要）',
      '可以进行任何想象中的互动',
      '感官体验被大幅强化',
      '一切以满足幻想为优先',
    ],
    writingTips: [
      '专注于感官细节的描写',
      '不需要解释设定，直接进入场景',
      '充分描写身体接触的感受',
      '可以加入大量的感官形容词',
    ],
    builtin: true,
    allowPartialScaling: true,
    typicalPartOverrides: {
      '乳房高度': 1.5,
      '乳房宽度': 1.5,
      '臀部宽度': 1.4,
      '足长': 1.1,
    },
  },
];

/** 全局变量 key */
const GLOBAL_WORLDVIEWS_KEY = 'giantessCalc_worldviews';
const GLOBAL_CURRENT_WORLDVIEW_KEY = 'giantessCalc_currentWorldview';

/**
 * 世界观 Store
 * 
 * 职责：
 * - 管理世界观列表
 * - 管理当前选中的世界观
 * - 自动持久化到全局变量
 */
export const useWorldviewsStore = defineStore('giantess-calculator-worldviews', () => {
  // ========== 加载逻辑 ==========
  const loadWorldviews = (): Worldview[] => {
    const globalVars = getVariables({ type: 'global' });
    const savedWorldviews = globalVars?.[GLOBAL_WORLDVIEWS_KEY] as Worldview[] | undefined;

    if (savedWorldviews && Array.isArray(savedWorldviews)) {
      const builtinIds = DEFAULT_WORLDVIEWS.filter((w) => w.builtin).map((w) => w.id);
      const customWorldviews = savedWorldviews.filter((w) => !builtinIds.includes(w.id));
      const savedBuiltins = savedWorldviews.filter((w) => builtinIds.includes(w.id));

      const mergedBuiltins = DEFAULT_WORLDVIEWS.filter((w) => w.builtin).map((defaultW) => {
        const savedW = savedBuiltins.find((s) => s.id === defaultW.id);
        if (savedW) {
          return {
            ...defaultW,
            allowPartialScaling: savedW.allowPartialScaling,
            typicalPartOverrides: savedW.typicalPartOverrides,
          };
        }
        return defaultW;
      });

      return [...mergedBuiltins, ...customWorldviews];
    }

    return [...DEFAULT_WORLDVIEWS];
  };

  const loadCurrentWorldviewId = (): string => {
    const globalVars = getVariables({ type: 'global' });
    const savedId = globalVars?.[GLOBAL_CURRENT_WORLDVIEW_KEY] as string | undefined;
    return savedId || 'realistic-physics';
  };

  // ========== 核心状态 ==========
  const worldviews = ref<Worldview[]>(loadWorldviews());
  const currentWorldviewId = ref<string>(loadCurrentWorldviewId());

  const currentWorldview = computed(
    () =>
      worldviews.value.find((w) => w.id === currentWorldviewId.value) ||
      worldviews.value[0] ||
      DEFAULT_WORLDVIEWS[0]
  );

  // 自动保存
  watchEffect(() => {
    insertOrAssignVariables(
      {
        [GLOBAL_WORLDVIEWS_KEY]: klona(worldviews.value),
        [GLOBAL_CURRENT_WORLDVIEW_KEY]: currentWorldviewId.value,
      },
      { type: 'global' }
    );
  });

  // ========== 操作方法 ==========
  const setCurrentWorldview = (id: string) => {
    if (worldviews.value.some((w) => w.id === id)) {
      currentWorldviewId.value = id;
    }
  };

  const addWorldview = (worldview: Omit<Worldview, 'id' | 'builtin'>) => {
    worldviews.value.push({
      ...worldview,
      id: `custom-${Date.now()}`,
      builtin: false,
    });
  };

  const updateWorldview = (id: string, updates: Partial<Worldview>) => {
    const index = worldviews.value.findIndex((w) => w.id === id);
    if (index !== -1) {
      worldviews.value[index] = { ...worldviews.value[index], ...updates };
    }
  };

  const removeWorldview = (id: string) => {
    const worldview = worldviews.value.find((w) => w.id === id);
    if (worldview && !worldview.builtin) {
      worldviews.value = worldviews.value.filter((w) => w.id !== id);
      if (currentWorldviewId.value === id) {
        currentWorldviewId.value = 'realistic-physics';
      }
    }
  };

  const resetToDefaults = () => {
    worldviews.value = [...DEFAULT_WORLDVIEWS];
    currentWorldviewId.value = 'realistic-physics';
  };

  const getWorldview = (id: string): Worldview | undefined => {
    return worldviews.value.find((w) => w.id === id);
  };

  return {
    // 核心状态
    worldviews,
    currentWorldviewId,
    currentWorldview,
    // 操作方法
    setCurrentWorldview,
    addWorldview,
    updateWorldview,
    removeWorldview,
    resetToDefaults,
    getWorldview,
  };
});
