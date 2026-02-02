<template>
  <div class="gc-panel" :class="{ collapsed: isCollapsed }">
    <!-- 面板头部 -->
    <div class="gc-header" @click="togglePanel">
      <div class="gc-header-title">
        <div class="gc-logo-wrapper">
          <i class="fa-solid fa-person-rays gc-logo-icon"></i>
        </div>
        <span>巨大娘计算器</span>
      </div>
      <div class="gc-header-actions">
        <span v-if="!settings.enabled && !isCollapsed" class="gc-status-badge disabled">已禁用</span>
        <i 
          class="fa-solid gc-toggle-icon"
          :class="isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'"
        ></i>
      </div>
    </div>

    <!-- 面板内容 -->
    <div v-show="!isCollapsed" class="gc-content" :class="{ 'has-overlay': hasOverlay }">
      <!-- 总开关 -->
      <div class="gc-control-bar">
        <button
          class="gc-btn gc-master-btn"
          :class="settings.enabled ? 'active' : ''"
          @click="toggleEnabled"
        >
          <div class="gc-master-icon">
            <i class="fa-solid" :class="settings.enabled ? 'fa-bolt' : 'fa-power-off'"></i>
          </div>
          <span>{{ settings.enabled ? '脚本已启用' : '脚本已禁用' }}</span>
          <div class="gc-master-status-dot"></div>
        </button>
      </div>
      
      <!-- 功能按钮栏 -->
      <div class="gc-action-bar">
        <button class="gc-icon-btn" @click="refreshCharacters" title="刷新数据">
          <i class="fa-solid fa-rotate"></i>
        </button>
        <div class="gc-divider"></div>
        <button 
          v-if="settings.debug" 
          class="gc-icon-btn debug" 
          @click="showDebug = !showDebug" 
          :class="{ active: showDebug }" 
          title="调试面板"
        >
          <i class="fa-solid fa-bug"></i>
        </button>
        <button class="gc-icon-btn prompt" @click="showPrompts = !showPrompts" :class="{ active: showPrompts }" title="提示词管理">
          <i class="fa-solid fa-file-lines"></i>
        </button>
        <button class="gc-icon-btn worldview" @click="showWorldview = !showWorldview" :class="{ active: showWorldview }" title="世界观设定">
          <i :class="currentWorldview?.icon || 'fa-solid fa-globe'"></i>
        </button>
        <div class="gc-divider"></div>
        <button class="gc-icon-btn" @click="showSettings = !showSettings" :class="{ active: showSettings }" title="设置">
          <i class="fa-solid fa-gear"></i>
        </button>
        <button class="gc-icon-btn" @click="showHelp = !showHelp" :class="{ active: showHelp }" title="帮助">
          <i class="fa-regular fa-circle-question"></i>
        </button>
      </div>

      <!-- 设置面板 -->
      <SettingsPanel
        :visible="showSettings"
        :settings="settings"
        @close="showSettings = false"
        @update:setting="updateSetting"
      />

      <!-- 帮助面板 -->
      <HelpPanel
        :visible="showHelp"
        :version="VERSION"
        :changelog="CHANGELOG"
        @close="showHelp = false"
      />

      <!-- 世界观面板 -->
      <WorldviewPanel
        :visible="showWorldview"
        :worldviews="worldviews"
        :current-worldview="currentWorldview"
        :current-worldview-id="currentWorldviewId"
        :settings="settings"
        @close="showWorldview = false"
        @select="setCurrentWorldview"
        @reset="resetWorldviews"
        @update:setting="updateSetting"
        @create="addWorldview"
        @update="updateWorldview"
        @delete="handleDeleteWorldview"
      />

      <!-- 提示词面板 -->
      <PromptsPanel
        :visible="showPrompts"
        :templates="templates"
        @close="showPrompts = false"
        @toggle="toggleTemplate"
        @move="moveTemplate"
        @delete="handleDeleteTemplate"
        @create="handleCreateTemplate"
        @save="handleSaveTemplate"
        @reset="resetPrompts"
      />

      <!-- 调试面板 -->
      <DebugPanel
        v-if="settings.debug"
        :visible="showDebug"
        :mvu-info="mvuInfo"
        :logs="debugLogs"
        :settings="settings"
        :characters="charactersArray"
        :test-name="testName"
        :test-height="testHeight"
        :test-original="testOriginal"
        @close="showDebug = false"
        @refresh="refreshMvuInfo"
        @clear-logs="clearDebugLogs"
        @update:testName="testName = $event"
        @update:testHeight="testHeight = $event"
        @update:testOriginal="testOriginal = $event"
        @inject-test="doInjectTest"
        @clear-test="doClearTest"
        @quick-test="doQuickTest"
        @save-damage="doSaveActualDamage"
        @clear-damage="doClearActualDamage"
      />

      <!-- 主要内容区 -->
      <div class="gc-main-area" :class="{ disabled: !settings.enabled }">
        
        <!-- 快速计算器 -->
        <QuickCalc />

        <!-- 角色列表 -->
        <div class="gc-section">
          <div class="gc-section-header">
            <span><i class="fa-solid fa-users"></i> 角色列表</span>
            <span class="gc-badge-count">{{ characters.size }}</span>
          </div>
          <CharacterList :characters="characters" :show-damage="settings.enableDamageCalculation" />
        </div>

        <!-- 扩展计算系统 -->
        <ExtensionsPanel
          :settings="settings"
          :damage-summary="damageSummary"
          :damage-scenarios="damageScenariosList"
          @toggle-damage="onDamageToggle"
          @update:setting="updateSetting"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore, DAMAGE_SCENARIOS } from '../settings';
