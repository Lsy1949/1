import { http } from 'msw'
import { mocked, ok, fail } from '../utils/response'
import {
  clearMockSession,
  findMockUser,
  readMockSession,
  verifyMockUser,
  writeMockSession,
} from '../data/users'
import { API_CODE } from '@/api/types'
import { DEFAULT_TENANT_ID } from '@/config/tenant/default'

/**
 * 认证接口 mock（mock 即契约，后端照此实现）。
 *
 * 【前置限制】
 * 1. SW 无法 Set-Cookie → 用 localStorage['mock:session'] 模拟登录态；
 *    真实 HttpOnly cookie 由后端保证，前端代码不因 mock 妥协。
 * 2. .localhost 域 cookie 不可用 → 跨子域免重登属「真实环境验证项」，
 *    mock 只验证单站点内登录态。
 * 3. CSRF 校验逻辑由后端实现；mock 可写非 HttpOnly 的 XSRF-TOKEN cookie 模拟，
 *    前端仅验证 axios xsrfCookieName/xsrfHeaderName 配置。
 *
 * 契约要点：
 * - 登录成功（真实环境）：Set-Cookie: session=...; Domain=.{主域}; HttpOnly; Secure; SameSite=Lax
 * - 登录失败：统一 INVALID_CREDENTIALS，不区分账号不存在/密码错误/不属该校（防枚举）
 * - /api/me：会话租户与 X-Tenant-Id 不一致 → 401（跨租户 cookie 视为未登录）
 */

interface LoginBody {
  username?: string
  password?: string
  tenantId?: string
}

function readTenantHeader(request: Request): string {
  return request.headers.get('X-Tenant-Id') ?? DEFAULT_TENANT_ID
}

export const authHandlers = [
  // 登录：body 携带 tenantId（主域选择器提交 / 子域站点注入）
  http.post(
    '/api/student/login',
    mocked(async ({ request }) => {
      const body = (await request.json().catch(() => ({}))) as LoginBody
      // 参数校验：缺 username/password → 400（前端表单应提前拦截，此处为协议层兜底）
      if (!body.username || !body.password) {
        return fail(API_CODE.BAD_REQUEST, '缺少必填参数：username/password')
      }
      const tenantId = body.tenantId ?? readTenantHeader(request)
      const user = verifyMockUser(tenantId, body.username ?? '', body.password ?? '')
      if (!user) {
        // 统一错误码：不区分账号不存在 / 密码错误 / 不属该校
        return fail(API_CODE.UNAUTHORIZED, 'INVALID_CREDENTIALS')
      }
      // 模拟 Set-Cookie：写 localStorage 会话（SW 限制，见文件头注释）
      writeMockSession({ userId: user.userId, username: user.username, tenantId: user.tenantId })
      return ok({
        userInfo: {
          userId: user.userId,
          name: user.name,
          tenantId: user.tenantId,
          roleId: 'student',
        },
        message: '登录成功',
      })
    }),
  ),

  // 登出：清会话（真实环境由后端清 cookie）
  http.post(
    '/api/auth/logout',
    mocked(() => {
      clearMockSession()
      return ok<null>(null, '已登出')
    }),
  ),

  // 登录态恢复：会话存在且租户与站点一致 → 200；否则 401
  http.get(
    '/api/me',
    mocked(({ request }) => {
      // 错误注入开关：验证「网络错与 401 同处理、不报错不重试」的降级路径
      if (localStorage.getItem('mock:fail-me') === '1') {
        return fail(API_CODE.SERVER_ERROR, '【Mock】已开启 /api/me 错误注入（localStorage mock:fail-me=1）')
      }
      const session = readMockSession()
      if (!session) return fail(API_CODE.UNAUTHORIZED, '未登录')
      // 跨租户 cookie 视为未登录：会话租户 ≠ 站点租户 → 401（不提示归属）
      if (session.tenantId !== readTenantHeader(request)) {
        return fail(API_CODE.UNAUTHORIZED, '未登录')
      }
      const user = findMockUser(session)
      if (!user) return fail(API_CODE.UNAUTHORIZED, '未登录')
      return ok({
        userId: user.userId,
        name: user.name,
        tenantId: user.tenantId,
        roleId: 'student',
      })
    }),
  ),

  // 以下旧接口保留（注册/找回密码/验证码），不动契约
  http.post('/api/register', mocked(() => ok({ message: '注册成功' }))),
  http.post('/api/forgot-password', mocked(() => ok({ message: '密码重置成功' }))),
  http.post('/api/sendCode', mocked(() => ok<null>(null, 'sent'))),
]
