/**
 * 巨大娘计算器 - 事件处理服务
 * 
 * 职责：
 * - 监听酒馆原生事件
 * - 触发变量同步
 * - 替代 MVU 事件机制
 * 
 * 数据处理策略：
 * - 新消息（GENERATION_ENDED）：始终解析消息中的命令
 * - 已有消息（SWIPED, INIT）：变量优先，已有数据则直接同步
 * - 编辑消息（MESSAGE_EDITED）：强制解析消息
 * 
 * @module services/variables/event-handler
 */

import type { EventHandlerConfig, VariableServiceStatus } from '../../types/variables';
import { useSettingsStore } from '../../stores/settings';
import { useCharactersStoreBase } from '../../stores/characters';
import {
  reinjectPromptsIfNeeded,
  fullDataProcess,
  syncVariablesToStore,
} from './sync';
import {
  extractAndApplyUpdates,
  hasUpdateCommands,
  getAffectedCharacters,
  parseAllUpdateCommands,
  filterChangedUpdates,
  applyParsedUpdates,
  hashContent,
} from './parser';
import {
  _internal_readGiantessData,
  _internal_extractCharacters,
  _internal_readProcessingState,
} from './reader';
import {
  updateProcessingState,
} from './writer';

// 事件监听器停止函数
let stopListeners: Array<{ stop: () => void }> = [];

/**
 * 处理选项
 */
interface ProcessOptions {
  /** 强制解析消息（编辑场景） */
  forceParseMessage?: boolean;
  /** 是否为新消息（LLM 响应） */
  isNewMessage?: boolean;
  /** 使用值比较过滤（编辑场景优化） */
  useValueComparison?: boolean;
}

// 服务状态
const serviceStatus: VariableServiceStatus = {
  initialized: false,
  lastSyncTime: null,
  listenerCount: 0,
  currentMessageId: null,
};

// 防抖同步函数
let debouncedSync: (() => void) | null = null;

/**
 * 检查变量中是否有有效的角色数据
 * 
 * @param messageId 消息 ID
 * @returns 是否有有效数据
 */
