<template>
  <GcOverlay
    :visible="visible"
    title="帮助"
    icon="fa-regular fa-circle-question"
    @close="$emit('close')"
  >
    <div class="gc-help-content">
      <div class="gc-help-section">
        <h3><i class="fa-solid fa-rocket"></i> 快速开始</h3>
        <p>在世界书或提示词中使用 MVU 命令：</p>
        <div class="gc-code-block">
          _.set('巨大娘.络络.当前身高', 170)<br>
          _.set('巨大娘.络络.原身高', 1.65)
        </div>
      </div>
      
      <div class="gc-help-section">
        <h3><i class="fa-solid fa-code-branch"></i> 版本信息</h3>
        <p>当前版本: v{{ version }}</p>
        <div class="gc-changelog">
          <div v-for="ver in changelog.slice(0, 3)" :key="ver.version" class="gc-ver-item">
            <strong>v{{ ver.version }}</strong> - {{ ver.date }}
            <ul>
              <li v-for="(c, i) in ver.changes" :key="i">{{ c }}</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="gc-help-section">
        <h3><i class="fa-solid fa-book"></i> 更多帮助</h3>
        <p>查看项目文档了解更多用法：</p>
        <ul class="gc-help-links">
          <li>MVU 变量结构</li>
          <li>提示词模板系统</li>
          <li>世界观模板系统</li>
          <li>损害计算功能</li>
        </ul>
      </div>
    </div>
  </GcOverlay>
</template>

<script setup lang="ts">
import { GcOverlay } from '../components';

defineProps<{
  visible: boolean;
  version: string;
  changelog: Array<{
    version: string;
    date: string;
    changes: string[];
  }>;
}>();

defineEmits<{
  (e: 'close'): void;
}>();
</script>

<style scoped>
.gc-help-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.gc-help-section {
  margin-bottom: 8px;
}

.gc-help-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95em;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--gc-text, #f1f5f9);
}

.gc-help-section h3 i {
  color: var(--gc-primary, #f472b6);
}

.gc-help-section p {
  font-size: 0.85em;
  color: var(--gc-text-muted, #94a3b8);
  margin-bottom: 8px;
}

.gc-code-block {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  padding: 10px 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.8em;
  color: #a5f3fc;
  overflow-x: auto;
}

.gc-changelog {
  max-height: 200px;
  overflow-y: auto;
}

.gc-ver-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--gc-border, rgba(255, 255, 255, 0.1));
}

.gc-ver-item:last-child {
  border-bottom: none;
}

.gc-ver-item strong {
  color: var(--gc-primary, #f472b6);
}

.gc-ver-item ul {
  margin: 6px 0 0 16px;
  font-size: 0.8em;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-help-links {
  margin: 0 0 0 16px;
  font-size: 0.85em;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-help-links li {
  margin-bottom: 4px;
}
</style>
