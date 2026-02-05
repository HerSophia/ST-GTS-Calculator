<template>
  <div class="gc-input-wrapper" :class="wrapperClass">
    <input
      v-if="type !== 'textarea'"
      :type="type"
      class="gc-input"
      :class="inputClass"
      :value="modelValue"
      :placeholder="placeholder"
      :readonly="readonly"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <textarea
      v-else
      class="gc-textarea"
      :class="inputClass"
      :value="modelValue"
      :placeholder="placeholder"
      :readonly="readonly"
      :rows="rows"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    ></textarea>
    <span v-if="suffix" class="gc-input-suffix">{{ suffix }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string | number;
  type?: 'text' | 'number' | 'textarea';
  placeholder?: string;
  readonly?: boolean;
  size?: 'sm' | 'md';
  suffix?: string;
  rows?: number;
  wrapperClass?: string;
  inputClass?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();
</script>

<style scoped>
.gc-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.gc-input {
  width: 100%;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--gc-border, rgba(255, 255, 255, 0.1));
  border-radius: 6px;
  color: var(--gc-text, #f1f5f9);
  font-size: 0.9em;
}

.gc-input:focus {
  outline: none;
  border-color: var(--gc-primary, #f472b6);
}

.gc-input.sm {
  padding: 4px 8px;
  font-size: 0.85em;
}

.gc-textarea {
  width: 100%;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--gc-border, rgba(255, 255, 255, 0.1));
  border-radius: 6px;
  color: var(--gc-text, #f1f5f9);
  font-size: 0.9em;
  resize: vertical;
  min-height: 80px;
}

.gc-input-suffix {
  color: var(--gc-text-muted, #94a3b8);
  font-size: 0.85em;
  margin-left: 4px;
}
</style>
