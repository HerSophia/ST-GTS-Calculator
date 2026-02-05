<template>
  <div v-if="visible" class="gc-overlay-panel" :class="panelClass">
    <div class="gc-overlay-header">
      <span>
        <i v-if="icon" :class="icon"></i>
        {{ title }}
      </span>
      <div class="gc-header-actions-inner">
        <slot name="header-actions"></slot>
        <button class="gc-close-btn" @click="$emit('close')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
    <div class="gc-overlay-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
  title: string;
  icon?: string;
  panelClass?: string;
}>();

defineEmits<{
  (e: 'close'): void;
}>();
</script>

<style scoped>
.gc-overlay-panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--gc-bg, #1e293b);
  z-index: 10;
  display: flex;
  flex-direction: column;
  border-radius: var(--gc-radius, 12px);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.gc-overlay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--gc-border, rgba(255, 255, 255, 0.1));
}

.gc-overlay-header span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.gc-header-actions-inner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gc-close-btn {
  background: transparent;
  border: none;
  color: var(--gc-text-muted, #94a3b8);
  cursor: pointer;
  padding: 4px;
}

.gc-close-btn:hover {
  color: var(--gc-text, #f1f5f9);
}

.gc-overlay-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
</style>
