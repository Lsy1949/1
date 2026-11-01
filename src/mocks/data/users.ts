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
  /** 注册邮箱（注册 / 重置密码身份核验用） */
  email?: string
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

/** 动态注册账号的持久化 key：注册成功后可真实登录（mock 状态持久化约定） */
const REGISTERED_USERS_KEY = 'mock:registered-users'

function readRegisteredUsers(): Record<string, MockUser[]> {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, MockUser[]>
  } catch {
    return {}
  }
}

function writeRegisteredUsers(store: Record<string, MockUser[]>): void {
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(store))
}

/**
 * 租户全量账号 = 静态种子 + 动态覆写（按 username 去重，动态优先：
 * 重置密码 / 注册都写入动态表，天然覆盖同名种子账号）。
 */
export function listTenantUsers(tenantId: string): MockUser[] {
  const merged = new Map<string, MockUser>()
  for (const u of MOCK_USERS[tenantId] ?? []) merged.set(u.username, u)
  for (const u of readRegisteredUsers()[tenantId] ?? []) merged.set(u.username, u)
  return [...merged.values()]
}

/** 按租户 + 用户名精确查账号 */
export function findMockUserByUsername(tenantId: string, username: string): MockUser | null {
  return listTenantUsers(tenantId).find(u => u.username === username) ?? null
}

/** 邮箱是否已被任意租户账号占用（排除自身，重置场景不改绑邮箱） */
export function isEmailTaken(email: string): boolean {
  const target = email.toLowerCase()
  const all = [...Object.keys(MOCK_USERS), ...Object.keys(readRegisteredUsers())]
  return all.some(tid =>
    listTenantUsers(tid).some(u => u.email?.toLowerCase() === target),
  )
}

/** 注册账号（写入动态表；用户名在租户内重复 → false） */
export function registerMockUser(input: {
  tenantId: string
  username: string
  password: string
  email: string
}): boolean {
  if (findMockUserByUsername(input.tenantId, input.username)) return false
  const store = readRegisteredUsers()
  const list = store[input.tenantId] ?? []
  list.push({
    userId: `u-${input.tenantId}-${input.username}`,
    username: input.username,
    password: input.password,
    name: input.username,
    tenantId: input.tenantId,
    email: input.email,
  })
  store[input.tenantId] = list
  writeRegisteredUsers(store)
  return true
}

/** 更新账号密码：覆写动态表同 username 记录（不存在则整条复制），账号不存在 → false */
export function updateMockUserPassword(
  tenantId: string,
  username: string,
  newPassword: string,
): boolean {
  const user = findMockUserByUsername(tenantId, username)
  if (!user) return false
  const store = readRegisteredUsers()
  const list = store[tenantId] ?? []
  const idx = list.findIndex(u => u.username === username)
  if (idx >= 0) list[idx] = { ...list[idx], password: newPassword }
  else list.push({ ...user, password: newPassword })
  store[tenantId] = list
  writeRegisteredUsers(store)
  return true
}

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
 * 1. 账号表（种子 + 动态注册/重置）精确匹配 username+password → 真实身份
 *    （注册账号用自己设置的密码、重置过的账号用新密码）；
 * 2. username 在表内但密码不符 → null（含演示账号，防演示密码旁路）；
 * 3. username 不在表内 → 演示规则：MOCK_DEMO_PASSWORD 生成临时身份。
 * 真实后端仍应校验账号存在性 + 归属租户，并统一返回 INVALID_CREDENTIALS。
 */
export function verifyMockUser(tenantId: string, username: string, password: string): MockUser | null {
  const known = findMockUserByUsername(tenantId, username)
  if (known) return known.password === password ? known : null
  if (password !== MOCK_DEMO_PASSWORD) return null
  // 临时身份：userId 由租户 + 用户名派生，保证同一账号多次登录稳定
  return {
    userId: `u-${tenantId}-${username}`,
    username,
    password,
    name: username,
    tenantId,
  }
}

/** 按会话找回完整账号（/api/me 用；查合并表，注册账号刷新后仍可还原） */
export function findMockUser(session: MockSession): MockUser | null {
  const users = listTenantUsers(session.tenantId)
  return users.find(u => u.userId === session.userId) ?? null
}
