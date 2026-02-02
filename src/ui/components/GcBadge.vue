<template>
  <span class="gc-badge" :class="[variant, size]">
    <slot></slot>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'muted' | 'giant' | 'tiny' | 'custom';
  size?: 'sm' | 'md';
}>();
</script>

<style scoped>
.gc-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 0.75em;
  font-weight: 500;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--gc-text-muted, #94a3b8);
}

.gc-badge.primary {
  background: rgba(244, 114, 182, 0.2);
  color: #f472b6;
}

.gc-badge.success {
  background: rgba(52, 211, 153, 0.2);
  color: #34d399;
}

.gc-badge.warning {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.gc-badge.danger {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.gc-badge.muted {
  background: rgba(148, 163, 184, 0.2);
  color: #94a3b8;
}

.gc-badge.giant {
  background: rgba(244, 114, 182, 0.2);
  color: #f472b6;
}

.gc-badge.tiny {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.gc-badge.custom {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

.gc-badge.sm {
  padding: 1px 6px;
  font-size: 0.7em;
}
</style>
