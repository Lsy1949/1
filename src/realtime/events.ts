/**
 * SignalR 事件契约。
 *
 * 【假设 A3】后端 Hub（VITE_SIGNALR_HUB_URL，开发期 /hubs/notify）的
 * 方法契约未定，以下为本地先行定义；后端就绪后仅需修改本文件，
 * connection.ts / useSignalR / 组件层不受影响。
 */

/** 通知推送载荷 */
export interface NotificationPayload {
  id: string
  title: string
  content: string
  type: 'system' | 'booking' | 'assessment' | 'article'
  createdAt: string
  [key: string]: unknown
}

/** 强制下线推送载荷 */
export interface ForceLogoutPayload {
  reason?: string
}

/**
 * 服务端 → 客户端方法映射（hub.on 的方法名）。
 * 新增推送事件必须先在此登记，禁止 any。
 */
export interface ServerEventMap {
  receiveNotification: NotificationPayload
  forceLogout: ForceLogoutPayload
}

export type ServerEventName = keyof ServerEventMap

/**
 * 客户端 → 服务端方法映射（hub.invoke 的方法名）。
 */
export interface ClientInvokeMap {
  /** 按租户加入推送分组（多租户广播隔离） */
  joinTenant: (tenantId: string) => void
  leaveTenant: (tenantId: string) => void
}

export type ClientInvokeName = keyof ClientInvokeMap

/** 客户端推送消息信封（经 emitter 广播 / realtime store 存放的统一形态） */
export interface RealtimeEnvelope<T = unknown> {
  event: ServerEventName
  data: T
  receivedAt: number
}
