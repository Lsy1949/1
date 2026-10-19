/**
 * 全局事件类型契约（events 层唯一类型源）。
 * 新增事件必须先在此登记类型，禁止 any；事件名统一 domain:action 格式。
 */

/** SignalR 推送消息信封（realtime/events.ts 按 type 收窄 data） */
export interface SignalRMessagePayload {
  type: string
  data: unknown
  receivedAt: number
}

/** 全局事件表 */
export type Events = {
  'user:login': { userId: string }
  'user:logout': void
  'ui:loading': boolean
  'signalr:connected': void
  'signalr:disconnected': { reason?: string }
  'signalr:message': SignalRMessagePayload
}

export type EventKey = keyof Events
