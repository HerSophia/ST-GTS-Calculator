<template>
  <div class="gc-extensions">
    <div 
      class="gc-section-header clickable"
      @click="isSectionCollapsed = !isSectionCollapsed"
    >
      <div class="gc-header-left">
        <i class="fa-solid fa-puzzle-piece"></i>
        <span>扩展系统</span>
      </div>
      <i 
        class="fa-solid gc-chevron"
        :class="isSectionCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'"
      ></i>
    </div>
    
    <transition name="slide">
      <div v-show="!isSectionCollapsed" class="gc-extension-list">
        <!-- 核心计算（始终开启） -->
        <div class="gc-extension-wrapper">
          <div class="gc-extension-item core">
            <div class="gc-extension-icon">
              <i class="fa-solid fa-calculator"></i>
            </div>
            <div class="gc-extension-info">
              <div class="gc-extension-name">
                基础计算
                <GcBadge size="sm">核心</GcBadge>
              </div>
              <div class="gc-extension-desc">身体数据计算、相对尺寸参照</div>
            </div>
            <div class="gc-extension-toggle">
              <span class="gc-always-on">始终开启</span>
            </div>
          </div>
        </div>

        <!-- 损害计算（可开关） -->
        <div class="gc-extension-wrapper" :class="{ expanded: settings.enableDamageCalculation && isDamageExpanded }">
          <div 
            class="gc-extension-item" 
            :class="{ 
              active: settings.enableDamageCalculation,
              clickable: settings.enableDamageCalculation
            }"
            @click="settings.enableDamageCalculation ? (isDamageExpanded = !isDamageExpanded) : null"
          >
            <div class="gc-extension-icon damage">
              <i class="fa-solid fa-explosion"></i>
            </div>
            <div class="gc-extension-info">
              <div class="gc-extension-name">
                损害计算
                <GcBadge v-if="settings.enableDamageCalculation" variant="success" size="sm">已启用</GcBadge>
              </div>
              <div class="gc-extension-desc">计算巨大娘行动可能造成的破坏</div>
            </div>
            <div class="gc-extension-toggle">
              <div class="gc-switch-wrapper" @click.stop>
                <GcSwitch
                  :model-value="settings.enableDamageCalculation"
                  @update:model-value="$emit('toggle-damage', $event)"
                />
              </div>
              <div v-if="settings.enableDamageCalculation" class="gc-expand-icon">
                <i class="fa-solid" :class="isDamageExpanded ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
              </div>
            </div>
          </div>

          <!-- 损害计算设置 -->
          <transition name="slide">
            <div v-if="settings.enableDamageCalculation && isDamageExpanded" class="gc-extension-settings">
              <div class="gc-setting-item">
                <label>默认场景</label>
                <select class="gc-input" :value="settings.damageScenario" @change="$emit('update:setting', 'damageScenario', ($event.target as HTMLSelectElement).value)">
                  <option
                    v-for="scenario in damageScenarios"
                    :key="scenario.id"
                    :value="scenario.id"
                  >
                    {{ scenario.name }} ({{ scenario.density.toLocaleString() }}人/km²)
                  </option>
                </select>
              </div>
              
              <div class="gc-setting-toggle">
                <label>
                  <span>注入损害提示词</span>
                  <small>在提示词中包含损害计算结果</small>
                </label>
                <GcSwitch
                  size="sm"
                  :model-value="settings.injectDamagePrompt"
                  @update:model-value="$emit('update:setting', 'injectDamagePrompt', $event)"
                />
              </div>
              
              <div class="gc-setting-toggle">
                <label>
                  <span>显示特殊效应</span>
                  <small>地震、海啸等物理效应</small>
                </label>
                <GcSwitch
                  size="sm"
                  :model-value="settings.showSpecialEffects"
                  @update:model-value="$emit('update:setting', 'showSpecialEffects', $event)"
                />
              </div>
              
              <div class="gc-setting-toggle">
                <label>
                  <span>按角色显示损害</span>
                  <small>在角色卡片中显示损害数据</small>
                </label>
                <GcSwitch
                  size="sm"
                  :model-value="settings.showDamagePerCharacter"
                  @update:model-value="$emit('update:setting', 'showDamagePerCharacter', $event)"
                />
              </div>
              
              <div class="gc-setting-toggle">
                <label>
                  <span>显示损害汇总</span>
                  <small>所有角色的损害统计</small>
                </label>
                <GcSwitch
                  size="sm"
                  :model-value="settings.showDamageSummary"
                  @update:model-value="$emit('update:setting', 'showDamageSummary', $event)"
                />
              </div>
              
              <!-- 损害预览 -->
              <div v-if="damageSummary" class="gc-damage-preview">
                <div class="gc-damage-preview-header">
                  <i class="fa-solid fa-chart-bar"></i>
                  <span>当前汇总</span>
                </div>
                <div class="gc-damage-preview-content">
                  <div class="gc-damage-stat">
                    <span class="gc-damage-label">巨大娘数量</span>
                    <span class="gc-damage-value">{{ damageSummary.giantCount }}</span>
                  </div>
                  <div class="gc-damage-stat">
                    <span class="gc-damage-label">预估单步伤亡</span>
                    <span class="gc-damage-value casualties">
                      {{ formatDamageRange(damageSummary.totalCasualties) }}
                    </span>
                  </div>
                  <div class="gc-damage-stat">
                    <span class="gc-damage-label">预估建筑损毁</span>
                    <span class="gc-damage-value buildings">
                      {{ formatDamageRange(damageSummary.totalBuildings) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- 物品系统（可开关） -->
        <div class="gc-extension-wrapper" :class="{ expanded: settings.enableItemsSystem && isItemsExpanded }">
          <div 
            class="gc-extension-item" 
            :class="{ 
              active: settings.enableItemsSystem,
              clickable: settings.enableItemsSystem
            }"
            @click="settings.enableItemsSystem ? (isItemsExpanded = !isItemsExpanded) : null"
          >
            <div class="gc-extension-icon items">
              <i class="fa-solid fa-box"></i>
            </div>
            <div class="gc-extension-info">
              <div class="gc-extension-name">
                物品系统
                <GcBadge v-if="settings.enableItemsSystem" variant="success" size="sm">已启用</GcBadge>
              </div>
              <div class="gc-extension-desc">管理角色物品，计算尺寸对比和互动可能性</div>
            </div>
            <div class="gc-extension-toggle">
              <div class="gc-switch-wrapper" @click.stop>
                <GcSwitch
                  :model-value="settings.enableItemsSystem"
                  @update:model-value="$emit('toggle-items', $event)"
                />
              </div>
              <div v-if="settings.enableItemsSystem" class="gc-expand-icon">
                <i class="fa-solid" :class="isItemsExpanded ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
              </div>
            </div>
          </div>

          <!-- 物品系统设置 -->
          <transition name="slide">
            <div v-if="settings.enableItemsSystem && isItemsExpanded" class="gc-extension-settings">
              <div class="gc-setting-toggle">
                <label>
                  <span>注入物品提示词</span>
                  <small>在提示词中包含物品数据</small>
                </label>
                <GcSwitch
                  size="sm"
                  :model-value="settings.injectItemsPrompt"
                  @update:model-value="$emit('update:setting', 'injectItemsPrompt', $event)"
                />
              </div>
              
              <div class="gc-items-hint">
                <i class="fa-solid fa-info-circle"></i>
                <span>在世界书或提示词中使用 <code>_.set('巨大娘.角色.名称._物品.物品ID', {...})</code> 添加物品</span>
              </div>
            </div>
          </transition>
        </div>

        <!-- 楼层数据显示（可开关） -->
        <div class="gc-extension-wrapper">
          <div 
            class="gc-extension-item" 
            :class="{ active: settings.enableMessageDisplay }"
          >
            <div class="gc-extension-icon display">
              <i class="fa-solid fa-eye"></i>
            </div>
            <div class="gc-extension-info">
              <div class="gc-extension-name">
                楼层数据显示
                <GcBadge v-if="settings.enableMessageDisplay" variant="success" size="sm">已启用</GcBadge>
              </div>
              <div class="gc-extension-desc">在消息楼层内直接显示角色身高体型数据</div>
            </div>
            <div class="gc-extension-toggle">
              <div class="gc-switch-wrapper" @click.stop>
                <GcSwitch
                  :model-value="settings.enableMessageDisplay"
                  @update:model-value="$emit('toggle-message-display', $event)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 玩法指导（可开关） -->
        <div class="gc-extension-wrapper" :class="{ expanded: settings.enablePlayGuide && isPlayGuideExpanded }">
          <div 
            class="gc-extension-item" 
            :class="{ 
              active: settings.enablePlayGuide,
              clickable: settings.enablePlayGuide
            }"
            @click="settings.enablePlayGuide ? (isPlayGuideExpanded = !isPlayGuideExpanded) : null"
          >
            <div class="gc-extension-icon guide">
              <i class="fa-solid fa-compass"></i>
            </div>
            <div class="gc-extension-info">
              <div class="gc-extension-name">
                玩法指导
                <GcBadge v-if="settings.enablePlayGuide" variant="success" size="sm">已启用</GcBadge>
                <GcBadge v-if="settings.enablePlayGuide && enabledCount > 0" size="sm">{{ enabledCount }}个玩法</GcBadge>
              </div>
              <div class="gc-extension-desc">针对不同玩法提供专门的描写指导提示词</div>
            </div>
            <div class="gc-extension-toggle">
              <div class="gc-switch-wrapper" @click.stop>
                <GcSwitch
                  :model-value="settings.enablePlayGuide"
                  @update:model-value="$emit('toggle-play-guide', $event)"
                />
              </div>
              <div v-if="settings.enablePlayGuide" class="gc-expand-icon">
                <i class="fa-solid" :class="isPlayGuideExpanded ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
              </div>
            </div>
          </div>

          <!-- 玩法指导设置 -->
          <transition name="slide">
            <div v-if="settings.enablePlayGuide && isPlayGuideExpanded" class="gc-extension-settings">
              <div class="gc-play-guide-hint">
                <i class="fa-solid fa-info-circle"></i>
                <span>选择需要启用的玩法，对应的描写指导将注入到提示词中</span>
              </div>
              
              <div
                v-for="guide in allGuides"
                :key="guide.id"
                class="gc-play-guide-item-wrapper"
              >
                <div
                  class="gc-play-guide-item"
                  :class="{ placeholder: guide.placeholder, editing: editingGuideId === guide.id }"
                >
                  <div class="gc-play-guide-item-left" @click="toggleEditGuide(guide.id)">
                    <i :class="guide.icon" class="gc-play-guide-icon"></i>
                    <div class="gc-play-guide-item-info">
                      <div class="gc-play-guide-item-name">
                        {{ guide.name }}
                        <GcBadge v-if="guide.isCustom" size="sm" variant="muted">自定义</GcBadge>
                        <GcBadge v-if="guide.placeholder" size="sm" variant="warning">待完善</GcBadge>
                        <GcBadge v-if="hasCustomContent(guide.id)" size="sm">已编辑</GcBadge>
                      </div>
                      <div class="gc-play-guide-item-desc">{{ guide.description }}</div>
                    </div>
                  </div>
                  <div class="gc-play-guide-item-right" @click.stop>
                    <GcButton
                      variant="icon-xs"
                      :icon="editingGuideId === guide.id ? 'fa-solid fa-chevron-up' : 'fa-solid fa-pen-to-square'"
                      @click="toggleEditGuide(guide.id)"
                    />
                    <GcButton
                      v-if="guide.isCustom"
                      variant="icon-xs"
                      icon="fa-solid fa-trash"
                      @click="removeCustomGuide(guide.id)"
                    />
                    <GcSwitch
                      size="sm"
                      :model-value="isGuideEnabled(guide.id)"
                      @update:model-value="toggleGuide(guide.id)"
                    />
                  </div>
                </div>

                <!-- 内联编辑器 -->
                <transition name="slide">
                  <div v-if="editingGuideId === guide.id" class="gc-play-guide-editor">
                    <textarea
                      class="gc-play-guide-textarea"
                      :value="editContent"
                      rows="12"
                      placeholder="输入该玩法的描写指导提示词（支持 Markdown）"
                      @input="editContent = ($event.target as HTMLTextAreaElement).value"
                    ></textarea>
                    <div class="gc-play-guide-editor-actions">
                      <GcButton variant="primary" size="sm" icon="fa-solid fa-check" @click="saveGuideContent">保存</GcButton>
                      <GcButton v-if="!guide.isCustom && hasCustomContent(guide.id)" size="sm" variant="danger" icon="fa-solid fa-rotate-left" @click="resetGuideContent(guide.id)">恢复默认</GcButton>
                      <GcButton size="sm" @click="cancelEditGuide">取消</GcButton>
                    </div>
                  </div>
                </transition>
              </div>

              <!-- 新建自定义玩法指导 -->
              <div class="gc-play-guide-add-section">
                <GcButton
                  v-if="!isAddingGuide"
                  size="sm"
                  icon="fa-solid fa-plus"
                  @click="isAddingGuide = true"
                >
                  新建玩法指导
                </GcButton>

                <transition name="slide">
                  <div v-if="isAddingGuide" class="gc-play-guide-add-form">
                    <div class="gc-play-guide-form-field">
                      <label>名称 <span class="gc-required">*</span></label>
                      <input
                        v-model="newGuideName"
                        class="gc-input sm"
                        placeholder="例如：拥抱互动"
                      />
                    </div>
                    <div class="gc-play-guide-form-field">
                      <label>描述</label>
                      <input
                        v-model="newGuideDesc"
                        class="gc-input sm"
                        placeholder="简短描述该玩法（可选）"
                      />
                    </div>
                    <div class="gc-play-guide-form-field">
                      <label>提示词内容</label>
                      <textarea
                        v-model="newGuideContent"
                        class="gc-play-guide-textarea"
                        rows="8"
                        placeholder="输入该玩法的描写指导提示词（支持 Markdown）"
                      ></textarea>
                    </div>
                    <div class="gc-play-guide-editor-actions">
                      <GcButton variant="primary" size="sm" icon="fa-solid fa-plus" :disabled="!newGuideName.trim()" @click="addCustomGuide">添加</GcButton>
                      <GcButton size="sm" @click="cancelAddGuide">取消</GcButton>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </transition>
        </div>

      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { GcSwitch, GcBadge, GcButton } from '../components';
