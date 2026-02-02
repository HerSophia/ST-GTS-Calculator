<template>
  <div class="gc-debug-logs-section">
    <div class="gc-debug-logs-header">
      <h3><i class="fa-solid fa-terminal"></i> 调试日志</h3>
      <button class="gc-btn-link" @click="$emit('clear')" title="清空日志">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
    
    <div class="gc-debug-logs">
      <div 
        v-for="(log, i) in logs" 
        :key="i" 
        class="gc-debug-log-item"
        :class="log.level"
      >
        <span class="gc-log-time">{{ log.time }}</span>
        <span class="gc-log-msg">{{ log.message }}</span>
      </div>
      
      <div v-if="!logs.length" class="gc-debug-empty">
        <i class="fa-solid fa-terminal"></i>
        <p>暂无日志</p>
        <small>开启调试模式后操作会记录在这里</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  logs: Array<{ time: string; message: string; level?: string }>;
}>();

defineEmits<{
  (e: 'clear'): void;
}>();
</script>

<style scoped>
.gc-debug-logs-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.gc-debug-logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.gc-debug-logs-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
  font-weight: 600;
  color: var(--gc-text, #f1f5f9);
}

.gc-debug-logs-header h3 i {
  color: var(--gc-primary, #f472b6);
}

.gc-btn-link {
  background: transparent;
  border: none;
  color: var(--gc-text-muted, #94a3b8);
  cursor: pointer;
  padding: 4px 8px;
}

.gc-btn-link:hover {
  color: var(--gc-text, #f1f5f9);
}

.gc-debug-logs {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 10px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.8em;
  max-height: 400px;
  overflow-y: auto;
}

.gc-debug-log-item {
  display: flex;
  gap: 10px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.gc-debug-log-item:last-child {
  border-bottom: none;
}

.gc-debug-log-item.warn {
  color: #fbbf24;
}

.gc-debug-log-item.error {
  color: #f87171;
}

.gc-log-time {
  color: var(--gc-text-muted, #94a3b8);
  white-space: nowrap;
}

.gc-log-msg {
  word-break: break-all;
  color: var(--gc-text, #f1f5f9);
}

.gc-debug-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.gc-debug-empty i {
  font-size: 2em;
  color: var(--gc-text-muted, #94a3b8);
  margin-bottom: 12px;
}

.gc-debug-empty p {
  font-size: 0.9em;
  margin-bottom: 6px;
}

.gc-debug-empty small {
  font-size: 0.8em;
  color: var(--gc-text-muted, #94a3b8);
}
</style>
