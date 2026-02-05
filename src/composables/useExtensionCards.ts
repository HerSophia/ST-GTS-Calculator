/**
 * 巨大娘计算器 - 扩展卡片内容管理
 *
 * 收集已启用扩展贡献的角色卡片内容
 *
 * @module composables/useExtensionCards
 */

import { computed, shallowRef, markRaw, type Component } from 'vue';
import { extensionManager } from '../services/extensions/manager';
import type { CharacterData } from '../types';
import type { CharacterCardContext } from '../types/extension';

/**
 * 扩展卡片信息
 */
export interface ExtensionCardInfo {
  /** 扩展 ID */
  id: string;
  /** 扩展名称 */
  name: string;
  /** 扩展图标 */
  icon: string;
  /** 组件 */
  component: Component;
  /** 判断是否显示的函数 */
  shouldShow?: (context: CharacterCardContext) => boolean;
}

/**
 * 使用扩展卡片内容
 */
export function useExtensionCards() {
  // 缓存收集的组件
  const cachedCards = shallowRef<ExtensionCardInfo[]>([]);

  /**
   * 收集所有已启用扩展的卡片组件
   */
  function collectCardComponents(): ExtensionCardInfo[] {
    const cards: ExtensionCardInfo[] = [];

    for (const ext of extensionManager.getEnabled()) {
      if (ext.getCharacterCardExtra) {
        try {
          const component = ext.getCharacterCardExtra();
          if (component) {
            cards.push({
              id: ext.id,
              name: ext.name,
              icon: ext.icon,
              component: markRaw(component),
              shouldShow: ext.shouldShowCardContent,
            });
          }
        } catch (e) {
          console.error(`[ExtensionCards] 收集 ${ext.id} 卡片组件失败:`, e);
        }
      }
    }

    return cards;
  }

  /**
   * 刷新卡片组件缓存
   */
  function refreshCards() {
    cachedCards.value = collectCardComponents();
  }

  /**
   * 获取应该为特定角色显示的扩展卡片
   */
  function getCardsForCharacter(
    character: CharacterData,
    expanded: boolean = false
  ): ExtensionCardInfo[] {
    const context: CharacterCardContext = {
      character,
      calcData: character.calcData || null,
      expanded,
    };

    return cachedCards.value.filter((card) => {
      // 如果扩展定义了 shouldShow，使用它来决定
      if (card.shouldShow) {
        return card.shouldShow(context);
      }
      // 默认显示（如果组件存在）
      return true;
    });
  }

  /**
   * 所有可用的卡片组件
   */
  const availableCards = computed(() => cachedCards.value);

  // 初始化时收集一次
  refreshCards();

  return {
    availableCards,
    getCardsForCharacter,
    refreshCards,
  };
}