import { useCharactersStore } from '../characters';
import { usePromptsStore, type PromptTemplate } from '../prompts';
import { useWorldviewsStore, type Worldview } from '../worldviews';
import { getMvuDebugInfo, injectTestData, clearTestData, type MvuDebugInfo } from '../mvu集成';
import { VERSION, CHANGELOG } from '../version';

// 面板组件
import { SettingsPanel, HelpPanel, WorldviewPanel, PromptsPanel, DebugPanel, ExtensionsPanel } from './panels';
import QuickCalc from './features/QuickCalc.vue';
import CharacterList from './CharacterList.vue';

import type { Settings } from '../types';

// ========== Stores ==========
const settingsStore = useSettingsStore();
const { settings, debugLogs } = storeToRefs(settingsStore);
const { toggle: toggleEnabled, clearDebugLogs } = settingsStore;

const charactersStore = useCharactersStore();
const { characters } = storeToRefs(charactersStore);
const { refresh: refreshCharacters, recalculateDamage, getDamageSummary } = charactersStore;

const promptsStore = usePromptsStore();
const { templates } = storeToRefs(promptsStore);
const { toggleTemplate, updateTemplate, addTemplate, removeTemplate, moveTemplate, resetToDefaults: resetPrompts } = promptsStore;

const worldviewsStore = useWorldviewsStore();
const { worldviews, currentWorldviewId } = storeToRefs(worldviewsStore);
const { setCurrentWorldview, addWorldview, updateWorldview, removeWorldview, resetToDefaults: resetWorldviews } = worldviewsStore;
const currentWorldview = computed(() => worldviewsStore.currentWorldview);

// ========== UI 状态 ==========
const isCollapsed = ref(false);
const showSettings = ref(false);
const showHelp = ref(false);
const showDebug = ref(false);
const showPrompts = ref(false);
const showWorldview = ref(false);

const hasOverlay = computed(() => 
  showSettings.value || showHelp.value || showDebug.value || showPrompts.value || showWorldview.value
);

const togglePanel = (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest('.gc-header-actions')) return;
  isCollapsed.value = !isCollapsed.value;
};

// ========== 设置处理 ==========
// 接受 unknown 类型，与子组件 emit 类型兼容
const updateSetting = (key: keyof Settings, value: unknown) => {
  (settings.value as Record<keyof Settings, unknown>)[key] = value;
};

// ========== 损害计算 ==========
const damageSummary = computed(() => getDamageSummary());

const damageScenariosList = computed(() => 
  DAMAGE_SCENARIOS.map(id => ({
    id,
    name: id,
    density: getDensityForScenario(id),
  }))
);

function getDensityForScenario(id: string): number {
  const densities: Record<string, number> = {
    '荒野': 1,
    '乡村': 50,
    '郊区': 500,
    '小城市': 2000,
    '中等城市': 5000,
    '大城市': 10000,
    '超大城市中心': 25000,
    '东京市中心': 15000,
    '香港': 26000,
    '马尼拉': 43000,
  };
  return densities[id] || 5000;
}

