<template>
  <div class="gc-debug-status-section">
    <!-- MVU 状态 -->
    <div class="gc-debug-section">
      <h3><i class="fa-solid fa-satellite-dish"></i> MVU 连接</h3>
      <div class="gc-debug-status">
        <div class="gc-debug-row">
          <span class="gc-debug-label">MVU 可用</span>
          <span class="gc-debug-value" :class="mvuInfo.mvuAvailable ? 'success' : 'error'">
            {{ mvuInfo.mvuAvailable ? '✅ 是' : '❌ 否' }}
          </span>
        </div>
        <div v-if="mvuInfo.mvuVersion" class="gc-debug-row">
          <span class="gc-debug-label">MVU 版本</span>
          <span class="gc-debug-value">{{ mvuInfo.mvuVersion }}</span>
        </div>
        <div class="gc-debug-row">
          <span class="gc-debug-label">变量前缀</span>
          <span class="gc-debug-value mono">{{ mvuInfo.prefix }}</span>
        </div>
      </div>
    </div>

    <!-- 数据状态 -->
    <div class="gc-debug-section">
      <h3><i class="fa-solid fa-database"></i> 数据状态</h3>
      <div class="gc-debug-status">
        <div class="gc-debug-row">
          <span class="gc-debug-label">stat_data</span>
          <span class="gc-debug-value" :class="mvuInfo.messageVariables?.hasStatData ? 'success' : 'warn'">
            {{ mvuInfo.messageVariables?.hasStatData ? '✅ 有' : '⚠️ 无' }}
          </span>
        </div>
        <div class="gc-debug-row">
          <span class="gc-debug-label">巨大娘数据</span>
          <span class="gc-debug-value" :class="mvuInfo.messageVariables?.hasGiantessData ? 'success' : 'warn'">
            {{ mvuInfo.messageVariables?.hasGiantessData ? '✅ 有' : '⚠️ 无' }}
          </span>
        </div>
        <div class="gc-debug-row">
          <span class="gc-debug-label">场景数据</span>
          <span class="gc-debug-value" :class="mvuInfo.messageVariables?.hasScenarioData ? 'success' : 'muted'">
            {{ mvuInfo.messageVariables?.hasScenarioData ? '✅ 有' : '— 无' }}
          </span>
        </div>
        <div class="gc-debug-row">
          <span class="gc-debug-label">互动限制</span>
          <span class="gc-debug-value" :class="mvuInfo.messageVariables?.hasInteractionData ? 'success' : 'muted'">
            {{ mvuInfo.messageVariables?.hasInteractionData ? '✅ 有' : '— 无' }}
          </span>
        </div>
        <div class="gc-debug-row">
          <span class="gc-debug-label">角色数量</span>
          <span class="gc-debug-value">
            {{ mvuInfo.messageVariables?.characterDetails?.length || 0 }}
          </span>
        </div>
      </div>
    </div>

    <!-- 当前设置 -->
    <div class="gc-debug-section">
      <h3><i class="fa-solid fa-sliders"></i> 当前配置</h3>
      <div class="gc-debug-status">
        <div class="gc-debug-row">
          <span class="gc-debug-label">脚本启用</span>
          <span class="gc-debug-value" :class="mvuInfo.settings?.enabled ? 'success' : 'warn'">
            {{ mvuInfo.settings?.enabled ? '✅ 是' : '⚠️ 否' }}
          </span>
        </div>
        <div class="gc-debug-row">
          <span class="gc-debug-label">自动注入</span>
          <span class="gc-debug-value" :class="mvuInfo.settings?.autoInject ? 'success' : 'muted'">
            {{ mvuInfo.settings?.autoInject ? '✅ 开' : '— 关' }}
          </span>
        </div>
        <div class="gc-debug-row">
          <span class="gc-debug-label">损害计算</span>
          <span class="gc-debug-value" :class="mvuInfo.settings?.enableDamageCalculation ? 'success' : 'muted'">
            {{ mvuInfo.settings?.enableDamageCalculation ? '✅ 开' : '— 关' }}
          </span>
        </div>
        <div class="gc-debug-row">
          <span class="gc-debug-label">世界观注入</span>
          <span class="gc-debug-value" :class="mvuInfo.settings?.injectWorldviewPrompt ? 'success' : 'muted'">
            {{ mvuInfo.settings?.injectWorldviewPrompt ? '✅ 开' : '— 关' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 场景与世界观 -->
    <div class="gc-debug-section">
      <h3><i class="fa-solid fa-globe"></i> 场景与世界观</h3>
      <div class="gc-debug-status">
        <div class="gc-debug-row">
          <span class="gc-debug-label">当前场景</span>
          <span class="gc-debug-value">{{ mvuInfo.scenario?.current }}</span>
        </div>
        <div class="gc-debug-row">
          <span class="gc-debug-label">场景来源</span>
          <span class="gc-debug-value" :class="mvuInfo.scenario?.source === 'MVU变量' ? 'highlight' : 'muted'">
            {{ mvuInfo.scenario?.source }}
          </span>
        </div>
        <div v-if="mvuInfo.scenario?.reason" class="gc-debug-row">
          <span class="gc-debug-label">场景原因</span>
          <span class="gc-debug-value">{{ mvuInfo.scenario.reason }}</span>
        </div>
        <div class="gc-debug-row">
          <span class="gc-debug-label">当前世界观</span>
          <span class="gc-debug-value highlight">{{ mvuInfo.worldview?.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MvuDebugInfo } from '../../../services/debug';

defineProps<{
  mvuInfo: MvuDebugInfo;
}>();
</script>

<style scoped>
.gc-debug-section {
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 12px;
}

.gc-debug-section:last-child {
  margin-bottom: 0;
}

.gc-debug-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--gc-text, #f1f5f9);
}

.gc-debug-section h3 i {
  color: var(--gc-primary, #f472b6);
}

.gc-debug-status {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gc-debug-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85em;
  padding: 4px 0;
}

.gc-debug-row:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.gc-debug-label {
  color: var(--gc-text-muted, #94a3b8);
}

.gc-debug-value {
  font-weight: 500;
  text-align: right;
}

.gc-debug-value.success {
  color: #34d399;
}

.gc-debug-value.warn {
  color: #fbbf24;
}

.gc-debug-value.error {
  color: #f87171;
}

.gc-debug-value.muted {
  color: var(--gc-text-muted, #94a3b8);
}

.gc-debug-value.highlight {
  color: var(--gc-primary, #f472b6);
}

.gc-debug-value.mono {
  font-family: 'Monaco', 'Menlo', monospace;
}
</style>
