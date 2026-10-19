import http from '../http'
import type { LoginParams, LoginResult, SendEmailCodeParams, UserInfo } from './types'

/**
 * 认证模块（对照旧 api/user.js loginApi + UserInfoByIdApi + api/captcha.js）。
 * 注册 / 忘记密码的真实后端契约未提供：真实分支占位在下方，
 * mock 分支见 features/auth/hooks/useAuth.ts（VITE_USE_MOCK_LOGIN 控制）。
 */

/** 角色 → 路径段 */
const ROLE_PATH: Record<string, string> = {
  student: 'student',
  teacher: 'teacher',
  admin: 'admin',
}

/**
 * 登录（沿用旧 URL 矩阵：{role}/login/{loginType}）。
 * // TODO: 待后端确认 @RequestParam vs @RequestBody（Q3：暂按 params）
 */
export async function login(params: LoginParams): Promise<LoginResult> {
  const rolePath = ROLE_PATH[params.roleId] ?? 'student'
  const suffix =
    params.loginType === 'phone' ? '/phone' : params.loginType === 'email' ? '/email' : ''

  const res = await http.post<LoginResult>(`/${rolePath}/login${suffix}`, null, { params })
  return res.data
}

/**
 * 按学号/工号查询用户信息。
 * // TODO: 待后端确认 @RequestParam vs @RequestBody
 */
export async function getUserInfoById(userId: string, roleId: string): Promise<UserInfo> {
  const rolePath = ROLE_PATH[roleId] ?? 'student'
  const path = rolePath === 'student' ? '/user/info_id' : `/${rolePath}/info_id`

  const res = await http.get<UserInfo>(path, { params: { userId } })
  return res.data
}

/**
 * 发送邮箱验证码（旧 api/captcha.js sendEmailCode）。
 * // TODO: 待后端确认 @RequestParam vs @RequestBody
 */
export async function sendEmailCode(params: SendEmailCodeParams): Promise<void> {
  await http.post('/sendCode', null, { params })
}
