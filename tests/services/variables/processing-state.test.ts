/**
 * 处理状态追踪测试
 * 
 * 测试第三阶段的处理状态记录和检测功能
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { variablesMock } from '../../setup';
import {
  writeProcessingState,
  updateProcessingState,
  clearProcessingState,
} from '@/services/variables/writer';
import {
  _internal_readProcessingState,
} from '@/services/variables/reader';
import type { ProcessingState } from '@/types/variables';

// 辅助函数：从变量中提取处理状态
function getProcessingStateFromVariables(): ProcessingState | undefined {
  const variables = variablesMock.__getVariables() as Record<string, unknown>;
  const statData = variables?.stat_data as Record<string, unknown> | undefined;
  const giantess = statData?.巨大娘 as Record<string, unknown> | undefined;
  return giantess?._处理状态 as ProcessingState | undefined;
}

// 辅助函数：从变量中提取角色数据
function getCharacterFromVariables(name: string): unknown {
  const variables = variablesMock.__getVariables() as Record<string, unknown>;
  const statData = variables?.stat_data as Record<string, unknown> | undefined;
  const giantess = statData?.巨大娘 as Record<string, unknown> | undefined;
  const characters = giantess?.角色 as Record<string, unknown> | undefined;
  return characters?.[name];
}

describe('Service: variables - 处理状态追踪', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    variablesMock.__reset();
    // 每个测试前初始化空变量
    variablesMock.__setVariables({});
  });

  // ========== writeProcessingState ==========
  describe('writeProcessingState', () => {
    it('应该写入处理状态', () => {
      const state: ProcessingState = {
        最后处理消息ID: 10,
        最后处理时间: Date.now(),
        内容哈希: 'abc123',
        已处理角色: ['络络'],
      };

      writeProcessingState(state);

      const processingState = getProcessingStateFromVariables();
      
      expect(processingState).toBeDefined();
      expect(processingState?.最后处理消息ID).toBe(10);
      expect(processingState?.内容哈希).toBe('abc123');
      expect(processingState?.已处理角色).toContain('络络');
    });
  });

  // ========== updateProcessingState ==========
  describe('updateProcessingState', () => {
    it('应该部分更新处理状态', () => {
      // 先写入初始状态
      variablesMock.__setVariables({
        stat_data: {
          巨大娘: {
            _处理状态: {
              最后处理消息ID: 5,
              内容哈希: 'old-hash',
            },
          },
        },
      });

      // 部分更新
      updateProcessingState({
        最后处理消息ID: 10,
        最后处理时间: 12345,
      });

      const state = getProcessingStateFromVariables();
      
      expect(state?.最后处理消息ID).toBe(10);
      expect(state?.最后处理时间).toBe(12345);
      expect(state?.内容哈希).toBe('old-hash'); // 保留未更新的字段
    });

    it('空变量时应该创建新状态', () => {
      updateProcessingState({
        最后处理消息ID: 10,
      });

      const state = getProcessingStateFromVariables();
      
      expect(state).toBeDefined();
      expect(state?.最后处理消息ID).toBe(10);
    });
  });

  // ========== clearProcessingState ==========
  describe('clearProcessingState', () => {
    it('应该清除处理状态', () => {
      variablesMock.__setVariables({
        stat_data: {
          巨大娘: {
            _处理状态: {
              最后处理消息ID: 10,
            },
            角色: {
              络络: { 当前身高: 100 },
            },
          },
        },
      });

      clearProcessingState();

      const state = getProcessingStateFromVariables();
      expect(state).toBeUndefined();
      // 其他数据应该保留
      expect(getCharacterFromVariables('络络')).toBeDefined();
    });
  });

  // ========== _internal_readProcessingState ==========
  describe('_internal_readProcessingState', () => {
    it('存在数据时应该返回处理状态', () => {
      variablesMock.__setVariables({
        stat_data: {
          巨大娘: {
            _处理状态: {
              最后处理消息ID: 10,
              内容哈希: 'test-hash',
            },
          },
        },
      });

      const state = _internal_readProcessingState();
      
      expect(state).not.toBeNull();
      expect(state?.最后处理消息ID).toBe(10);
      expect(state?.内容哈希).toBe('test-hash');
    });

    it('无数据时应该返回 null', () => {
      const state = _internal_readProcessingState();
      
      expect(state).toBeNull();
    });

    it('有巨大娘数据但无处理状态时应该返回 null', () => {
      variablesMock.__setVariables({
        stat_data: {
          巨大娘: {
            角色: {
              络络: { 当前身高: 100 },
            },
          },
        },
      });

      const state = _internal_readProcessingState();
      
      expect(state).toBeNull();
    });
  });

  // ========== 集成场景 ==========
  describe('集成场景', () => {
    it('写入后应该能读取', () => {
      const state: ProcessingState = {
        最后处理消息ID: 15,
        最后处理时间: Date.now(),
        内容哈希: 'integration-test',
        已处理角色: ['角色A', '角色B'],
      };

      writeProcessingState(state);
      const readState = _internal_readProcessingState();

      expect(readState).toEqual(state);
    });

    it('更新后应该反映新值', () => {
      writeProcessingState({
        最后处理消息ID: 10,
        内容哈希: 'hash-1',
      });

      updateProcessingState({
        最后处理消息ID: 20,
        内容哈希: 'hash-2',
      });

      const state = _internal_readProcessingState();
      expect(state?.最后处理消息ID).toBe(20);
      expect(state?.内容哈希).toBe('hash-2');
    });

    it('清除后应该返回 null', () => {
      writeProcessingState({
        最后处理消息ID: 10,
      });

      clearProcessingState();
      const state = _internal_readProcessingState();

      expect(state).toBeNull();
    });
  });
});
