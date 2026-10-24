import { useMutation } from '@tanstack/react-query'
import { getUserStore } from '@/stores/useUserStore'
import { getTenantStore } from '@/stores/useTenantStore'
import { emitter } from '@/events'
import { start, stop } from '@/realtime/connection'
import { logoutApi } from '@/api/modules/auth'
import * as authApi from '@/api/modules/auth'
import type { LoginParams, LoginResult, SendEmailCodeParams, UserInfo } from '@/api/modules/types'
import { DEFAULT_TENANT_ID } from '@/config/tenant/default'

/**
 * 认证 hooks：server 层与组件之间的请求态桥接。
 *
 * - 登录 / 注册 / 找回密码统一用 useMutation 管理 pending 与 error；
 * - 开发期 mock 由 MSW 拦截（src/mocks/handlers/auth.ts），本文件不再感知 mock 开关；
 * - 成功后统一写【新】userStore（persisted）并广播 user:login。
 *
 * 组件内用法保持原契约：const { run, loading, error, result } = useAuthLogin()
 */

/**
 * 登录成功后统一落地（cookie 会话编排，契约 §1.1）：
 * 1. 通过 /api/me 恢复会话 profile（登录响应 userInfo 仅作展示回显，
 *    登录态权威来源是 cookie 会话探测 —— restoreFromMe 内含租户防御）
 * 2. 建立实时通道（cookie 自动携带，无 token）
 * 3. 按站点类型分流：
 *    - 请求带 tenantId（主域选择器）→ window.location 跳子域首页（整页跳转，不带 from）
 *    - 子域登录 → 留本站；from 回跳由 S6 在登录页消费
 */
function applyLoginSuccess(params: LoginParams, result: LoginResult): LoginResult {
  const targetTenant = params.tenantId ?? params.school
  const currentTenant = getTenantStore().tenantId
  if (targetTenant && targetTenant !== currentTenant) {
    // 主域选校登录：整页跳子域（开发环境子域为 {tenant}.localhost，生产为 {tenant}.psy.com，
    // location.host 保留端口）。先跳再走，不在当前站恢复会话——跨租户会话在本站
    // /api/me 必然 401（X-Tenant-Id ≠ 会话租户），白打一次还留控制台红。
    // P2 防御：targetTenant='default' 时目标应是主域本身（default.psy.com 不存在）。
    // 当前场景不会触发（子域选择器隐藏、主域选择器含"社会人士"选中即本域），纯防未来误配。
    // 主域构造：剥掉首段子域前缀；无前缀（localhost:3001）时 replace 无匹配保持原样。
    const host =
      targetTenant === DEFAULT_TENANT_ID
        ? window.location.host.replace(/^[^.]+\.(?=.)/, '')
        : window.location.host.replace(/^([^.]+\.)?/, `${targetTenant}.`)
    window.location.assign(`${window.location.protocol}//${host}/`)
    return result
  }

  // 同站登录：恢复会话（restoreFromMe 内含租户防御）+ 建立实时通道
  const userStore = getUserStore()
  void userStore.restoreFromMe()
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
  hooks?: AsyncActionHooks<R> & { onSuccessWithParams?: (params: P, result: R) => void },
) {
  const mutation = useMutation({
    mutationFn,
    onSuccess: (result, variables) => {
      hooks?.onSuccessWithParams?.(variables, result)
      hooks?.onSuccess?.(result)
    },
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
      onSuccessWithParams: (params, result) => {
        applyLoginSuccess(params, result)
      },
      onSuccess: (result) => hooks?.onSuccess?.(result),
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
 * 登出（契约 §1.2：先通知后端清 cookie，本地失败静默照清）：
 * 1. 断开实时通道
 * 2. 调 /api/auth/logout（失败静默）
 * 3. 清认证态
 * 4. 广播 user:logout（入口订阅后跳 /login）
 */
export function logout(): void {
  const userStore = getUserStore()
  void stop()
  void logoutApi().catch(() => {
    /* 后端不可达也继续本地登出 */
  })
  userStore.reset()
  emitter.emit('user:logout')
}

/** 按学号查询用户信息（非请求态场景的直连示例） */
export function fetchUserInfoById(userId: string, roleId: string): Promise<UserInfo> {
  return authApi.getUserInfoById(userId, roleId)
}
