<template>
  <div
    class="gc-char-item"
    :class="{ expanded: isExpanded, 'has-damage': showDamage && data.damageData }"
    @click="toggleExpand"
  >
    <div class="gc-char-header">
      <div class="gc-char-avatar" :class="avatarClass">
        <i :class="avatarIcon"></i>
      </div>
      
      <div class="gc-char-info">
        <div class="gc-char-name">
          {{ name }}
          <i class="fa-solid fa-chevron-right gc-char-expand-icon"></i>
        </div>
        <div class="gc-char-stats">
          <span v-if="data.calcData" class="gc-stat-height">
            {{ data.calcData.当前身高_格式化 }}
          </span>
          <span v-else class="gc-stat-unknown">未设置</span>
          
          <span v-if="data.calcData" class="gc-stat-multiplier">
            ×{{ data.calcData.倍率 }}
          </span>
          
          <!-- 损害等级指示器 -->
          <span 
            v-if="showDamage && data.damageData" 
            class="gc-damage-indicator"
            :title="`破坏力: ${data.damageData.破坏力等级}`"
          >
            <i class="fa-solid fa-explosion"></i>
            {{ data.damageData.破坏力等级 }}
          </span>
        </div>
      </div>
      
      <span v-if="data.calcData" class="gc-level-badge" :class="levelBadgeClass">
        {{ data.calcData.级别 }}
      </span>
    </div>

    <!-- 展开详情 -->
    <div v-if="isExpanded && data.calcData" class="gc-char-details">
      <div class="gc-char-details-grid">
        <!-- 基础数据 -->
        <div class="gc-detail-section">
          <div class="gc-detail-section-title">
            <i class="fa-solid fa-ruler-combined"></i> 基础数据
          </div>
          <div class="gc-detail-row">
            <span class="gc-detail-label">原身高</span>
            <span class="gc-detail-value">{{ data.calcData.原身高 }}m</span>
          </div>
          <div class="gc-detail-row">
            <span class="gc-detail-label">当前身高</span>
            <span class="gc-detail-value">{{ data.calcData.当前身高_格式化 }}</span>
          </div>
          <div class="gc-detail-row">
            <span class="gc-detail-label">倍率</span>
            <span class="gc-detail-value">×{{ data.calcData.倍率 }}</span>
          </div>
          <div class="gc-detail-row">
            <span class="gc-detail-label">级别</span>
            <span class="gc-detail-value">{{ data.calcData.级别 }}</span>
          </div>
        </div>

        <!-- 身体部位（巨大娘） -->
        <template v-if="'身体部位_格式化' in data.calcData">
          <div class="gc-detail-section">
            <div class="gc-detail-section-title">
              <i class="fa-solid fa-person"></i> 关键部位
            </div>
            <template v-for="part in keyBodyParts" :key="part">
              <div v-if="(data.calcData as any).身体部位_格式化[part]" class="gc-detail-row">
                <span class="gc-detail-label">{{ part }}</span>
                <span class="gc-detail-value">{{ (data.calcData as any).身体部位_格式化[part] }}</span>
              </div>
            </template>
          </div>
        </template>

        <!-- 眼中的世界（巨大娘） -->
        <template v-if="'眼中的世界_格式化' in data.calcData">
          <div class="gc-detail-section">
            <div class="gc-detail-section-title">
              <i class="fa-solid fa-eye"></i> 她眼中的世界
            </div>
            <template v-for="obj in keyObjects" :key="obj">
              <div v-if="(data.calcData as any).眼中的世界_格式化[obj]" class="gc-detail-row">
                <span class="gc-detail-label">{{ obj }}</span>
                <span class="gc-detail-value">{{ (data.calcData as any).眼中的世界_格式化[obj] }}</span>
              </div>
            </template>
          </div>
        </template>

        <!-- 眼中的巨大娘（小人） -->
        <template v-if="'眼中的巨大娘_格式化' in data.calcData">
          <div class="gc-detail-section">
            <div class="gc-detail-section-title">
              <i class="fa-solid fa-eye"></i> 眼中的巨大娘
            </div>
            <template v-for="part in keyGiantessParts" :key="part">
              <div v-if="(data.calcData as any).眼中的巨大娘_格式化[part]" class="gc-detail-row">
                <span class="gc-detail-label">{{ part }}</span>
                <span class="gc-detail-value">{{ (data.calcData as any).眼中的巨大娘_格式化[part] }}</span>
              </div>
            </template>
          </div>
        </template>

        <!-- 扩展内容区域 -->
        <div class="gc-extension-content-area">
          <!-- 扩展贡献的内容 -->
          <slot name="extensions" :character="data" :expanded="isExpanded"></slot>
        </div>
        
        <!-- 保留旧插槽以向后兼容 -->
        <slot name="damage" :damage-data="data.damageData"></slot>
        <slot name="actual-damage" :actual-damage="data.actualDamage"></slot>
        <slot name="items" :items-data="data.itemsCalc"></slot>

        <!-- 身高历史 -->
        <template v-if="data.history && data.history.length > 0">
          <div class="gc-detail-section full-width">
            <div class="gc-detail-section-title">
              <i class="fa-solid fa-clock-rotate-left"></i> 最近变化
            </div>
            <div class="gc-history-list">
              <div v-for="(record, idx) in data.history.slice(-3).reverse()" :key="idx" class="gc-history-item">
                <div class="gc-history-time">{{ formatTime(record.time) }}</div>
                <div class="gc-history-content">
                  <span class="gc-history-height">{{ record.heightFormatted }}</span>
                  <span v-if="record.reason" class="gc-history-reason">{{ record.reason }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CharacterData } from '../../characters';

