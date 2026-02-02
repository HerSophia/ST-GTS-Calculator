<template>
  <GcOverlay
    :visible="visible"
    title="提示词管理"
    icon="fa-solid fa-file-lines"
    panel-class="gc-prompts-panel"
    @close="handleClose"
  >
    <template #header-actions>
      <button class="gc-btn-link" @click="$emit('reset')" title="重置为默认">
        <i class="fa-solid fa-rotate-left"></i>
      </button>
    </template>

    <div class="gc-prompts-content">
      <!-- 模板列表 -->
      <div v-if="!editingTemplate && !isCreating" class="gc-prompts-list">
        <div class="gc-prompts-hint">
          <i class="fa-solid fa-info-circle"></i>
          <span>启用/禁用模板来自定义注入的提示词内容，点击模板可编辑</span>
        </div>
        
        <div 
          v-for="template in templates" 
          :key="template.id" 
          class="gc-prompt-item"
          :class="{ disabled: !template.enabled, builtin: template.builtin }"
        >
          <div class="gc-prompt-toggle">
            <GcSwitch
              :model-value="template.enabled"
              size="sm"
              @update:model-value="$emit('toggle', template.id)"
            />
          </div>
          
          <div class="gc-prompt-info" @click="startEdit(template)">
            <div class="gc-prompt-name">
              <span>{{ template.name }}</span>
              <GcBadge v-if="template.builtin" size="sm">内置</GcBadge>
              <GcBadge v-else variant="custom" size="sm">自定义</GcBadge>
              <span class="gc-prompt-type">{{ template.type }}</span>
            </div>
            <div class="gc-prompt-desc">{{ template.description }}</div>
          </div>
          
          <div class="gc-prompt-actions">
            <div class="gc-prompt-order-btns">
              <button class="gc-btn-icon-xs" @click="$emit('move', template.id, 'up')" title="上移">
                <i class="fa-solid fa-chevron-up"></i>
              </button>
              <button class="gc-btn-icon-xs" @click="$emit('move', template.id, 'down')" title="下移">
                <i class="fa-solid fa-chevron-down"></i>
              </button>
            </div>
            <button class="gc-btn-icon-sm" @click="startEdit(template)" title="编辑">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button 
              v-if="!template.builtin" 
              class="gc-btn-icon-sm danger" 
              @click="$emit('delete', template.id, template.name)" 
              title="删除"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
        
        <GcButton class="gc-add-template-btn" @click="startCreate">
          <i class="fa-solid fa-plus"></i> 新建自定义模板
        </GcButton>
      </div>

      <!-- 新建模板 -->
      <div v-else-if="isCreating" class="gc-prompt-editor">
        <div class="gc-editor-header">
          <button class="gc-btn-link" @click="cancelCreate">
            <i class="fa-solid fa-arrow-left"></i> 返回列表
          </button>
          <span class="gc-editor-title">新建模板</span>
        </div>
        <div class="gc-editor-form">
          <div class="gc-setting-item">
            <label>模板名称 *</label>
            <input v-model="newTemplate.name" type="text" class="gc-input" placeholder="输入模板名称" />
          </div>
          <div class="gc-setting-item">
            <label>描述</label>
            <input v-model="newTemplate.description" type="text" class="gc-input" placeholder="简短描述模板用途" />
          </div>
          <div class="gc-setting-item">
            <label>模板类型</label>
            <select v-model="newTemplate.type" class="gc-input">
              <option value="header">header - 头部说明</option>
              <option value="character">character - 角色数据（为每个角色生成）</option>
              <option value="interaction">interaction - 互动限制</option>
              <option value="rules">rules - 规则说明</option>
              <option value="footer">footer - 尾部补充</option>
            </select>
          </div>
          <div class="gc-setting-item">
            <label>模板内容</label>
            <div class="gc-editor-hint" v-pre>
              支持变量: <code>{{角色名}}</code> <code>{{当前身高_格式化}}</code> <code>{{倍率}}</code> <code>{{级别}}</code> <code>{{描述}}</code> <code>{{身体数据}}</code> <code>{{相对参照}}</code> <code>{{互动限制列表}}</code>
            </div>
            <textarea 
              v-model="newTemplate.content" 
              class="gc-textarea gc-editor-textarea"
              rows="10"
              placeholder="输入模板内容..."
            ></textarea>
          </div>
          <div class="gc-setting-toggle">
            <label><span>默认启用</span></label>
            <GcSwitch v-model="newTemplate.enabled" />
          </div>
          <div class="gc-editor-actions">
            <GcButton @click="cancelCreate">取消</GcButton>
            <GcButton variant="primary" @click="createTemplate">
              <i class="fa-solid fa-plus"></i> 创建模板
            </GcButton>
          </div>
        </div>
      </div>

      <!-- 模板编辑 -->
      <div v-else-if="editingTemplate" class="gc-prompt-editor">
        <div class="gc-editor-header">
          <button class="gc-btn-link" @click="cancelEdit">
            <i class="fa-solid fa-arrow-left"></i> 返回列表
          </button>
          <span class="gc-editor-title">编辑: {{ editingTemplate.name }}</span>
        </div>
        <div class="gc-editor-form">
          <div class="gc-setting-item">
            <label>模板名称</label>
            <input v-model="editingTemplate.name" type="text" class="gc-input" :disabled="editingTemplate.builtin" />
          </div>
          <div class="gc-setting-item">
            <label>描述</label>
            <input v-model="editingTemplate.description" type="text" class="gc-input" />
          </div>
          <div class="gc-setting-item">
            <label>模板内容</label>
            <div class="gc-editor-hint" v-pre>
              支持变量: <code>{{角色名}}</code> <code>{{当前身高_格式化}}</code> <code>{{倍率}}</code> <code>{{级别}}</code> <code>{{描述}}</code> <code>{{身体数据}}</code> <code>{{相对参照}}</code> <code>{{互动限制列表}}</code>
            </div>
            <textarea 
              v-model="editingTemplate.content" 
              class="gc-textarea gc-editor-textarea"
              rows="12"
            ></textarea>
          </div>
          <div class="gc-editor-actions">
            <GcButton @click="cancelEdit">取消</GcButton>
            <GcButton variant="primary" @click="saveTemplate">
              <i class="fa-solid fa-save"></i> 保存
            </GcButton>
          </div>
        </div>
      </div>
    </div>
  </GcOverlay>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { GcOverlay, GcSwitch, GcButton, GcBadge } from '../components';
