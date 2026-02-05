/**
 * 巨大娘计算器 - 互动限制规则
 */
import type { InteractionRule, ImpossibleInteraction, InteractionLimits } from '../types';

// 重新导出类型，保持向后兼容
export type { InteractionRule, ImpossibleInteraction, InteractionLimits };

export const INTERACTION_RULES: Record<string, InteractionRule> = {
  // 手部互动
  手指撩下巴: {
    minRatio: 0.05,
    description: '需要小者至少有几厘米大，否则手指无法精确操作',
    alternatives: '可以用指尖轻触、用指甲拨弄',
  },
  手掌握住: {
    minRatio: 0.01,
    description: '需要小者有一定大小才能被手掌握住',
    alternatives: '可以用指尖捏住、放在掌心',
  },
  双手捧起: {
    minRatio: 0.02,
    description: '需要小者有足够体积才能双手捧起',
    alternatives: '可以放在单手掌心、用指尖拿起',
  },
  拥抱: {
    minRatio: 0.3,
    description: '需要双方体型相近才能拥抱',
    alternatives: '可以将小者贴在身上、放在胸口',
  },
  亲吻嘴唇: {
    minRatio: 0.02,
    description: '需要小者至少和嘴唇差不多大',
    alternatives: '可以舔舐、用舌尖触碰、整个含入口中',
  },

  // 足部互动
  踩在脚下_感知: {
    minRatio: 0.001,
    description: '需要小者至少毫米级才能被感知到踩踏感',
    alternatives: '更小的小人会被完全无视，如同灰尘',
  },
  脚趾夹住: {
    minRatio: 0.005,
    description: '需要小者有一定大小才能被脚趾夹住',
    alternatives: '可以卡在脚趾缝中、粘在脚趾上',
  },
  用脚玩弄: {
    minRatio: 0.01,
    description: '需要小者足够大才能被脚有意识地玩弄',
    alternatives: '可以无意识地踩踏、碾压',
  },

  // 口部互动
  舌头卷起: {
    minRatio: 0.005,
    description: '需要小者有一定大小才能被舌头卷起',
    alternatives: '可以用唾液粘住、随唾液吞下',
  },
  咀嚼: {
    minRatio: 0.01,
    description: '需要小者有一定大小才值得咀嚼',
    alternatives: '可以直接吞下、随食物一起吞咽',
  },
  活吞_有感觉: {
    minRatio: 0.005,
    description: '需要小者至少几毫米才能在吞咽时被感知',
    alternatives: '更小的会像灰尘一样被无意识吞下',
  },

  // 身体互动
  入阴_有感觉: {
    minRatio: 0.005,
    description: '需要小者至少几毫米才能在阴道内被感知',
    alternatives: '更小的会完全无感，如同细菌',
  },
  入菊_有感觉: {
    minRatio: 0.005,
    description: '需要小者至少几毫米才能在肛门内被感知',
    alternatives: '更小的会完全无感',
  },
  乳沟夹住: {
    minRatio: 0.02,
    description: '需要小者有一定大小才能被乳沟夹住',
    alternatives: '可以藏在乳沟褶皱中、粘在皮肤上',
  },

  // 视觉互动
  肉眼可见: {
    minRatio: 0.0001,
    description: '需要小者至少0.1毫米才能被肉眼看见',
    alternatives: '需要放大镜或显微镜才能看到',
  },
  清晰辨认面容: {
    minRatio: 0.001,
    description: '需要小者至少1毫米才能辨认面容',
    alternatives: '只能看到一个小点或模糊轮廓',
  },

  // 交流互动
  听到声音: {
    minRatio: 0.001,
    description: '需要小者至少毫米级才可能发出可听见的声音',
    alternatives: '声音太小，完全听不到',
  },
  正常对话: {
    minRatio: 0.05,
    description: '需要双方体型差距不太大才能正常对话',
    alternatives: '需要扩音设备或特殊能力才能交流',
  },
};

/**
 * 检查两个角色之间的互动限制
 */
export function checkInteractionLimits(
  bigHeight: number,
  smallHeight: number,
  formatLength: (meters: number) => string
): InteractionLimits {
  const ratio = smallHeight / bigHeight;

  const possible: string[] = [];
  const impossible: ImpossibleInteraction[] = [];
  const alternatives: Record<string, string> = {};

  for (const [action, rule] of Object.entries(INTERACTION_RULES)) {
    if (ratio >= rule.minRatio) {
      possible.push(action);
    } else {
      impossible.push({
        action,
        reason: rule.description,
        alternative: rule.alternatives,
      });
      alternatives[action] = rule.alternatives;
    }
  }

  const round = (v: number, p = 2) => Math.round(v * Math.pow(10, p)) / Math.pow(10, p);

  return {
    ratio,
    ratioFormatted: ratio >= 0.01 ? `${round(ratio * 100)}%` : `1/${round(1 / ratio)}`,
    smallInBigEyes: formatLength(smallHeight),
    possible,
    impossible,
    alternatives,
  };
}

/**
 * 生成互动限制提示文本
 */
export function generateInteractionPrompt(
  bigName: string,
  smallName: string,
  limits: InteractionLimits
): string {
  if (limits.impossible.length === 0) {
    return `${bigName}与${smallName}的体型差距不大，可以进行大多数正常互动。`;
  }

  const lines: string[] = [];
  lines.push(`【${bigName}与${smallName}的互动限制】`);
  lines.push(`体型比例：${smallName}是${bigName}的${limits.ratioFormatted}`);
  lines.push(`${smallName}在${bigName}眼中约${limits.smallInBigEyes}大小`);
  lines.push('');
  lines.push('以下互动在物理上不合理，请避免或使用替代方案：');

  for (const item of limits.impossible) {
    lines.push(`- ${item.action}：${item.reason}`);
    if (item.alternative) {
      lines.push(`  → 替代：${item.alternative}`);
    }
  }

  return lines.join('\n');
}
