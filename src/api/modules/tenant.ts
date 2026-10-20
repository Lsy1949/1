import axios from 'axios'
import type { AxiosResponse } from 'axios'
import type { TenantConfigDTO } from '@/api/types'

/**
 * 租户配置 API —— 公开接口（Q6 确认）。
 *
 * 使用独立的裸 axios 实例，刻意不走 src/api/http.ts：
 * http 拦截器注入 X-Tenant-Id 依赖 tenant store，tenant store 又依赖
 * loader，loader 依赖本模块 —— 走 http 会形成循环引用。
 * 请求显式携带 tenantId 参数（Q6），不注入任何请求头。
 *
 * Mock：DEV 下由 MSW 拦截（见 src/mocks/handlers/tenant.ts），
 * 本模块不再承担 mock 开关，避免 mock 数据与业务 API 混住。
 */
const bareHttp = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 1500, // 与 loader 的 AbortController 双保险
})

/** 响应体契约（假设 A1）：兼容 { code, message, data } 信封与裸对象两种 */
interface TenantConfigResponse {
  code?: number
  message?: string
  data?: TenantConfigDTO
}

/**
 * 拉取租户配置。
 * 任何失败（网络 / 超时 / 非对象响应）一律返回 null，静默降级由 loader 处理。
 */
export async function fetchTenantConfig(
  tenantId: string,
  signal?: AbortSignal,
): Promise<TenantConfigDTO | null> {
  try {
    const res: AxiosResponse<TenantConfigResponse & TenantConfigDTO> = await bareHttp.get(
      '/api/tenant/config',
      { params: { tenantId }, signal },
    )
    const body = res.data
    if (!body || typeof body !== 'object') return null
    const payload = body.data && typeof body.data === 'object' ? body.data : body
    return payload as TenantConfigDTO
  } catch {
    return null
  }
}
