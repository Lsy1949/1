import { http } from 'msw'
import { mocked, ok } from '../utils/response'
import type { LoginParams, LoginResult } from '@/api/modules/types'

/**
 * 认证接口 mock（替代原 src/api/mock/auth.ts）。
 *
 * 登录 URL 矩阵与 api/modules/auth.ts 保持一致：
 *   POST /{role}/login[/phone|/email]
 *   POST /register
 *   POST /forgot-password
 */

/** 根据 query 参数构造登录结果（开发期跳过真实校验） */
function buildLoginResult(params: LoginParams, role: string): LoginResult {
  return {
    token: `mock-token-${Date.now()}`,
    userInfo: {
      name: params.userId || params.phone || params.email || '测试用户',
      roleId: params.roleId ?? (role as LoginParams['roleId']),
      userId: params.userId || '',
      school: params.school || '',
    },
    roleId: params.roleId ?? (role as LoginParams['roleId']),
    message: '登录成功',
  }
}

export const authHandlers = [
  // /student/login、/student/login/phone、/student/login/email 共用一条规则
  http.post(
    '/:role/login*',
    mocked(({ request, params }) => {
      const url = new URL(request.url)
      const query = Object.fromEntries(url.searchParams) as unknown as LoginParams
      return ok<LoginResult>(buildLoginResult(query, String(params.role)))
    }),
  ),

  http.post('/register', mocked(() => ok({ message: '注册成功' }))),

  http.post('/forgot-password', mocked(() => ok({ message: '密码重置成功' }))),

  http.get('/user/info_id', mocked(() => ok({ userId: '', name: '测试用户', roleId: 'student' }))),

  http.post('/sendCode', mocked(() => ok<null>(null, 'sent'))),
]
