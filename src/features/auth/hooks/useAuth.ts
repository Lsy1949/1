import { useCallback, useRef, useState } from 'react'
import { getUserStore } from '@/stores/useUserStore'
import { emitter } from '@/events'
import { start, stop } from '@/realtime/connection'
import * as authApi from '@/api/modules/auth'
import type { LoginParams, LoginResult, SendEmailCodeParams, UserInfo } from '@/api/modules/types'
import { mockForgotPassword, mockLogin, mockRegister } from '@/api/mock/auth'

/**
 * 认证 composables（React 版）：server 层与组件之间的请求态桥接。
 * 等价迁移自 Vue 版（vue-request useRequest）——去第三方请求库，
 * 用 useState + useCallback + useRef 手写最小 manual 请求 hook。
 *
 * - mock 开关（Q1）：VITE_USE_MOCK_LOGIN==='true' 走 mock 分支（复刻旧
 *   stores/auth.js 行为），否则走真实接口；组件层无感，切后端只改环境变量
 * - 成功后统一写【新】userStore（persisted）并广播 user:login
 * - 组件内用法：const { run, loading, error, result } = useAuthLogin()
 */

const USE_MOCK = import.meta.env.VITE_USE_MOCK_LOGIN === 'true'

/** 登录服务（mock/真实自动切换） */
function loginService(params: LoginParams): Promise<LoginResult> {
  return USE_MOCK ? mockLogin(params) : authApi.login(params)
}

/**
 * 注册 / 忘记密码：真实后端契约未提供（Q1），
 * 真实分支当前抛出明确错误，后端就绪后替换为对应 API。
 */
async function registerService(data: Record<string, unknown>): Promise<{ message: string }> {
  if (USE_MOCK) return mockRegister(data)
  throw new Error('注册接口后端契约未提供（阶段5 接入）')
}

async function forgotPasswordService(data: Record<string, unknown>): Promise<{ message: string }> {
  if (USE_MOCK) return mockForgotPassword(data)
  throw new Error('忘记密码接口后端契约未提供（阶段5 接入）')
}

/** 登录成功：写 store + 广播 + 建立实时连接 */
function applyLoginSuccess(result: LoginResult): LoginResult {
  const userStore = getUserStore()
  userStore.setToken(result.token)
  userStore.setProfile({
    id: result.userInfo.userId ?? '',
    name: result.userInfo.name ?? '',
    avatar: result.userInfo.avatar,
    roleId: result.roleId,
  })
  emitter.emit('user:login', { userId: result.userInfo.userId ?? '' })
  // 实时通道随登录建立（失败静默，connection.ts 内部已降级）
  void start()
  return result
}

/** 注册/登出 hooks：成功消息与页面切换由组件侧回调完成 */
interface AsyncActionHooks<T> {
  onSuccess?: (result: T) => void
  onError?: (error: Error) => void
}

/**
 * 等价 vue-request manual useRequest 的最小实现（无第三方依赖）：
 * - run(params) 触发请求；loading / error / data 为响应式 state
 * - 错误统一归一化为 Error，rejection 已在内部消化（无 unhandled rejection）
 * - hooks 经 ref 转发：run 引用稳定，成功/失败回调闭包永远最新
 */
function useManualRequest<P, R>(service: (params: P) => Promise<R>, hooks?: AsyncActionHooks<R>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const [data, setData] = useState<R>()
  const hooksRef = useRef(hooks)
  hooksRef.current = hooks

  const run = useCallback(
    (params: P): Promise<void> => {
      setLoading(true)
      setError(undefined)
      return service(params)
        .then((result) => {
          setData(result)
          setLoading(false)
          hooksRef.current?.onSuccess?.(result)
        })
        .catch((err: unknown) => {
          const normalized = err instanceof Error ? err : new Error(String(err))
          setError(normalized)
          setLoading(false)
          hooksRef.current?.onError?.(normalized)
        })
    },
    [service],
  )

  return { run, loading, error, data }
}

/** 登录（manual 请求：由表单触发；成功写 store + 建立实时通道） */
export function useAuthLogin(hooks?: {
  onSuccess?: (result: LoginResult) => void
  onError?: (error: Error) => void
}) {
  const { run, loading, error, data } = useManualRequest(loginService, {
    onSuccess: (result) => {
      applyLoginSuccess(result)
      hooks?.onSuccess?.(result)
    },
    onError: (err) => hooks?.onError?.(err),
  })

  return { run, loading, error, result: data }
}

export function useRegister(hooks?: AsyncActionHooks<{ message: string }>) {
  return useManualRequest(registerService, hooks)
}

export function useForgotPassword(hooks?: AsyncActionHooks<{ message: string }>) {
  return useManualRequest(forgotPasswordService, hooks)
}

/** 发送邮箱验证码（无状态动作，直接调 server 层） */
export function sendEmailCode(params: SendEmailCodeParams): Promise<void> {
  return authApi.sendEmailCode(params)
}

/**
 * 登出：清 userStore + 停实时连接 + 广播（入口处订阅后跳登录页）。
 */
export function logout(): void {
  getUserStore().reset()
  void stop()
  emitter.emit('user:logout')
}

/** 按学号查询用户信息（非请求态场景的直连示例） */
export function fetchUserInfoById(userId: string, roleId: string): Promise<UserInfo> {
  return authApi.getUserInfoById(userId, roleId)
}