function hasValidCharacterData(messageId: number | 'latest'): boolean {
  try {
    const existingData = _internal_readGiantessData({ messageId });
    if (!existingData) return false;
    
    const characters = _internal_extractCharacters(existingData);
    const characterCount = Object.keys(characters).length;
    
    if (characterCount === 0) return false;
    
    // 检查是否至少有一个角色有有效的身高数据
    for (const charData of Object.values(characters)) {
      const currentHeight = charData.当前身高 || charData.身高;
      if (currentHeight && currentHeight > 0) {
        return true;
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * 检查消息是否已被处理（通过处理状态）
 * 
 * @param messageId 消息 ID
 * @param contentHash 内容哈希（可选）
 * @returns 是否已处理
 */
function isMessageAlreadyProcessed(
  messageId: number | 'latest',
  contentHash?: string
): boolean {
  const processingState = _internal_readProcessingState({ messageId });
  
  if (!processingState) return false;
  
  // 检查是否是同一个消息
  if (processingState.最后处理消息ID !== messageId) return false;
  
  // 如果提供了内容哈希，检查内容是否变化
  if (contentHash && processingState.内容哈希 !== contentHash) {
    return false; // 内容已变化，需要重新处理
  }
  
  return true;
}

/**
 * 从消息解析并处理数据
 * 
 * 统一的数据处理流程，支持变量优先策略和处理状态追踪：
 * 
 * 1. 判断是否需要解析消息：
 *    - 强制解析（编辑场景）→ 解析（使用值比较优化）
 *    - 新消息（LLM 响应）→ 解析
 *    - 变量中无数据 → 解析
 *    - 变量中有数据 → 跳过解析，直接同步
 * 
 * 2. 如果需要解析：
 *    - 获取消息内容
 *    - 解析变量更新命令
 *    - 编辑场景：使用值比较过滤未变化的更新
 *    - 写入变量
 *    - 记录处理状态
 * 
 * 3. 执行完整数据处理流程
 * 
 * @param messageId 消息 ID
 * @param options 处理选项
 * @returns 同步结果
 */
function parseAndProcessMessage(
  messageId: number | 'latest',
  options: ProcessOptions = {}
): { success: boolean; characterCount: number } {
  const { 
    forceParseMessage = false, 
    isNewMessage = false,
    useValueComparison = false,
  } = options;
  const settingsStore = useSettingsStore();
  
  settingsStore.debugLog(`📋 开始处理数据 (messageId: ${messageId})`, {
    forceParseMessage,
    isNewMessage,
    useValueComparison,
  });
  
  // 1. 判断是否需要解析消息
  const hasExistingData = hasValidCharacterData(messageId);
  const shouldParseMessage = forceParseMessage || isNewMessage || !hasExistingData;
  
  settingsStore.debugLog(`📊 数据状态检查`, {
    hasExistingData,
    shouldParseMessage,
    reason: forceParseMessage ? '强制解析' 
      : isNewMessage ? '新消息' 
      : !hasExistingData ? '变量无数据' 
      : '变量优先',
  });
  
  // 2. 如果变量中已有数据且不需要强制解析，直接同步到 Store
  if (!shouldParseMessage) {
    settingsStore.debugLog('📦 使用变量中的现有数据，跳过消息解析');
    
    // 直接同步变量到 Store
    const syncResult = syncVariablesToStore({ messageId });
    
    // 重新注入提示词
    if (syncResult.characterCount > 0) {
      reinjectPromptsIfNeeded();
    }
    
    return syncResult;
  }
  
  // 3. 需要解析消息
  settingsStore.debugLog('📝 准备解析消息内容...');
  
  let messageContent: string | null = null;
  
  if (messageId === 'latest') {
    // 获取最新消息的 ID
    try {
      const messages = getChatMessages(-1); // 获取最后一条消息
      if (messages && messages.length > 0) {
        messageContent = messages[0].message || null;
      }
    } catch (error) {
      settingsStore.debugLog('⚠️ 获取最新消息失败，尝试其他方式');
    }
  } else {
    messageContent = getMessageContent(messageId);
  }
  
  // 4. 解析并应用变量更新命令
  let appliedCount = 0;
  let contentHash: string | undefined;
  
  if (messageContent && hasUpdateCommands(messageContent)) {
    settingsStore.debugLog('📝 检测到变量更新命令');
    
    // 计算内容哈希
    contentHash = hashContent(messageContent);
    
    // 检查是否已处理过（基于处理状态）
    if (!forceParseMessage && isMessageAlreadyProcessed(messageId, contentHash)) {
      settingsStore.debugLog('⏭️ 消息已处理过且内容未变，跳过解析');
      return fullDataProcess({ messageId });
    }
    
    const updates = parseAllUpdateCommands(messageContent);
    const affectedCharacters = getAffectedCharacters(updates);
    
    settingsStore.debugLog(`🔍 解析到 ${updates.length} 个更新命令`);
    if (affectedCharacters.length > 0) {
      settingsStore.debugLog(`📝 影响的角色: ${affectedCharacters.join(', ')}`);
    }
    
    // 编辑场景：使用值比较过滤未变化的更新
    if (useValueComparison && updates.length > 0) {
      const changedUpdates = filterChangedUpdates(updates, { messageId });
      
      if (changedUpdates.length === 0) {
        settingsStore.debugLog('⏭️ 所有更新值与现有值相同，跳过应用');
      } else {
        settingsStore.debugLog(`📊 过滤后需要应用 ${changedUpdates.length}/${updates.length} 个更新`);
        appliedCount = applyParsedUpdates(changedUpdates, { messageId });
      }
    } else {
      // 正常应用所有更新
      extractAndApplyUpdates(messageContent, { messageId });
      appliedCount = updates.length;
    }
    
    // 记录处理状态
    if (appliedCount > 0 || isNewMessage) {
      updateProcessingState({
        最后处理消息ID: messageId,
        最后处理时间: Date.now(),
        内容哈希: contentHash,
        已处理角色: affectedCharacters,
      }, { messageId });
    }
  } else {
    settingsStore.debugLog('📋 消息中没有变量更新命令');
  }
  
  // 5. 执行完整数据处理流程（计算 → 同步 → 注入提示词）
  return fullDataProcess({ messageId });
}

/**
 * 获取消息内容
 * 使用酒馆助手的 getChatMessages API 获取当前选中分支的消息内容
 * 
 * @param messageId 消息 ID
 * @returns 消息内容，如果获取失败则返回 null
 */
function getMessageContent(messageId: number): string | null {
  try {
    // 使用 getChatMessages API 获取当前选中分支的消息
    // 不使用 include_swipes，这样会返回当前选中的分支内容
    const messages = getChatMessages(messageId);
    if (messages && messages.length > 0) {
      return messages[0].message || null;
    }
  } catch (error) {
    console.warn('[GiantessCalc] 获取消息内容失败:', error);
  }
  return null;
}

/**
 * 处理消息分支切换事件
 * 
 * 使用变量优先策略：如果变量中已有数据，直接同步，不重新解析消息
 * 
 * @param messageId 消息 ID
 */
function handleMessageSwiped(messageId: number): void {
  const settingsStore = useSettingsStore();
  
  if (!settingsStore.settings.enabled) return;
  
  console.log(`[GiantessCalc] 📄 消息分支切换: ${messageId}`);
  settingsStore.debugLog(`📄 消息分支切换: ${messageId}`);
  
  serviceStatus.currentMessageId = messageId;
  
  // 变量优先：如果变量中已有数据，直接同步
  const result = parseAndProcessMessage(messageId);
  
  console.log(`[GiantessCalc] 📄 处理结果:`, result);
  
  serviceStatus.lastSyncTime = Date.now();
}

/**
 * 处理消息编辑完成事件
 * 
 * 强制解析消息：用户可能添加了新的更新命令
 * 使用值比较优化：只应用有变化的更新
 * 
 * @param messageId 消息 ID
 */
function handleMessageEdited(messageId: number): void {
  const settingsStore = useSettingsStore();
  
  if (!settingsStore.settings.enabled) return;
  
  console.log(`[GiantessCalc] ✏️ 消息编辑完成: ${messageId}`);
  settingsStore.debugLog(`✏️ 消息编辑完成: ${messageId}`);
  
  serviceStatus.currentMessageId = messageId;
  
  // 强制解析 + 值比较：只应用有变化的更新
  parseAndProcessMessage(messageId, { 
    forceParseMessage: true,
    useValueComparison: true,
  });
  
  serviceStatus.lastSyncTime = Date.now();
}

/**
 * 处理消息更新事件
 * 
 * 使用防抖机制从消息解析数据并处理
 * 
 * @param messageId 消息 ID
 */
function handleMessageUpdated(messageId: number): void {
  const settingsStore = useSettingsStore();
  
  if (!settingsStore.settings.enabled) return;
  
  // 使用防抖避免频繁触发
  if (debouncedSync) {
    debouncedSync();
  } else {
    parseAndProcessMessage(messageId);
  }
  
  serviceStatus.currentMessageId = messageId;
  serviceStatus.lastSyncTime = Date.now();
}

/**
 * 处理消息删除事件
 * 
 * 从最新消息解析数据并处理
 * 
 * @param messageId 消息 ID
 */
function handleMessageDeleted(messageId: number): void {
  const settingsStore = useSettingsStore();
  
  if (!settingsStore.settings.enabled) return;
  
  console.log(`[GiantessCalc] 🗑️ 消息删除: ${messageId}`);
  settingsStore.debugLog(`🗑️ 消息删除: ${messageId}`);
  
  // 从最新消息解析数据并处理
  parseAndProcessMessage('latest');
  
  serviceStatus.lastSyncTime = Date.now();
}

/**
 * 处理 LLM 生成完成事件
 * 
 * 始终解析消息：这是新生成的消息，必须解析其中的命令
 * 
 * @param messageId 消息 ID
 */
function handleGenerationEnded(messageId: number): void {
  const settingsStore = useSettingsStore();
  
  if (!settingsStore.settings.enabled) return;
  
  console.log(`[GiantessCalc] 🤖 LLM 生成完成: ${messageId}`);
  settingsStore.debugLog(`🤖 LLM 生成完成: ${messageId}`);
  
  serviceStatus.currentMessageId = messageId;
  
  // 新消息：必须解析其中的更新命令
  parseAndProcessMessage(messageId, { isNewMessage: true });
  
  serviceStatus.lastSyncTime = Date.now();
}

/**
 * 处理聊天切换事件
 * 
 * 清空状态，从最新消息解析数据
 * 
 * @param chatFileName 聊天文件名
 */
function handleChatChanged(chatFileName: string): void {
  const settingsStore = useSettingsStore();
  const charactersStore = useCharactersStoreBase();
  
  console.log(`[GiantessCalc] 📂 聊天切换: ${chatFileName}`);
  settingsStore.debugLog(`📂 聊天切换: ${chatFileName}`);
  
  // 清空当前状态（包括消息 ID，确保完全隔离）
  charactersStore.clearAll();
  serviceStatus.currentMessageId = null;
  
  if (!settingsStore.settings.enabled) return;
  
  // 延迟加载新聊天的数据（确保聊天完全加载）
  setTimeout(() => {
    parseAndProcessMessage('latest');
    serviceStatus.lastSyncTime = Date.now();
  }, 100);
}

/**
 * 处理生成前事件
 * 确保在每次生成前都注入最新的提示词
 */
function handleBeforeGeneration(): void {
  const settingsStore = useSettingsStore();
  
  if (!settingsStore.settings.enabled || !settingsStore.settings.autoInject) {
    return;
  }
  
  console.log(`[GiantessCalc] ⚡ 生成前检查提示词注入...`);
  settingsStore.debugLog('⚡ 生成前检查提示词注入...');
  
  // 重新注入提示词
  reinjectPromptsIfNeeded({ messageId: 'latest' });
}

/**
 * 初始化事件监听
 * 替代原来的 initMvuIntegration()
 * 
 * @param config 配置选项
 */
export function initVariableEventListeners(config: EventHandlerConfig = {}): void {
  const {
    debounce = true,
    debounceDelay = 100,
    syncOnInit = true,
  } = config;
  
  const settingsStore = useSettingsStore();
  
  console.log('[GiantessCalc] 🚀 初始化变量事件监听...');
  settingsStore.debugLog('🚀 初始化变量事件监听...');
  
  // 清理之前的监听器
  cleanupEventListeners();
  
  // 创建防抖函数（从消息解析数据并处理）
  if (debounce) {
    debouncedSync = _.debounce(() => {
      parseAndProcessMessage('latest');
    }, debounceDelay);
  }
  
  try {
    // 1. 消息分支切换
    const swipeListener = eventOn(
      tavern_events.MESSAGE_SWIPED,
      handleMessageSwiped
    );
    stopListeners.push(swipeListener);
    settingsStore.debugLog('✅ 已监听 MESSAGE_SWIPED');
    
    // 2. 消息编辑完成
    const editedListener = eventOn(
      tavern_events.MESSAGE_EDITED,
      handleMessageEdited
    );
    stopListeners.push(editedListener);
    settingsStore.debugLog('✅ 已监听 MESSAGE_EDITED');
    
    // 3. 消息更新（通用）
    const updatedListener = eventOn(
      tavern_events.MESSAGE_UPDATED,
      handleMessageUpdated
    );
    stopListeners.push(updatedListener);
    settingsStore.debugLog('✅ 已监听 MESSAGE_UPDATED');
    
    // 4. 消息删除
    const deletedListener = eventOn(
      tavern_events.MESSAGE_DELETED,
      handleMessageDeleted
    );
    stopListeners.push(deletedListener);
    settingsStore.debugLog('✅ 已监听 MESSAGE_DELETED');
    
    // 5. LLM 生成完成
    const generationListener = eventOn(
      tavern_events.GENERATION_ENDED,
      handleGenerationEnded
    );
    stopListeners.push(generationListener);
    settingsStore.debugLog('✅ 已监听 GENERATION_ENDED');
    
    // 6. 聊天切换
    const chatChangedListener = eventOn(
      tavern_events.CHAT_CHANGED,
      handleChatChanged
    );
    stopListeners.push(chatChangedListener);
    settingsStore.debugLog('✅ 已监听 CHAT_CHANGED');
    
    // 7. 生成前
    const beforeGenListener = eventOn(
      tavern_events.GENERATION_AFTER_COMMANDS,
      handleBeforeGeneration
    );
    stopListeners.push(beforeGenListener);
    settingsStore.debugLog('✅ 已监听 GENERATION_AFTER_COMMANDS');
    
    serviceStatus.initialized = true;
    serviceStatus.listenerCount = stopListeners.length;
    
      console.log(`[GiantessCalc] ✅ 已注册 ${stopListeners.length} 个事件监听器`);
    settingsStore.debugLog(`✅ 已注册 ${stopListeners.length} 个事件监听器`);
    
  } catch (error) {
    console.error('[GiantessCalc] ❌ 注册事件监听器失败:', error);
    settingsStore.debugError('❌ 注册事件监听器失败:', error);
  }
  
  // 初始化时从最新消息解析数据
  if (syncOnInit) {
    setTimeout(() => {
      parseAndProcessMessage('latest');
      serviceStatus.lastSyncTime = Date.now();
    }, 100);
  }
}

/**
 * 清理事件监听器
 */
export function cleanupEventListeners(): void {
  for (const listener of stopListeners) {
    try {
      listener.stop();
    } catch (error) {
      console.warn('[GiantessCalc] 清理监听器失败:', error);
    }
  }
  
  stopListeners = [];
  debouncedSync = null;
  
  serviceStatus.initialized = false;
  serviceStatus.listenerCount = 0;
  
  const settingsStore = useSettingsStore();
  settingsStore.debugLog('🧹 已清理所有事件监听器');
}

/**
 * 获取服务状态
 */
export function getServiceStatus(): VariableServiceStatus {
  return { ...serviceStatus };
}

/**
 * 手动触发同步
 * 用于调试或 UI 操作
 */
export function manualSync(): void {
  parseAndProcessMessage('latest');
  serviceStatus.lastSyncTime = Date.now();
}

/**
 * 检查服务是否已初始化
 */
export function isInitialized(): boolean {
  return serviceStatus.initialized;
}
