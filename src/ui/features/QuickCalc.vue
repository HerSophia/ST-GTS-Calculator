<template>
  <div class="gc-calc-section">
    <div class="gc-calc-box">
      <div class="gc-input-wrapper">
        <input
          v-model.number="calcHeight"
          type="number"
          placeholder="身高(m)"
          class="gc-input"
          @keypress.enter="doCalculate"
        />
        <span class="gc-unit">m</span>
      </div>
      <span class="gc-operator">/</span>
      <div class="gc-input-wrapper">
        <input
          v-model.number="calcOriginal"
          type="number"
          placeholder="原高(m)"
          class="gc-input"
        />
        <span class="gc-unit">m</span>
      </div>
      <button class="gc-btn-icon primary" @click="doCalculate" title="计算">
        <i class="fa-solid fa-calculator"></i>
      </button>
    </div>
    
    <!-- 计算结果 -->
    <transition name="fade">
      <Result v-if="calcResult" :result="calcResult" :is-giant="isGiant" @close="clearCalcResult" />
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useCalculator } from '../../composables';
import Result from '../Result.vue';

const {
  calcHeight,
  calcOriginal,
  calcResult,
  isGiant,
  doCalculate,
  clearCalcResult,
} = useCalculator();
</script>

<style scoped>
.gc-calc-section {
  margin-bottom: 20px;
}

.gc-calc-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 14px;
  border: 1px solid var(--gc-border, rgba(255, 255, 255, 0.08));
}

.gc-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.gc-input {
  width: 100%;
  padding: 10px 32px 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  border-radius: 10px;
  color: var(--gc-text, #f8fafc);
  font-size: 0.95em;
  transition: all 0.2s;
  font-family: var(--gc-font-mono);
}

.gc-input:hover {
  background: rgba(255, 255, 255, 0.06);
}

.gc-input:focus {
  outline: none;
  background: rgba(0, 0, 0, 0.3);
  border-color: var(--gc-primary, #ec4899);
  box-shadow: 0 0 0 3px var(--gc-primary-light, rgba(236, 72, 153, 0.15));
}

.gc-input::placeholder {
  color: var(--gc-text-dim, #64748b);
  font-family: var(--gc-font-family);
}

.gc-unit {
  position: absolute;
  right: 12px;
  color: var(--gc-text-dim, #64748b);
  font-size: 0.85em;
  pointer-events: none;
  font-weight: 500;
}

.gc-operator {
  color: var(--gc-text-muted, #94a3b8);
  font-weight: bold;
  font-size: 1.1em;
  opacity: 0.5;
}

.gc-btn-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.gc-btn-icon.primary {
  background: var(--gc-primary, #ec4899);
  color: white;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

.gc-btn-icon.primary:hover {
  background: var(--gc-primary-hover, #db2777);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(236, 72, 153, 0.4);
}

.gc-btn-icon.primary:active {
  transform: translateY(0);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
