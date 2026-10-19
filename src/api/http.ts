/// <reference types="vite/client" />
import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { setupInterceptors } from './interceptors'

/**
 * 全局唯一业务 Axios 实例（禁止组件直接 import axios）。
 * baseURL / 超时在此统一；token、X-Tenant-Id、401 处理见 interceptors.ts。
 */
const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

setupInterceptors(http)

export default http
