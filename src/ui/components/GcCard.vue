<template>
  <div class="gc-card" :class="cardClass">
    <div v-if="title" class="gc-card-header">
      <i v-if="icon" :class="icon"></i>
      <span>{{ title }}</span>
      <slot name="header-actions"></slot>
    </div>
    <div class="gc-card-body">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  icon?: string;
  cardClass?: string;
}>();
</script>

<style scoped>
.gc-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--gc-border, rgba(255, 255, 255, 0.1));
  border-radius: 10px;
  overflow: hidden;
}

.gc-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--gc-border, rgba(255, 255, 255, 0.1));
  font-weight: 500;
  font-size: 0.9em;
}

.gc-card-header i {
  color: var(--gc-primary, #f472b6);
}

.gc-card-body {
  padding: 14px;
}
</style>
