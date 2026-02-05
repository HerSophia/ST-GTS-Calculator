<template>
  <div class="gc-char-list">
    <div v-if="characters.size === 0" class="gc-empty">
      <i class="fa-regular fa-folder-open"></i>
      <span>暂无角色数据</span>
    </div>
    
    <CharacterCard
      v-for="[name, data] in characters"
      :key="name"
      :name="name"
      :data="data"
      :show-damage="showDamage"
      :expanded="expandedChar === name"
      @toggle="toggleExpand"
    >
      <!-- 扩展内容插槽 -->
      <template #extensions="{ character, expanded }">
        <ExtensionContent :character="character" :expanded="expanded" />
      </template>

      <!-- 实际损害插槽 -->
      <template #actual-damage="{ actualDamage }">
        <div v-if="actualDamage" class="gc-detail-section full-width gc-actual-damage-section">
          <div class="gc-detail-section-title">
            <i class="fa-solid fa-skull"></i> 实际损害记录
            <span class="gc-actual-damage-badge">剧情累计</span>
          </div>
          <div class="gc-actual-damage-grid">
            <div v-if="actualDamage.总伤亡人数" class="gc-actual-damage-item">
              <div class="gc-actual-damage-item-label">累计伤亡</div>
              <div class="gc-actual-damage-item-value casualties">{{ formatLargeNumber(actualDamage.总伤亡人数) }}人</div>
            </div>
            <div v-if="actualDamage.总建筑损毁" class="gc-actual-damage-item">
              <div class="gc-actual-damage-item-label">建筑损毁</div>
              <div class="gc-actual-damage-item-value buildings">{{ actualDamage.总建筑损毁 }}栋</div>
            </div>
            <div v-if="actualDamage.总城市毁灭" class="gc-actual-damage-item">
              <div class="gc-actual-damage-item-label">城市毁灭</div>
              <div class="gc-actual-damage-item-value cities">{{ actualDamage.总城市毁灭 }}座</div>
            </div>
          </div>
          
          <!-- 最近行动 -->
          <div v-if="actualDamage.最近行动" class="gc-last-action">
            <div class="gc-last-action-title">
              <i class="fa-solid fa-shoe-prints"></i> 最近行动
            </div>
            <div class="gc-last-action-content">
              <span class="gc-last-action-desc">{{ actualDamage.最近行动.描述 }}</span>
              <span v-if="actualDamage.最近行动.伤亡人数" class="gc-last-action-casualties">
                伤亡: {{ formatLargeNumber(actualDamage.最近行动.伤亡人数) }}人
              </span>
            </div>
          </div>
          
          <!-- 重大事件 -->
          <div v-if="actualDamage.重大事件?.length" class="gc-major-events">
            <div class="gc-major-events-title">
              <i class="fa-solid fa-star"></i> 重大事件 ({{ actualDamage.重大事件.length }})
            </div>
            <div class="gc-major-events-list">
              <div v-for="(event, i) in actualDamage.重大事件.slice(-3)" :key="i" class="gc-major-event-item">
                <span class="gc-major-event-desc">{{ event.描述 }}</span>
                <span v-if="event.伤亡人数" class="gc-major-event-casualties">{{ formatLargeNumber(event.伤亡人数) }}人</span>
              </div>
            </div>
          </div>
          
          <!-- 备注 -->
          <div v-if="actualDamage.备注" class="gc-actual-damage-note">
            <i class="fa-solid fa-comment"></i> {{ actualDamage.备注 }}
          </div>
        </div>
      </template>
    </CharacterCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CharacterCard from './features/CharacterCard.vue';
import ExtensionContent from './features/ExtensionContent.vue';
import type { CharacterData } from '../characters';

defineProps<{
  characters: Map<string, CharacterData>;
  showDamage?: boolean;
  showItems?: boolean;
}>();

const expandedChar = ref<string | null>(null);

const toggleExpand = (name: string) => {
  expandedChar.value = expandedChar.value === name ? null : name;
};

// 格式化大数字
const formatLargeNumber = (n: number): string => {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}千`;
  return Math.round(n).toString();
};
</script>

<style scoped>
.gc-char-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 4px;
}

.gc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--gc-text-muted, #94a3b8);
  padding: 40px 24px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  border: 1px dashed var(--gc-border, rgba(255, 255, 255, 0.08));
}

/* 实际损害记录区域 */
.gc-actual-damage-section {
  background: rgba(239, 68, 68, 0.05);
  border-radius: 8px;
  padding: 12px !important;
  border: 1px solid rgba(239, 68, 68, 0.2);
  margin-top: 8px;
}

.gc-actual-damage-section .gc-detail-section-title {
  color: #ef4444;
}

.gc-actual-damage-badge {
  font-size: 0.7em;
  font-weight: 500;
  padding: 2px 6px;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-radius: 4px;
  margin-left: auto;
}

.gc-actual-damage-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.gc-actual-damage-item {
  background: rgba(0, 0, 0, 0.2);
  padding: 8px 10px;
  border-radius: 6px;
  text-align: center;
}

.gc-actual-damage-item-label {
  font-size: 0.7em;
  color: var(--gc-text-muted, #94a3b8);
  margin-bottom: 2px;
}

.gc-actual-damage-item-value {
  font-size: 0.95em;
  font-weight: 600;
  font-family: var(--gc-font-mono);
}

.gc-actual-damage-item-value.casualties {
  color: #f87171;
}

.gc-actual-damage-item-value.buildings {
  color: #fbbf24;
}

.gc-actual-damage-item-value.cities {
  color: #c084fc;
}

/* 最近行动 */
.gc-last-action {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(239, 68, 68, 0.2);
}

.gc-last-action-title {
  font-size: 0.75em;
  font-weight: 600;
  color: #f87171;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.gc-last-action-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85em;
}

.gc-last-action-desc {
  color: var(--gc-text, #f8fafc);
}

.gc-last-action-casualties {
  color: #f87171;
  font-family: var(--gc-font-mono);
}

/* 重大事件 */
.gc-major-events {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(239, 68, 68, 0.2);
}

.gc-major-events-title {
  font-size: 0.75em;
  font-weight: 600;
  color: #fbbf24;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.gc-major-events-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gc-major-event-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8em;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}

.gc-major-event-desc {
  color: var(--gc-text, #f8fafc);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gc-major-event-casualties {
  color: #f87171;
  font-family: var(--gc-font-mono);
  margin-left: 8px;
  flex-shrink: 0;
}

/* 备注 */
.gc-actual-damage-note {
  margin-top: 8px;
  font-size: 0.8em;
  color: var(--gc-text-muted, #94a3b8);
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 6px;
}

.gc-actual-damage-note i {
  color: #94a3b8;
}

/* 滚动条 */
.gc-char-list::-webkit-scrollbar {
  width: 4px;
}

.gc-char-list::-webkit-scrollbar-track {
  background: transparent;
}

.gc-char-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.gc-char-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
