import { http } from 'msw'
import { mocked, ok, fail } from '../utils/response'
import {
  clearMockSession,
  findMockUser,
  findMockUserByUsername,
  isEmailTaken,
  listTenantUsers,
  readMockSession,
  registerMockUser,
  updateMockUserPassword,
  verifyMockUser,
  writeMockSession,
} from '../data/users'
import {
  consumeVerifyToken,
  isCodeThrottled,
  issueEmailCode,
  issueVerifyToken,
  verifyEmailCode,
} from '../data/emailCodes'
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
 * - mock 演示规则：未登记用户名 + 演示密码 111111 可登录（真实后端按账号表校验）
 * - /api/me：会话租户与 X-Tenant-Id 不一致 → 401（跨租户 cookie 视为未登录）
 * - 验证码 / 注册 / 重置（契约 §1.4-1.6）：错误统一下发稳定错误码字符串
 *   （EMAIL_TAKEN / CODE_INVALID ...），前端映射 i18n 文案；响应 message 固定 'success'
 */

interface LoginBody {
  username?: string
  password?: string
  tenantId?: string
  /** 登录方式：account 账号密码（默认）/ email 邮箱验证码（契约 §1.1） */
  loginType?: 'account' | 'email'
  email?: string
  code?: string
}

interface SendCodeBody {
  email?: string
  scene?: string
  tenantId?: string
  username?: string
}

interface VerifyCodeBody {
  email?: string
  scene?: string
  code?: string
}

interface RegisterBody {
  tenantId?: string
  username?: string
  password?: string
  email?: string
  verifyToken?: string
}

interface ResetPasswordBody extends RegisterBody {
  newPassword?: string
}

function readTenantHeader(request: Request): string {
  return request.headers.get('X-Tenant-Id') ?? DEFAULT_TENANT_ID
}

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

/** 脱敏邮箱：a***@qq.com（结构字段，非文案） */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  return `${local[0]}***@${domain}`
}

