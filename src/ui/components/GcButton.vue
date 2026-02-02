<template>
  <button
    class="gc-btn"
    :class="[
      variant && `gc-btn-${variant}`,
      size && `gc-btn-${size}`,
      { active, disabled }
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <i v-if="icon" :class="icon"></i>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'danger' | 'link' | 'icon' | 'icon-sm' | 'icon-xs';
  size?: 'sm' | 'md';
  icon?: string;
  active?: boolean;
  disabled?: boolean;
}>();

defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();
</script>

<style scoped>
.gc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--gc-border, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  color: var(--gc-text, #f1f5f9);
  font-weight: 500;
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.2s;
}

.gc-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.gc-btn-primary {
  background: var(--gc-primary, #f472b6);
  border-color: var(--gc-primary, #f472b6);
  color: white;
}

.gc-btn-primary:hover {
  background: var(--gc-primary-hover, #ec4899);
}

.gc-btn-danger {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.gc-btn-danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

.gc-btn-link {
  background: transparent;
  border: none;
  color: var(--gc-text-muted, #94a3b8);
  padding: 4px 8px;
}

.gc-btn-link:hover {
  color: var(--gc-text, #f1f5f9);
}

.gc-btn-sm {
  padding: 6px 10px;
  font-size: 0.8em;
}

.gc-btn-icon {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 8px;
}

.gc-btn-icon-sm {
  width: 28px;
  height: 28px;
  padding: 0;
  font-size: 0.8em;
  border-radius: 6px;
}

.gc-btn-icon-xs {
  width: 20px;
  height: 20px;
  padding: 0;
  font-size: 0.7em;
  border-radius: 4px;
}

.gc-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gc-btn.active {
  background: var(--gc-primary, #f472b6);
  color: white;
}
</style>