const props = defineProps<{
  name: string;
  data: CharacterData;
  showDamage?: boolean;
  expanded?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle', name: string): void;
}>();

const isExpanded = computed(() => props.expanded);

const toggleExpand = () => {
  emit('toggle', props.name);
};

const avatarClass = computed(() => {
  if (!props.data.calcData) return '';
  return props.data.calcData.倍率 >= 1 ? 'giant' : 'tiny';
});

const avatarIcon = computed(() => {
  if (!props.data.calcData) return 'fa-solid fa-user';
  return props.data.calcData.倍率 >= 1 ? 'fa-solid fa-shoe-prints' : 'fa-solid fa-bug';
});

const levelBadgeClass = computed(() => {
  if (!props.data.calcData) return '';
  return props.data.calcData.倍率 >= 1 ? 'giant' : 'tiny';
});

const formatTime = (time?: string) => {
  if (!time) return '';
  if (time.includes(' ')) return time.split(' ')[1];
  return time;
};

const keyBodyParts = ['眼睛高度', '足长', '手掌长', '乳房高度'];
const keyObjects = ['普通成年人', '轿车长度', '十层楼房'];
const keyGiantessParts = ['身高', '足长', '手掌长'];
</script>

<style scoped>
.gc-char-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--gc-border, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 12px;
}

.gc-char-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.gc-char-item.expanded {
  background: rgba(15, 23, 42, 0.6);
  border-color: var(--gc-primary-border, rgba(236, 72, 153, 0.4));
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

.gc-char-item.has-damage {
  border-left: 3px solid rgba(249, 115, 22, 0.4);
}

.gc-char-item.has-damage.expanded {
  border-left-color: #f97316;
}

.gc-char-header {
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.gc-char-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4em;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  transition: all 0.3s;
}

.gc-char-avatar.giant {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(239, 68, 68, 0.2));
  color: #f97316;
  box-shadow: 0 0 15px rgba(249, 115, 22, 0.1);
}

.gc-char-avatar.tiny {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2));
  color: #60a5fa;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.1);
}

.gc-char-info {
  flex: 1;
  min-width: 0;
}

.gc-char-name {
  font-weight: 600;
  font-size: 1.05em;
  color: #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.gc-char-expand-icon {
  font-size: 0.8em;
  color: #94a3b8;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.5;
}

.gc-char-item:hover .gc-char-expand-icon {
  opacity: 1;
}

.gc-char-item.expanded .gc-char-expand-icon {
  transform: rotate(90deg);
  color: var(--gc-primary, #ec4899);
}

.gc-char-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9em;
}

.gc-stat-height {
  color: #e2e8f0;
  font-weight: 500;
}

.gc-stat-unknown {
  color: #64748b;
  font-style: italic;
}

.gc-stat-multiplier {
  color: #94a3b8;
  font-family: var(--gc-font-mono);
  background: rgba(255, 255, 255, 0.05);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.85em;
}

.gc-level-badge {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.75em;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  letter-spacing: 0.05em;
}

.gc-level-badge.giant {
  background: rgba(249, 115, 22, 0.15);
  color: #f97316;
}

.gc-level-badge.tiny {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

/* 损害指示器 */
.gc-damage-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8em;
  padding: 2px 8px;
  background: rgba(249, 115, 22, 0.1);
  color: #fb923c;
  border-radius: 6px;
  border: 1px solid rgba(249, 115, 22, 0.2);
}

/* 详情区域 */
.gc-char-details {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.15);
  padding: 20px;
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 450px;
  overflow-y: auto;
}

.gc-char-details::-webkit-scrollbar {
  width: 4px;
}

.gc-char-details::-webkit-scrollbar-track {
  background: transparent;
}

.gc-char-details::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.gc-char-details::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.gc-char-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.gc-detail-section {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid transparent;
}

.gc-detail-section:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.05);
}

.gc-detail-section.full-width {
  grid-column: 1 / -1;
}

.gc-detail-section-title {
  font-size: 0.8em;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.gc-detail-section-title i {
  color: var(--gc-primary, #ec4899);
}

.gc-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.9em;
  padding: 6px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
}

.gc-detail-row:last-child {
  border-bottom: none;
}

.gc-detail-label {
  color: #64748b;
}

.gc-detail-value {
  color: #e2e8f0;
  font-family: var(--gc-font-mono);
  font-weight: 500;
}

/* 历史记录 */
.gc-history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gc-history-item {
  display: flex;
  gap: 12px;
  font-size: 0.9em;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  align-items: center;
}

.gc-history-time {
  color: #64748b;
  font-family: var(--gc-font-mono);
  font-size: 0.85em;
}

.gc-history-content {
  flex: 1;
  display: flex;
  gap: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  align-items: center;
}

.gc-history-height {
  color: #f1f5f9;
  font-weight: 600;
}

.gc-history-reason {
  color: #94a3b8;
  font-size: 0.9em;
  opacity: 0.8;
}
</style>
