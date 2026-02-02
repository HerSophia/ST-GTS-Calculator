<template>
  <GcOverlay
    :visible="visible"
    title="设置"
    icon="fa-solid fa-gear"
    @close="$emit('close')"
  >
    <div class="gc-settings-list">
      <!-- 版本与更新 -->
      <div class="gc-settings-section">
        <div class="gc-settings-section-title">
          <i class="fa-solid fa-info-circle"></i>
          <span>版本信息</span>
        </div>
        
        <div class="gc-version-info">
          <div class="gc-version-current">
            <span class="gc-version-label">当前版本</span>
            <span class="gc-version-number">v{{ currentVersion }}</span>
          </div>
          
          <!-- 更新检查结果 -->
          <div v-if="hasUpdate" class="gc-update-available">
            <div class="gc-update-badge">
              <i class="fa-solid fa-gift"></i>
              <span>发现新版本 <strong>v{{ latestVersion }}</strong></span>
              <span v-if="releaseDate" class="gc-update-date">({{ releaseDate }})</span>
            </div>
            <div class="gc-update-actions">
              <button class="gc-btn gc-btn-primary gc-btn-sm" @click="openDownloadPage">
                <i class="fa-solid fa-download"></i>
                <span>下载更新</span>
              </button>
              <button class="gc-btn gc-btn-ghost gc-btn-sm" @click="openReleasePage">
                <i class="fa-solid fa-external-link"></i>
              </button>
              <button class="gc-btn gc-btn-ghost gc-btn-sm" @click="ignoreCurrentUpdate" title="忽略此版本">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
          
          <!-- 检查更新按钮 -->
          <div class="gc-update-check">
            <button 
              class="gc-btn gc-btn-secondary gc-btn-sm" 
              @click="checkUpdate"
              :disabled="checking"
            >
              <i :class="checking ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate'"></i>
              <span>{{ checking ? '检查中...' : '检查更新' }}</span>
            </button>
            <span v-if="lastCheckTime" class="gc-update-last-check">
              上次检查: {{ formatLastCheck }}
            </span>
          </div>
        </div>
        
        <div class="gc-setting-toggle">
          <label>
            <span>自动检查更新</span>
            <small>启动时自动检查是否有新版本</small>
          </label>
          <GcSwitch
            :model-value="autoCheckUpdate"
            @update:model-value="toggleAutoCheck"
          />
        </div>
      </div>

      <div class="gc-settings-divider"></div>

      <!-- 基本设置 -->
      <div class="gc-settings-section">
        <div class="gc-settings-section-title">
          <i class="fa-solid fa-sliders"></i>
          <span>基本设置</span>
        </div>
        
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
      </div>

      <div class="gc-settings-divider"></div>

      <!-- 提示词设置 -->
      <div class="gc-settings-section">
        <div class="gc-settings-section-title">
          <i class="fa-solid fa-file-lines"></i>
          <span>提示词设置</span>
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

      <div class="gc-settings-divider"></div>

      <!-- 开发者选项 -->
      <div class="gc-settings-section">
        <div class="gc-settings-section-title">
          <i class="fa-solid fa-code"></i>
          <span>开发者选项</span>
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
      </div>
    </div>
  </GcOverlay>
</template>

<script setup lang="ts">
import { GcOverlay, GcSwitch } from '../components';
import { useUpdater } from '../../composables';
import type { Settings } from '../../types';

const props = defineProps<{
  visible: boolean;
  settings: Settings;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update:setting', key: keyof Settings, value: unknown): void;
}>();

// 更新器
const {
  checking,
  hasUpdate,
  currentVersion,
  latestVersion,
  releaseDate,
  settings: updaterSettings,
  check: checkUpdate,
  openDownloadPage,
  openReleasePage,
  ignoreCurrentUpdate,
  toggleAutoCheck,
} = useUpdater();

const autoCheckUpdate = computed(() => updaterSettings.value.autoCheck);
const lastCheckTime = computed(() => updaterSettings.value.lastCheckTime);

const formatLastCheck = computed(() => {
  if (!lastCheckTime.value) return '';
  const date = new Date(lastCheckTime.value);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return date.toLocaleDateString('zh-CN');
});

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
  gap: 16px;
}

.gc-settings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gc-settings-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
  font-weight: 600;
  color: var(--gc-text, #f1f5f9);
  padding-bottom: 4px;
}

.gc-settings-section-title i {
  color: var(--gc-primary, #f472b6);
  font-size: 0.9em;
}

.gc-settings-divider {
  height: 1px;
  background: var(--gc-border, rgba(255, 255, 255, 0.1));
  margin: 4px 0;
}

/* 版本信息 */
.gc-version-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.gc-version-current {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gc-version-label {
  font-size: 0.85em;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-version-number {
  font-size: 0.95em;
  font-weight: 600;
  color: var(--gc-text, #f1f5f9);
}

/* 更新可用 */
.gc-update-available {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border-radius: 6px;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.gc-update-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9em;
  color: #a5b4fc;
}

.gc-update-badge i {
  color: #fbbf24;
}

.gc-update-badge strong {
  color: #c4b5fd;
}

.gc-update-date {
  font-size: 0.85em;
  opacity: 0.8;
}

.gc-update-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 检查更新 */
.gc-update-check {
  display: flex;
  align-items: center;
  gap: 10px;
}

.gc-update-last-check {
  font-size: 0.75em;
  color: var(--gc-text-muted, #94a3b8);
}

/* 按钮样式 */
.gc-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gc-btn-sm {
  padding: 5px 10px;
  font-size: 0.8em;
}

.gc-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.gc-btn-primary:hover:not(:disabled) {
  filter: brightness(1.1);
}

.gc-btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--gc-text, #f1f5f9);
  border: 1px solid var(--gc-border, rgba(255, 255, 255, 0.1));
}

.gc-btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.gc-btn-ghost {
  background: transparent;
  color: var(--gc-text-muted, #94a3b8);
  padding: 5px 8px;
}

.gc-btn-ghost:hover:not(:disabled) {
  color: var(--gc-text, #f1f5f9);
  background: rgba(255, 255, 255, 0.05);
}

.gc-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 原有样式 */
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

.gc-setting-toggle:last-child {
  border-bottom: none;
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
