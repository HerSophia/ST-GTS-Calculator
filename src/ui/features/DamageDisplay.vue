<template>
  <div v-if="damageData" class="gc-detail-section full-width gc-damage-section">
    <div class="gc-detail-section-title">
      <i class="fa-solid fa-explosion"></i> 破坏力数据
      <span class="gc-damage-level-badge">{{ damageData.破坏力等级 }}</span>
    </div>
    
    <div class="gc-damage-grid">
      <div class="gc-damage-item">
        <div class="gc-damage-item-label">足迹面积</div>
        <div class="gc-damage-item-value">{{ damageData.足迹.足迹面积_格式化 }}</div>
      </div>
      <div class="gc-damage-item">
        <div class="gc-damage-item-label">单步伤亡</div>
        <div class="gc-damage-item-value casualties">{{ damageData.单步损害.小人伤亡.格式化 }}</div>
      </div>
      <div class="gc-damage-item">
        <div class="gc-damage-item-label">建筑损毁</div>
        <div class="gc-damage-item-value buildings">{{ damageData.单步损害.建筑损毁.格式化 }}</div>
      </div>
      <div v-if="damageData.单步损害.城区损毁.数量 > 0" class="gc-damage-item">
        <div class="gc-damage-item-label">城区损毁</div>
        <div class="gc-damage-item-value">{{ damageData.单步损害.城区损毁.格式化 }}</div>
      </div>
    </div>
    
    <!-- 宏观破坏 -->
    <div v-if="damageData.宏观破坏" class="gc-macro-damage">
      <div class="gc-macro-damage-title">
        <i class="fa-solid fa-globe"></i>
        宏观破坏力: {{ damageData.宏观破坏.等级名称 }}
      </div>
      <div class="gc-macro-damage-list">
        <span v-if="damageData.宏观破坏.城市">{{ damageData.宏观破坏.城市.格式化 }}</span>
        <span v-if="damageData.宏观破坏.国家">{{ damageData.宏观破坏.国家.格式化 }}</span>
        <span v-if="damageData.宏观破坏.大陆">{{ damageData.宏观破坏.大陆.格式化 }}</span>
        <span v-if="damageData.宏观破坏.行星">{{ damageData.宏观破坏.行星.格式化 }}</span>
        <span v-if="damageData.宏观破坏.恒星">{{ damageData.宏观破坏.恒星.格式化 }}</span>
        <span v-if="damageData.宏观破坏.星系">{{ damageData.宏观破坏.星系.格式化 }}</span>
      </div>
    </div>
    
    <!-- 特殊效应 -->
    <div v-if="damageData.特殊效应.length > 0" class="gc-special-effects">
      <div class="gc-special-effects-title">
        <i class="fa-solid fa-bolt"></i> 物理效应
      </div>
      <div class="gc-special-effects-list">
        <span v-for="(effect, i) in damageData.特殊效应.slice(0, 4)" :key="i" class="gc-effect-tag">
          {{ effect }}
        </span>
        <span v-if="damageData.特殊效应.length > 4" class="gc-effect-more">
          +{{ damageData.特殊效应.length - 4 }}更多
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  damageData: {
    破坏力等级: string;
    足迹: {
      足迹面积_格式化: string;
    };
    单步损害: {
      小人伤亡: { 格式化: string };
      建筑损毁: { 格式化: string };
      城区损毁: { 数量: number; 格式化: string };
    };
    宏观破坏?: {
      等级名称: string;
      城市?: { 格式化: string };
      国家?: { 格式化: string };
      大陆?: { 格式化: string };
      行星?: { 格式化: string };
      恒星?: { 格式化: string };
      星系?: { 格式化: string };
    };
    特殊效应: string[];
  } | null;
}>();
</script>

<style scoped>
.gc-damage-section {
  background: rgba(251, 146, 60, 0.05);
  border-radius: 8px;
  padding: 12px !important;
  border: 1px solid rgba(251, 146, 60, 0.15);
}

.gc-detail-section-title {
  font-size: 0.75em;
  font-weight: 600;
  color: #fb923c;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 6px;
}

.gc-damage-level-badge {
  font-size: 0.8em;
  font-weight: 500;
  padding: 2px 8px;
  background: rgba(251, 146, 60, 0.2);
  color: #fb923c;
  border-radius: 4px;
  margin-left: auto;
}

.gc-damage-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.gc-damage-item {
  background: rgba(0, 0, 0, 0.2);
  padding: 8px 10px;
  border-radius: 6px;
}

.gc-damage-item-label {
  font-size: 0.75em;
  color: #94a3b8;
  margin-bottom: 2px;
}

.gc-damage-item-value {
  font-size: 0.9em;
  font-weight: 500;
  font-family: 'JetBrains Mono', monospace;
  color: #e2e8f0;
}

.gc-damage-item-value.casualties {
  color: #f87171;
}

.gc-damage-item-value.buildings {
  color: #fbbf24;
}

/* 宏观破坏 */
.gc-macro-damage {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(251, 146, 60, 0.2);
}

.gc-macro-damage-title {
  font-size: 0.8em;
  font-weight: 600;
  color: #fb923c;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.gc-macro-damage-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.gc-macro-damage-list span {
  font-size: 0.8em;
  padding: 3px 8px;
  background: rgba(251, 146, 60, 0.15);
  color: #e2e8f0;
  border-radius: 4px;
}

/* 特殊效应 */
.gc-special-effects {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(251, 146, 60, 0.2);
}

.gc-special-effects-title {
  font-size: 0.8em;
  font-weight: 600;
  color: #60a5fa;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.gc-special-effects-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.gc-effect-tag {
  font-size: 0.75em;
  padding: 2px 6px;
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
  border-radius: 4px;
}

.gc-effect-more {
  font-size: 0.75em;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  border-radius: 4px;
}

/* 全宽 */
.full-width {
  flex-basis: 100%;
}
</style>