import type { Settings, DamageSummary, CustomPlayGuide } from '../../types';
import { PLAY_GUIDE_DEFINITIONS, getPlayGuideById } from '../../services/extensions/play-guide-prompts';

const props = defineProps<{
  settings: Settings;
  damageSummary: DamageSummary | null;
  damageScenarios: Array<{ id: string; name: string; density: number }>;
}>();

const emit = defineEmits<{
  (e: 'toggle-damage', value: boolean): void;
  (e: 'toggle-items', value: boolean): void;
  (e: 'toggle-message-display', value: boolean): void;
  (e: 'toggle-play-guide', value: boolean): void;
  (e: 'update:setting', key: keyof Settings, value: unknown): void;
}>();

// 状态控制
const isSectionCollapsed = ref(false);
const isDamageExpanded = ref(true);
const isItemsExpanded = ref(true);
const isPlayGuideExpanded = ref(true);

// 当启用损害计算时，自动展开设置
watch(() => props.settings.enableDamageCalculation, (val) => {
  if (val) isDamageExpanded.value = true;
});

// 当启用物品系统时，自动展开设置
watch(() => props.settings.enableItemsSystem, (val) => {
  if (val) isItemsExpanded.value = true;
});

// 当启用玩法指导时，自动展开设置
watch(() => props.settings.enablePlayGuide, (val) => {
  if (val) isPlayGuideExpanded.value = true;
});

