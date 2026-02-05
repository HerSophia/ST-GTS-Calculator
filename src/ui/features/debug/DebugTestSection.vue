<template>
  <div class="gc-debug-test-section">
    <!-- 测试数据注入 -->
    <div class="gc-debug-section">
      <h3><i class="fa-solid fa-flask"></i> 测试数据注入</h3>
      <div class="gc-debug-form">
        <div class="gc-debug-input-row">
          <input 
            :value="testName" 
            @input="$emit('update:test-name', ($event.target as HTMLInputElement).value)" 
            type="text" 
            placeholder="角色名" 
            class="gc-input sm" 
          />
          <input 
            :value="testHeight" 
            @input="$emit('update:test-height', parseFloat(($event.target as HTMLInputElement).value) || 0)" 
            type="number" 
            placeholder="身高(m)" 
            class="gc-input sm" 
          />
          <input 
            :value="testOriginal" 
            @input="$emit('update:test-original', parseFloat(($event.target as HTMLInputElement).value) || 0)" 
            type="number" 
            placeholder="原高(m)" 
            class="gc-input sm" 
          />
        </div>
        <div class="gc-debug-hint">
          <i class="fa-solid fa-info-circle"></i>
          <span v-if="testHeight && testOriginal && testHeight < testOriginal">
            将创建<strong class="tiny">小人</strong>（{{ (testHeight / testOriginal).toFixed(4) }}倍）
          </span>
          <span v-else-if="testHeight && testOriginal">
            将创建<strong class="giant">巨大娘</strong>（{{ (testHeight / testOriginal).toFixed(1) }}倍）
          </span>
          <span v-else>输入身高和原高自动判断类型</span>
        </div>
        <div class="gc-debug-btn-row">
          <button class="gc-btn gc-btn-sm primary" @click="$emit('inject')">
            <i class="fa-solid fa-syringe"></i> 注入测试
          </button>
          <button class="gc-btn gc-btn-sm" @click="$emit('clear', testName)" :disabled="!testName">
            <i class="fa-solid fa-eraser"></i> 清除此角色
          </button>
          <button class="gc-btn gc-btn-sm danger" @click="$emit('clear')">
            <i class="fa-solid fa-trash"></i> 清除全部
          </button>
        </div>
      </div>
    </div>

    <!-- 快捷测试 -->
    <div class="gc-debug-section">
      <h3><i class="fa-solid fa-lightbulb"></i> 快捷测试</h3>
      <div class="gc-debug-quick-tests">
        <button class="gc-btn gc-btn-sm" @click="$emit('quick-test', { name: '巨人', height: 100, original: 1.65 })">
          巨大娘 100m
        </button>
        <button class="gc-btn gc-btn-sm" @click="$emit('quick-test', { name: '千米级', height: 1000, original: 1.65 })">
          千米级 1km
        </button>
        <button class="gc-btn gc-btn-sm" @click="$emit('quick-test', { name: '行星级', height: 10000000, original: 1.65 })">
          行星级 10Mm
        </button>
        <button class="gc-btn gc-btn-sm tiny" @click="$emit('quick-test', { name: '小人', height: 0.01, original: 1.65 })">
          小人 1cm
        </button>
        <button class="gc-btn gc-btn-sm tiny" @click="$emit('quick-test', { name: '微型', height: 0.001, original: 1.65 })">
          微型 1mm
        </button>
      </div>
    </div>

    <!-- 实际损害录入 -->
    <div class="gc-debug-section">
      <h3><i class="fa-solid fa-skull"></i> 实际损害录入</h3>
      <div class="gc-debug-form">
        <div class="gc-debug-hint damage">
          <i class="fa-solid fa-info-circle"></i>
          <span>记录角色在剧情中造成的实际损害</span>
        </div>
        
        <div class="gc-setting-item">
          <label>选择角色</label>
          <select v-model="damageTarget" class="gc-input">
            <option value="">-- 选择角色 --</option>
            <option 
              v-for="char in giantCharacters" 
              :key="char.name" 
              :value="char.name"
            >
              {{ char.name }}
            </option>
          </select>
        </div>
        
        <div v-if="damageTarget" class="gc-actual-damage-form">
          <div class="gc-debug-input-group">
            <label>累计伤亡</label>
            <div class="gc-debug-input-row">
              <input 
                v-model.number="damageForm.totalCasualties" 
                type="number" 
                class="gc-input sm" 
                placeholder="0" 
              />
              <span class="gc-input-suffix">人</span>
            </div>
          </div>
          
          <div class="gc-debug-input-group">
            <label>累计建筑损毁</label>
            <div class="gc-debug-input-row">
              <input 
                v-model.number="damageForm.totalBuildings" 
                type="number" 
                class="gc-input sm" 
                placeholder="0" 
              />
              <span class="gc-input-suffix">栋</span>
            </div>
          </div>
          
          <div class="gc-debug-input-group">
            <label>最近行动描述</label>
            <input 
              v-model="damageForm.lastAction" 
              type="text" 
              class="gc-input" 
              placeholder="如：踩下一脚" 
            />
          </div>
          
          <div class="gc-debug-input-group">
            <label>最近行动伤亡</label>
            <div class="gc-debug-input-row">
              <input 
                v-model.number="damageForm.lastActionCasualties" 
                type="number" 
                class="gc-input sm" 
                placeholder="0" 
              />
              <span class="gc-input-suffix">人</span>
            </div>
          </div>
          
          <div class="gc-debug-input-group">
            <label>备注</label>
            <input 
              v-model="damageForm.note" 
              type="text" 
              class="gc-input" 
              placeholder="可选备注" 
            />
          </div>
          
          <div class="gc-debug-btn-row">
            <button class="gc-btn gc-btn-sm primary" @click="saveDamage">
              <i class="fa-solid fa-save"></i> 保存
            </button>
            <button class="gc-btn gc-btn-sm danger" @click="clearDamage">
              <i class="fa-solid fa-trash"></i> 清除
            </button>
          </div>
        </div>
        
        <div v-else class="gc-debug-hint muted">
          <i class="fa-solid fa-exclamation-circle"></i>
          <span>请先选择一个巨大娘角色</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CharacterData } from '../../../types';

