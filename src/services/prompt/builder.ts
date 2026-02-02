/**
 * 巨大娘计算器 - 提示词构建服务
 * 
 * 职责：
 * - 变量插值
 * - 格式化各类数据为文本
 * - 构建角色上下文
 * - 生成世界观提示词
 * 
 * @module services/prompt/builder
 */

import type {
  PromptContext,
  GiantessData,
  TinyData,
  DamageCalculation,
  Worldview,
} from '../../types';
import {
  formatLength,
  generateDamagePrompt,
  formatDamageCompact,
} from '../../core';

/**
 * 变量插值 - 替换模板中的 {{变量名}}
 * 
 * @param template 模板字符串
 * @param context 上下文变量
 * @returns 插值后的字符串
 */
export function interpolate(template: string, context: Partial<PromptContext>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = (context as Record<string, unknown>)[key];
    if (value !== undefined) {
      return String(value);
    }
    return match; // 保留未匹配的占位符
  });
}

/**
 * 格式化身体数据为文本
 * 
 * @param bodyParts 身体部位数据（部位名 -> 尺寸米）
 * @returns 格式化的文本
 */
export function formatBodyData(bodyParts: Record<string, number>): string {
  const categories: Record<string, string[]> = {
    '身体尺寸': ['身高', '肩膀高度', '胸部顶端', '臀部高度', '裆部高度'],
    '足部': ['足长', '足宽', '大脚趾长', '脚趾缝隙'],
    '手部': ['手掌长', '手掌宽', '手指长'],
    '胸部': ['乳房高度', '乳房宽度', '乳沟深度'],
    '口腔': ['嘴巴宽度', '舌头长', '舌头宽'],
  };

  const lines: string[] = [];
  
  for (const [category, keys] of Object.entries(categories)) {
    const items = keys
      .filter(key => bodyParts[key] !== undefined)
      .map(key => `${key}: ${formatLength(bodyParts[key])}`);
    
    if (items.length > 0) {
      lines.push(`- **${category}**: ${items.join('、')}`);
    }
  }

  return lines.join('\n');
}

/**
 * 格式化相对参照为文本
 * 
 * @param references 参照物数据（物品名 -> 描述）
 * @returns 格式化的文本
 */
export function formatRelativeReferences(references: Record<string, string>): string {
  const lines: string[] = [];
  
  for (const [object, description] of Object.entries(references)) {
    lines.push(`- ${object}：${description}`);
  }

  return lines.join('\n');
}

/**
 * 格式化互动限制为文本
 * 
 * @param interactions 互动限制列表
 * @returns 格式化的文本
 */
