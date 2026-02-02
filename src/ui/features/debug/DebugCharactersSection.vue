<template>
  <div class="gc-debug-characters-section">
    <div v-if="!characters.length" class="gc-debug-empty">
      <i class="fa-solid fa-users-slash"></i>
      <p>暂无角色数据</p>
      <small>在世界书或提示词中设置角色身高后，这里会显示详细信息</small>
    </div>
    
    <div v-else class="gc-debug-characters">
      <div 
        v-for="char in characters" 
        :key="char.name" 
        class="gc-debug-char-card"
        :class="{ giant: char.类型 === '巨大娘', tiny: char.类型 === '小人' }"
      >
        <div class="gc-debug-char-header">
          <span class="gc-debug-char-name">{{ char.name }}</span>
          <span class="gc-debug-char-type" :class="char.类型 === '巨大娘' ? 'giant' : 'tiny'">
            {{ char.类型 }}
          </span>
        </div>
        
        <div class="gc-debug-char-body">
          <div class="gc-debug-char-row">
            <span>身高</span>
            <span class="mono">{{ char.当前身高_格式化 || `${char.当前身高}m` }}</span>
          </div>
          <div class="gc-debug-char-row">
            <span>原身高</span>
            <span class="mono">{{ char.原身高 }}m</span>
          </div>
          <div class="gc-debug-char-row">
            <span>倍率</span>
            <span class="mono">{{ char.倍率?.toFixed(2) }}x</span>
          </div>
          <div v-if="char.级别" class="gc-debug-char-row">
            <span>级别</span>
            <span class="highlight">{{ char.级别 }}</span>
          </div>
          <div class="gc-debug-char-row">
            <span>计算数据</span>
            <span :class="char.有计算数据 ? 'success' : 'warn'">{{ char.有计算数据 ? '✅' : '❌' }}</span>
          </div>
          <div class="gc-debug-char-row">
            <span>损害数据</span>
            <span :class="char.有损害数据 ? 'success' : 'muted'">{{ char.有损害数据 ? '✅' : '—' }}</span>
          </div>
          <div class="gc-debug-char-row">
            <span>历史记录</span>
            <span>{{ char.有身高历史 ? `${char.历史记录数}条` : '—' }}</span>
          </div>
        </div>
        
        <!-- 自定义部位 -->
        <div v-if="char.自定义部位 && Object.keys(char.自定义部位).length" class="gc-debug-char-custom">
          <div class="gc-debug-char-custom-title">
            <i class="fa-solid fa-bolt"></i> 自定义部位
          </div>
          <div v-for="(val, key) in char.自定义部位" :key="key" class="gc-debug-char-row">
            <span>{{ key }}</span>
            <span class="mono">{{ val }}m</span>
          </div>
        </div>
        
        <!-- 预估损害 -->
        <div v-if="char.预估损害" class="gc-debug-char-damage estimate">
          <div class="gc-debug-char-damage-title">
            <i class="fa-solid fa-calculator"></i> 预估损害
            <span class="gc-debug-char-damage-badge">自动计算</span>
          </div>
          <div class="gc-debug-char-row">
            <span>破坏力等级</span>
            <span class="damage">{{ char.预估损害.破坏力等级 }}</span>
          </div>
          <div class="gc-debug-char-row">
            <span>单步伤亡</span>
            <span class="damage">{{ char.预估损害.单步伤亡 }}</span>
          </div>
          <div class="gc-debug-char-row">
            <span>场景</span>
            <span>{{ char.预估损害.场景 }}</span>
          </div>
        </div>
        
        <!-- 实际损害 -->
        <div v-if="char.实际损害" class="gc-debug-char-damage actual">
          <div class="gc-debug-char-damage-title">
            <i class="fa-solid fa-skull"></i> 实际损害
            <span class="gc-debug-char-damage-badge actual">剧情记录</span>
          </div>
          <div v-if="char.实际损害.总伤亡人数_格式化" class="gc-debug-char-row">
            <span>累计伤亡</span>
            <span class="actual-damage">{{ char.实际损害.总伤亡人数_格式化 }}</span>
          </div>
          <div v-if="char.实际损害.总建筑损毁" class="gc-debug-char-row">
            <span>累计建筑损毁</span>
            <span class="actual-damage">{{ char.实际损害.总建筑损毁 }}栋</span>
          </div>
          <div v-if="char.实际损害.最近行动" class="gc-debug-char-row">
            <span>最近行动</span>
            <span class="action">{{ char.实际损害.最近行动 }}</span>
          </div>
          <div v-if="char.实际损害.重大事件数" class="gc-debug-char-row">
            <span>重大事件</span>
            <span>{{ char.实际损害.重大事件数 }}件</span>
          </div>
        </div>
        
        <!-- 无损害数据提示 -->
        <div v-if="!char.预估损害 && !char.实际损害 && char.类型 === '巨大娘'" class="gc-debug-char-no-damage">
          <i class="fa-solid fa-info-circle"></i>
          <span>启用损害计算后显示预估数据</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DebugCharacterInfo } from '../../../types';

