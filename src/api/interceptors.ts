import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { getUserStore } from '@/stores/useUserStore'
import { getTenantStore } from '@/stores/useTenantStore'
import { emitter } from '@/events'

/**
 * 统一拦截器：X-Tenant-Id 注入（业务代码无感）、错误归一化、401 处理。
 *
 * cookie 会话模式（契约 §0.1）：不注入 Authorization —— 身份凭证由
 * withCredentials 自动携带的 HttpOnly cookie 保证，前端不持有 token。
 *
 * React 侧 store 约定：拦截器运行于非 React 上下文，
 * 统一使用 getXxxStore() 直读模块级 store 快照。
 */
export function setupInterceptors(service: AxiosInstance): void {
  service.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // 多租户标识：所有业务请求统一注入（仅作「当前站点租户」提示，契约 §0.3）
    const tenantStore = getTenantStore()
    config.headers.set('X-Tenant-Id', tenantStore.tenantId)

    return config
  })

  service.interceptors.response.use(
    // 成功分支直接放行（旧 request.js 中此处的 401/500 判断是死代码，已修正）
    (response: AxiosResponse) => response,
    (error: AxiosError) => Promise.reject(normalizeError(error)),
  )
}

/**
 * 归一化后的请求错误。
 *
 * 保留 HTTP 状态码，供调用方区分 404（资源不存在）等分支；
 * 无响应（超时/断网）场景 status 为空。
 */
export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function normalizeError(error: AxiosError): Error {
  if (error.response) {
    const { status, data } = error.response
    const businessMessage = (data as { message?: string } | undefined)?.message

    if (status === 401) {
      // 按 URL + 登录态区分语义：
      // - /api/me 401 且未登录：启动探测的正常结果，完全静默
      //   （不清理、不广播、不跳转；跳转决策归 ProtectedRoute 所有）
      // - /api/me 401 且已登录：会话中途过期 → 本地 reset（消除"显示已登录
      //   但业务接口全 401"的矛盾态），不广播跳转（探测口不做导航决策）
      // - 其他接口 401 且已登录：会话失效 → reset + 广播（入口处订阅后跳登录页）
      const isMeProbe = error.config?.url?.includes('/api/me') ?? false
      const userStore = getUserStore()
      if (userStore.isLoggedIn) {
        userStore.reset()
        if (!isMeProbe) {
          emitter.emit('user:logout')
        }
      }
      // 登录接口的 401 是凭证错误（契约 §1.1 统一 INVALID_CREDENTIALS，
      // 不区分账号不存在/密码错/不属该校）——映射专用文案，不能显示"登录已过期"
      if (businessMessage === 'INVALID_CREDENTIALS') {
        return new ApiError('账号或密码错误', status)
      }
      return new ApiError('登录已过期，请重新登录', status)
    }

    if (status >= 500) {
      return new ApiError('服务器暂时不可用，请稍后再试', status)
    }

    return new ApiError(businessMessage || `请求失败 (${status})`, status)
  }

  if (error.code === 'ECONNABORTED') {
    return new ApiError('请求超时，请稍后重试')
  }

  if (error.request) {
    return new ApiError('网络错误，请检查网络连接')
  }

  return new ApiError('请求配置错误')
}
