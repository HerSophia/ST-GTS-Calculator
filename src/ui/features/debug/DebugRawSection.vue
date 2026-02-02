<template>
  <div class="gc-debug-raw-section">
    <div class="gc-debug-section">
      <h3><i class="fa-solid fa-database"></i> MVU 原始数据</h3>
      <pre class="gc-debug-json">{{ JSON.stringify(mvuInfo.messageVariables, null, 2) }}</pre>
    </div>
    
    <div class="gc-debug-section">
      <h3><i class="fa-solid fa-cog"></i> 当前设置</h3>
      <pre class="gc-debug-json">{{ JSON.stringify(settings, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MvuDebugInfo } from '../../../services/debug';
import type { Settings } from '../../../types';

defineProps<{
  mvuInfo: MvuDebugInfo;
  settings: Settings;
}>();
</script>

<style scoped>
.gc-debug-section {
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 12px;
}

.gc-debug-section:last-child {
  margin-bottom: 0;
}

.gc-debug-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--gc-text, #f1f5f9);
}

.gc-debug-section h3 i {
  color: var(--gc-primary, #f472b6);
}

.gc-debug-json {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.75em;
  overflow-x: auto;
  max-height: 300px;
  color: #a5f3fc;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
