import http from './http'
import { API_CODE } from './types/contract'
import type { ApiResponse } from './types/contract'

/**
 * 统一请求封装：业务代码只调这里，不直接 import axios。
 *
 * 职责：
 *  1. 解包统一信封 `{ code, data, message }` → 直接返回 `data`
 *     （兼容后端未启用信封时返回裸业务对象的形态，见 modules/types.ts 假设 A2）
 *  2. 把「HTTP 200 但业务码非 200」的情形也归一为异常，避免静默吞错
 *  3. 其余错误（HTTP 4xx/5xx、超时、断网）已由 interceptors.ts 归一化，此处不重复处理
 */

export interface RequestOptions {
  params?: Record<string, unknown>
  signal?: AbortSignal
}

/** 信封解包；裸对象直接透传 */
function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
    const envelope = body as ApiResponse<T>
    if (envelope.code !== API_CODE.OK) {
      throw new Error(envelope.message || `请求失败 (${envelope.code})`)
    }
    return envelope.data
  }
  return body as T
}

/** GET（泛型即出参 data 类型） */
export async function get<T>(url: string, options?: RequestOptions): Promise<T> {
  const res = await http.get(url, { params: options?.params, signal: options?.signal })
  return unwrap<T>(res.data)
}

/** POST：body 走 JSON，参数走 query 由 options.params 提供（对齐后端 @RequestParam 契约） */
export async function post<T>(
  url: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const res = await http.post(url, body, {
    params: options?.params,
    signal: options?.signal,
  })
  return unwrap<T>(res.data)
}

/** DELETE（泛型即出参 data 类型） */
export async function del<T>(url: string, options?: RequestOptions): Promise<T> {
  const res = await http.delete(url, {
    params: options?.params,
    signal: options?.signal,
  })
  return unwrap<T>(res.data)
}

/** PATCH：用于状态变更类接口（如取消预约），body 走 JSON */
export async function patch<T>(
  url: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const res = await http.patch(url, body, {
    params: options?.params,
    signal: options?.signal,
  })
  return unwrap<T>(res.data)
}
