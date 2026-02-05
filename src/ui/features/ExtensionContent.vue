<template>
  <div class="gc-extension-content">
    <component
      :is="card.component"
      v-for="card in visibleCards"
      :key="card.id"
      :character="character"
      :calc-data="character.calcData"
      :expanded="expanded"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useExtensionCards } from '../../composables/useExtensionCards';
import type { CharacterData } from '../../types';

const props = defineProps<{
  character: CharacterData;
  expanded?: boolean;
}>();

const { getCardsForCharacter, refreshCards } = useExtensionCards();

// 获取应该显示的卡片
const visibleCards = computed(() => {
  return getCardsForCharacter(props.character, props.expanded || false);
});

// 当扩展状态变化时刷新
onMounted(() => {
  refreshCards();
});

// 监听 character 变化刷新卡片
watch(() => props.character, () => {
  refreshCards();
}, { deep: true });
</script>

<style>
/* 扩展内容通用样式 */
.gc-extension-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

/* 扩展区块样式 */
.gc-ext-damage-section,
.gc-ext-items-section {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid transparent;
}

.gc-ext-damage-section {
  background: rgba(249, 115, 22, 0.05);
  border-color: rgba(249, 115, 22, 0.15);
}

.gc-ext-items-section {
  background: rgba(99, 102, 241, 0.05);
  border-color: rgba(99, 102, 241, 0.15);
}

/* 标题样式 */
.gc-ext-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.gc-ext-damage-section .gc-ext-section-title {
  color: #fb923c;
}

.gc-ext-items-section .gc-ext-section-title {
  color: #818cf8;
}

.gc-ext-badge {
  margin-left: auto;
  font-size: 0.85em;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
}

.gc-ext-badge.damage {
  background: rgba(249, 115, 22, 0.2);
  color: #fb923c;
}

.gc-ext-badge.items {
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
}

/* 数据网格 */
.gc-ext-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.gc-ext-item {
  background: rgba(0, 0, 0, 0.2);
  padding: 8px 10px;
  border-radius: 6px;
}

.gc-ext-label {
  font-size: 0.75em;
  color: #94a3b8;
  margin-bottom: 2px;
}

.gc-ext-value {
  font-size: 0.9em;
  font-weight: 500;
  font-family: 'JetBrains Mono', monospace;
  color: #e2e8f0;
}

.gc-ext-value.casualties {
  color: #f87171;
}

.gc-ext-value.buildings {
  color: #fbbf24;
}

/* 宏观破坏 */
.gc-ext-macro {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(249, 115, 22, 0.2);
}

.gc-ext-macro-title {
  font-size: 0.8em;
  font-weight: 600;
  color: #fb923c;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.gc-ext-macro-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.gc-ext-macro-list span {
  font-size: 0.8em;
  padding: 3px 8px;
  background: rgba(249, 115, 22, 0.15);
  color: #e2e8f0;
  border-radius: 4px;
}

/* 特殊效应 */
.gc-ext-effects {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(249, 115, 22, 0.2);
}

.gc-ext-effects-title {
  font-size: 0.8em;
  font-weight: 600;
  color: #60a5fa;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.gc-ext-effects-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.gc-ext-effect-tag {
  font-size: 0.75em;
  padding: 2px 6px;
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
  border-radius: 4px;
}

/* 物品列表 */
.gc-ext-items-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gc-ext-item-card {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.gc-ext-item-card:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(99, 102, 241, 0.2);
}

.gc-ext-item-card.expanded {
  border-color: rgba(99, 102, 241, 0.4);
}

.gc-ext-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
}

.gc-ext-item-header > i:first-child {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border-radius: 4px;
  font-size: 0.8em;
  flex-shrink: 0;
}

.gc-ext-item-info {
  flex: 1;
  min-width: 0;
}

.gc-ext-item-name {
  font-size: 0.85em;
  font-weight: 500;
  color: #e2e8f0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.gc-ext-carried-tag {
  font-size: 0.7em;
  color: #818cf8;
  opacity: 0.8;
}

.gc-ext-item-type {
  font-size: 0.75em;
  color: #64748b;
}

.gc-ext-item-size {
  font-size: 0.8em;
  font-weight: 500;
  font-family: 'JetBrains Mono', monospace;
  color: #818cf8;
  flex-shrink: 0;
}

.gc-ext-item-chevron {
  font-size: 0.7em;
  color: #64748b;
  transition: transform 0.2s;
}

.gc-ext-item-card.expanded .gc-ext-item-chevron {
  color: #818cf8;
}

.gc-ext-item-details {
  padding: 8px 10px;
  border-top: 1px dashed rgba(99, 102, 241, 0.2);
}

.gc-ext-item-dims {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.gc-ext-dim-tag {
  font-size: 0.75em;
  padding: 2px 8px;
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
}

.gc-ext-item-interactions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.gc-ext-interaction {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75em;
  padding: 2px 8px;
  border-radius: 4px;
}

.gc-ext-interaction.possible {
  background: rgba(74, 222, 128, 0.1);
  color: #4ade80;
}

.gc-ext-interaction.impossible {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}
</style>
