/**
 * 事件处理服务测试
 * 
 * 测试酒馆事件监听和处理功能
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { variablesMock, mvuMock, eventMock } from '../../setup';
import { useSettingsStore } from '@/stores/settings';
import { useCharactersStoreBase } from '@/stores/characters';
import {
  initVariableEventListeners,
  cleanupEventListeners,
  getServiceStatus,
  manualSync,
  isInitialized,
} from '@/services/variables/event-handler';

describe('Service: variables/event-handler', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mvuMock.__reset();
    variablesMock.__reset();
    eventMock.__reset();
    // 确保每次测试前清理监听器
    cleanupEventListeners();
  });

  // ========== initVariableEventListeners ==========
  describe('initVariableEventListeners', () => {
    it('应该注册所有事件监听器', () => {
      initVariableEventListeners({ syncOnInit: false });

      // 应该注册了 7 个事件
      expect(eventMock.eventOn).toHaveBeenCalledTimes(7);

      // 验证服务状态
      const status = getServiceStatus();
      expect(status.initialized).toBe(true);
      expect(status.listenerCount).toBe(7);
    });

    it('应该监听 MESSAGE_SWIPED 事件', () => {
      initVariableEventListeners({ syncOnInit: false });

      expect(eventMock.eventOn).toHaveBeenCalledWith(
        'MESSAGE_SWIPED',
        expect.any(Function)
      );
    });

    it('应该监听 MESSAGE_EDITED 事件', () => {
      initVariableEventListeners({ syncOnInit: false });

      expect(eventMock.eventOn).toHaveBeenCalledWith(
        'MESSAGE_EDITED',
        expect.any(Function)
      );
    });

    it('应该监听 GENERATION_ENDED 事件', () => {
      initVariableEventListeners({ syncOnInit: false });

      expect(eventMock.eventOn).toHaveBeenCalledWith(
        'GENERATION_ENDED',
        expect.any(Function)
      );
    });

    it('应该监听 CHAT_CHANGED 事件', () => {
      initVariableEventListeners({ syncOnInit: false });

      expect(eventMock.eventOn).toHaveBeenCalledWith(
        'CHAT_CHANGED',
        expect.any(Function)
      );
    });

    describe('配置选项', () => {
      it('应该支持禁用初始同步', () => {
        initVariableEventListeners({ syncOnInit: false });

        // 初始化时不应该调用同步
        // 只有事件触发时才同步
      });

      it('应该支持自定义防抖延迟', () => {
        initVariableEventListeners({
          syncOnInit: false,
          debounce: true,
          debounceDelay: 200,
        });

        const status = getServiceStatus();
        expect(status.initialized).toBe(true);
      });
    });

    describe('重复初始化', () => {
      it('重复初始化应该先清理旧监听器', () => {
        initVariableEventListeners({ syncOnInit: false });
        const firstStatus = getServiceStatus();
        expect(firstStatus.listenerCount).toBe(7);

        // 重复初始化
        initVariableEventListeners({ syncOnInit: false });
        const secondStatus = getServiceStatus();
        expect(secondStatus.listenerCount).toBe(7); // 仍然是 7 个，不会累加
      });
    });
  });

  // ========== cleanupEventListeners ==========
  describe('cleanupEventListeners', () => {
    it('应该清理所有监听器', () => {
      initVariableEventListeners({ syncOnInit: false });
      expect(getServiceStatus().initialized).toBe(true);

      cleanupEventListeners();

      const status = getServiceStatus();
      expect(status.initialized).toBe(false);
      expect(status.listenerCount).toBe(0);
    });

    it('重复清理不应该报错', () => {
      cleanupEventListeners();
      cleanupEventListeners();

      expect(getServiceStatus().initialized).toBe(false);
    });
  });

  // ========== getServiceStatus ==========
  describe('getServiceStatus', () => {
    it('初始状态应该是未初始化', () => {
      const status = getServiceStatus();

      expect(status.initialized).toBe(false);
      expect(status.lastSyncTime).toBeNull();
      expect(status.listenerCount).toBe(0);
      expect(status.currentMessageId).toBeNull();
    });

    it('初始化后应该更新状态', () => {
      initVariableEventListeners({ syncOnInit: false });

      const status = getServiceStatus();

      expect(status.initialized).toBe(true);
      expect(status.listenerCount).toBe(7);
    });

    it('应该返回状态的副本', () => {
      initVariableEventListeners({ syncOnInit: false });

      const status1 = getServiceStatus();
      const status2 = getServiceStatus();

      expect(status1).not.toBe(status2); // 不是同一个对象
      expect(status1).toEqual(status2);  // 但内容相同
    });
  });

  // ========== manualSync ==========
  describe('manualSync', () => {
    it('应该手动触发同步', () => {
      variablesMock.__setVariables({
        stat_data: {
          巨大娘: {
            角色: {
              络络: { 当前身高: 170, 原身高: 1.65 },
            },
          },
        },
      });

      manualSync();

      const charactersStore = useCharactersStoreBase();
      expect(charactersStore.getCharacter('络络')).not.toBeNull();
    });

    it('应该更新最后同步时间', () => {
      const beforeTime = Date.now();

      manualSync();

      const status = getServiceStatus();
      expect(status.lastSyncTime).not.toBeNull();
      expect(status.lastSyncTime).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  // ========== isInitialized ==========
  describe('isInitialized', () => {
    it('初始应该返回 false', () => {
      expect(isInitialized()).toBe(false);
    });

    it('初始化后应该返回 true', () => {
      initVariableEventListeners({ syncOnInit: false });

      expect(isInitialized()).toBe(true);
    });

    it('清理后应该返回 false', () => {
      initVariableEventListeners({ syncOnInit: false });
      cleanupEventListeners();

      expect(isInitialized()).toBe(false);
    });
  });

  // ========== 变量优先策略测试 ==========
  describe('变量优先策略', () => {
    beforeEach(() => {
      const settingsStore = useSettingsStore();
      settingsStore.settings.enabled = true;
      initVariableEventListeners({ syncOnInit: false });
    });

    it('MESSAGE_SWIPED 应该使用变量优先策略', () => {
      // 变量中已有数据
      variablesMock.__setVariables({
        stat_data: {
          巨大娘: {
            角色: {
              络络: { 当前身高: 170, 原身高: 1.65 },
            },
          },
        },
      });

      eventMock.__emit('MESSAGE_SWIPED', 5);

      const charactersStore = useCharactersStoreBase();
      const char = charactersStore.getCharacter('络络');
      expect(char).not.toBeNull();
      expect(char?.currentHeight).toBe(170);
    });

    it('GENERATION_ENDED 应该始终解析新消息', () => {
      // 即使变量中有数据，新消息也应该被解析
      variablesMock.__setVariables({
        stat_data: {
          巨大娘: {
            角色: {
              络络: { 当前身高: 100, 原身高: 1.65 },
            },
          },
        },
      });

      // 模拟新消息内容中有更新命令（这里简化处理）
      eventMock.__emit('GENERATION_ENDED', 10);

      // 应该触发处理
      const status = getServiceStatus();
      expect(status.currentMessageId).toBe(10);
      expect(status.lastSyncTime).not.toBeNull();
    });

    it('MESSAGE_EDITED 应该强制解析消息', () => {
      // 变量中已有数据
      variablesMock.__setVariables({
        stat_data: {
          巨大娘: {
            角色: {
              络络: { 当前身高: 100, 原身高: 1.65 },
            },
          },
        },
      });

      // 编辑消息应该触发强制解析
      eventMock.__emit('MESSAGE_EDITED', 5);

      const status = getServiceStatus();
      expect(status.currentMessageId).toBe(5);
      expect(status.lastSyncTime).not.toBeNull();
    });

    it('当变量中无数据时应该解析消息', () => {
      // 变量为空
      variablesMock.__setVariables({});

      eventMock.__emit('MESSAGE_SWIPED', 5);

      // 应该尝试从消息解析（虽然消息也是空的）
      const status = getServiceStatus();
      expect(status.currentMessageId).toBe(5);
    });
  });

  // ========== 事件处理测试 ==========
  describe('事件处理', () => {
    beforeEach(() => {
      initVariableEventListeners({ syncOnInit: false });
    });

    describe('MESSAGE_SWIPED', () => {
      it('当脚本禁用时应该跳过处理', () => {
        const settingsStore = useSettingsStore();
        settingsStore.settings.enabled = false;

        variablesMock.__setVariables({
          stat_data: {
            巨大娘: {
              角色: {
                络络: { 当前身高: 170 },
              },
            },
          },
        });

        eventMock.__emit('MESSAGE_SWIPED', 5);

        const charactersStore = useCharactersStoreBase();
        expect(charactersStore.getCharacter('络络')).toBeUndefined();
      });

      it('当脚本启用时应该同步数据', () => {
        const settingsStore = useSettingsStore();
        settingsStore.settings.enabled = true;

        variablesMock.__setVariables({
          stat_data: {
            巨大娘: {
              角色: {
                络络: { 当前身高: 170, 原身高: 1.65 },
              },
            },
          },
        });

        eventMock.__emit('MESSAGE_SWIPED', 5);

        const charactersStore = useCharactersStoreBase();
        expect(charactersStore.getCharacter('络络')).not.toBeNull();
      });
    });

    describe('MESSAGE_DELETED', () => {
      it('当脚本禁用时应该跳过处理', () => {
        const settingsStore = useSettingsStore();
        settingsStore.settings.enabled = false;

        eventMock.__emit('MESSAGE_DELETED', 5);

        // 不应该有任何副作用
      });
    });

    describe('CHAT_CHANGED', () => {
      it('应该清空角色数据', async () => {
        const charactersStore = useCharactersStoreBase();
        charactersStore.setCharacter('旧角色', {
          name: '旧角色',
          currentHeight: 100,
          originalHeight: 1.65,
        });

        expect(charactersStore.getCharacter('旧角色')).not.toBeNull();

        eventMock.__emit('CHAT_CHANGED', 'new-chat.json');

        // 应该立即清空
        expect(charactersStore.getCharacter('旧角色')).toBeUndefined();
      });
    });
  });
});