export function formatInteractionLimits(
  interactions: Array<{
    大者: string;
    小者: string;
    impossible: Array<{ action: string; reason: string; alternative: string }>;
  }>
): string {
  const lines: string[] = [];

  for (const interaction of interactions) {
    if (interaction.impossible.length === 0) continue;

    lines.push(`### ${interaction.大者} ↔ ${interaction.小者}`);
    lines.push('');

    for (const item of interaction.impossible) {
      lines.push(`- **${item.action}**：${item.reason}`);
      if (item.alternative) {
        lines.push(`  - 替代方案：${item.alternative}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 生成世界观提示词
 * 
 * @param worldview 世界观对象
 * @returns 格式化的提示词文本
 */
export function generateWorldviewPrompt(worldview: Worldview): string {
  const lines: string[] = [];

  lines.push(`# 世界观设定：${worldview.name}`);
  lines.push('');
  lines.push(worldview.description);
  lines.push('');
  lines.push('## 变化机制');
  lines.push(worldview.mechanism);
  lines.push('');
  lines.push('## 身体特性');
  lines.push(worldview.bodyCharacteristics);
  lines.push('');

  if (worldview.limitations.length > 0 && worldview.limitations[0] !== '无') {
    lines.push('## 限制与代价');
    for (const limitation of worldview.limitations) {
      lines.push(`- ${limitation}`);
    }
    lines.push('');
  }

  if (worldview.specialRules.length > 0) {
    lines.push('## 特殊规则');
    for (const rule of worldview.specialRules) {
      lines.push(`- ${rule}`);
    }
    lines.push('');
  }

  if (worldview.writingTips.length > 0) {
    lines.push('## 写作建议');
    for (const tip of worldview.writingTips) {
      lines.push(`- ${tip}`);
    }
  }

  return lines.join('\n');
}

/**
 * 构建角色的提示词上下文
 * 
 * @param name 角色名
 * @param calcData 计算数据
 * @param originalHeight 原始身高
 * @param options 额外选项
 * @returns 提示词上下文
 */
export function buildCharacterContext(
  name: string,
  calcData: GiantessData | TinyData,
  originalHeight: number,
  options: {
    damageData?: DamageCalculation;
    worldview?: Worldview;
    enableDamageCalculation?: boolean;
    compactPromptFormat?: boolean;
  } = {}
): PromptContext {
  // 格式化身体数据
  const bodyDataLines: string[] = [];
  if ('身体部位_格式化' in calcData && calcData.身体部位_格式化) {
    for (const [part, formatted] of Object.entries(calcData.身体部位_格式化)) {
      bodyDataLines.push(`- ${part}: ${formatted}`);
    }
  }

  // 格式化自定义部位（单独标注）
  let customPartsText = '';
  if ('自定义部位' in calcData && calcData.自定义部位) {
    const customEntries = Object.entries(calcData.自定义部位);
    if (customEntries.length > 0) {
      const customLines: string[] = ['\n**⚡ 自定义部位**（与整体倍率不同）'];
      const scales = (calcData as GiantessData).自定义部位_倍率 || {};
      for (const [part, value] of customEntries) {
        const partScale = scales[part] ? `（${scales[part]}倍）` : '';
        customLines.push(`- ${part}: ${formatLength(value)} ${partScale}`);
      }
      customPartsText = customLines.join('\n');
    }
  }

  // 格式化相对参照
  const referenceLines: string[] = [];
  if ('眼中的世界_格式化' in calcData && calcData.眼中的世界_格式化) {
    for (const [obj, desc] of Object.entries(calcData.眼中的世界_格式化)) {
      referenceLines.push(`- ${obj}: ${desc}`);
    }
  }

  // 生成世界观提示词
  const worldviewPrompt = options.worldview
    ? generateWorldviewPrompt(options.worldview)
    : '';

  // 生成损害数据文本（用于单角色）
  let damageText = '';
  if (options.damageData && options.enableDamageCalculation) {
    if (options.compactPromptFormat) {
      damageText = formatDamageCompact(options.damageData);
    } else {
      damageText = generateDamagePrompt(name, options.damageData);
    }
  }

  return {
    角色名: name,
    当前身高: calcData.当前身高,
    当前身高_格式化: calcData.当前身高_格式化,
    原身高: originalHeight,
    原身高_格式化: formatLength(originalHeight),
    倍率: calcData.倍率,
    级别: calcData.级别,
    描述: calcData.描述,
    身体数据: bodyDataLines.join('\n') || '（无数据）',
    自定义部位: customPartsText,
    相对参照: referenceLines.join('\n') || '（无数据）',
    互动限制列表: '', // 将在后面填充
    世界观提示词: worldviewPrompt,
    世界观名称: options.worldview?.name || '',
    损害数据: damageText,
  };
}

/**
 * 生成全部角色的损害汇总提示词
 * 
 * @param characterDamages 角色损害数据列表
 * @param options 显示选项
 * @returns 损害汇总提示词
 */
export function generateAllDamagePrompt(
  characterDamages: Array<{ name: string; damageData: DamageCalculation }>,
  options: {
    showPerCharacter?: boolean;
    showSummary?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { showPerCharacter = true, showSummary = true, compact = false } = options;
  const lines: string[] = [];

  if (characterDamages.length === 0) return '';

  // 按角色显示
  if (showPerCharacter) {
    for (const { name, damageData } of characterDamages) {
      if (compact) {
        lines.push(`## ${name}`);
        lines.push(formatDamageCompact(damageData));
      } else {
        lines.push(generateDamagePrompt(name, damageData));
      }
      lines.push('');
    }
  }

  // 汇总统计
  if (showSummary && characterDamages.length > 1) {
    let totalCasualtiesMin = 0;
    let totalCasualtiesMax = 0;
    let totalBuildingsMin = 0;
    let totalBuildingsMax = 0;
    let highestLevel = '';
    const allEffects = new Set<string>();

    for (const { damageData } of characterDamages) {
      totalCasualtiesMin += damageData.单步损害.小人伤亡.最小估计;
      totalCasualtiesMax += damageData.单步损害.小人伤亡.最大估计;
      totalBuildingsMin += damageData.单步损害.建筑损毁.最小估计;
      totalBuildingsMax += damageData.单步损害.建筑损毁.最大估计;
      
      // 取最高破坏等级
      if (!highestLevel || damageData.破坏力等级 > highestLevel) {
        highestLevel = damageData.破坏力等级;
      }
      
      // 收集所有特殊效应
      for (const effect of damageData.特殊效应) {
        allEffects.add(effect);
      }
    }

    lines.push('---');
    lines.push('');
    lines.push('## 总计损害（所有巨大娘）');
    lines.push('');
    lines.push(`- 参与角色数：${characterDamages.length}`);
    lines.push(`- 单步总伤亡：${Math.round(totalCasualtiesMin)}-${Math.round(totalCasualtiesMax)}人`);
    lines.push(`- 单步总建筑损毁：${Math.round(totalBuildingsMin)}-${Math.round(totalBuildingsMax)}栋`);
    lines.push(`- 最高破坏力等级：${highestLevel}`);
    
    if (allEffects.size > 0) {
      lines.push('');
      lines.push('**综合物理效应**：');
      for (const effect of allEffects) {
        lines.push(`- ${effect}`);
      }
    }
  }

  return lines.join('\n');
}
