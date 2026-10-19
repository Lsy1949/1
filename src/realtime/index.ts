import { useRealtimeStore } from '@/stores/useRealtimeStore'
import { emitter } from '@/events'
import type { Events } from '@/events'
import * as conn from './connection'
import type { ServerEventMap, ServerEventName } from './events'

/**
 * useSignalR：组件消费实时通道的唯一入口。
 *
 * - 状态：来自 realtime store（组件内调用时随状态变更触发重渲染）
 * - on()：返回退订函数，组件内请在 useEffect 的 cleanup 中调用
 *   （等价 Vue 版「setup 中调用随组件卸载自动解除监听」）
 * - start()/stop()：页面组级控制（如登录后 start、登出时 stop）
 *
 * 推送数据的两种消费方式：
 * 1. emitter.on('signalr:message', envelope => ...) —— 一次性 UI 反应（toast 等）
 * 2. realtime store 的 lastMessage / unreadCount —— 持久展示
 */
export function useSignalR() {
  const realtime = useRealtimeStore()

  /**
   * 订阅服务端推送事件。
   * @returns 取消订阅函数（组件内在 useEffect cleanup 中调用）
   */
  function on<K extends ServerEventName>(
    event: K,
    handler: (data: ServerEventMap[K]) => void,
  ): () => void {
    const wrapped = (envelope: Events['signalr:message']) => {
      if (envelope.type === event) handler(envelope.data as ServerEventMap[K])
    }
    emitter.on('signalr:message', wrapped)

    return () => emitter.off('signalr:message', wrapped)
  }

  return {
    status: realtime.status,
    reconnectAttempts: realtime.reconnectAttempts,
    lastMessage: realtime.lastMessage,
    unreadCount: realtime.unreadCount,
    start: conn.start,
    stop: conn.stop,
    invoke: conn.invoke,
    on,
  }
}

export type { RealtimeEnvelope, ServerEventMap, ServerEventName } from './events'
