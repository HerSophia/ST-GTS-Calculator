<template>
  <GcOverlay
    :visible="visible"
    :title="'世界观设定'"
    :icon="currentWorldview?.icon || 'fa-solid fa-globe'"
    panel-class="gc-worldview-panel"
    @close="handleClose"
  >
    <template #header-actions>
      <button class="gc-btn-link" @click="$emit('reset')" title="重置为默认">
        <i class="fa-solid fa-rotate-left"></i>
      </button>
    </template>

    <div class="gc-worldview-content">
      <!-- 当前世界观选择 -->
      <div class="gc-worldview-selector">
        <div class="gc-worldview-current">
          <div class="gc-worldview-current-info">
            <i :class="currentWorldview?.icon" class="gc-worldview-icon"></i>
            <div>
              <div class="gc-worldview-name">{{ currentWorldview?.name }}</div>
              <div class="gc-worldview-desc">{{ currentWorldview?.description }}</div>
            </div>
          </div>
        </div>
        
        <!-- 世界观快速切换列表 -->
        <div class="gc-worldview-list">
          <div 
            v-for="wv in worldviews" 
            :key="wv.id"
            class="gc-worldview-item"
            :class="{ active: wv.id === currentWorldviewId, builtin: wv.builtin }"
            @click="$emit('select', wv.id)"
          >
            <i :class="wv.icon" class="gc-worldview-item-icon"></i>
            <div class="gc-worldview-item-info">
              <span class="gc-worldview-item-name">{{ wv.name }}</span>
              <GcBadge v-if="!wv.builtin" variant="custom" size="sm">自定义</GcBadge>
            </div>
            <i v-if="wv.id === currentWorldviewId" class="fa-solid fa-check gc-worldview-check"></i>
          </div>
        </div>
      </div>
      
      <!-- 当前世界观详情 -->
      <div v-if="!isEditing" class="gc-worldview-details">
        <div class="gc-worldview-section">
          <h4><i class="fa-solid fa-gears"></i> 变化机制</h4>
          <div class="gc-worldview-text">{{ currentWorldview?.mechanism }}</div>
        </div>
        
        <div class="gc-worldview-section">
          <h4><i class="fa-solid fa-person"></i> 身体特性</h4>
          <div class="gc-worldview-text">{{ currentWorldview?.bodyCharacteristics }}</div>
        </div>
        
        <div v-if="hasLimitations" class="gc-worldview-section">
          <h4><i class="fa-solid fa-triangle-exclamation"></i> 限制与代价</h4>
          <ul class="gc-worldview-list-items">
            <li v-for="(item, i) in currentWorldview?.limitations" :key="i">{{ item }}</li>
          </ul>
        </div>
        
        <div v-if="currentWorldview?.specialRules?.length" class="gc-worldview-section">
          <h4><i class="fa-solid fa-star"></i> 特殊规则</h4>
          <ul class="gc-worldview-list-items">
            <li v-for="(item, i) in currentWorldview?.specialRules" :key="i">{{ item }}</li>
          </ul>
        </div>
        
        <div v-if="currentWorldview?.writingTips?.length" class="gc-worldview-section">
          <h4><i class="fa-solid fa-pen-fancy"></i> 写作建议</h4>
          <ul class="gc-worldview-list-items">
            <li v-for="(item, i) in currentWorldview?.writingTips" :key="i">{{ item }}</li>
          </ul>
        </div>
        
        <!-- 世界观设置选项 -->
        <div class="gc-worldview-section gc-worldview-options">
          <h4><i class="fa-solid fa-sliders"></i> 世界观选项</h4>
          <div class="gc-setting-toggle">
            <label>
              <span>注入世界观提示词</span>
              <small>将世界观设定注入到 AI 提示词中</small>
            </label>
            <GcSwitch
              :model-value="settings.injectWorldviewPrompt"
              @update:model-value="$emit('update:setting', 'injectWorldviewPrompt', $event)"
            />
          </div>
          <div class="gc-setting-toggle">
            <label>
              <span>允许身体部位独立变化</span>
              <small>特定部位可以有不同的缩放倍率</small>
            </label>
            <GcSwitch
              :model-value="settings.allowPartialScaling"
              @update:model-value="$emit('update:setting', 'allowPartialScaling', $event)"
            />
          </div>
        </div>
        
        <div v-if="!currentWorldview?.builtin" class="gc-worldview-actions">
          <GcButton @click="startEdit"><i class="fa-solid fa-pen"></i> 编辑</GcButton>
          <GcButton variant="danger" @click="$emit('delete', currentWorldview?.id, currentWorldview?.name)">
            <i class="fa-solid fa-trash"></i> 删除
          </GcButton>
        </div>
      </div>
      
      <!-- 编辑世界观 -->
      <div v-else class="gc-worldview-editor">
        <div class="gc-editor-header">
          <button class="gc-btn-link" @click="cancelEdit">
            <i class="fa-solid fa-arrow-left"></i> 返回
          </button>
          <span class="gc-editor-title">{{ editingData ? '编辑世界观' : '新建世界观' }}</span>
        </div>
        <div class="gc-editor-form">
          <div class="gc-setting-item">
            <label>名称 *</label>
            <input v-model="form.name" type="text" class="gc-input" placeholder="世界观名称" />
          </div>
          <div class="gc-setting-item">
            <label>图标 (Font Awesome class)</label>
            <input v-model="form.icon" type="text" class="gc-input" placeholder="fa-solid fa-atom" />
          </div>
          <div class="gc-setting-item">
            <label>描述</label>
            <input v-model="form.description" type="text" class="gc-input" placeholder="简短描述" />
          </div>
          <div class="gc-setting-item">
            <label>变化机制</label>
            <textarea v-model="form.mechanism" class="gc-textarea" rows="4" placeholder="描述体型变化的机制..."></textarea>
          </div>
          <div class="gc-setting-item">
            <label>身体特性</label>
            <textarea v-model="form.bodyCharacteristics" class="gc-textarea" rows="4" placeholder="描述变化后的身体特征..."></textarea>
          </div>
          <div class="gc-editor-actions">
            <GcButton @click="cancelEdit">取消</GcButton>
            <GcButton variant="primary" @click="saveWorldview">
              <i class="fa-solid fa-save"></i> 保存
            </GcButton>
          </div>
        </div>
      </div>
      
      <!-- 新建世界观按钮 -->
      <GcButton v-if="!isEditing" class="gc-add-template-btn" @click="startCreate">
        <i class="fa-solid fa-plus"></i> 新建自定义世界观
      </GcButton>
    </div>
  </GcOverlay>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { GcOverlay, GcSwitch, GcButton, GcBadge } from '../components';
