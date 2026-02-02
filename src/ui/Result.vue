<template>
  <div class="gc-result" :class="isGiant ? 'giant' : 'tiny'">
    <div class="gc-result-header">
      <div class="gc-result-icon-wrapper">
        <i class="fa-solid" :class="isGiant ? 'fa-ruler-vertical' : 'fa-microscope'"></i>
      </div>
      <div class="gc-result-title">
        <div class="gc-result-height">
          {{ result.当前身高_格式化 }}
        </div>
        <div class="gc-result-meta">
          <span class="gc-badge" :class="isGiant ? 'giant' : 'tiny'">
            {{ result.级别 }}
          </span>
          <span class="gc-multiplier">
            <i class="fa-solid fa-xmark"></i> {{ result.倍率 }}
          </span>
        </div>
      </div>
      <button class="gc-result-close" @click="$emit('close')" title="关闭">
        <i class="fa-solid fa-times"></i>
      </button>
    </div>
    
    <div class="gc-result-body">
      <div class="gc-level-desc">
        <i class="fa-solid fa-quote-left"></i>
        {{ result.级别描述 }}
      </div>
      <div class="gc-result-desc">{{ result.描述 }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GiantessData, TinyData } from '../core';

defineProps<{
  result: GiantessData | TinyData;
  isGiant: boolean;
}>();

defineEmits<{
  (e: 'close'): void;
}>();
</script>

<style scoped>
.gc-result {
  --gc-giant-color: #fb923c;
  --gc-tiny-color: #60a5fa;
  --gc-bg: rgba(30, 41, 59, 0.7);
  --gc-border: rgba(255, 255, 255, 0.1);
  
  background: var(--gc-bg);
  border: 1px solid var(--gc-border);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
  backdrop-filter: blur(8px);
}

.gc-result:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.2);
}

.gc-result.giant {
  border-left: 4px solid var(--gc-giant-color);
}

.gc-result.tiny {
  border-left: 4px solid var(--gc-tiny-color);
}

.gc-result-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--gc-border);
  background: rgba(255, 255, 255, 0.03);
  position: relative;
}

.gc-result-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.gc-result-close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.gc-result-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
}

.gc-result.giant .gc-result-icon-wrapper {
  color: var(--gc-giant-color);
  background: rgba(251, 146, 60, 0.1);
}

.gc-result.tiny .gc-result-icon-wrapper {
  color: var(--gc-tiny-color);
  background: rgba(96, 165, 250, 0.1);
}

.gc-result-title {
  flex: 1;
}

.gc-result-height {
  font-size: 1.5em;
  font-weight: 700;
  line-height: 1.2;
  color: var(--smart-text-color, #e2e8f0);
  letter-spacing: -0.02em;
}

.gc-result-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 0.85em;
}

.gc-badge {
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85em;
}

.gc-badge.giant {
  background: rgba(251, 146, 60, 0.2);
  color: var(--gc-giant-color);
}

.gc-badge.tiny {
  background: rgba(96, 165, 250, 0.2);
  color: var(--gc-tiny-color);
}

.gc-multiplier {
  color: var(--smart-text-muted-color, #94a3b8);
  font-family: 'JetBrains Mono', monospace;
}

.gc-result-body {
  padding: 16px;
}

.gc-level-desc {
  font-size: 0.9em;
  color: var(--smart-text-muted-color, #94a3b8);
  margin-bottom: 12px;
  font-style: italic;
  display: flex;
  gap: 8px;
}

.gc-level-desc i {
  opacity: 0.5;
  margin-top: 2px;
}

.gc-result-desc {
  font-size: 0.95em;
  line-height: 1.6;
  color: var(--smart-text-color, #e2e8f0);
  white-space: pre-wrap;
}
</style>