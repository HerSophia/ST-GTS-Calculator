<template>
  <input
    type="checkbox"
    class="gc-switch"
    :class="{ sm: size === 'sm' }"
    :checked="modelValue"
    @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  size?: 'sm' | 'md';
}>();

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();
</script>

<style scoped>
.gc-switch {
  appearance: none;
  width: 36px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.gc-switch::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: all 0.2s;
}

.gc-switch:checked {
  background: var(--gc-primary, #f472b6);
}

.gc-switch:checked::after {
  left: 18px;
}

.gc-switch.sm {
  width: 28px;
  height: 16px;
}

.gc-switch.sm::after {
  width: 12px;
  height: 12px;
}

.gc-switch.sm:checked::after {
  left: 14px;
}
</style>
