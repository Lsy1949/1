import { DEFAULT_TENANT_ID } from './default'

/** 租户 ID 合法格式（同时防止头注入 / 缓存 key 污染） */
const TENANT_ID_RE = /^[a-z0-9][a-z0-9_-]*$/i

function isValidTenantId(id: string | null | undefined): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= 64 && TENANT_ID_RE.test(id)
}

/**
 * 优先级 2：子域名识别——VITE_APP_DOMAIN 后缀匹配。
 *
 * ⚠️ 规则表与 index.html FOUC 内联脚本严格同源（两份独立实现靠人工同步，
 * 改这里必须同步改 index.html，反之亦然——首帧与 JS 加载后租户不同 = 闪色板）：
 *   {tenant}.{VITE_APP_DOMAIN}  → 租户 ID（如 nist.localhost → nist、nist.psy.com → nist）
 *   裸主域（psy.com / localhost）→ null（剥后缀后为空）
 *   www.*                        → null（显式排除）
 *   多级前缀（a.b.psy.com）      → null（剩余段含 '.'，不猜测层级）
 *   IP / 非匹配域名              → null（endsWith 不命中）
 * VITE_APP_DOMAIN 为空 → 本级整体跳过。
 */
function fromSubdomain(): string | null {
  const domain = import.meta.env.VITE_APP_DOMAIN
  if (!domain || typeof window === 'undefined') return null

  const hostname = window.location.hostname.toLowerCase()
  const suffix = '.' + domain.toLowerCase()
  if (!hostname.endsWith(suffix)) return null

  const sub = hostname.slice(0, hostname.length - suffix.length)
  // www / 多级子域不视为租户标识
  if (!sub || sub === 'www' || sub.includes('.')) return null
  return isValidTenantId(sub) ? sub : null
}

/** 优先级 1：构建期锁定 VITE_PRIVATE_TENANT（私有化部署） */
function fromEnv(): string | null {
  const id = import.meta.env.VITE_PRIVATE_TENANT
  return isValidTenantId(id) ? id : null
}

/**
 * 租户权威链（3 级，命中即停）：
 *   1. VITE_PRIVATE_TENANT —— 私有化部署构建期锁定
 *   2. 子域名（VITE_APP_DOMAIN 后缀匹配）—— 公网 SaaS 唯一运行时通道
 *   3. 'default' —— 主站兜底
 *
 * 已删除的旧通道（不再支持，命中也忽略）：
 *   - ?tenant=xxx query 参数
 *   - sessionStorage['tenant:id'] 会话记忆
 *   旧标签页残留的 sessionStorage['tenant:id'] 自然失效（无人读取），无需清理。
 */
// 生产防呆断言只打一次（axios 每请求都调本函数，漏配时避免刷屏 + 监控 SDK 配额打爆）
let tenantAssertWarned = false

export function resolveTenantId(): string {
  // 生产构建防呆：两个权威通道都缺失时必然全站 default——
  // 不 throw（应用仍可用），留排查线索
  if (
    !tenantAssertWarned &&
    import.meta.env.PROD &&
    !import.meta.env.VITE_APP_DOMAIN &&
    !import.meta.env.VITE_PRIVATE_TENANT
  ) {
    tenantAssertWarned = true
    console.error(
      '[Tenant] 生产构建未配置租户解析（VITE_APP_DOMAIN / VITE_PRIVATE_TENANT 均为空），全部回退 default',
    )
  }
  return fromEnv() ?? fromSubdomain() ?? DEFAULT_TENANT_ID
}
