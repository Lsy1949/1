/**
 * events 层统一出口：业务代码只从 '@/events' 导入。
 * 事件类型集中定义在 './events'，禁止散落字符串事件名。
 */
export { emitter } from './eventBus'
export type { Events, EventKey, SignalRMessagePayload } from './events'
