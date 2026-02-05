/**
 * 巨大娘计算器 - 格式化工具函数
 */

let precision = 2;

export function setPrecision(p: number): void {
  precision = p;
}

export function getPrecision(): number {
  return precision;
}

/**
 * 四舍五入到指定精度
 */
export function round(value: number, p: number = precision): number {
  const factor = Math.pow(10, p);
  return Math.round(value * factor) / factor;
}

/**
 * 智能单位转换 - 长度
 */
export function formatLength(meters: number, useAstronomical = true): string {
  const abs = Math.abs(meters);

  // 天文单位
  if (useAstronomical) {
    const LIGHT_YEAR = 9460730472580800;
    const AU = 149597870700;

    if (abs >= LIGHT_YEAR * 1000) {
      return `${round(meters / LIGHT_YEAR)}光年`;
    }
    if (abs >= LIGHT_YEAR) {
      return `${round(meters / LIGHT_YEAR, 3)}光年`;
    }
    if (abs >= AU) {
      return `${round(meters / AU)}AU`;
    }
  }

  // 常规单位
  if (abs >= 1000000) {
    return `${round(meters / 1000)}公里`;
  }
  if (abs >= 1000) {
    return `${round(meters / 1000)}公里`;
  }
  if (abs >= 1) {
    return `${round(meters)}米`;
  }
  if (abs >= 0.01) {
    return `${round(meters * 100)}厘米`;
  }
  if (abs >= 0.001) {
    return `${round(meters * 1000)}毫米`;
  }
  if (abs >= 0.000001) {
    return `${round(meters * 1000000)}微米`;
  }
  if (abs >= 0.000000001) {
    return `${round(meters * 1000000000)}纳米`;
  }
  return `${round(meters * 1000000000000)}皮米`;
}

/**
 * 格式化重量
 */
export function formatWeight(kg: number): string {
  if (kg >= 1e12) {
    return `${round(kg / 1e12)}万亿吨`;
  }
  if (kg >= 1e9) {
    return `${round(kg / 1e9)}十亿吨`;
  }
  if (kg >= 1e6) {
    return `${round(kg / 1e6)}百万吨`;
  }
  if (kg >= 1000) {
    return `${round(kg / 1000)}吨`;
  }
  return `${round(kg)}千克`;
}

/**
 * 格式化体积
 */
export function formatVolume(cubicMeters: number): string {
  if (cubicMeters >= 1e9) {
    return `${round(cubicMeters / 1e9)}立方公里`;
  }
  if (cubicMeters >= 1) {
    return `${round(cubicMeters)}立方米`;
  }
  if (cubicMeters >= 0.001) {
    return `${round(cubicMeters * 1000)}升`;
  }
  if (cubicMeters >= 0.000001) {
    return `${round(cubicMeters * 1000000)}毫升`;
  }
  return `${round(cubicMeters * 1e9)}立方毫米`;
}

/**
 * 格式化面积
 */
export function formatArea(sqMeters: number): string {
  if (sqMeters >= 1e6) {
    return `${round(sqMeters / 1e6)}平方公里`;
  }
  if (sqMeters >= 1) {
    return `${round(sqMeters)}平方米`;
  }
  if (sqMeters >= 0.0001) {
    return `${round(sqMeters * 10000)}平方厘米`;
  }
  return `${round(sqMeters * 1000000)}平方毫米`;
}
