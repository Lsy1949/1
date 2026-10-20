import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { getUserStore } from '@/stores/useUserStore'
import { getTenantStore } from '@/stores/useTenantStore'
import { emitter } from '@/events'

/**
 * 统一拦截器：token 注入、X-Tenant-Id 注入（业务代码无感）、
 * 错误归一化、401 处理。
 *
 * React 侧 store 约定：拦截器运行于非 React 上下文，
 * 统一使用 getXxxStore() 直读模块级 store 快照。
 */
export function setupInterceptors(service: AxiosInstance): void {
  service.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const userStore = getUserStore()
    if (userStore.token) {
      config.headers.set('Authorization', `Bearer ${userStore.token}`)
    }

    // 多租户标识：所有业务请求统一注入，业务代码零感知
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
      const userStore = getUserStore()
      userStore.reset()
      // 跨模块解耦通知：入口处订阅后 navigate 登录页（SPA 内跳转，不整页刷新）
      emitter.emit('user:logout')
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
