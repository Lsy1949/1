/// <reference types="vite/client" />
import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { setupInterceptors } from './interceptors'

/**
 * 全局唯一业务 Axios 实例（禁止组件直接 import axios）。
 * baseURL / 超时在此统一；X-Tenant-Id、401 处理见 interceptors.ts。
 *
 * cookie 会话配置（契约 §0.1 / §0.5）：
 * - withCredentials：跨子域请求携带会话 cookie
 * - xsrfCookieName / xsrfHeaderName：CSRF token 自动读取与回带
 * - withXSRFToken: true —— axios v1 跨域必须显式开启才会带 X-XSRF-TOKEN 头
 *   （默认仅同源带；生产子域调 API 域缺了它就是 CSRF 全 403）
 */
const http: AxiosInstance = axios.create({
  // VITE_API_BASE_URL 为空（mock 开发）时回退 '/api'——
  // 空字符串会让 axios 把相对路径拼到 origin 上（缺 /api 前缀导致 404）
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  withXSRFToken: true,
})

setupInterceptors(http)

export default http
