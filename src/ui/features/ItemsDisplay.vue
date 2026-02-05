<template>
  <div v-if="itemsData && hasItems" class="gc-detail-section full-width gc-items-section">
    <div class="gc-detail-section-title">
      <i class="fa-solid fa-box"></i> 携带物品
      <span class="gc-items-count-badge">{{ itemCount }}件</span>
    </div>
    
    <div class="gc-items-list">
      <div 
        v-for="(item, itemId) in itemsData.物品" 
        :key="itemId"
        class="gc-item-card"
        :class="{ expanded: expandedItems.has(String(itemId)) }"
        @click="toggleItem(String(itemId))"
      >
        <div class="gc-item-header">
          <div class="gc-item-icon" :class="getItemTypeClass(item.定义.类型)">
            <i :class="getItemIcon(item.定义.类型)"></i>
          </div>
          <div class="gc-item-info">
            <div class="gc-item-name">
              {{ item.定义.名称 }}
              <span v-if="item.定义.随身携带" class="gc-carried-tag" title="随身携带，随角色一起缩放">
                <i class="fa-solid fa-link"></i>
              </span>
            </div>
            <div class="gc-item-brief">
              <span class="gc-item-type">{{ item.定义.类型 || '其他' }}</span>
              <span v-if="item.定义.材质" class="gc-item-material">{{ item.定义.材质 }}</span>
            </div>
          </div>
          <div class="gc-item-size">
            {{ getMainSize(item) }}
          </div>
          <i class="fa-solid gc-item-expand-icon" :class="expandedItems.has(String(itemId)) ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        </div>
        
        <!-- 展开详情 -->
        <transition name="slide">
          <div v-if="expandedItems.has(String(itemId))" class="gc-item-details" @click.stop>
            <!-- 缩放尺寸 -->
            <div class="gc-item-detail-section">
              <div class="gc-item-detail-title">
                <i class="fa-solid fa-ruler"></i> 缩放尺寸
              </div>
              <div class="gc-item-dimensions">
                <span v-for="(value, key) in item.缩放尺寸_格式化" :key="key" class="gc-dimension-tag">
                  {{ key }}: {{ value }}
                </span>
              </div>
            </div>
            
            <!-- 角色视角 -->
            <div v-if="item.角色视角.length > 0" class="gc-item-detail-section">
              <div class="gc-item-detail-title">
                <i class="fa-solid fa-eye"></i> 角色视角
              </div>
              <div class="gc-item-references">
                <span v-for="(ref, i) in item.角色视角.slice(0, 2)" :key="i" class="gc-reference-tag">
                  {{ ref.描述 }}
                </span>
              </div>
            </div>
            
            <!-- 互动可能性 -->
            <div class="gc-item-detail-section">
              <div class="gc-item-detail-title">
                <i class="fa-solid fa-hand"></i> 互动可能性
              </div>
              <div class="gc-item-interactions">
                <div 
                  v-for="(interaction, i) in item.互动可能性" 
                  :key="i" 
                  class="gc-interaction-item"
                  :class="{ possible: interaction.可行, impossible: !interaction.可行 }"
                >
                  <i :class="interaction.可行 ? 'fa-solid fa-check' : 'fa-solid fa-xmark'"></i>
                  <span class="gc-interaction-name">{{ interaction.名称 }}</span>
                  <span class="gc-interaction-desc">{{ interaction.描述 }}</span>
                </div>
              </div>
            </div>
            
            <!-- 特殊效果 -->
            <div v-if="item.特殊效果 && item.特殊效果.length > 0" class="gc-item-detail-section">
              <div class="gc-item-detail-title">
                <i class="fa-solid fa-bolt"></i> 特殊效果
              </div>
              <div class="gc-item-effects">
                <span v-for="(effect, i) in item.特殊效果" :key="i" class="gc-effect-tag">
                  {{ effect }}
                </span>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CharacterItemsCalculation, ItemCalculation, ItemType } from '../../types';

const props = defineProps<{
  itemsData: CharacterItemsCalculation | null | undefined;
}>();

// 展开状态
const expandedItems = ref(new Set<string>());

const toggleItem = (itemId: string) => {
  if (expandedItems.value.has(itemId)) {
    expandedItems.value.delete(itemId);
  } else {
    expandedItems.value.add(itemId);
  }
};

const hasItems = computed(() => {
  if (!props.itemsData?.物品) return false;
  return Object.keys(props.itemsData.物品).length > 0;
});

const itemCount = computed(() => {
  if (!props.itemsData?.物品) return 0;
  return Object.keys(props.itemsData.物品).length;
});

// 获取主要尺寸显示
const getMainSize = (item: ItemCalculation): string => {
  const formatted = item.缩放尺寸_格式化;
  // 优先显示长度，其次高度，再次直径
  if (formatted.长) return formatted.长;
  if (formatted.高) return formatted.高;
  if (formatted.直径) return formatted.直径;
  // 返回第一个可用的
  const first = Object.values(formatted)[0];
  return first || '-';
};

