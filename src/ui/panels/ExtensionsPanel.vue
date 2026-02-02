<template>
  <div class="gc-extensions">
    <div 
      class="gc-section-header clickable"
      @click="isSectionCollapsed = !isSectionCollapsed"
    >
      <div class="gc-header-left">
        <i class="fa-solid fa-puzzle-piece"></i>
        <span>扩展系统</span>
      </div>
      <i 
        class="fa-solid gc-chevron"
        :class="isSectionCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'"
      ></i>
    </div>
    
    <transition name="slide">
      <div v-show="!isSectionCollapsed" class="gc-extension-list">
      <!-- 核心计算（始终开启） -->
      <div class="gc-extension-item core">
        <div class="gc-extension-icon">
          <i class="fa-solid fa-calculator"></i>
        </div>
        <div class="gc-extension-info">
          <div class="gc-extension-name">
            基础计算
            <GcBadge size="sm">核心</GcBadge>
          </div>
          <div class="gc-extension-desc">身体数据计算、相对尺寸参照</div>
        </div>
        <div class="gc-extension-toggle">
          <span class="gc-always-on">始终开启</span>
        </div>
      </div>

      <!-- 损害计算（可开关） -->
      <div 
        class="gc-extension-item" 
        :class="{ 
          active: settings.enableDamageCalculation,
          clickable: settings.enableDamageCalculation
        }"
        @click="settings.enableDamageCalculation ? (isDamageExpanded = !isDamageExpanded) : null"
      >
        <div class="gc-extension-icon damage">
          <i class="fa-solid fa-explosion"></i>
        </div>
        <div class="gc-extension-info">
          <div class="gc-extension-name">
            损害计算
            <GcBadge v-if="settings.enableDamageCalculation" variant="success" size="sm">已启用</GcBadge>
          </div>
          <div class="gc-extension-desc">计算巨大娘行动可能造成的破坏</div>
        </div>
        <div class="gc-extension-toggle">
          <div @click.stop class="gc-switch-wrapper">
            <GcSwitch
              :model-value="settings.enableDamageCalculation"
              @update:model-value="$emit('toggle-damage', $event)"
            />
          </div>
          <div v-if="settings.enableDamageCalculation" class="gc-expand-icon">
            <i class="fa-solid" :class="isDamageExpanded ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
          </div>
        </div>
      </div>

      <!-- 损害计算设置 -->
      <transition name="slide">
        <div v-if="settings.enableDamageCalculation && isDamageExpanded" class="gc-extension-settings">
          <div class="gc-setting-item">
            <label>默认场景</label>
            <select class="gc-input" :value="settings.damageScenario" @change="$emit('update:setting', 'damageScenario', ($event.target as HTMLSelectElement).value)">
              <option
                v-for="scenario in damageScenarios"
                :key="scenario.id"
                :value="scenario.id"
              >
                {{ scenario.name }} ({{ scenario.density.toLocaleString() }}人/km²)
              </option>
            </select>
          </div>
          
          <div class="gc-setting-toggle">
            <label>
              <span>注入损害提示词</span>
              <small>在提示词中包含损害计算结果</small>
            </label>
            <GcSwitch
              size="sm"
              :model-value="settings.injectDamagePrompt"
              @update:model-value="$emit('update:setting', 'injectDamagePrompt', $event)"
            />
          </div>
          
          <div class="gc-setting-toggle">
            <label>
              <span>显示特殊效应</span>
              <small>地震、海啸等物理效应</small>
            </label>
            <GcSwitch
              size="sm"
              :model-value="settings.showSpecialEffects"
              @update:model-value="$emit('update:setting', 'showSpecialEffects', $event)"
            />
          </div>
          
          <div class="gc-setting-toggle">
            <label>
              <span>按角色显示损害</span>
              <small>在角色卡片中显示损害数据</small>
            </label>
            <GcSwitch
              size="sm"
              :model-value="settings.showDamagePerCharacter"
              @update:model-value="$emit('update:setting', 'showDamagePerCharacter', $event)"
            />
          </div>
          
          <div class="gc-setting-toggle">
            <label>
              <span>显示损害汇总</span>
              <small>所有角色的损害统计</small>
            </label>
            <GcSwitch
              size="sm"
              :model-value="settings.showDamageSummary"
              @update:model-value="$emit('update:setting', 'showDamageSummary', $event)"
            />
          </div>
          
          <!-- 损害预览 -->
          <div v-if="damageSummary" class="gc-damage-preview">
            <div class="gc-damage-preview-header">
              <i class="fa-solid fa-chart-bar"></i>
              <span>当前汇总</span>
            </div>
            <div class="gc-damage-preview-content">
              <div class="gc-damage-stat">
                <span class="gc-damage-label">巨大娘数量</span>
                <span class="gc-damage-value">{{ damageSummary.giantCount }}</span>
              </div>
              <div class="gc-damage-stat">
                <span class="gc-damage-label">预估单步伤亡</span>
                <span class="gc-damage-value casualties">
                  {{ formatDamageRange(damageSummary.totalCasualties) }}
                </span>
              </div>
              <div class="gc-damage-stat">
                <span class="gc-damage-label">预估建筑损毁</span>
                <span class="gc-damage-value buildings">
                  {{ formatDamageRange(damageSummary.totalBuildings) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </transition>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { GcSwitch, GcBadge } from '../components';
import type { Settings, DamageSummary } from '../../types';

const props = defineProps<{
  settings: Settings;
  damageSummary: DamageSummary | null;
  damageScenarios: Array<{ id: string; name: string; density: number }>;
}>();

defineEmits<{
  (e: 'toggle-damage', value: boolean): void;
  (e: 'update:setting', key: keyof Settings, value: unknown): void;
}>();

// 状态控制
const isSectionCollapsed = ref(false);
const isDamageExpanded = ref(true);

// 当启用损害计算时，自动展开设置
watch(() => props.settings.enableDamageCalculation, (val) => {
  if (val) isDamageExpanded.value = true;
});

const formatDamageRange = (range: { min: number; max: number } | undefined) => {
  if (!range) return '-';
  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };
  return `${formatNum(range.min)} - ${formatNum(range.max)}`;
};
</script>

<style scoped>
.gc-extensions {
  margin-top: 16px;
}

.gc-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 0.9em;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--gc-text-muted, #94a3b8);
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
}

