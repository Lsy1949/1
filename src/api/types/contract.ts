/**
 * API 统一契约（信封 / 分页 / 状态码）。
 *
 * 【响应信封】与后端约定 `{ code, data, message }`；
 * 但 src/api/request.ts 的解包层对「裸业务对象」同样兼容
 * （见 modules/types.ts 记录的假设 A2），契约未定时不至于全链路返工。
 */

/** 统一响应信封 */
export interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

/** 统一分页信封（列表接口统一用它，避免各模块自造形状） */
export interface ApiPage<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 业务状态码（与后端约定；mock 侧同时用作 HTTP 状态码） */
export const API_CODE = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const

export type ApiCode = (typeof API_CODE)[keyof typeof API_CODE]
