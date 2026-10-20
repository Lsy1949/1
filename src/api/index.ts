/**
 * api 层统一出口：业务代码只从 '@/api' 导入。
 */
export { default as http } from './http'
export { get, post } from './request'
export type { RequestOptions } from './request'

// ---- 类型（统一契约 + 各 domain DTO）----
export * from './types'

// ---- 业务 modules ----
export * as aiApi from './ai'
export * as authApi from './modules/auth'
export * as userApi from './modules/user'
export * as adminApi from './modules/admin'
export * as scheduleApi from './modules/schedule'
export * as labApi from './modules/lab'
export * as reservationApi from './modules/reservation'