// ========== 玩法指导 ==========

/** 统一的玩法指导显示类型 */
interface DisplayGuide {
  id: string;
  name: string;
  description: string;
  icon: string;
  content: string;
  placeholder?: boolean;
  isCustom: boolean;
}

/** 合并内置和自定义玩法指导 */
const allGuides = computed<DisplayGuide[]>(() => {
  const builtIn: DisplayGuide[] = PLAY_GUIDE_DEFINITIONS.map(g => ({
    ...g,
    isCustom: false,
  }));
  const custom: DisplayGuide[] = (props.settings.customPlayGuides ?? []).map(g => ({
    ...g,
    isCustom: true,
  }));
  return [...builtIn, ...custom];
});

const enabledCount = computed(() => props.settings.enabledPlayGuides.length);

const isGuideEnabled = (guideId: string): boolean => {
  return props.settings.enabledPlayGuides.includes(guideId);
};

const toggleGuide = (guideId: string) => {
  const current = [...props.settings.enabledPlayGuides];
  const index = current.indexOf(guideId);
  if (index >= 0) {
    current.splice(index, 1);
  } else {
    current.push(guideId);
  }
  emit('update:setting', 'enabledPlayGuides', current);
};

// ========== 玩法指导编辑 ==========
const editingGuideId = ref<string | null>(null);
const editContent = ref('');