import type { Worldview } from '../../types';
import type { Settings } from '../../types';

const props = defineProps<{
  visible: boolean;
  worldviews: Worldview[];
  currentWorldviewId: string;
  currentWorldview: Worldview | undefined;
  settings: Settings;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'reset'): void;
  (e: 'select', id: string): void;
  (e: 'create', wv: Omit<Worldview, 'id' | 'builtin'>): void;
  (e: 'update', id: string, wv: Partial<Worldview>): void;
  (e: 'delete', id: string | undefined, name: string | undefined): void;
  (e: 'update:setting', key: keyof Settings, value: unknown): void;
}>();

// 内部状态
const isEditing = ref(false);
const editingData = ref<Worldview | null>(null);
const form = ref({
  name: '',
  icon: 'fa-solid fa-star',
  description: '',
  mechanism: '',
  bodyCharacteristics: '',
  limitations: [] as string[],
  specialRules: [] as string[],
  writingTips: [] as string[],
});

const hasLimitations = computed(() => {
  const lim = props.currentWorldview?.limitations;
  return lim && lim.length > 0 && lim[0] !== '无';
});

const startCreate = () => {
  editingData.value = null;
  form.value = {
    name: '',
    icon: 'fa-solid fa-star',
    description: '',
    mechanism: '',
    bodyCharacteristics: '',
    limitations: [],
    specialRules: [],
    writingTips: [],
  };
  isEditing.value = true;
};

const startEdit = () => {
  if (!props.currentWorldview) return;
  editingData.value = props.currentWorldview;
  form.value = {
    name: props.currentWorldview.name,
    icon: props.currentWorldview.icon,
    description: props.currentWorldview.description,
    mechanism: props.currentWorldview.mechanism,
    bodyCharacteristics: props.currentWorldview.bodyCharacteristics,
    limitations: [...props.currentWorldview.limitations],
    specialRules: [...props.currentWorldview.specialRules],
    writingTips: [...props.currentWorldview.writingTips],
  };
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  editingData.value = null;
};

