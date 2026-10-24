import { get, post } from '../request'
import type { LoginParams, LoginResult, PublicTenant, SendEmailCodeParams, UserInfo } from './types'

/**
 * 认证模块（对照旧 api/user.js loginApi + UserInfoByIdApi + api/captcha.js）。
 * 开发期由 MSW 拦截（见 src/mocks/handlers/auth.ts），业务代码不再直接引用 mock 实现。
 */

/**
 * 登录（契约 §1.1：POST /api/student/login，body JSON）。
 * 失败统一 INVALID_CREDENTIALS（不区分账号不存在/密码错误/不属该校）。
 */
export function login(params: LoginParams): Promise<LoginResult> {
  return post<LoginResult>('student/login', {
    username: params.userId ?? '',
    password: params.password ?? '',
    ...(params.tenantId ?? params.school ? { tenantId: params.tenantId ?? params.school } : {}),
  })
}

/** 角色 → 路径段（旧 URL 矩阵残留，仅 getUserInfoById 使用，待该接口契约化后删除） */
const ROLE_PATH: Record<string, string> = {
  student: 'student',
  teacher: 'teacher',
  admin: 'admin',
}

/** 按学号/工号查询用户信息 */
export function getUserInfoById(userId: string, roleId: string): Promise<UserInfo> {
  const rolePath = ROLE_PATH[roleId] ?? 'student'
  const path = rolePath === 'student' ? 'user/info_id' : `${rolePath}/info_id`

  return get<UserInfo>(path, { params: { userId } })
}

/** 发送邮箱验证码（旧 api/captcha.js sendEmailCode） */
export function sendEmailCode(params: SendEmailCodeParams): Promise<void> {
  return post<void>('sendCode', null, {
    params: params as unknown as Record<string, unknown>,
  })
}

/**
 * 登录态恢复（cookie 会话探测口）。
 * 契约 §1.3：200 = 已登录；401 / 网络错 = 未登录（调用方静默处理，不重试不报错）。
 */
export function fetchMe(): Promise<UserInfo> {
  return get<UserInfo>('me')
}

/** 登出（契约 §1.2：后端清 cookie；前端失败静默，本地状态照清） */
export function logoutApi(): Promise<null> {
  return post<null>('auth/logout')
}

/** 注册 */
export function register(data: Record<string, unknown>): Promise<{ message: string }> {
  return post<{ message: string }>('register', data)
}

/** 忘记密码 / 重置密码 */
export function forgotPassword(data: Record<string, unknown>): Promise<{ message: string }> {
  return post<{ message: string }>('forgot-password', data)
}

/** 主域登录页学校选择器数据源（契约 §2.3，公开无需登录） */
export function fetchPublicTenants(): Promise<PublicTenant[]> {
  return get<PublicTenant[]>('tenants/public')
}