// 获取物品类型图标
const getItemIcon = (type?: ItemType): string => {
  const iconMap: Record<string, string> = {
    '日用品': 'fa-solid fa-mobile-screen',
    '配饰': 'fa-solid fa-gem',
    '服装': 'fa-solid fa-shirt',
    '食物': 'fa-solid fa-burger',
    '家具': 'fa-solid fa-couch',
    '交通工具': 'fa-solid fa-car',
    '建筑': 'fa-solid fa-building',
    '自然物': 'fa-solid fa-tree',
    '玩具': 'fa-solid fa-puzzle-piece',
    '武器': 'fa-solid fa-gun',
    '工具': 'fa-solid fa-wrench',
    '其他': 'fa-solid fa-box',
  };
  return iconMap[type || '其他'] || 'fa-solid fa-box';
};

// 获取物品类型样式类
const getItemTypeClass = (type?: ItemType): string => {
  const classMap: Record<string, string> = {
    '日用品': 'daily',
    '配饰': 'accessory',
    '服装': 'clothing',
    '食物': 'food',
    '家具': 'furniture',
    '交通工具': 'vehicle',
    '建筑': 'building',
    '自然物': 'nature',
    '玩具': 'toy',
    '武器': 'weapon',
    '工具': 'tool',
    '其他': 'other',
  };
  return classMap[type || '其他'] || 'other';
};
</script>

<style scoped>
.gc-items-section {
  background: rgba(99, 102, 241, 0.05);
  border-radius: 8px;
  padding: 12px !important;
  border: 1px solid rgba(99, 102, 241, 0.15);
}

.gc-detail-section-title {
  font-size: 0.75em;
  font-weight: 600;
  color: #818cf8;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 6px;
}

.gc-items-count-badge {
  font-size: 0.85em;
  font-weight: 500;
  padding: 2px 8px;
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  border-radius: 4px;
  margin-left: auto;
}

.gc-items-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gc-item-card {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.gc-item-card:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(99, 102, 241, 0.2);
}

.gc-item-card.expanded {
  border-color: rgba(99, 102, 241, 0.4);
}

.gc-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
}

.gc-item-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 0.8em;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
}

.gc-item-icon.daily { background: rgba(96, 165, 250, 0.15); color: #60a5fa; }
.gc-item-icon.accessory { background: rgba(244, 114, 182, 0.15); color: #f472b6; }
.gc-item-icon.clothing { background: rgba(167, 139, 250, 0.15); color: #a78bfa; }
.gc-item-icon.food { background: rgba(251, 146, 60, 0.15); color: #fb923c; }
.gc-item-icon.furniture { background: rgba(45, 212, 191, 0.15); color: #2dd4bf; }
.gc-item-icon.vehicle { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
.gc-item-icon.building { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
.gc-item-icon.nature { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
.gc-item-icon.toy { background: rgba(232, 121, 249, 0.15); color: #e879f9; }
.gc-item-icon.weapon { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.gc-item-icon.tool { background: rgba(156, 163, 175, 0.15); color: #9ca3af; }
.gc-item-icon.other { background: rgba(107, 114, 128, 0.15); color: #6b7280; }

.gc-item-info {
  flex: 1;
  min-width: 0;
}

.gc-item-name {
  font-size: 0.85em;
  font-weight: 500;
  color: #e2e8f0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.gc-carried-tag {
  font-size: 0.7em;
  color: #818cf8;
  opacity: 0.8;
}

.gc-item-brief {
  font-size: 0.75em;
  color: #64748b;
  display: flex;
  gap: 8px;
  margin-top: 2px;
}

.gc-item-type {
  color: #94a3b8;
}

.gc-item-material {
  color: #64748b;
}

.gc-item-size {
  font-size: 0.8em;
  font-weight: 500;
  font-family: 'JetBrains Mono', monospace;
  color: #818cf8;
  flex-shrink: 0;
}

.gc-item-expand-icon {
  font-size: 0.7em;
  color: #64748b;
  transition: transform 0.2s;
}

.gc-item-card.expanded .gc-item-expand-icon {
  color: #818cf8;
}

/* 物品详情 */
.gc-item-details {
  padding: 0 10px 10px;
  border-top: 1px dashed rgba(99, 102, 241, 0.2);
  margin-top: 4px;
}

.gc-item-detail-section {
  margin-top: 10px;
}

.gc-item-detail-title {
  font-size: 0.75em;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.gc-item-detail-title i {
  color: #818cf8;
}

.gc-item-dimensions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.gc-dimension-tag {
  font-size: 0.75em;
  padding: 2px 8px;
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
}

.gc-item-references {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gc-reference-tag {
  font-size: 0.8em;
  color: #94a3b8;
}

.gc-item-interactions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gc-interaction-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8em;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
}

.gc-interaction-item.possible {
  background: rgba(74, 222, 128, 0.1);
}

.gc-interaction-item.possible i {
  color: #4ade80;
}

.gc-interaction-item.impossible {
  background: rgba(239, 68, 68, 0.1);
}

.gc-interaction-item.impossible i {
  color: #f87171;
}

.gc-interaction-name {
  font-weight: 500;
  color: #e2e8f0;
  min-width: 60px;
}

.gc-interaction-desc {
  color: #94a3b8;
  font-size: 0.9em;
}

.gc-item-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.gc-effect-tag {
  font-size: 0.75em;
  padding: 2px 8px;
  background: rgba(251, 146, 60, 0.15);
  color: #fb923c;
  border-radius: 4px;
}

/* 动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 500px;
}

/* 全宽 */
.full-width {
  flex-basis: 100%;
}
</style>
