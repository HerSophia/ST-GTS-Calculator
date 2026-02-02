<template>
  <GcOverlay
    :visible="visible"
    title="MVU 调试"
    icon="fa-solid fa-bug"
    panel-class="gc-debug-panel"
    @close="$emit('close')"
  >
    <template #header-actions>
      <button class="gc-btn-link" @click="$emit('refresh')" title="刷新状态">
        <i class="fa-solid fa-rotate"></i>
      </button>
    </template>

    <div class="gc-debug-content">
      <!-- 选项卡导航 -->
      <div class="gc-debug-tabs">
        <button 
          class="gc-debug-tab" 
          :class="{ active: activeTab === 'status' }" 
          @click="activeTab = 'status'"
        >
          <i class="fa-solid fa-satellite-dish"></i> 状态
        </button>
        <button 
          class="gc-debug-tab" 
          :class="{ active: activeTab === 'characters' }" 
          @click="activeTab = 'characters'"
        >
          <i class="fa-solid fa-users"></i> 角色
          <span v-if="characterCount" class="gc-debug-tab-badge">{{ characterCount }}</span>
        </button>
        <button 
          class="gc-debug-tab" 
          :class="{ active: activeTab === 'test' }" 
          @click="activeTab = 'test'"
        >
          <i class="fa-solid fa-flask"></i> 测试
        </button>
        <button 
          class="gc-debug-tab" 
          :class="{ active: activeTab === 'logs' }" 
          @click="activeTab = 'logs'"
        >
          <i class="fa-solid fa-terminal"></i> 日志
          <span v-if="logs.length" class="gc-debug-tab-badge">{{ logs.length }}</span>
        </button>
        <button 
          class="gc-debug-tab" 
          :class="{ active: activeTab === 'raw' }" 
          @click="activeTab = 'raw'"
        >
          <i class="fa-solid fa-database"></i> 原始
        </button>
      </div>

      <!-- 状态选项卡 -->
      <div v-if="activeTab === 'status'" class="gc-debug-tab-content">
        <DebugStatusSection :mvu-info="mvuInfo" />
      </div>

      <!-- 角色选项卡 -->
      <div v-if="activeTab === 'characters'" class="gc-debug-tab-content">
        <DebugCharactersSection :characters="debugCharacters" />
      </div>

      <!-- 测试选项卡 -->
      <div v-if="activeTab === 'test'" class="gc-debug-tab-content">
        <DebugTestSection
          :test-name="testName"
          :test-height="testHeight"
          :test-original="testOriginal"
          :characters="characters"
          @update:test-name="$emit('update:testName', $event)"
          @update:test-height="$emit('update:testHeight', $event)"
          @update:test-original="$emit('update:testOriginal', $event)"
          @inject="$emit('inject-test')"
          @clear="$emit('clear-test', $event)"
          @quick-test="$emit('quick-test', $event)"
          @save-damage="$emit('save-damage', $event)"
          @clear-damage="$emit('clear-damage', $event)"
        />
      </div>

      <!-- 日志选项卡 -->
      <div v-if="activeTab === 'logs'" class="gc-debug-tab-content">
        <DebugLogsSection :logs="logs" @clear="$emit('clear-logs')" />
      </div>

      <!-- 原始数据选项卡 -->
      <div v-if="activeTab === 'raw'" class="gc-debug-tab-content">
        <DebugRawSection :mvu-info="mvuInfo" :settings="settings" />
      </div>
    </div>
  </GcOverlay>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { GcOverlay } from '../components';
import DebugStatusSection from '../features/debug/DebugStatusSection.vue';
import DebugCharactersSection from '../features/debug/DebugCharactersSection.vue';
import DebugTestSection from '../features/debug/DebugTestSection.vue';
import DebugLogsSection from '../features/debug/DebugLogsSection.vue';
import DebugRawSection from '../features/debug/DebugRawSection.vue';
import type { MvuDebugInfo } from '../../services/debug';
import type { Settings } from '../../types';
import type { CharacterData } from '../../types';

const props = defineProps<{
  visible: boolean;
  mvuInfo: MvuDebugInfo;
  logs: Array<{ time: string; message: string; level?: string }>;
  settings: Settings;
  characters: CharacterData[];
  testName: string;
  testHeight: number;
  testOriginal: number;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'refresh'): void;
  (e: 'clear-logs'): void;
  (e: 'update:testName', value: string): void;
  (e: 'update:testHeight', value: number): void;
  (e: 'update:testOriginal', value: number): void;
  (e: 'inject-test'): void;
  (e: 'clear-test', name?: string): void;
  (e: 'quick-test', params: { name: string; height: number; original: number }): void;
  (e: 'save-damage', params: { name: string; data: unknown }): void;
  (e: 'clear-damage', name: string): void;
}>();

const activeTab = ref<'status' | 'characters' | 'test' | 'logs' | 'raw'>('status');

const characterCount = computed(() => 
  props.mvuInfo.messageVariables?.characterDetails?.length || 0
);

// 过滤掉类型为 '未知' 的角色，用于显示
const debugCharacters = computed(() => {
  const chars = props.mvuInfo.messageVariables?.characterDetails || [];
  return chars.filter(c => c.类型 !== '未知');
});
</script>

<style scoped>
.gc-debug-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gc-debug-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  flex-wrap: wrap;
}

.gc-debug-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--gc-text-muted, #94a3b8);
  font-size: 0.8em;
  cursor: pointer;
  transition: all 0.2s;
}

.gc-debug-tab:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--gc-text, #f1f5f9);
}

.gc-debug-tab.active {
  background: var(--gc-primary, #f472b6);
  color: white;
}

.gc-debug-tab-badge {
  padding: 1px 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 0.85em;
}

.gc-debug-tab.active .gc-debug-tab-badge {
  background: rgba(255, 255, 255, 0.3);
}

.gc-debug-tab-content {
  padding: 8px 0;
}

.gc-btn-link {
  background: transparent;
  border: none;
  color: var(--gc-text-muted, #94a3b8);
  cursor: pointer;
  padding: 4px 8px;
}

.gc-btn-link:hover {
  color: var(--gc-text, #f1f5f9);
}
</style>
