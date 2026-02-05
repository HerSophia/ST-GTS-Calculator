/**
 * 角色测试数据工厂
 */
import type { Character } from '@/types';

/**
 * 创建 Mock 角色
 */
export function createMockCharacter(overrides: Partial<Character> = {}): Character {
  return {
    name: '测试角色',
    currentHeight: 170,
    originalHeight: 1.65,
    reason: '测试原因',
    ...overrides,
  };
}

/**
 * 创建巨大娘测试角色
 * @param scale 倍率，默认 100 倍
 */
export function createMockGiantess(scale: number = 100): Character {
  const originalHeight = 1.65;
  return createMockCharacter({
    name: '巨大娘',
    currentHeight: originalHeight * scale,
    originalHeight,
    reason: `变成了 ${scale} 倍大`,
  });
}

/**
 * 创建小人测试角色
 * @param scale 倍率，默认 0.01（百分之一）
 */
export function createMockTiny(scale: number = 0.01): Character {
  const originalHeight = 1.70;
  return createMockCharacter({
    name: '小人',
    currentHeight: originalHeight * scale,
    originalHeight,
    reason: `缩小到了 ${scale * 100}%`,
  });
}

/**
 * 预设测试场景
 */
export const TEST_SCENARIOS = {
  /** 百倍巨大娘 */
  giantess100x: createMockGiantess(100),
  /** 千倍巨大娘 */
  giantess1000x: createMockGiantess(1000),
  /** 百分之一小人 */
  tiny001x: createMockTiny(0.01),
  /** 千分之一小人 */
  tiny0001x: createMockTiny(0.001),
};