// ========== 自定义玩法指导新建 ==========
const isAddingGuide = ref(false);
const newGuideName = ref('');
const newGuideDesc = ref('');
const newGuideContent = ref('');

/** 检查是否为用户自定义指导 */
const isCustomGuide = (guideId: string): boolean => {
  return (props.settings.customPlayGuides ?? []).some(g => g.id === guideId);
};

/**
 * 获取指定玩法当前生效的内容
 */
const getGuideContent = (guideId: string): string => {
  // 自定义指导：直接从 customPlayGuides 获取
  const customGuide = (props.settings.customPlayGuides ?? []).find(g => g.id === guideId);
  if (customGuide) return customGuide.content;
  // 内置指导：优先自定义内容
  const custom = props.settings.customPlayGuideContents[guideId];
  if (custom !== undefined) return custom;
  const def = getPlayGuideById(guideId);
  return def?.content ?? '';
};

/**
 * 是否有用户自定义内容（仅限内置指导）
 */
const hasCustomContent = (guideId: string): boolean => {
  if (isCustomGuide(guideId)) return false;
  return guideId in props.settings.customPlayGuideContents;
};

/**
 * 点击玩法项切换编辑面板
 */
const toggleEditGuide = (guideId: string) => {
  if (editingGuideId.value === guideId) {
    editingGuideId.value = null;
    return;
  }
  editingGuideId.value = guideId;
  editContent.value = getGuideContent(guideId);
};