const onDamageToggle = (enabled: boolean) => {
  settings.value.enableDamageCalculation = enabled;
  if (enabled) {
    recalculateDamage();
    toastr.success('损害计算已启用');
  } else {
    toastr.info('损害计算已禁用');
  }
};

// ========== 提示词处理 ==========
const handleSaveTemplate = (template: PromptTemplate) => {
  updateTemplate(template.id, template);
  toastr.success(`模板 "${template.name}" 已保存`);
};

const handleCreateTemplate = (template: Omit<PromptTemplate, 'id' | 'order' | 'builtin'>) => {
  addTemplate(template);
  toastr.success(`模板 "${template.name}" 已创建`);
};

const handleDeleteTemplate = (id: string, name: string) => {
  if (confirm(`确定要删除模板 "${name}" 吗？`)) {
    removeTemplate(id);
    toastr.success(`模板 "${name}" 已删除`);
  }
};

// ========== 世界观处理 ==========
const handleDeleteWorldview = (id: string | undefined, name: string | undefined) => {
  if (id && name && confirm(`确定要删除世界观 "${name}" 吗？`)) {
    removeWorldview(id);
    toastr.success(`世界观 "${name}" 已删除`);
  }
};

// ========== 调试功能 ==========
const mvuInfo = ref<MvuDebugInfo>(getMvuDebugInfo());
const testName = ref('测试角色');
const testHeight = ref(100);
const testOriginal = ref(1.65);

const refreshMvuInfo = () => {
  mvuInfo.value = getMvuDebugInfo();
  settingsStore.debugLog('🔄 已刷新 MVU 状态');
};

// 直接使用 values()，因为 CharacterData 已经包含 name 属性
const charactersArray = computed(() => 
  Array.from(characters.value.values())
);

const doInjectTest = () => {
  if (!testName.value) {
    toastr.warning('请输入角色名');
    return;
  }
  const result = injectTestData(testName.value, testHeight.value, testOriginal.value);
  if (result.success) {
    toastr.success(`已注入测试数据: ${testName.value}`);
    setTimeout(() => { refreshMvuInfo(); refreshCharacters(); }, 500);
  } else {
    toastr.error(`注入失败: ${result.error}`);
  }
};

const doQuickTest = (params: { name: string; height: number; original: number }) => {
  const result = injectTestData(params.name, params.height, params.original);
  if (result.success) {
    toastr.success(`已注入测试数据: ${params.name}`);
    setTimeout(() => { refreshMvuInfo(); refreshCharacters(); }, 500);
  } else {
    toastr.error(`注入失败: ${result.error}`);
  }
};

const doClearTest = (name?: string) => {
  const result = clearTestData(name);
  if (result.success) {
    toastr.success(name ? `已清除角色: ${name}` : '已清除所有测试数据');
    setTimeout(() => { refreshMvuInfo(); refreshCharacters(); }, 300);
  } else {
    toastr.error(`清除失败: ${result.error}`);
  }
};

const doSaveActualDamage = (params: { name: string; data: unknown }) => {
  // 保存实际损害数据
  try {
    const prefix = settings.value.variablePrefix;
    const variables = getVariables({ type: 'message', message_id: 'latest' });
    _.set(variables, `stat_data.${prefix}.${params.name}._实际损害`, params.data);
    insertOrAssignVariables(variables, { type: 'message', message_id: 'latest' });
    toastr.success(`已保存 ${params.name} 的实际损害数据`);
    setTimeout(() => { refreshMvuInfo(); refreshCharacters(); }, 300);
  } catch (e) {
    toastr.error(`保存失败: ${e}`);
  }
};

const doClearActualDamage = (name: string) => {
  try {
    const prefix = settings.value.variablePrefix;
    deleteVariable(`stat_data.${prefix}.${name}._实际损害`, { type: 'message', message_id: 'latest' });
    toastr.success(`已清除 ${name} 的实际损害数据`);
    setTimeout(() => { refreshMvuInfo(); refreshCharacters(); }, 300);
  } catch (e) {
    toastr.error(`清除失败: ${e}`);
  }
};

// 打开调试面板时自动刷新
watch(showDebug, (val) => {
  if (val) refreshMvuInfo();
});
</script>

