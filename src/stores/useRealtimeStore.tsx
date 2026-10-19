import { createStore } from './createStore'
import type { SignalRMessagePayload } from '@/events'

// 类型保持从本模块转出（Vue 版从 @/stores 引用；本体定义在 @/events）
export type { SignalRMessagePayload } from '@/events'

export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'reconnecting'

export interface RealtimeStoreValue {
  // ---------- state ----------
  status: ConnectionState
  reconnectAttempts: number
  lastMessage: SignalRMessagePayload | null
  unreadCount: number
  // ---------- actions ----------
  setStatus: (value: ConnectionState) => void
  recordReconnect: () => void
  resetReconnect: () => void
  touchMessage: (payload: SignalRMessagePayload) => void
  increaseUnread: () => void
  clearUnread: () => void
}

interface RealtimeState {
  status: ConnectionState
  reconnectAttempts: number
  lastMessage: SignalRMessagePayload | null
  unreadCount: number
}

// ---------- actions ----------
function setStatus(value: ConnectionState): void {
  store.setState({ status: value })
}

function recordReconnect(): void {
  store.setState((s) => ({ reconnectAttempts: s.reconnectAttempts + 1 }))
}

function resetReconnect(): void {
  store.setState({ reconnectAttempts: 0 })
}

function touchMessage(payload: SignalRMessagePayload): void {
  store.setState({ lastMessage: payload })
}

function increaseUnread(): void {
  store.setState((s) => ({ unreadCount: s.unreadCount + 1 }))
}

function clearUnread(): void {
  store.setState({ unreadCount: 0 })
}

// ---------- getters 拼装（变更时重建，快照引用稳定） ----------
function toValue(s: RealtimeState): RealtimeStoreValue {
  return {
    ...s,
    setStatus,
    recordReconnect,
    resetReconnect,
    touchMessage,
    increaseUnread,
    clearUnread,
  }
}

/**
 * 实时连接 store：只存连接状态与运行时数据。
 * 刻意不持久化 —— 运行时状态不属于 localStorage（与 Vue 版一致）。
 */
const store = createStore<RealtimeState, RealtimeStoreValue>(
  { status: 'disconnected', reconnectAttempts: 0, lastMessage: null, unreadCount: 0 },
  toValue,
)

/**
 * 组件内使用（调用形态与 Pinia 版一致）：const realtimeStore = useRealtimeStore()
 */
export function useRealtimeStore(): RealtimeStoreValue {
  return store.useStore()
}

/** 非 React 基础设施层（SignalR 连接）读写入口 */
export function getRealtimeStore(): RealtimeStoreValue {
  return store.getSnapshot()
}