const cancelEditGuide = () => {
  editingGuideId.value = null;
};

const saveGuideContent = () => {
  if (!editingGuideId.value) return;
  const guideId = editingGuideId.value;

  if (isCustomGuide(guideId)) {
    // 自定义指导：更新 customPlayGuides 数组中的 content
    const updated = (props.settings.customPlayGuides ?? []).map(g =>
      g.id === guideId ? { ...g, content: editContent.value } : g
    );
    emit('update:setting', 'customPlayGuides', updated);
  } else {
    // 内置指导：保存到 customPlayGuideContents
    const updated = { ...props.settings.customPlayGuideContents };
    updated[guideId] = editContent.value;
    emit('update:setting', 'customPlayGuideContents', updated);
  }
  editingGuideId.value = null;
};

const resetGuideContent = (guideId: string) => {
  const updated = { ...props.settings.customPlayGuideContents };
  delete updated[guideId];
  emit('update:setting', 'customPlayGuideContents', updated);
  // 刷新编辑器内容
  editContent.value = getPlayGuideById(guideId)?.content ?? '';
};

// ========== 自定义玩法操作 ==========
const generateGuideId = (): string => {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const addCustomGuide = () => {
  if (!newGuideName.value.trim()) return;
  const newGuide: CustomPlayGuide = {
    id: generateGuideId(),
    name: newGuideName.value.trim(),
    description: newGuideDesc.value.trim() || '用户自定义玩法指导',
    icon: 'fa-solid fa-scroll',
    content: newGuideContent.value,
  };
  const updated = [...(props.settings.customPlayGuides ?? []), newGuide];
  emit('update:setting', 'customPlayGuides', updated);
  newGuideName.value = '';
  newGuideDesc.value = '';
  newGuideContent.value = '';
  isAddingGuide.value = false;
};

const removeCustomGuide = (guideId: string) => {
  const updated = (props.settings.customPlayGuides ?? []).filter(g => g.id !== guideId);
  emit('update:setting', 'customPlayGuides', updated);
  // 同时从启用列表中移除
  if (props.settings.enabledPlayGuides.includes(guideId)) {
    const updatedEnabled = props.settings.enabledPlayGuides.filter(id => id !== guideId);
    emit('update:setting', 'enabledPlayGuides', updatedEnabled);
  }
  if (editingGuideId.value === guideId) {
    editingGuideId.value = null;
  }
};

const cancelAddGuide = () => {
  newGuideName.value = '';
  newGuideDesc.value = '';
  newGuideContent.value = '';
  isAddingGuide.value = false;
};

const formatDamageRange = (range: { min: number; max: number } | undefined) => {
  if (!range) return '-';
  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };
  return `${formatNum(range.min)} - ${formatNum(range.max)}`;
};
</script>

