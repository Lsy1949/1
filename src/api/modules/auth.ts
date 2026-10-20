import { get, post } from '../request'
import type { LoginParams, LoginResult, SendEmailCodeParams, UserInfo } from './types'

/**
 * 认证模块（对照旧 api/user.js loginApi + UserInfoByIdApi + api/captcha.js）。
 * 开发期由 MSW 拦截（见 src/mocks/handlers/auth.ts），业务代码不再直接引用 mock 实现。
 */

/** 角色 → 路径段 */
const ROLE_PATH: Record<string, string> = {
  student: 'student',
  teacher: 'teacher',
  admin: 'admin',
}

/** 登录（沿用旧 URL 矩阵：{role}/login/{loginType}） */
export function login(params: LoginParams): Promise<LoginResult> {
  const rolePath = ROLE_PATH[params.roleId] ?? 'student'
  const suffix =
    params.loginType === 'phone' ? '/phone' : params.loginType === 'email' ? '/email' : ''

  return post<LoginResult>(`/${rolePath}/login${suffix}`, null, {
    params: params as unknown as Record<string, unknown>,
  })
}

/** 按学号/工号查询用户信息 */
export function getUserInfoById(userId: string, roleId: string): Promise<UserInfo> {
  const rolePath = ROLE_PATH[roleId] ?? 'student'
  const path = rolePath === 'student' ? '/user/info_id' : `/${rolePath}/info_id`

  return get<UserInfo>(path, { params: { userId } })
}

/** 发送邮箱验证码（旧 api/captcha.js sendEmailCode） */
export function sendEmailCode(params: SendEmailCodeParams): Promise<void> {
  return post<void>('/sendCode', null, {
    params: params as unknown as Record<string, unknown>,
  })
}

/** 注册 */
export function register(data: Record<string, unknown>): Promise<{ message: string }> {
  return post<{ message: string }>('/register', data)
}

/** 忘记密码 / 重置密码 */
export function forgotPassword(data: Record<string, unknown>): Promise<{ message: string }> {
  return post<{ message: string }>('/forgot-password', data)
}