const saveWorldview = () => {
  if (!form.value.name.trim()) {
    toastr.warning('请输入世界观名称');
    return;
  }
  
  const worldviewData = {
    name: form.value.name.trim(),
    icon: form.value.icon.trim() || 'fa-solid fa-star',
    description: form.value.description.trim(),
    mechanism: form.value.mechanism.trim(),
    bodyCharacteristics: form.value.bodyCharacteristics.trim(),
    limitations: form.value.limitations.filter(s => s.trim()),
    specialRules: form.value.specialRules.filter(s => s.trim()),
    writingTips: form.value.writingTips.filter(s => s.trim()),
  };
  
  if (editingData.value) {
    emit('update', editingData.value.id, worldviewData);
  } else {
    emit('create', worldviewData);
  }
  
  isEditing.value = false;
  editingData.value = null;
};

const handleClose = () => {
  if (isEditing.value) {
    cancelEdit();
  }
  emit('close');
};
</script>

<style scoped>
.gc-worldview-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gc-worldview-selector {
  margin-bottom: 8px;
}

.gc-worldview-current {
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 12px;
}

.gc-worldview-current-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gc-worldview-icon {
  font-size: 1.5em;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(244, 114, 182, 0.2);
  border-radius: 8px;
  color: var(--gc-primary, #f472b6);
}

.gc-worldview-name {
  font-weight: 600;
  font-size: 0.95em;
  margin-bottom: 2px;
}

.gc-worldview-desc {
  font-size: 0.8em;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-worldview-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
}

.gc-worldview-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.gc-worldview-item:hover {
  background: rgba(0, 0, 0, 0.25);
}

.gc-worldview-item.active {
  background: rgba(244, 114, 182, 0.15);
  border: 1px solid rgba(244, 114, 182, 0.3);
}

.gc-worldview-item-icon {
  font-size: 1.1em;
  width: 28px;
  text-align: center;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-worldview-item.active .gc-worldview-item-icon {
  color: var(--gc-primary, #f472b6);
}

.gc-worldview-item-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.gc-worldview-item-name {
  font-size: 0.9em;
}

.gc-worldview-check {
  color: var(--gc-primary, #f472b6);
  font-size: 0.9em;
}

.gc-worldview-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gc-worldview-section {
  padding: 10px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
}

.gc-worldview-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85em;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--gc-text, #f1f5f9);
}

.gc-worldview-section h4 i {
  color: var(--gc-primary, #f472b6);
}

.gc-worldview-text {
  font-size: 0.85em;
  color: var(--gc-text-muted, #94a3b8);
  line-height: 1.5;
}

.gc-worldview-list-items {
  margin: 0;
  padding-left: 20px;
  font-size: 0.85em;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-worldview-list-items li {
  margin-bottom: 4px;
}

.gc-worldview-options {
  border-top: 1px dashed var(--gc-border, rgba(255, 255, 255, 0.1));
  padding-top: 12px;
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
  font-size: 0.85em;
  font-weight: 500;
}

.gc-setting-toggle label small {
  font-size: 0.75em;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-worldview-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.gc-worldview-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gc-editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gc-editor-title {
  font-weight: 600;
  font-size: 0.95em;
}

.gc-editor-form {
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
  padding: 8px 10px;
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

.gc-textarea {
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--gc-border, rgba(255, 255, 255, 0.1));
  border-radius: 6px;
  color: var(--gc-text, #f1f5f9);
  font-size: 0.9em;
  resize: vertical;
}

.gc-textarea:focus {
  outline: none;
  border-color: var(--gc-primary, #f472b6);
}

.gc-editor-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}

.gc-add-template-btn {
  margin-top: 8px;
}

.gc-btn-link {
  background: transparent;
  border: none;
  color: var(--gc-text-muted, #94a3b8);
  cursor: pointer;
  padding: 4px 8px;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  gap: 6px;
}

.gc-btn-link:hover {
  color: var(--gc-text, #f1f5f9);
}
</style>