<style scoped>
.gc-extensions {
  margin-top: 16px;
}

.gc-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 0.9em;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--gc-text-muted, #94a3b8);
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
}

.gc-section-header:hover {
  color: var(--gc-text, #f1f5f9);
}

.gc-section-header.clickable:hover .gc-header-left {
  color: var(--gc-primary, #f472b6);
}

.gc-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s;
}

.gc-chevron {
  font-size: 0.8em;
  opacity: 0.7;
  transition: transform 0.2s;
}

.gc-section-header i {
  color: var(--gc-primary, #f472b6);
}

.gc-extension-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 扩展项包装器 - 让设置面板正确嵌套在扩展项下方 */
.gc-extension-wrapper {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
}

.gc-extension-wrapper.expanded {
  background: rgba(0, 0, 0, 0.1);
}

.gc-extension-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.gc-extension-wrapper.expanded .gc-extension-item {
  border-radius: 8px 8px 0 0;
}

.gc-extension-item:hover {
  background: rgba(0, 0, 0, 0.3);
}

.gc-extension-item.clickable {
  cursor: pointer;
}

.gc-extension-item.core {
  border-color: rgba(52, 211, 153, 0.2);
}

.gc-extension-item.active {
  border-color: rgba(244, 114, 182, 0.3);
}

.gc-extension-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-extension-item.core .gc-extension-icon {
  background: rgba(52, 211, 153, 0.1);
  color: #34d399;
}

.gc-extension-icon.damage {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.gc-extension-item.active .gc-extension-icon.damage {
  color: #ef4444;
}

.gc-extension-icon.items {
  background: rgba(99, 102, 241, 0.1);
  color: #818cf8;
}

.gc-extension-item.active .gc-extension-icon.items {
  color: #6366f1;
}

.gc-extension-icon.display {
  background: rgba(34, 211, 238, 0.1);
  color: #67e8f9;
}

.gc-extension-item.active .gc-extension-icon.display {
  color: #22d3ee;
}

.gc-extension-icon.guide {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
}

.gc-extension-item.active .gc-extension-icon.guide {
  color: #f59e0b;
}


.gc-extension-info {
  flex: 1;
  min-width: 0;
}

.gc-extension-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  font-size: 0.9em;
  margin-bottom: 2px;
}

.gc-extension-desc {
  font-size: 0.8em;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-extension-toggle {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.gc-switch-wrapper {
  display: flex;
  align-items: center;
}

.gc-expand-icon {
  width: 20px;
  display: flex;
  justify-content: center;
  color: var(--gc-text-muted, #94a3b8);
  font-size: 0.8em;
  opacity: 0.7;
}

.gc-always-on {
  font-size: 0.75em;
  color: #34d399;
  padding: 2px 8px;
  background: rgba(52, 211, 153, 0.1);
  border-radius: 4px;
}

/* 设置面板样式 - 嵌套在扩展项下方 */
.gc-extension-settings {
  padding: 12px 12px 12px 60px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 0 0 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.gc-setting-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gc-setting-item label {
  font-size: 0.85em;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-input {
  width: 100%;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--gc-border, rgba(255, 255, 255, 0.1));
  border-radius: 6px;
  color: var(--gc-text, #f1f5f9);
  font-size: 0.85em;
}

.gc-setting-toggle {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 6px 0;
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

.gc-damage-preview {
  margin-top: 8px;
  padding: 10px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
}

.gc-damage-preview-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85em;
  font-weight: 500;
  margin-bottom: 8px;
  color: #f87171;
}

.gc-damage-preview-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gc-damage-stat {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
}

.gc-damage-label {
  color: var(--gc-text-muted, #94a3b8);
}

.gc-damage-value {
  font-weight: 500;
}

.gc-damage-value.casualties {
  color: #f87171;
}

.gc-damage-value.buildings {
  color: #fbbf24;
}

/* 物品系统样式 */
.gc-items-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 6px;
  font-size: 0.8em;
  color: #a5b4fc;
}

.gc-items-hint i {
  margin-top: 2px;
  flex-shrink: 0;
}

.gc-items-hint code {
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  color: #c7d2fe;
}

/* 玩法指导样式 */
.gc-play-guide-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 6px;
  font-size: 0.8em;
  color: #fcd34d;
}

.gc-play-guide-hint i {
  margin-top: 2px;
  flex-shrink: 0;
}

.gc-play-guide-item-wrapper {
  display: flex;
  flex-direction: column;
}

.gc-play-guide-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  transition: background 0.2s;
  cursor: pointer;
  border: 1px solid transparent;
}

.gc-play-guide-item:hover {
  background: rgba(0, 0, 0, 0.25);
}

.gc-play-guide-item.placeholder {
  opacity: 0.75;
}

.gc-play-guide-item.editing {
  border-color: rgba(251, 191, 36, 0.3);
  background: rgba(0, 0, 0, 0.25);
  border-radius: 6px 6px 0 0;
}

.gc-play-guide-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  cursor: pointer;
}

.gc-play-guide-item-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.gc-play-guide-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 6px;
  color: #fbbf24;
  font-size: 0.85em;
  flex-shrink: 0;
}

.gc-play-guide-item-info {
  min-width: 0;
}

.gc-play-guide-item-name {
  font-size: 0.85em;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.gc-play-guide-item-desc {
  font-size: 0.75em;
  color: var(--gc-text-muted, #94a3b8);
  margin-top: 1px;
}

/* 玩法指导编辑器 */
.gc-play-guide-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-top: none;
  border-radius: 0 0 6px 6px;
}

.gc-play-guide-textarea {
  width: 100%;
  min-height: 150px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--gc-border, rgba(255, 255, 255, 0.1));
  border-radius: 6px;
  color: var(--gc-text, #f1f5f9);
  font-size: 0.8em;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}

.gc-play-guide-textarea:focus {
  border-color: rgba(251, 191, 36, 0.4);
}

.gc-play-guide-editor-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

/* 自定义玩法指导新建 */
.gc-play-guide-add-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}

.gc-play-guide-add-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 6px;
}

.gc-play-guide-form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gc-play-guide-form-field label {
  font-size: 0.8em;
  color: var(--gc-text-muted, #94a3b8);
  font-weight: 500;
}

.gc-required {
  color: #f87171;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 1000px;
}
</style>
