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

/** 成功信封 `{ code: 200, data, message: 'success' }` */
export function ok<T>(data: T, message = 'success'): HttpResponse<ApiResponse<T>> {
  return HttpResponse.json({ code: API_CODE.OK, data, message })
}

/** 失败信封：业务码与 HTTP 状态码保持一致，便于 axios 拦截器走既有归一化分支 */
export function fail(code: number, message: string): HttpResponse<ApiResponse<null>> {
  return HttpResponse.json({ code, data: null, message }, { status: code })
}

/**
 * 统一包装 resolver：注入模拟延迟 + 错误开关。
 *
 * 用法：`http.get('/api/x', mocked(({ request }) => ok(data)))`
 * —— 延迟与错误注入集中在此，各 handler 无需重复。
 */
export function mocked(resolver: HttpResponseResolver): HttpResponseResolver {
  return async (info) => {
    await delay(MOCK_DELAY_MS)
    if (mockErrorMode()) {
      return fail(API_CODE.SERVER_ERROR, '【Mock】已开启错误注入（VITE_MOCK_ERROR=1）')
    }
    return resolver(info)
  }
}
