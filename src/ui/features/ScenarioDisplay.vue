<template>
  <div v-if="hasScenario" class="gc-scenario-section">
    <div class="gc-scenario-header">
      <div class="gc-scenario-icon">
        <i class="fa-solid fa-location-dot"></i>
      </div>
      <div class="gc-scenario-info">
        <div class="gc-scenario-title">当前场景</div>
        <div class="gc-scenario-name">{{ scenario.当前场景 }}</div>
      </div>
      <div v-if="populationDensity" class="gc-scenario-density" :class="{ 'is-custom': isCustomDensity }" :title="densityTitle">
        <i class="fa-solid fa-users"></i>
        {{ formatDensity(populationDensity) }}
        <span v-if="isCustomDensity" class="gc-custom-badge">自定义</span>
      </div>
    </div>
    
    <div v-if="hasDetails" class="gc-scenario-details">
      <div v-if="scenario.具体地点" class="gc-scenario-detail-item">
        <i class="fa-solid fa-map-pin"></i>
        <span>{{ scenario.具体地点 }}</span>
      </div>
      <div v-if="scenario.场景时间" class="gc-scenario-detail-item">
        <i class="fa-regular fa-clock"></i>
        <span>{{ scenario.场景时间 }}</span>
      </div>
      <div v-if="scenario.人群状态" class="gc-scenario-detail-item">
        <i class="fa-solid fa-person-walking"></i>
        <span>{{ scenario.人群状态 }}</span>
      </div>
      <div v-if="scenario.场景原因" class="gc-scenario-detail-item reason">
        <i class="fa-solid fa-info-circle"></i>
        <span>{{ scenario.场景原因 }}</span>
      </div>
    </div>
  </div>
  
  <div v-else class="gc-scenario-empty">
    <i class="fa-solid fa-location-crosshairs"></i>
    <span>场景未设置</span>
    <span class="gc-scenario-hint">LLM 可通过变量设置当前场景</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { POPULATION_DENSITY } from '../../core/damage';
import type { ScenarioData } from '../../stores/characters';

const props = defineProps<{
  scenario: ScenarioData;
}>();

const hasScenario = computed(() => {
  return props.scenario && props.scenario.当前场景;
});

const hasDetails = computed(() => {
  return props.scenario.具体地点 || 
         props.scenario.场景时间 || 
         props.scenario.人群状态 ||
         props.scenario.场景原因;
});

// 获取有效的人群密度（自定义优先）
const populationDensity = computed(() => {
  // 自定义密度优先
  if (props.scenario?.人群密度 !== undefined && props.scenario.人群密度 > 0) {
    return props.scenario.人群密度;
  }
  // 否则使用场景预设
  if (!props.scenario?.当前场景) return null;
  return POPULATION_DENSITY[props.scenario.当前场景] ?? null;
});

// 是否使用了自定义密度
const isCustomDensity = computed(() => {
  return props.scenario?.人群密度 !== undefined && props.scenario.人群密度 > 0;
});

const densityTitle = computed(() => {
  if (!populationDensity.value) return '';
  const source = isCustomDensity.value ? '(自定义)' : '(预设)';
  return `人口密度: ${populationDensity.value.toLocaleString()} 人/平方公里 ${source}`;
});

const formatDensity = (density: number): string => {
  if (density >= 10000) {
    return `${(density / 1000).toFixed(0)}k/km²`;
  }
  if (density >= 1000) {
    return `${(density / 1000).toFixed(1)}k/km²`;
  }
  return `${density}/km²`;
};
</script>

<style scoped>
.gc-scenario-section {
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
}

.gc-scenario-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gc-scenario-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #60a5fa;
  font-size: 1.1em;
  flex-shrink: 0;
}

.gc-scenario-info {
  flex: 1;
  min-width: 0;
}

.gc-scenario-title {
  font-size: 0.75em;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.gc-scenario-name {
  font-size: 1.1em;
  font-weight: 600;
  color: #f1f5f9;
}

.gc-scenario-density {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  font-size: 0.85em;
  font-family: 'JetBrains Mono', monospace;
  color: #60a5fa;
  cursor: help;
}

.gc-scenario-density.is-custom {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.gc-custom-badge {
  font-size: 0.7em;
  padding: 2px 6px;
  background: rgba(245, 158, 11, 0.3);
  border-radius: 4px;
  font-family: inherit;
  font-weight: 500;
}

.gc-scenario-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(59, 130, 246, 0.15);
}

.gc-scenario-detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  font-size: 0.85em;
  color: #e2e8f0;
}

.gc-scenario-detail-item i {
  color: #60a5fa;
  font-size: 0.9em;
}

.gc-scenario-detail-item.reason {
  flex-basis: 100%;
  background: rgba(59, 130, 246, 0.08);
}

.gc-scenario-detail-item.reason i {
  color: #94a3b8;
}

.gc-scenario-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 16px;
  color: #64748b;
}

.gc-scenario-empty i {
  font-size: 1.5em;
  opacity: 0.5;
}

.gc-scenario-hint {
  font-size: 0.8em;
  color: #475569;
}
</style>
