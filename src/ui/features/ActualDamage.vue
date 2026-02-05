<template>
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

<script setup lang="ts">
defineProps<{
  actualDamage: {
    总伤亡人数?: number;
    总建筑损毁?: number;
    总城市毁灭?: number;
    最近行动?: {
      描述: string;
      伤亡人数?: number;
      建筑损毁?: number;
      特殊破坏?: string;
      时间点?: string;
    };
    重大事件?: Array<{
      描述: string;
      伤亡人数?: number;
      建筑损毁?: number;
      时间点?: string;
    }>;
    备注?: string;
  } | null;
}>();

// 格式化大数字
const formatLargeNumber = (n: number): string => {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}千`;
  return Math.round(n).toString();
};
</script>

<style scoped>
.gc-actual-damage-section {
  background: rgba(239, 68, 68, 0.05);
  border-radius: 8px;
  padding: 12px !important;
  border: 1px solid rgba(239, 68, 68, 0.2);
  margin-top: 8px;
}

.gc-detail-section-title {
  font-size: 0.75em;
  font-weight: 600;
  color: #ef4444;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 6px;
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
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.gc-actual-damage-item {
  background: rgba(0, 0, 0, 0.2);
  padding: 8px 10px;
  border-radius: 6px;
}

.gc-actual-damage-item-label {
  font-size: 0.75em;
  color: #94a3b8;
  margin-bottom: 2px;
}

.gc-actual-damage-item-value {
  font-size: 0.9em;
  font-weight: 500;
  font-family: 'JetBrains Mono', monospace;
  color: #e2e8f0;
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
  font-size: 0.8em;
  font-weight: 600;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.gc-last-action-content {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.85em;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.gc-last-action-desc {
  color: #e2e8f0;
}

.gc-last-action-casualties {
  color: #f87171;
  font-size: 0.9em;
  font-family: 'JetBrains Mono', monospace;
}

/* 重大事件 */
.gc-major-events {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(239, 68, 68, 0.2);
}

.gc-major-events-title {
  font-size: 0.8em;
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
  align-items: baseline;
  font-size: 0.8em;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  border-left: 2px solid rgba(251, 191, 36, 0.5);
}

.gc-major-event-desc {
  color: #e2e8f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;
}

.gc-major-event-casualties {
  color: #f87171;
  font-size: 0.9em;
  font-family: 'JetBrains Mono', monospace;
}

/* 备注 */
.gc-actual-damage-note {
  margin-top: 10px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  font-size: 0.8em;
  color: #94a3b8;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.gc-actual-damage-note i {
  color: #64748b;
  margin-top: 2px;
}

/* 全宽 */
.full-width {
  flex-basis: 100%;
}
</style>
