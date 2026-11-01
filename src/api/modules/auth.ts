import { get, post } from '../request'
import type {
  LoginParams,
  LoginResult,
  PublicTenant,
  RegisterParams,
  ResetPasswordParams,
  SendEmailCodeParams,
  SendEmailCodeResult,
  UserInfo,
  VerifyEmailCodeParams,
  VerifyEmailCodeResult,
} from './types'

/**
 * 认证模块（对照旧 api/user.js loginApi + UserInfoByIdApi + api/captcha.js）。
 * 开发期由 MSW 拦截（见 src/mocks/handlers/auth.ts），业务代码不再直接引用 mock 实现。
 */

/**
 * 登录（契约 §1.1：POST /api/student/login，body JSON）。
 * - loginType=account（默认）：username + password
 * - loginType=email：email + code（邮箱验证码登录）
 * 失败统一 INVALID_CREDENTIALS（不区分账号不存在/密码错误/不属该校）。
 */
export function login(params: LoginParams): Promise<LoginResult> {
  const credential =
    params.loginType === 'email'
      ? { loginType: 'email', email: params.email ?? '', code: params.code ?? '' }
      : {
          loginType: 'account',
          username: params.userId ?? '',
          password: params.password ?? '',
        }
  return post<LoginResult>('student/login', {
    ...credential,
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

/** 发送邮箱验证码（契约 §1.4：60s 限流，5min 有效；scene 决定附加校验） */
export function sendEmailCode(params: SendEmailCodeParams): Promise<SendEmailCodeResult> {
  return post<SendEmailCodeResult>('auth/send-code', params)
}

/** 校验邮箱验证码（契约 §1.4：通过换取一次性 verifyToken，5min 有效） */
export function verifyEmailCode(params: VerifyEmailCodeParams): Promise<VerifyEmailCodeResult> {
  return post<VerifyEmailCodeResult>('auth/verify-code', params)
}

/** 注册（契约 §1.5：verifyToken 必填，服务端校验学号唯一后落库） */
export function register(params: RegisterParams): Promise<null> {
  return post<null>('auth/register', params)
}

/** 重置密码（契约 §1.6：verifyToken 必填，校验通过后更新账号密码） */
export function resetPassword(params: ResetPasswordParams): Promise<null> {
  return post<null>('auth/reset-password', params)
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

/** 主域登录页学校选择器数据源（契约 §2.3，公开无需登录） */
export function fetchPublicTenants(): Promise<PublicTenant[]> {
  return get<PublicTenant[]>('tenants/public')
}
