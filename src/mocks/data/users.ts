/**
 * 各租户 mock 账号表（mock 即契约）。
 *
 * 【前置限制】
 * 浏览器 Service Worker 无法执行真实 Set-Cookie，
 * 因此 mock 用 localStorage['mock:session'] 模拟登录态；
 * 真实 HttpOnly cookie 行为（Domain=.psy.com / Secure / SameSite=Lax）
 * 由后端实现保证，前端代码不因 mock 妥协（withCredentials 照写）。
 *
 * 跨租户规则：账号归属单一租户；
 * nist001 在 tsinghua 租户下登录 → INVALID_CREDENTIALS（不提示归属，防枚举）。
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

/** key = 归属租户 ID */
export const MOCK_USERS: Record<string, MockUser[]> = {
  [DEFAULT_TENANT_ID]: [
    { userId: 'u-social-001', username: 'social001', password: '123456', name: '社会人士·体验账号', tenantId: DEFAULT_TENANT_ID },
  ],
  nist: [
    { userId: 'u-nist-001', username: 'nist001', password: '123456', name: '南理工·测试学生', tenantId: 'nist' },
  ],
  tsinghua: [
    { userId: 'u-thu-001', username: 'thu001', password: '123456', name: '清华·测试学生', tenantId: 'tsinghua' },
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
 * 校验账号：按「请求租户」+ 用户名 + 密码匹配。
 * 账号不属于该租户时也返回 null（与密码错误同处理，防归属枚举）。
 */
export function verifyMockUser(tenantId: string, username: string, password: string): MockUser | null {
  const users = MOCK_USERS[tenantId] ?? []
  return users.find(u => u.username === username && u.password === password) ?? null
}

/** 按会话找回完整账号（/api/me 用） */
export function findMockUser(session: MockSession): MockUser | null {
  const users = MOCK_USERS[session.tenantId] ?? []
  return users.find(u => u.userId === session.userId) ?? null
}
