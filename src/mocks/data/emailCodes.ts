/**
 * 邮箱验证码 mock 数据层（mock 即契约，后端照此语义实现）。
 *
 * - 验证码本体存 localStorage（mock:email-codes）：60s 限流窗口要跨刷新保留；
 * - verifyToken 存内存（模块级 Map）：短时效一次性凭证，页面刷新即失效
 *   —— 与真实后端 token 语义一致（刷新后重新走验证流程）；
 * - 【演示通道】真实环境验证码经邮件下发；mock 无法发信，通过
 *   send-code 响应的 devCode 字段回传演示码，前端 toast 提示。
 */

/** 限流窗口（ms）：同邮箱同场景 60s 内只发一次 */
const RESEND_INTERVAL = 60_000
/** 验证码有效期（ms） */
const CODE_TTL = 5 * 60_000
/** 验证码错误锁定阈值 */
const MAX_FAIL_COUNT = 5
/** verifyToken 有效期（ms） */
const TOKEN_TTL = 5 * 60_000

const STORAGE_KEY = 'mock:email-codes'

interface StoredCode {
  code: string
  /** 发送时间戳（限流用） */
  sentAt: number
  /** 过期时间戳 */
  expireAt: number
  /** 校验失败次数（防暴力枚举） */
  failCount: number
}

type CodeStore = Record<string, StoredCode>

function readStore(): CodeStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as CodeStore
  } catch {
    return {}
  }
}

function writeStore(store: CodeStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

/** 存储键：场景隔离（同一邮箱在注册/重置两个流程互不干扰） */
function codeKey(email: string, scene: string): string {
  return `${scene}:${email.toLowerCase()}`
}

/** 是否处于限流窗口（60s 内已发过码） */
export function isCodeThrottled(email: string, scene: string, now = Date.now()): boolean {
  const stored = readStore()[codeKey(email, scene)]
  return !!stored && now - stored.sentAt < RESEND_INTERVAL
}

/** 剩余限流秒数（前端提示用；0 = 可发送） */
export function throttleRemainSeconds(email: string, scene: string, now = Date.now()): number {
  const stored = readStore()[codeKey(email, scene)]
  if (!stored) return 0
  return Math.max(0, Math.ceil((stored.sentAt + RESEND_INTERVAL - now) / 1000))
}

/** 签发验证码（无条件覆盖旧码 —— 调用方应先过限流检查） */
export function issueEmailCode(email: string, scene: string, now = Date.now()): string {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const store = readStore()
  store[codeKey(email, scene)] = {
    code,
    sentAt: now,
    expireAt: now + CODE_TTL,
    failCount: 0,
  }
  writeStore(store)
  return code
}

/** 读取未过期验证码（过期自动清理，返回 null） */
function getValidCode(email: string, scene: string, now = Date.now()): StoredCode | null {
  const key = codeKey(email, scene)
  const stored = readStore()[key]
  if (!stored) return null
  if (stored.expireAt <= now) {
    removeEmailCode(email, scene)
    return null
  }
  return stored
}

export type VerifyOutcome = 'ok' | 'not_found' | 'expired' | 'invalid' | 'locked'

/** 校验验证码：ok 时清除验证码记录（一次性消费语义） */
export function verifyEmailCode(
  email: string,
  scene: string,
  input: string,
  now = Date.now(),
): VerifyOutcome {
  const key = codeKey(email, scene)
  const stored = getValidCode(email, scene, now)
  if (!stored) return readStore()[key] ? 'expired' : 'not_found'
  if (stored.failCount >= MAX_FAIL_COUNT) return 'locked'
  if (stored.code !== input) {
    stored.failCount += 1
    const store = readStore()
    store[key] = stored
    writeStore(store)
    return 'invalid'
  }
  removeEmailCode(email, scene)
  return 'ok'
}

function removeEmailCode(email: string, scene: string): void {
  const store = readStore()
  delete store[codeKey(email, scene)]
  writeStore(store)
}

/** verifyToken 内存表：token → 绑定的邮箱 + 场景 + 过期时间 */
const verifyTokens = new Map<
  string,
  { email: string; scene: string; expireAt: number }
>()

/** 签发一次性 verifyToken（verify-code 校验通过后调用） */
export function issueVerifyToken(email: string, scene: string, now = Date.now()): string {
  const token = `vt-${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  verifyTokens.set(token, { email: email.toLowerCase(), scene, expireAt: now + TOKEN_TTL })
  return token
}

/** 消费 verifyToken（一次性）：校验场景与邮箱匹配，通过即作废 */
export function consumeVerifyToken(
  token: string,
  expect: { email: string; scene: string },
  now = Date.now(),
): boolean {
  const bound = verifyTokens.get(token)
  if (!bound) return false
  if (bound.expireAt <= now) {
    verifyTokens.delete(token)
    return false
  }
  if (bound.scene !== expect.scene || bound.email !== expect.email.toLowerCase()) return false
  verifyTokens.delete(token)
  return true
}
