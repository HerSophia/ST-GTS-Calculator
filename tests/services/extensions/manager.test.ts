/**
 * 扩展管理器测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { extensionManager } from '@/services/extensions/manager';
import type { Extension, GiantessData, PromptContext, PromptTemplate } from '@/types';

// 创建测试用扩展
function createMockExtension(overrides: Partial<Extension> = {}): Extension {
  return {
    id: `test-extension-${Math.random().toString(36).substr(2, 9)}`,
    name: '测试扩展',
    description: '用于测试的扩展',
    icon: 'fa-test',
    defaultEnabled: false,
    ...overrides,
  };
}

describe('Service: extensions/manager', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // 注意：extensionManager 是单例，需要在测试间清理状态
    // 由于没有暴露 clear 方法，我们通过禁用所有扩展来重置
    for (const ext of extensionManager.getAll()) {
      if (extensionManager.isEnabled(ext.id)) {
        extensionManager.disable(ext.id);
      }
    }
  });

  // ========== register ==========
  describe('register', () => {
    it('应该成功注册新扩展', () => {
      const ext = createMockExtension({ id: 'new-ext-1' });
      
      extensionManager.register(ext);
      
      expect(extensionManager.get('new-ext-1')).toBeDefined();
      expect(extensionManager.get('new-ext-1')?.name).toBe('测试扩展');
    });

    it('注册时应该调用 onInit 钩子', () => {
      const onInit = vi.fn();
      const ext = createMockExtension({ id: 'init-hook-ext', onInit });
      
      extensionManager.register(ext);
      
      expect(onInit).toHaveBeenCalledTimes(1);
    });

    it('重复注册相同 ID 的扩展应该被忽略', () => {
      const ext1 = createMockExtension({ id: 'dup-ext', name: '扩展1' });
      const ext2 = createMockExtension({ id: 'dup-ext', name: '扩展2' });
      
      extensionManager.register(ext1);
      extensionManager.register(ext2);
      
      // 应该保持第一个注册的扩展
      expect(extensionManager.get('dup-ext')?.name).toBe('扩展1');
    });

    it('onInit 抛出错误不应该影响注册', () => {
      const ext = createMockExtension({
        id: 'error-init-ext',
        onInit: () => { throw new Error('Init failed'); },
      });
      
      // 不应该抛出错误
      expect(() => extensionManager.register(ext)).not.toThrow();
      
      // 扩展仍然应该被注册
      expect(extensionManager.get('error-init-ext')).toBeDefined();
    });
  });

  // ========== get / getAll ==========
  describe('get / getAll', () => {
    it('get 应该返回指定 ID 的扩展', () => {
      const ext = createMockExtension({ id: 'get-test-ext' });
      extensionManager.register(ext);
      
      const result = extensionManager.get('get-test-ext');
      
      expect(result).toBe(ext);
    });

    it('get 不存在的扩展应该返回 undefined', () => {
      const result = extensionManager.get('non-existent-ext');
      
      expect(result).toBeUndefined();
    });

    it('getAll 应该返回所有注册的扩展', () => {
      const initialCount = extensionManager.getAll().length;
      
      extensionManager.register(createMockExtension({ id: 'all-1' }));
      extensionManager.register(createMockExtension({ id: 'all-2' }));
      
      const all = extensionManager.getAll();
      
      expect(all.length).toBe(initialCount + 2);
    });
  });

  // ========== enable / disable ==========
  describe('enable / disable', () => {
    it('enable 应该启用扩展', () => {
      const ext = createMockExtension({ id: 'enable-test' });
      extensionManager.register(ext);
      
      extensionManager.enable('enable-test');
      
      expect(extensionManager.isEnabled('enable-test')).toBe(true);
    });

    it('enable 应该调用 onEnable 钩子', () => {
      const onEnable = vi.fn();
      const ext = createMockExtension({ id: 'enable-hook', onEnable });
      extensionManager.register(ext);
      
      extensionManager.enable('enable-hook');
      
      expect(onEnable).toHaveBeenCalledTimes(1);
    });

    it('disable 应该禁用扩展', () => {
      const ext = createMockExtension({ id: 'disable-test' });
      extensionManager.register(ext);
      extensionManager.enable('disable-test');
      
      extensionManager.disable('disable-test');
      
      expect(extensionManager.isEnabled('disable-test')).toBe(false);
    });

    it('disable 应该调用 onDisable 钩子', () => {
      const onDisable = vi.fn();
      const ext = createMockExtension({ id: 'disable-hook', onDisable });
      extensionManager.register(ext);
      extensionManager.enable('disable-hook');
      
      extensionManager.disable('disable-hook');
      
      expect(onDisable).toHaveBeenCalledTimes(1);
    });

    it('重复启用已启用的扩展不应该重复调用钩子', () => {
      const onEnable = vi.fn();
      const ext = createMockExtension({ id: 'double-enable', onEnable });
      extensionManager.register(ext);
      
      extensionManager.enable('double-enable');
      extensionManager.enable('double-enable');
      
      expect(onEnable).toHaveBeenCalledTimes(1);
    });

    it('禁用未启用的扩展不应该调用钩子', () => {
      const onDisable = vi.fn();
      const ext = createMockExtension({ id: 'no-disable', onDisable });
      extensionManager.register(ext);
      
      extensionManager.disable('no-disable');
      
      expect(onDisable).not.toHaveBeenCalled();
    });

    it('启用不存在的扩展不应该抛出错误', () => {
      expect(() => extensionManager.enable('non-existent')).not.toThrow();
    });

    it('onEnable 抛出错误应该回滚启用状态', () => {
      const ext = createMockExtension({
        id: 'error-enable',
        onEnable: () => { throw new Error('Enable failed'); },
      });
      extensionManager.register(ext);
      
      extensionManager.enable('error-enable');
      
      // 启用应该被回滚
      expect(extensionManager.isEnabled('error-enable')).toBe(false);
    });
  });

  // ========== 依赖管理 ==========
  describe('依赖管理', () => {
    it('启用有依赖的扩展时，依赖必须先启用', () => {
      const baseExt = createMockExtension({ id: 'base-ext' });
      const dependentExt = createMockExtension({
        id: 'dependent-ext',
        dependencies: ['base-ext'],
      });
      extensionManager.register(baseExt);
      extensionManager.register(dependentExt);
      
      // 未启用依赖时启用依赖方
      extensionManager.enable('dependent-ext');
      
      expect(extensionManager.isEnabled('dependent-ext')).toBe(false);
    });

    it('依赖已启用时可以启用依赖方', () => {
      const baseExt = createMockExtension({ id: 'base-ext-2' });
      const dependentExt = createMockExtension({
        id: 'dependent-ext-2',
        dependencies: ['base-ext-2'],
      });
      extensionManager.register(baseExt);
      extensionManager.register(dependentExt);
      
      extensionManager.enable('base-ext-2');
      extensionManager.enable('dependent-ext-2');
      
      expect(extensionManager.isEnabled('dependent-ext-2')).toBe(true);
    });

    it('禁用被依赖的扩展应该被阻止', () => {
      const baseExt = createMockExtension({ id: 'base-ext-3' });
      const dependentExt = createMockExtension({
        id: 'dependent-ext-3',
        dependencies: ['base-ext-3'],
      });
      extensionManager.register(baseExt);
      extensionManager.register(dependentExt);
      extensionManager.enable('base-ext-3');
      extensionManager.enable('dependent-ext-3');
      
      // 尝试禁用被依赖的扩展
      extensionManager.disable('base-ext-3');
      
      // 应该仍然启用
      expect(extensionManager.isEnabled('base-ext-3')).toBe(true);
    });
  });

  // ========== toggle ==========
  describe('toggle', () => {
    it('toggle 应该切换扩展状态', () => {
      const ext = createMockExtension({ id: 'toggle-test' });
      extensionManager.register(ext);
      
      const result1 = extensionManager.toggle('toggle-test');
      expect(result1).toBe(true);
      expect(extensionManager.isEnabled('toggle-test')).toBe(true);
      
      const result2 = extensionManager.toggle('toggle-test');
      expect(result2).toBe(false);
      expect(extensionManager.isEnabled('toggle-test')).toBe(false);
    });
  });

  // ========== getEnabled ==========
  describe('getEnabled', () => {
    it('应该只返回已启用的扩展', () => {
      const ext1 = createMockExtension({ id: 'enabled-1' });
      const ext2 = createMockExtension({ id: 'disabled-1' });
      extensionManager.register(ext1);
      extensionManager.register(ext2);
      extensionManager.enable('enabled-1');
      
      const enabled = extensionManager.getEnabled();
      
      expect(enabled.some(e => e.id === 'enabled-1')).toBe(true);
      expect(enabled.some(e => e.id === 'disabled-1')).toBe(false);
    });
  });

  // ========== 钩子触发 ==========
  describe('triggerCharacterUpdate', () => {
    it('应该调用所有已启用扩展的 onCharacterUpdate', () => {
      const onCharacterUpdate1 = vi.fn().mockReturnValue({ extra1: 'data1' });
      const onCharacterUpdate2 = vi.fn().mockReturnValue({ extra2: 'data2' });
      
      extensionManager.register(createMockExtension({
        id: 'char-update-1',
        onCharacterUpdate: onCharacterUpdate1,
      }));
      extensionManager.register(createMockExtension({
        id: 'char-update-2',
        onCharacterUpdate: onCharacterUpdate2,
      }));
      extensionManager.enable('char-update-1');
      extensionManager.enable('char-update-2');
      
      const mockCharacter = { name: 'test', currentHeight: 170, originalHeight: 1.65 };
      const mockCalcData = { 当前身高: 170, 倍率: 100 } as unknown as GiantessData;
      
      const result = extensionManager.triggerCharacterUpdate(mockCharacter, mockCalcData);
      
      expect(onCharacterUpdate1).toHaveBeenCalledWith(mockCharacter, mockCalcData);
      expect(onCharacterUpdate2).toHaveBeenCalledWith(mockCharacter, mockCalcData);
      expect(result.extra1).toBe('data1');
      expect(result.extra2).toBe('data2');
    });

    it('不应该调用禁用扩展的钩子', () => {
      const onCharacterUpdate = vi.fn();
      extensionManager.register(createMockExtension({
        id: 'disabled-char-update',
        onCharacterUpdate,
      }));
      // 不启用
      
      const mockCharacter = { name: 'test', currentHeight: 170, originalHeight: 1.65 };
      const mockCalcData = {} as GiantessData;
      
      extensionManager.triggerCharacterUpdate(mockCharacter, mockCalcData);
      
      expect(onCharacterUpdate).not.toHaveBeenCalled();
    });

    it('钩子抛出错误不应该影响其他钩子', () => {
      const onCharacterUpdate1 = vi.fn().mockImplementation(() => {
        throw new Error('Hook error');
      });
      const onCharacterUpdate2 = vi.fn().mockReturnValue({ data: 'ok' });
      
      extensionManager.register(createMockExtension({
        id: 'error-hook-1',
        onCharacterUpdate: onCharacterUpdate1,
      }));
      extensionManager.register(createMockExtension({
        id: 'error-hook-2',
        onCharacterUpdate: onCharacterUpdate2,
      }));
      extensionManager.enable('error-hook-1');
      extensionManager.enable('error-hook-2');
      
      const mockCharacter = { name: 'test', currentHeight: 170, originalHeight: 1.65 };
      const mockCalcData = {} as GiantessData;
      
      const result = extensionManager.triggerCharacterUpdate(mockCharacter, mockCalcData);
      
      // 第二个钩子仍然应该被调用
      expect(onCharacterUpdate2).toHaveBeenCalled();
      expect(result.data).toBe('ok');
    });
  });

  describe('triggerBeforePromptInject', () => {
    it('应该链式调用所有钩子并传递修改后的上下文', () => {
      const hook1 = vi.fn((ctx: PromptContext) => ({
        ...ctx,
        角色名: ctx.角色名 + '_1',
      }));
      const hook2 = vi.fn((ctx: PromptContext) => ({
        ...ctx,
        角色名: ctx.角色名 + '_2',
      }));
      
      extensionManager.register(createMockExtension({
        id: 'prompt-hook-1',
        onBeforePromptInject: hook1,
      }));
      extensionManager.register(createMockExtension({
        id: 'prompt-hook-2',
        onBeforePromptInject: hook2,
      }));
      extensionManager.enable('prompt-hook-1');
      extensionManager.enable('prompt-hook-2');
      
      const initialContext = { 角色名: 'test' } as PromptContext;
      
      const result = extensionManager.triggerBeforePromptInject(initialContext);
      
      // 应该按顺序链式调用
      expect(result.角色名).toBe('test_1_2');
    });
  });

  describe('triggerAfterPromptInject', () => {
    it('应该调用所有已启用扩展的钩子', () => {
      const hook1 = vi.fn();
      const hook2 = vi.fn();
      
      extensionManager.register(createMockExtension({
        id: 'after-prompt-1',
        onAfterPromptInject: hook1,
      }));
      extensionManager.register(createMockExtension({
        id: 'after-prompt-2',
        onAfterPromptInject: hook2,
      }));
      extensionManager.enable('after-prompt-1');
      extensionManager.enable('after-prompt-2');
      
      extensionManager.triggerAfterPromptInject('prompt-123');
      
      expect(hook1).toHaveBeenCalledWith('prompt-123');
      expect(hook2).toHaveBeenCalledWith('prompt-123');
    });
  });

  // ========== 内容收集 ==========
  describe('collectPromptTemplates', () => {
    it('应该收集所有已启用扩展的提示词模板', () => {
      const templates1: PromptTemplate[] = [
        { id: 't1', name: '模板1', description: '测试模板1', type: 'header', content: '', enabled: true, order: 1, builtin: false },
      ];
      const templates2: PromptTemplate[] = [
        { id: 't2', name: '模板2', description: '测试模板2', type: 'footer', content: '', enabled: true, order: 2, builtin: false },
      ];
      
      extensionManager.register(createMockExtension({
        id: 'template-ext-1',
        getPromptTemplates: () => templates1,
      }));
      extensionManager.register(createMockExtension({
        id: 'template-ext-2',
        getPromptTemplates: () => templates2,
      }));
      extensionManager.enable('template-ext-1');
      extensionManager.enable('template-ext-2');
      
      const collected = extensionManager.collectPromptTemplates();
      
      expect(collected).toContainEqual(expect.objectContaining({ id: 't1' }));
      expect(collected).toContainEqual(expect.objectContaining({ id: 't2' }));
    });

    it('不应该收集禁用扩展的模板', () => {
      const templates: PromptTemplate[] = [
        { id: 't-disabled', name: '模板', description: '禁用模板', type: 'header', content: '', enabled: true, order: 1, builtin: false },
      ];
      
      extensionManager.register(createMockExtension({
        id: 'disabled-template-ext',
        getPromptTemplates: () => templates,
      }));
      // 不启用
      
      const collected = extensionManager.collectPromptTemplates();
      
      expect(collected).not.toContainEqual(expect.objectContaining({ id: 't-disabled' }));
    });
  });

  describe('collectSettingsComponents', () => {
    it('应该收集所有已启用扩展的设置组件', () => {
      const mockComponent1 = { template: '<div>Settings 1</div>' };
      const mockComponent2 = { template: '<div>Settings 2</div>' };
      
      extensionManager.register(createMockExtension({
        id: 'settings-ext-1',
        getSettingsComponent: () => mockComponent1 as never,
      }));
      extensionManager.register(createMockExtension({
        id: 'settings-ext-2',
        getSettingsComponent: () => mockComponent2 as never,
      }));
      extensionManager.enable('settings-ext-1');
      extensionManager.enable('settings-ext-2');
      
      const collected = extensionManager.collectSettingsComponents();
      
      expect(collected.size).toBe(2);
      expect(collected.get('settings-ext-1')).toBe(mockComponent1);
      expect(collected.get('settings-ext-2')).toBe(mockComponent2);
    });

    it('不应该收集禁用扩展的设置组件', () => {
      const mockComponent = { template: '<div>Settings</div>' };
      
      extensionManager.register(createMockExtension({
        id: 'disabled-settings-ext',
        getSettingsComponent: () => mockComponent as never,
      }));
      // 不启用
      
      const collected = extensionManager.collectSettingsComponents();
      
      expect(collected.has('disabled-settings-ext')).toBe(false);
    });

    it('钩子抛出错误不应该影响其他扩展', () => {
      const mockComponent = { template: '<div>Settings</div>' };
      
      extensionManager.register(createMockExtension({
        id: 'error-settings-ext',
        getSettingsComponent: () => { throw new Error('Settings error'); },
      }));
      extensionManager.register(createMockExtension({
        id: 'ok-settings-ext',
        getSettingsComponent: () => mockComponent as never,
      }));
      extensionManager.enable('error-settings-ext');
      extensionManager.enable('ok-settings-ext');
      
      const collected = extensionManager.collectSettingsComponents();
      
      // 错误的扩展不会添加，但正常的扩展应该被收集
      expect(collected.has('error-settings-ext')).toBe(false);
      expect(collected.get('ok-settings-ext')).toBe(mockComponent);
    });
  });

  describe('collectCharacterCardExtras', () => {
    it('应该收集所有已启用扩展的角色卡片额外内容', () => {
      const mockComponent1 = { template: '<div>Card Extra 1</div>' };
      const mockComponent2 = { template: '<div>Card Extra 2</div>' };
      
      extensionManager.register(createMockExtension({
        id: 'card-ext-1',
        getCharacterCardExtra: () => mockComponent1 as never,
      }));
      extensionManager.register(createMockExtension({
        id: 'card-ext-2',
        getCharacterCardExtra: () => mockComponent2 as never,
      }));
      extensionManager.enable('card-ext-1');
      extensionManager.enable('card-ext-2');
      
      const collected = extensionManager.collectCharacterCardExtras();
      
      expect(collected.size).toBe(2);
      expect(collected.get('card-ext-1')).toBe(mockComponent1);
      expect(collected.get('card-ext-2')).toBe(mockComponent2);
    });

    it('不应该收集禁用扩展的内容', () => {
      const mockComponent = { template: '<div>Card Extra</div>' };
      
      extensionManager.register(createMockExtension({
        id: 'disabled-card-ext',
        getCharacterCardExtra: () => mockComponent as never,
      }));
      // 不启用
      
      const collected = extensionManager.collectCharacterCardExtras();
      
      expect(collected.has('disabled-card-ext')).toBe(false);
    });

    it('钩子抛出错误不应该影响其他扩展', () => {
      const mockComponent = { template: '<div>Card Extra</div>' };
      
      extensionManager.register(createMockExtension({
        id: 'error-card-ext',
        getCharacterCardExtra: () => { throw new Error('Card error'); },
      }));
      extensionManager.register(createMockExtension({
        id: 'ok-card-ext',
        getCharacterCardExtra: () => mockComponent as never,
      }));
      extensionManager.enable('error-card-ext');
      extensionManager.enable('ok-card-ext');
      
      const collected = extensionManager.collectCharacterCardExtras();
      
      expect(collected.has('error-card-ext')).toBe(false);
      expect(collected.get('ok-card-ext')).toBe(mockComponent);
    });
  });

  describe('collectDebugPanelExtras', () => {
    it('应该收集所有已启用扩展的调试面板内容', () => {
      const mockComponent1 = { template: '<div>Debug 1</div>' };
      const mockComponent2 = { template: '<div>Debug 2</div>' };
      
      extensionManager.register(createMockExtension({
        id: 'debug-ext-1',
        getDebugPanelExtra: () => mockComponent1 as never,
      }));
      extensionManager.register(createMockExtension({
        id: 'debug-ext-2',
        getDebugPanelExtra: () => mockComponent2 as never,
      }));
      extensionManager.enable('debug-ext-1');
      extensionManager.enable('debug-ext-2');
      
      const collected = extensionManager.collectDebugPanelExtras();
      
      expect(collected.size).toBe(2);
      expect(collected.get('debug-ext-1')).toBe(mockComponent1);
      expect(collected.get('debug-ext-2')).toBe(mockComponent2);
    });

    it('不应该收集禁用扩展的内容', () => {
      const mockComponent = { template: '<div>Debug</div>' };
      
      extensionManager.register(createMockExtension({
        id: 'disabled-debug-ext',
        getDebugPanelExtra: () => mockComponent as never,
      }));
      // 不启用
      
      const collected = extensionManager.collectDebugPanelExtras();
      
      expect(collected.has('disabled-debug-ext')).toBe(false);
    });

    it('钩子抛出错误不应该影响其他扩展', () => {
      const mockComponent = { template: '<div>Debug</div>' };
      
      extensionManager.register(createMockExtension({
        id: 'error-debug-ext',
        getDebugPanelExtra: () => { throw new Error('Debug error'); },
      }));
      extensionManager.register(createMockExtension({
        id: 'ok-debug-ext',
        getDebugPanelExtra: () => mockComponent as never,
      }));
      extensionManager.enable('error-debug-ext');
      extensionManager.enable('ok-debug-ext');
      
      const collected = extensionManager.collectDebugPanelExtras();
      
      expect(collected.has('error-debug-ext')).toBe(false);
      expect(collected.get('ok-debug-ext')).toBe(mockComponent);
    });
  });

  // ========== 状态管理 ==========
  describe('getEnabledIds / restoreEnabledIds', () => {
    it('getEnabledIds 应该返回所有已启用扩展的 ID', () => {
      extensionManager.register(createMockExtension({ id: 'state-1' }));
      extensionManager.register(createMockExtension({ id: 'state-2' }));
      extensionManager.register(createMockExtension({ id: 'state-3' }));
      extensionManager.enable('state-1');
      extensionManager.enable('state-3');
      
      const enabledIds = extensionManager.getEnabledIds();
      
      expect(enabledIds).toContain('state-1');
      expect(enabledIds).toContain('state-3');
      expect(enabledIds).not.toContain('state-2');
    });

    it('restoreEnabledIds 应该恢复启用状态', () => {
      extensionManager.register(createMockExtension({ id: 'restore-1' }));
      extensionManager.register(createMockExtension({ id: 'restore-2' }));
      
      extensionManager.restoreEnabledIds(['restore-1', 'restore-2']);
      
      expect(extensionManager.isEnabled('restore-1')).toBe(true);
      expect(extensionManager.isEnabled('restore-2')).toBe(true);
    });

    it('restoreEnabledIds 应该忽略不存在的扩展', () => {
      extensionManager.register(createMockExtension({ id: 'restore-exist' }));
      
      // 不应该抛出错误
      expect(() => {
        extensionManager.restoreEnabledIds(['restore-exist', 'non-existent']);
      }).not.toThrow();
      
      expect(extensionManager.isEnabled('restore-exist')).toBe(true);
    });
  });

  // ========== initDefaults ==========
  describe('initDefaults', () => {
    it('应该启用 defaultEnabled 为 true 的扩展', () => {
      extensionManager.register(createMockExtension({
        id: 'default-enabled',
        defaultEnabled: true,
      }));
      extensionManager.register(createMockExtension({
        id: 'default-disabled',
        defaultEnabled: false,
      }));
      
      extensionManager.initDefaults();
      
      expect(extensionManager.isEnabled('default-enabled')).toBe(true);
      expect(extensionManager.isEnabled('default-disabled')).toBe(false);
    });
  });

  // ========== getExtensionInfo / getAllExtensionInfo ==========
  describe('getExtensionInfo', () => {
    it('应该返回扩展的完整信息', () => {
      extensionManager.register(createMockExtension({ id: 'info-test' }));
      extensionManager.enable('info-test');
      
      const info = extensionManager.getExtensionInfo('info-test');
      
      expect(info).not.toBeNull();
      expect(info!.extension.id).toBe('info-test');
      expect(info!.enabled).toBe(true);
      expect(info!.canDisable).toBe(true);
    });

    it('当有其他扩展依赖时 canDisable 应该为 false', () => {
      extensionManager.register(createMockExtension({ id: 'base-info' }));
      extensionManager.register(createMockExtension({
        id: 'dependent-info',
        dependencies: ['base-info'],
      }));
      extensionManager.enable('base-info');
      extensionManager.enable('dependent-info');
      
      const info = extensionManager.getExtensionInfo('base-info');
      
      expect(info!.canDisable).toBe(false);
    });

    it('不存在的扩展应该返回 null', () => {
      const info = extensionManager.getExtensionInfo('non-existent-info');
      
      expect(info).toBeNull();
    });
  });

  describe('getAllExtensionInfo', () => {
    it('应该返回所有扩展的信息', () => {
      const initialCount = extensionManager.getAllExtensionInfo().length;
      
      extensionManager.register(createMockExtension({ id: 'all-info-1' }));
      extensionManager.register(createMockExtension({ id: 'all-info-2' }));
      
      const allInfo = extensionManager.getAllExtensionInfo();
      
      expect(allInfo.length).toBe(initialCount + 2);
    });
  });
});
