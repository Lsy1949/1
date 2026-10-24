import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import type { HubConnection } from '@microsoft/signalr'
import { getUserStore } from '@/stores/useUserStore'
import { getTenantStore } from '@/stores/useTenantStore'
import { getRealtimeStore } from '@/stores/useRealtimeStore'
import { emitter } from '@/events'
import type { RealtimeEnvelope, ServerEventMap, ServerEventName } from './events'

/**
 * 全局唯一 HubConnection 工厂（禁止组件内 new HubConnectionBuilder）。
 *
 * - 自动重连：withAutomaticReconnect([0, 2000, 5000, 10000])，四次失败后停止
 * - 鉴权：cookie 自动携带（withCredentials 语义，契约 §0.1）；不再注入 accessToken
 * - 状态：全部同步到 realtime store；连接/断开同时经 emitter 广播
 * - 推送：按 ServerEventMap 统一注册 → 更新 store + 广播信封
 */

let connection: HubConnection | null = null
let startingPromise: Promise<void> | null = null

/** 把服务器推送统一转成信封，写 store 并广播 */
function dispatchEvent<K extends ServerEventName>(event: K, data: ServerEventMap[K]): void {
  const realtime = getRealtimeStore()
  const envelope: RealtimeEnvelope<ServerEventMap[K]> = {
    event,
    data,
    receivedAt: Date.now(),
  }

  realtime.touchMessage({ type: event, data, receivedAt: envelope.receivedAt })
  if (event === 'receiveNotification') realtime.increaseUnread()

  emitter.emit('signalr:message', { type: event, data, receivedAt: envelope.receivedAt })
}

function registerServerHandlers(conn: HubConnection): void {
  conn.on('receiveNotification', (data: ServerEventMap['receiveNotification']) =>
    dispatchEvent('receiveNotification', data),
  )
  conn.on('forceLogout', (data: ServerEventMap['forceLogout']) => {
    // 服务端强制下线：清认证态并广播（入口处已订阅 user:logout 跳登录页）
    getUserStore().reset()
    emitter.emit('user:logout')
    dispatchEvent('forceLogout', data)
  })
}

function registerStateHandlers(conn: HubConnection): void {
  const realtime = getRealtimeStore()

  conn.onreconnecting((error?: Error) => {
    realtime.setStatus('reconnecting')
    realtime.recordReconnect()
    console.warn('[signalr] reconnecting:', error?.message)
  })

  conn.onreconnected(() => {
    realtime.setStatus('connected')
    realtime.resetReconnect()
    // 重连成功后重新加入租户分组（服务端分组状态不随连接保留）
    void invoke('joinTenant', getTenantStore().tenantId).catch(() => {})
    emitter.emit('signalr:connected')
  })

  conn.onclose((error?: Error) => {
    realtime.setStatus('disconnected')
    startingPromise = null
    emitter.emit('signalr:disconnected', { reason: error?.message })
    console.warn('[signalr] closed:', error?.message)
  })
}

/** 创建（或返回已有的）连接实例 */
export function getConnection(): HubConnection {
  if (connection) return connection

  // 空值降级由调用侧（connect 前）负责，这里只做类型收窄：
  // 未配置时传入空串，signalr 会给出与传 undefined 相同的 "Url cannot be empty" 报错
  const hubUrl = import.meta.env.VITE_SIGNALR_HUB_URL ?? ''
  connection = new HubConnectionBuilder()
    // withCredentials: true = cookie 会话凭证随协商请求/升级请求自动携带。
    // 注意：@microsoft/signalr 用自己的 HTTP 客户端，不读 axios 配置——
    // axios 的 withCredentials 对此无效，必须在此显式开启（S3 漏配点）。
    .withUrl(hubUrl, { withCredentials: true })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
    .build()

  // 合理的超时/心跳（默认 30s/15s，显式写出便于调参）
  connection.serverTimeoutInMilliseconds = 30_000
  connection.keepAliveIntervalInMilliseconds = 15_000

  registerServerHandlers(connection)
  registerStateHandlers(connection)
  return connection
}

/** 建立连接（幂等：连接中/已连接时复用同一个 start） */
export async function start(): Promise<void> {
  // 空值降级：未配置 Hub URL（mock 开发/未启用实时推送）时静默跳过，
  // 否则 withUrl('') 会在构建时抛 "url should not be empty"（注释见 getConnection）
  if (!import.meta.env.VITE_SIGNALR_HUB_URL) return
  const conn = getConnection()
  if (conn.state === 'Connected') return
  if (startingPromise) return startingPromise

  getRealtimeStore().setStatus('connecting')
  // 用局部变量承接 promise 链：startingPromise 会在 catch 回调里被置 null，
  // 若直接 return 它，TS 会把类型放宽为 Promise<void> | null 导致 TS2322
  const promise: Promise<void> = conn
    .start()
    .then(() => {
      getRealtimeStore().setStatus('connected')
      emitter.emit('signalr:connected')
      // 连接建立后按租户加入分组
      return invoke('joinTenant', getTenantStore().tenantId)
    })
    .catch((error: unknown) => {
      getRealtimeStore().setStatus('disconnected')
      startingPromise = null
      // 静默降级：实时通道不可用不阻塞应用，仅控制台告警
      console.warn('[signalr] start failed:', error instanceof Error ? error.message : error)
    })

  startingPromise = promise
  return promise
}

/** 关闭连接（登出 / 离开需要实时功能的页面组时调用） */
export async function stop(): Promise<void> {
  if (!connection || connection.state === 'Disconnected') return
  startingPromise = null
  await connection.stop().catch((error: unknown) => {
    console.warn('[signalr] stop failed:', error instanceof Error ? error.message : error)
  })
  getRealtimeStore().setStatus('disconnected')
}

/** 调用服务端方法 */
export async function invoke<K extends keyof import('./events').ClientInvokeMap>(
  method: K,
  ...args: Parameters<import('./events').ClientInvokeMap[K]>
): Promise<void> {
  if (!connection || connection.state !== 'Connected') {
    console.warn(`[signalr] invoke "${String(method)}" skipped: not connected`)
    return
  }
  await connection.invoke(method as string, ...args)
}
