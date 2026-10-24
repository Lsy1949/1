import { HttpResponse, delay } from 'msw'
import type { HttpResponseResolver } from 'msw'
import { API_CODE } from '@/api/types'
import type { ApiResponse } from '@/api/types'

/** 模拟网络延迟（ms）：让 loading 态可观察、Network 面板可见真实耗时 */
export const MOCK_DELAY_MS = 300

/** 错误注入开关：VITE_MOCK_ERROR=1 时所有接口返回 500，用于验证 error / loading 分支 */
export function mockErrorMode(): boolean {
  return import.meta.env.VITE_MOCK_ERROR === '1'
}

/**
 * 会话过期开关：localStorage['mock:expire']='1' 时所有接口返回 401，
 * 验证前端「会话过期 → 清状态 → 跳登录」降级链路。
 */
export function mockExpireMode(): boolean {
  return localStorage.getItem('mock:expire') === '1'
}

/**
 * CSRF 校验开关：localStorage['mock:csrf']='1' 时，写请求（POST/PUT/PATCH/DELETE）
 * 缺 X-XSRF-TOKEN 头或与 XSRF-TOKEN cookie 不一致 → 403（协议层拒绝）。
 *
 * 【前置限制】真实环境 XSRF-TOKEN cookie 由后端下发（非 HttpOnly），
 * 校验逻辑由后端实现；mock 在 GET 请求时补种 cookie 模拟下发，
 * 前端仅验证 axios xsrfCookieName/xsrfHeaderName 配置。
 * 默认关闭：前端 axios XSRF 配置属认证改造阶段，开启前登录等写请求会 403。
 */
export function mockCsrfMode(): boolean {
  return localStorage.getItem('mock:csrf') === '1'
}

/** XSRF cookie 名 / 请求头名（与契约文档 §0 一致） */
export const XSRF_COOKIE_NAME = 'XSRF-TOKEN'
export const XSRF_HEADER_NAME = 'X-XSRF-TOKEN'

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/** 读非 HttpOnly cookie（msw resolver 运行在页面上下文，可访问 document.cookie） */
function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/** GET 请求补种 XSRF-TOKEN cookie（模拟后端任意响应下发），已存在则不覆盖 */
function ensureXsrfCookie(): void {
  if (!readCookie(XSRF_COOKIE_NAME)) {
    document.cookie = `${XSRF_COOKIE_NAME}=mock-xsrf-token; path=/; SameSite=Lax`
  }
}

/** 成功信封 `{ code: 200, data, message: 'success' }` */
export function ok<T>(data: T, message = 'success'): HttpResponse<ApiResponse<T>> {
  return HttpResponse.json({ code: API_CODE.OK, data, message })
}

/** 失败信封：业务码与 HTTP 状态码保持一致，便于 axios 拦截器走既有归一化分支 */
export function fail(code: number, message: string): HttpResponse<ApiResponse<null>> {
  return HttpResponse.json({ code, data: null, message }, { status: code })
}

/**
 * 统一包装 resolver：注入模拟延迟 + 全局安全行为开关。
 *
 * 守门顺序：延迟 → 500 错误注入 → 会话过期(401) → CSRF(403，写请求) → 业务 resolver。
 * 错误响应统一 { code, message }，不含堆栈/内部路径。
 *
 * 用法：`http.get('/api/x', mocked(({ request }) => ok(data)))`
 * —— 延迟与安全行为集中在此，各 handler 无需重复。
 */
export function mocked(resolver: HttpResponseResolver): HttpResponseResolver {
  return async (info) => {
    await delay(MOCK_DELAY_MS)
    if (mockErrorMode()) {
      return fail(API_CODE.SERVER_ERROR, '【Mock】已开启错误注入（VITE_MOCK_ERROR=1）')
    }
    if (mockExpireMode()) {
      return fail(API_CODE.UNAUTHORIZED, '【Mock】已开启会话过期注入（localStorage mock:expire=1）')
    }
    // CSRF：GET 补种 cookie（模拟后端下发）；写请求在开关开启时校验头
    if (info.request.method === 'GET') {
      ensureXsrfCookie()
    } else if (
      mockCsrfMode() &&
      WRITE_METHODS.has(info.request.method) &&
      info.request.headers.get(XSRF_HEADER_NAME) !== readCookie(XSRF_COOKIE_NAME)
    ) {
      return fail(API_CODE.FORBIDDEN, '【Mock】CSRF 校验失败：缺少或无效的 X-XSRF-TOKEN')
    }
    return resolver(info)
  }
}