<style scoped>
/* ========== CSS 变量 ========== */
.gc-panel {
  --gc-primary: #ec4899;
  --gc-bg: #0f172a;
  --gc-text: #f8fafc;
  --gc-text-muted: #94a3b8;
  --gc-border: rgba(255, 255, 255, 0.08);
  --gc-radius: 16px;
  
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--gc-bg);
  border: 1px solid var(--gc-border);
  border-radius: var(--gc-radius);
  margin-bottom: 24px;
  color: var(--gc-text);
  box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.gc-panel.collapsed {
  border-color: rgba(255, 255, 255, 0.05);
  background: rgba(15, 23, 42, 0.6);
}

/* ========== 头部 ========== */
.gc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.03), transparent);
  border-bottom: 1px solid transparent;
  transition: all 0.2s;
}

.gc-panel:not(.collapsed) .gc-header {
  border-bottom-color: var(--gc-border);
}

.gc-header:hover {
  background: rgba(255, 255, 255, 0.06);
}

.gc-header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 1.05em;
  color: var(--gc-text);
}

.gc-logo-wrapper {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(236, 72, 153, 0.15);
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(236, 72, 153, 0.2);
}

.gc-logo-icon {
  color: var(--gc-primary);
  font-size: 1.1em;
}

.gc-header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.gc-toggle-icon {
  color: var(--gc-text-muted);
  font-size: 0.9em;
  transition: transform 0.2s;
}

.gc-status-badge {
  font-size: 0.75em;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
}

.gc-status-badge.disabled {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* ========== 内容区 ========== */
.gc-content {
  padding: 20px;
  position: relative;
  min-height: 200px;
}

.gc-content.has-overlay {
  overflow: hidden;
}

/* ========== 控制栏 ========== */
.gc-control-bar {
  margin-bottom: 16px;
}

.gc-master-btn {
  width: 100%;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--gc-border);
  border-radius: 12px;
  color: var(--gc-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 1em;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.gc-master-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.gc-master-btn.active {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%);
  border-color: rgba(236, 72, 153, 0.4);
  color: white;
  box-shadow: 0 0 20px rgba(236, 72, 153, 0.1);
}

.gc-master-btn.active:hover {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%);
  border-color: rgba(236, 72, 153, 0.5);
}

.gc-master-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
}

.gc-master-btn.active .gc-master-icon {
  background: rgba(236, 72, 153, 0.8);
  color: white;
  box-shadow: 0 0 10px rgba(236, 72, 153, 0.4);
}

.gc-master-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #64748b;
  box-shadow: 0 0 0 2px rgba(100, 116, 139, 0.2);
  transition: all 0.3s;
}

.gc-master-btn.active .gc-master-status-dot {
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3), 0 0 10px rgba(16, 185, 129, 0.5);
}

/* ========== 按钮栏 ========== */
.gc-action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  justify-content: flex-end;
  align-items: center;
  padding: 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.gc-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 4px;
}

.gc-icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--gc-text-muted, #94a3b8);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  margin: 0;
  box-shadow: none;
}

.gc-icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--gc-text, #f8fafc);
}

.gc-icon-btn.active {
  background: rgba(236, 72, 153, 0.15);
  color: var(--gc-primary, #ec4899);
}

.gc-icon-btn.debug { color: #fbbf24; }
.gc-icon-btn.debug:hover { background: rgba(251, 191, 36, 0.15); }
.gc-icon-btn.debug.active { background: rgba(251, 191, 36, 0.2); }

.gc-icon-btn.prompt { color: #a78bfa; }
.gc-icon-btn.prompt:hover { background: rgba(167, 139, 250, 0.15); }
.gc-icon-btn.prompt.active { background: rgba(167, 139, 250, 0.2); }

.gc-icon-btn.worldview { color: #c084fc; }
.gc-icon-btn.worldview:hover { background: rgba(192, 132, 252, 0.15); }
.gc-icon-btn.worldview.active { background: rgba(192, 132, 252, 0.2); }

/* ========== 主区域 ========== */
.gc-main-area {
  transition: opacity 0.2s;
}

.gc-main-area.disabled {
  opacity: 0.5;
  pointer-events: none;
  filter: grayscale(1);
}

/* ========== 区块 ========== */
.gc-section {
  margin-bottom: 24px;
}

.gc-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 0.9em;
  font-weight: 600;
  color: var(--gc-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.gc-section-header i {
  color: var(--gc-primary);
  margin-right: 8px;
}

.gc-badge-count {
  padding: 2px 10px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  font-size: 0.85em;
  color: var(--gc-text);
  font-weight: 500;
}
</style>