.gc-section-header:hover {
  color: var(--gc-text, #f1f5f9);
}

.gc-section-header.clickable:hover .gc-header-left {
  color: var(--gc-primary, #f472b6);
}

.gc-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s;
}

.gc-chevron {
  font-size: 0.8em;
  opacity: 0.7;
  transition: transform 0.2s;
}

.gc-section-header i {
  color: var(--gc-primary, #f472b6);
}

.gc-extension-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gc-extension-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.gc-extension-item:hover {
  background: rgba(0, 0, 0, 0.3);
}

.gc-extension-item.clickable {
  cursor: pointer;
}

.gc-extension-item.core {
  border-color: rgba(52, 211, 153, 0.2);
}

.gc-extension-item.active {
  border-color: rgba(244, 114, 182, 0.3);
}

.gc-extension-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-extension-item.core .gc-extension-icon {
  background: rgba(52, 211, 153, 0.1);
  color: #34d399;
}

.gc-extension-icon.damage {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.gc-extension-item.active .gc-extension-icon.damage {
  color: #ef4444;
}

.gc-extension-info {
  flex: 1;
  min-width: 0;
}

.gc-extension-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  font-size: 0.9em;
  margin-bottom: 2px;
}

.gc-extension-desc {
  font-size: 0.8em;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-extension-toggle {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.gc-switch-wrapper {
  display: flex;
  align-items: center;
}

.gc-expand-icon {
  width: 20px;
  display: flex;
  justify-content: center;
  color: var(--gc-text-muted, #94a3b8);
  font-size: 0.8em;
  opacity: 0.7;
}

.gc-always-on {
  font-size: 0.75em;
  color: #34d399;
  padding: 2px 8px;
  background: rgba(52, 211, 153, 0.1);
  border-radius: 4px;
}

.gc-extension-settings {
  padding: 12px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  margin-left: 48px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gc-setting-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gc-setting-item label {
  font-size: 0.85em;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-input {
  width: 100%;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--gc-border, rgba(255, 255, 255, 0.1));
  border-radius: 6px;
  color: var(--gc-text, #f1f5f9);
  font-size: 0.85em;
}

.gc-setting-toggle {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 6px 0;
}

.gc-setting-toggle label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gc-setting-toggle label span {
  font-size: 0.85em;
  font-weight: 500;
}

.gc-setting-toggle label small {
  font-size: 0.75em;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-damage-preview {
  margin-top: 8px;
  padding: 10px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
}

.gc-damage-preview-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85em;
  font-weight: 500;
  margin-bottom: 8px;
  color: #f87171;
}

.gc-damage-preview-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gc-damage-stat {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
}

.gc-damage-label {
  color: var(--gc-text-muted, #94a3b8);
}

.gc-damage-value {
  font-weight: 500;
}

.gc-damage-value.casualties {
  color: #f87171;
}

.gc-damage-value.buildings {
  color: #fbbf24;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 1000px;
}
</style>