import type { PromptTemplate, PromptTemplateType } from '../../types';

defineProps<{
  visible: boolean;
  templates: PromptTemplate[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'reset'): void;
  (e: 'toggle', id: string): void;
  (e: 'move', id: string, direction: 'up' | 'down'): void;
  (e: 'delete', id: string, name: string): void;
  (e: 'create', template: Omit<PromptTemplate, 'id' | 'order' | 'builtin'>): void;
  (e: 'save', template: PromptTemplate): void;
}>();

// 内部状态
const isCreating = ref(false);
const editingTemplate = ref<PromptTemplate | null>(null);
const newTemplate = ref({
  name: '',
  description: '',
  content: '',
  type: 'footer' as PromptTemplateType,
  enabled: true,
});

const startCreate = () => {
  newTemplate.value = {
    name: '',
    description: '',
    content: '',
    type: 'footer',
    enabled: true,
  };
  isCreating.value = true;
};

const cancelCreate = () => {
  isCreating.value = false;
};

const createTemplate = () => {
  if (!newTemplate.value.name.trim()) {
    toastr.warning('请输入模板名称');
    return;
  }
  emit('create', {
    name: newTemplate.value.name.trim(),
    description: newTemplate.value.description.trim(),
    content: newTemplate.value.content,
    type: newTemplate.value.type,
    enabled: newTemplate.value.enabled,
  });
  isCreating.value = false;
};

const startEdit = (template: PromptTemplate) => {
  editingTemplate.value = { ...template };
};

const cancelEdit = () => {
  editingTemplate.value = null;
};

const saveTemplate = () => {
  if (editingTemplate.value) {
    emit('save', editingTemplate.value);
    editingTemplate.value = null;
  }
};

const handleClose = () => {
  if (isCreating.value) {
    isCreating.value = false;
  }
  if (editingTemplate.value) {
    editingTemplate.value = null;
  }
  emit('close');
};
</script>

<style scoped>
.gc-prompts-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gc-prompts-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
  font-size: 0.8em;
  color: #60a5fa;
  margin-bottom: 8px;
}

.gc-prompts-hint i {
  font-size: 1.1em;
}

.gc-prompts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gc-prompt-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  transition: all 0.2s;
}

.gc-prompt-item:hover {
  background: rgba(0, 0, 0, 0.3);
}

.gc-prompt-item.disabled {
  opacity: 0.6;
}

.gc-prompt-toggle {
  padding-top: 2px;
}

.gc-prompt-info {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.gc-prompt-name {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
  font-weight: 500;
  font-size: 0.9em;
}

.gc-prompt-type {
  font-size: 0.75em;
  color: var(--gc-text-muted, #94a3b8);
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.gc-prompt-desc {
  font-size: 0.8em;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-prompt-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.gc-prompt-order-btns {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gc-btn-icon-xs {
  width: 20px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 3px;
  color: var(--gc-text-muted, #94a3b8);
  cursor: pointer;
  font-size: 0.7em;
}

.gc-btn-icon-xs:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--gc-text, #f1f5f9);
}

.gc-btn-icon-sm {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 4px;
  color: var(--gc-text-muted, #94a3b8);
  cursor: pointer;
}

.gc-btn-icon-sm:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--gc-text, #f1f5f9);
}

.gc-btn-icon-sm.danger:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.gc-add-template-btn {
  margin-top: 8px;
}

.gc-prompt-editor {
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
  font-family: inherit;
}

.gc-textarea:focus {
  outline: none;
  border-color: var(--gc-primary, #f472b6);
}

.gc-editor-textarea {
  min-height: 200px;
}

.gc-editor-hint {
  font-size: 0.75em;
  color: var(--gc-text-muted, #94a3b8);
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  margin-bottom: 6px;
}

.gc-editor-hint code {
  padding: 1px 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.95em;
}

.gc-setting-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
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

.gc-editor-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
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