const props = defineProps<{
  testName: string;
  testHeight: number;
  testOriginal: number;
  characters: CharacterData[];
}>();

const emit = defineEmits<{
  (e: 'update:test-name', value: string): void;
  (e: 'update:test-height', value: number): void;
  (e: 'update:test-original', value: number): void;
  (e: 'inject'): void;
  (e: 'clear', name?: string): void;
  (e: 'quick-test', params: { name: string; height: number; original: number }): void;
  (e: 'save-damage', params: { name: string; data: typeof damageForm.value }): void;
  (e: 'clear-damage', name: string): void;
}>();

const damageTarget = ref('');
const damageForm = ref({
  totalCasualties: 0,
  totalBuildings: 0,
  lastAction: '',
  lastActionCasualties: 0,
  note: '',
});

const giantCharacters = computed(() => 
  props.characters.filter(c => {
    const scale = c.currentHeight / c.originalHeight;
    return scale >= 1;
  })
);

const saveDamage = () => {
  if (!damageTarget.value) return;
  emit('save-damage', {
    name: damageTarget.value,
    data: { ...damageForm.value },
  });
};

const clearDamage = () => {
  if (!damageTarget.value) return;
  emit('clear-damage', damageTarget.value);
  damageForm.value = {
    totalCasualties: 0,
    totalBuildings: 0,
    lastAction: '',
    lastActionCasualties: 0,
    note: '',
  };
};
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

.gc-debug-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gc-debug-input-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.gc-debug-input-row .gc-input {
  flex: 1;
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

.gc-input.sm {
  padding: 4px 8px;
  font-size: 0.8em;
}

.gc-debug-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
  font-size: 0.8em;
  color: #60a5fa;
}

.gc-debug-hint i {
  margin-top: 2px;
}

.gc-debug-hint strong.tiny {
  color: #60a5fa;
}

.gc-debug-hint strong.giant {
  color: var(--gc-primary, #f472b6);
}

.gc-debug-hint.damage {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.gc-debug-hint.muted {
  background: rgba(148, 163, 184, 0.1);
  color: var(--gc-text-muted, #94a3b8);
}

.gc-debug-btn-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.gc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--gc-border, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  color: var(--gc-text, #f1f5f9);
  font-weight: 500;
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.2s;
}

.gc-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.gc-btn-sm {
  padding: 6px 10px;
  font-size: 0.8em;
}

.gc-btn.primary {
  background: var(--gc-primary, #f472b6);
  border-color: var(--gc-primary, #f472b6);
  color: white;
}

.gc-btn.primary:hover {
  background: var(--gc-primary-hover, #ec4899);
}

.gc-btn.danger {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.gc-btn.danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

.gc-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gc-debug-quick-tests {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.gc-debug-quick-tests .gc-btn.tiny {
  background: rgba(96, 165, 250, 0.1);
  border-color: rgba(96, 165, 250, 0.3);
  color: #60a5fa;
}

.gc-debug-quick-tests .gc-btn.tiny:hover {
  background: rgba(96, 165, 250, 0.2);
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

.gc-actual-damage-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background: rgba(239, 68, 68, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.1);
}

.gc-debug-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gc-debug-input-group label {
  font-size: 0.8em;
  color: var(--gc-text-muted, #94a3b8);
}

.gc-input-suffix {
  color: var(--gc-text-muted, #94a3b8);
  font-size: 0.85em;
  white-space: nowrap;
}
</style>