export const authHandlers = [
  // 登录：body 携带 tenantId（主域选择器提交 / 子域站点注入）；
  // loginType=email 走邮箱验证码登录（契约 §1.1），其余为账号密码
  http.post(
    '/api/student/login',
    mocked(async ({ request }) => {
      const body = (await request.json().catch(() => ({}))) as LoginBody
      const tenantId = body.tenantId ?? readTenantHeader(request)
      let user: ReturnType<typeof verifyMockUser> = null
      if (body.loginType === 'email') {
        // 邮箱验证码登录：缺参 → 400；验证码错/过期 → 统一 INVALID_CREDENTIALS（防枚举）
        if (!body.email || !body.code) {
          return fail(API_CODE.BAD_REQUEST, '缺少必填参数：email/code')
        }
        if (verifyEmailCode(body.email, 'login', body.code) !== 'ok') {
          return fail(API_CODE.UNAUTHORIZED, 'INVALID_CREDENTIALS')
        }
        // 身份解析：优先邮箱匹配的账号（注册账号绑定邮箱）；未命中走演示规则临时身份
        // （真实后端按账号表校验，邮箱未绑定 → 拒绝）
        const email = body.email.toLowerCase()
        user =
          listTenantUsers(tenantId).find((u) => u.email?.toLowerCase() === email) ?? {
            userId: `u-${tenantId}-${email.split('@')[0]}`,
            username: email.split('@')[0],
            password: '',
            name: email.split('@')[0],
            tenantId,
            email: body.email,
          }
      } else {
        // 账号密码登录：缺参 → 400（前端表单应提前拦截，此处为协议层兜底）
        if (!body.username || !body.password) {
          return fail(API_CODE.BAD_REQUEST, '缺少必填参数：username/password')
        }
        user = verifyMockUser(tenantId, body.username ?? '', body.password ?? '')
      }
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
      // 未登记账号（mock 临时身份）不在账号表里，回退到会话中的用户名
      return ok({
        userId: session.userId,
        name: user?.name ?? session.username,
        tenantId: session.tenantId,
        roleId: 'student',
      })
    }),
  ),

  // ─────────────────────────────────────────────────────────────
  // 邮箱验证码 / 注册 / 重置密码（契约 §1.4-1.6，大厂式三步流程的接口支撑）
  // 错误统一下发稳定错误码（前端 map i18n），防文案耦合

  // §1.4 发送验证码：60s 限流；register 校验邮箱未占用；reset 校验账号与邮箱匹配
  http.post(
    '/api/auth/send-code',
    mocked(async ({ request }) => {
      const body = (await request.json().catch(() => ({}))) as SendCodeBody
      const email = body.email ?? ''
      const scene = body.scene ?? 'login'
      if (!EMAIL_PATTERN.test(email)) {
        return fail(API_CODE.BAD_REQUEST, 'INVALID_EMAIL')
      }
      if (scene === 'register' && isEmailTaken(email)) {
        return fail(API_CODE.CONFLICT, 'EMAIL_TAKEN')
      }
      if (scene === 'reset') {
        const tenantId = body.tenantId ?? DEFAULT_TENANT_ID
        const user = body.username ? findMockUserByUsername(tenantId, body.username) : null
        // 真实后端可改为统一 200 防枚举；mock 显式报错便于联调定位
        if (!user) return fail(API_CODE.NOT_FOUND, 'USER_NOT_FOUND')
        if (!user.email || user.email.toLowerCase() !== email.toLowerCase()) {
          return fail(API_CODE.NOT_FOUND, 'EMAIL_MISMATCH')
        }
      }
      if (isCodeThrottled(email, scene)) {
        return fail(API_CODE.TOO_MANY_REQUESTS, 'CODE_TOO_FREQUENT')
      }
      const code = issueEmailCode(email, scene)
      return ok({ emailMasked: maskEmail(email), devCode: code })
    }),
  ),

  // §1.4 校验验证码：通过换取一次性 verifyToken（5min）
  http.post(
    '/api/auth/verify-code',
    mocked(async ({ request }) => {
      const body = (await request.json().catch(() => ({}))) as VerifyCodeBody
      const email = body.email ?? ''
      const scene = body.scene ?? 'login'
      const code = body.code ?? ''
      if (!email || !/^\d{6}$/.test(code)) {
        return fail(API_CODE.BAD_REQUEST, 'CODE_INVALID')
      }
      const outcome = verifyEmailCode(email, scene, code)
      if (outcome === 'ok') {
        return ok({ verifyToken: issueVerifyToken(email, scene) })
      }
      const errorMap: Record<string, { status: number; code: string }> = {
        not_found: { status: API_CODE.UNAUTHORIZED, code: 'CODE_INVALID' },
        expired: { status: API_CODE.UNAUTHORIZED, code: 'CODE_EXPIRED' },
        invalid: { status: API_CODE.UNAUTHORIZED, code: 'CODE_INVALID' },
        locked: { status: API_CODE.TOO_MANY_REQUESTS, code: 'CODE_LOCKED' },
      }
      const mapped = errorMap[outcome] ?? { status: API_CODE.UNAUTHORIZED, code: 'CODE_INVALID' }
      return fail(mapped.status, mapped.code)
    }),
  ),

  // §1.5 注册：verifyToken 有效 + 学号唯一 → 落动态账号表（注册即可登录）
  http.post(
    '/api/auth/register',
    mocked(async ({ request }) => {
      const body = (await request.json().catch(() => ({}))) as RegisterBody
      const { tenantId, username, password, email, verifyToken } = body
      if (!tenantId || !username || !password || !email || !verifyToken) {
        return fail(API_CODE.BAD_REQUEST, 'BAD_REQUEST')
      }
      if (!consumeVerifyToken(verifyToken, { email, scene: 'register' })) {
        return fail(API_CODE.UNAUTHORIZED, 'VERIFY_TOKEN_INVALID')
      }
      if (findMockUserByUsername(tenantId, username)) {
        return fail(API_CODE.CONFLICT, 'USERNAME_TAKEN')
      }
      registerMockUser({ tenantId, username, password, email })
      return ok<null>(null)
    }),
  ),

  // §1.6 重置密码：verifyToken 有效（reset 场景绑定邮箱）→ 更新账号密码
  http.post(
    '/api/auth/reset-password',
    mocked(async ({ request }) => {
      const body = (await request.json().catch(() => ({}))) as ResetPasswordBody
      const { tenantId, username, newPassword, email, verifyToken } = body
      if (!tenantId || !username || !newPassword || !email || !verifyToken) {
        return fail(API_CODE.BAD_REQUEST, 'BAD_REQUEST')
      }
      if (!consumeVerifyToken(verifyToken, { email, scene: 'reset' })) {
        return fail(API_CODE.UNAUTHORIZED, 'VERIFY_TOKEN_INVALID')
      }
      if (!findMockUserByUsername(tenantId, username)) {
        return fail(API_CODE.NOT_FOUND, 'USER_NOT_FOUND')
      }
      updateMockUserPassword(tenantId, username, newPassword)
      return ok<null>(null)
    }),
  ),
]
