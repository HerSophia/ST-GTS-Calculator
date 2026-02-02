<template>
  <GcOverlay
    :visible="visible"
    title="设置"
    icon="fa-solid fa-gear"
    @close="$emit('close')"
  >
    <div class="gc-settings-list">
      <div class="gc-setting-item">
        <label>变量前缀</label>
        <input
          :value="settings.variablePrefix"
          @input="updateSetting('variablePrefix', ($event.target as HTMLInputElement).value)"
          type="text"
          class="gc-input sm"
          placeholder="巨大娘"
        />
      </div>
      
      <div class="gc-setting-item">
        <label>注入深度</label>
        <div class="gc-input-spinner">
          <button @click="decrementDepth">-</button>
          <input :value="settings.injectDepth" type="number" readonly />
          <button @click="incrementDepth">+</button>
        </div>
      </div>
      
      <div class="gc-setting-toggle">
        <label>
          <span>自动注入提示词</span>
          <small>数据变化时自动更新 Prompt</small>
        </label>
        <GcSwitch
          :model-value="settings.autoInject"
          @update:model-value="updateSetting('autoInject', $event)"
        />
      </div>
      
      <div class="gc-setting-toggle">
        <label>
          <span>注入互动限制</span>
          <small>检查物理上不可能的互动</small>
        </label>
        <GcSwitch
          :model-value="settings.injectInteractionLimits"
          @update:model-value="updateSetting('injectInteractionLimits', $event)"
        />
      </div>
      
      <div class="gc-setting-toggle">
        <label>
          <span>调试模式</span>
          <small>在控制台输出详细日志</small>
        </label>
        <GcSwitch
          :model-value="settings.debug"
          @update:model-value="updateSetting('debug', $event)"
        />
      </div>
      
      <div class="gc-setting-toggle">
        <label>
          <span>显示变量更新规则</span>
          <small>指导 AI 如何更新身高变量</small>
        </label>
        <GcSwitch
          :model-value="settings.showVariableUpdateRules"
          @update:model-value="updateSetting('showVariableUpdateRules', $event)"
        />
      </div>
      
      <div class="gc-setting-toggle">
        <label>
          <span>紧凑提示词格式</span>
          <small>减少提示词中的空行</small>
        </label>
        <GcSwitch
          :model-value="settings.compactPromptFormat"
          @update:model-value="updateSetting('compactPromptFormat', $event)"
        />
      </div>
    </div>
  </GcOverlay>
</template>

<script setup lang="ts">
import { GcOverlay, GcSwitch } from '../components';
import type { Settings } from '../../types';

const props = defineProps<{
  visible: boolean;
  settings: Settings;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update:setting', key: keyof Settings, value: unknown): void;
}>();

const updateSetting = (key: keyof Settings, value: unknown) => {
  emit('update:setting', key, value);
};

const decrementDepth = () => {
  if (props.settings.injectDepth > 0) {
    updateSetting('injectDepth', props.settings.injectDepth - 1);
  }
};

const incrementDepth = () => {
  if (props.settings.injectDepth < 10) {
    updateSetting('injectDepth', props.settings.injectDepth + 1);
  }
};
</script>

<style scoped>
.gc-settings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gc-setting-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gc-setting-item label {
  font-size: 0.85em;
  color: var(--gc-text-muted, #94a3b8);
  font-weight: 500;
}

.gc-input {
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

.gc-input-spinner {
  display: flex;
  align-items: center;
  gap: 4px;
}

.gc-input-spinner button {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--gc-border, rgba(255, 255, 255, 0.1));
  border-radius: 4px;
  color: var(--gc-text, #f1f5f9);
  cursor: pointer;
}

.gc-input-spinner button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.gc-input-spinner input {
  width: 50px;
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--gc-border, rgba(255, 255, 255, 0.1));
  border-radius: 4px;
  color: var(--gc-text, #f1f5f9);
  font-size: 0.9em;
  padding: 4px;
}

.gc-setting-toggle {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid var(--gc-border, rgba(255, 255, 255, 0.1));
}

.gc-setting-toggle label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gc-setting-toggle label span {
  font-size: 0.9em;
  font-weight: 500;
}

.gc-setting-toggle label small {
  font-size: 0.75em;
  color: var(--gc-text-muted, #94a3b8);
}
</style>