defineProps<{
  characters: DebugCharacterInfo[];
}>();
</script>

<style scoped>
.gc-debug-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.gc-debug-empty i {
  font-size: 2.5em;
  color: var(--gc-text-muted, #94a3b8);
  margin-bottom: 12px;
}

.gc-debug-empty p {
  font-size: 0.95em;
  margin-bottom: 6px;
}

.gc-debug-empty small {
  font-size: 0.8em;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-debug-characters {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gc-debug-char-card {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 12px;
  border-left: 3px solid transparent;
}

.gc-debug-char-card:hover {
  background: rgba(0, 0, 0, 0.3);
}

.gc-debug-char-card.giant {
  border-left-color: var(--gc-primary, #f472b6);
}

.gc-debug-char-card.tiny {
  border-left-color: #60a5fa;
}

.gc-debug-char-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.gc-debug-char-name {
  font-weight: 600;
  font-size: 0.95em;
}

.gc-debug-char-type {
  font-size: 0.75em;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
}

.gc-debug-char-type.giant {
  background: rgba(244, 114, 182, 0.2);
  color: #f472b6;
}

.gc-debug-char-type.tiny {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

.gc-debug-char-body {
  margin-bottom: 8px;
}

.gc-debug-char-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8em;
  padding: 3px 0;
}

.gc-debug-char-row span:last-child {
  text-align: right;
}

.gc-debug-char-row .mono {
  font-family: 'Monaco', 'Menlo', monospace;
}

.gc-debug-char-row .success {
  color: #34d399;
}

.gc-debug-char-row .warn {
  color: #fbbf24;
}

.gc-debug-char-row .muted {
  color: var(--gc-text-muted, #94a3b8);
}

.gc-debug-char-row .highlight {
  color: var(--gc-primary, #f472b6);
}

.gc-debug-char-row .damage {
  color: #f87171;
}

.gc-debug-char-row .actual-damage {
  color: #f87171;
  font-weight: 600;
}

.gc-debug-char-row .action {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-debug-char-custom,
.gc-debug-char-damage {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.gc-debug-char-custom-title,
.gc-debug-char-damage-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8em;
  font-weight: 600;
  margin-bottom: 6px;
}

.gc-debug-char-custom-title {
  color: #fbbf24;
}

.gc-debug-char-damage-title {
  color: #f87171;
}

.gc-debug-char-damage.estimate .gc-debug-char-damage-title {
  color: #60a5fa;
}

.gc-debug-char-damage.actual .gc-debug-char-damage-title {
  color: #f87171;
}

.gc-debug-char-damage-badge {
  font-size: 0.85em;
  padding: 1px 6px;
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
  border-radius: 3px;
  font-weight: normal;
}

.gc-debug-char-damage-badge.actual {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.gc-debug-char-no-damage {
  margin-top: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 0.8em;
  color: var(--gc-text-muted, #94a3b8);
  display: flex;
  align-items: center;
  gap: 6px;
}

.gc-debug-char-no-damage i {
  color: #60a5fa;
}
</style>
