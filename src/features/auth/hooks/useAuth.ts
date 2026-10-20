import { useMutation } from '@tanstack/react-query'
import { getUserStore } from '@/stores/useUserStore'
import { emitter } from '@/events'
import { start, stop } from '@/realtime/connection'
import * as authApi from '@/api/modules/auth'
import type { LoginParams, LoginResult, SendEmailCodeParams, UserInfo } from '@/api/modules/types'

/**
 * 认证 hooks：server 层与组件之间的请求态桥接。
 *
 * - 登录 / 注册 / 找回密码统一用 useMutation 管理 pending 与 error；
 * - 开发期 mock 由 MSW 拦截（src/mocks/handlers/auth.ts），本文件不再感知 mock 开关；
 * - 成功后统一写【新】userStore（persisted）并广播 user:login。
 *
 * 组件内用法保持原契约：const { run, loading, error, result } = useAuthLogin()
 */

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

interface AsyncActionHooks<T> {
  onSuccess?: (result: T) => void
  onError?: (error: Error) => void
}

/**
 * 适配层：把 useMutation 包装成组件既有的 { run, loading, error, result } 契约。
 * run 不会 reject（与原手写 hook 行为一致），错误通过 error + onError 暴露。
 */
function useMutationAdapter<P, R>(
  mutationFn: (params: P) => Promise<R>,
  hooks?: AsyncActionHooks<R>,
) {
  const mutation = useMutation({
    mutationFn,
    onSuccess: (result) => hooks?.onSuccess?.(result),
    onError: (error: Error) => hooks?.onError?.(error),
  })

  const run = async (params: P): Promise<void> => {
    try {
      await mutation.mutateAsync(params)
    } catch {
      /* 错误已由 onError 与 error 暴露 */
    }
  }

  return {
    run,
    loading: mutation.isPending,
    error: mutation.error ?? undefined,
    data: mutation.data,
  }
}

/** 登录（成功写 store + 建立实时通道） */
export function useAuthLogin(hooks?: {
  onSuccess?: (result: LoginResult) => void
  onError?: (error: Error) => void
}) {
  const { run, loading, error, data } = useMutationAdapter<LoginParams, LoginResult>(
    (params) => authApi.login(params),
    {
      onSuccess: (result) => {
        applyLoginSuccess(result)
        hooks?.onSuccess?.(result)
      },
      onError: (err) => hooks?.onError?.(err),
    },
  )

  return { run, loading, error, result: data }
}

export function useRegister(hooks?: AsyncActionHooks<{ message: string }>) {
  const { run, loading, error, data } = useMutationAdapter<Record<string, unknown>, { message: string }>(
    (data) => authApi.register(data),
    hooks,
  )
  return { run, loading, error, result: data }
}

export function useForgotPassword(hooks?: AsyncActionHooks<{ message: string }>) {
  const { run, loading, error, data } = useMutationAdapter<Record<string, unknown>, { message: string }>(
    (data) => authApi.forgotPassword(data),
    hooks,
  )
  return { run, loading, error, result: data }
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
