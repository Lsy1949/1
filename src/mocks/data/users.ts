/**
 * 各租户 mock 账号表（mock 即契约）。
 *
 * 【前置限制】
 * 浏览器 Service Worker 无法执行真实 Set-Cookie，
 * 因此 mock 用 localStorage['mock:session'] 模拟登录态；
 * 真实 HttpOnly cookie 行为（Domain=.psy.com / Secure / SameSite=Lax）
 * 由后端实现保证，前端代码不因 mock 妥协（withCredentials 照写）。
 *
 * 跨租户规则：真实后端按账号归属租户校验（nist001 在 tsinghua 登录 → INVALID_CREDENTIALS）；
 * mock 为联调便利放开用户名限制 —— 密码统一为 MOCK_DEMO_PASSWORD，任意用户名均可登录，
 * 未登记的账号按「请求租户」生成临时身份。
 */

import { DEFAULT_TENANT_ID } from '@/config/tenant/default'

export interface MockUser {
  userId: string
  username: string
  password: string
  name: string
  /** 归属租户（登录时按此校验） */
  tenantId: string
}

/** 演示密码：mock 校验规则 —— 任意用户名 + 该密码即可登录 */
export const MOCK_DEMO_PASSWORD = '111111'

/** key = 归属租户 ID */
export const MOCK_USERS: Record<string, MockUser[]> = {
  [DEFAULT_TENANT_ID]: [
    { userId: 'u-social-001', username: 'admin001', password: '111111', name: '社会人士·体验账号', tenantId: DEFAULT_TENANT_ID },
  ],
  nist: [
    { userId: 'u-nist-001', username: 'admin002', password: '111111', name: '南理工·测试学生', tenantId: 'nist' },
  ],
  tsinghua: [
    { userId: 'u-thu-001', username: 'admin003', password: '111111', name: '清华·测试学生', tenantId: 'tsinghua' },
  ],
}

/** localStorage 模拟会话的 key（SW 无法 Set-Cookie 的替代通道） */
export const MOCK_SESSION_KEY = 'mock:session'

export interface MockSession {
  userId: string
  username: string
  tenantId: string
}

/** 读会话（非法 JSON 视为无会话） */
export function readMockSession(): MockSession | null {
  try {
    const raw = localStorage.getItem(MOCK_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<MockSession>
    if (!parsed.userId || !parsed.tenantId) return null
    return parsed as MockSession
  } catch {
    return null
  }
}

export function writeMockSession(session: MockSession): void {
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session))
}

export function clearMockSession(): void {
  localStorage.removeItem(MOCK_SESSION_KEY)
}

/**
 * 校验账号（mock 演示规则）：
 * 1. 密码必须是 MOCK_DEMO_PASSWORD，否则视为密码错误；
 * 2. 用户名不做限制：已登记的账号返回真实身份，未登记的按请求租户生成临时身份。
 * 真实后端仍应校验账号存在性 + 归属租户，并统一返回 INVALID_CREDENTIALS。
 */
export function verifyMockUser(tenantId: string, username: string, password: string): MockUser | null {
  if (password !== MOCK_DEMO_PASSWORD) return null
  const users = MOCK_USERS[tenantId] ?? []
  const known = users.find(u => u.username === username)
  if (known) return known
  // 临时身份：userId 由租户 + 用户名派生，保证同一账号多次登录稳定
  return {
    userId: `u-${tenantId}-${username}`,
    username,
    password,
    name: username,
    tenantId,
  }
}

/** 按会话找回完整账号（/api/me 用） */
export function findMockUser(session: MockSession): MockUser | null {
  const users = MOCK_USERS[session.tenantId] ?? []
  return users.find(u => u.userId === session.userId) ?? null
}
