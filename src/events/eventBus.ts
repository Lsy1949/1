import mitt from 'mitt'
import type { Events } from './events'

/**
 * 全局唯一事件总线实例。
 * 只用于轻量解耦通知（登出、全局 UI 反应等）；
 * 业务状态同步走 Pinia，实时推送走 SignalR。
 */
export const emitter = mitt<Events>()
