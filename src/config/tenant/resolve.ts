import { DEFAULT_TENANT_ID } from './default'

/** 租户 ID 合法格式（同时防止头注入 / 缓存 key 污染） */
const TENANT_ID_RE = /^[a-z0-9][a-z0-9_-]*$/i

function isValidTenantId(id: string | null | undefined): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= 64 && TENANT_ID_RE.test(id)
}

/** 优先级 1：子域名识别 {tenantId}.{VITE_APP_DOMAIN}（VITE_APP_DOMAIN 为空则跳过） */
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

/** 优先级 2：环境变量 VITE_TENANT_ID（单校私有部署） */
function fromEnv(): string | null {
  const id = import.meta.env.VITE_TENANT_ID
  return isValidTenantId(id) ? id : null
}

/** 优先级 3：URL 参数 ?tenant=xxx（仅调试用） */
function fromQuery(): string | null {
  if (typeof window === 'undefined') return null
  const id = new URLSearchParams(window.location.search).get('tenant')
  return isValidTenantId(id) ? id : null
}

/**
 * 租户识别（Q5 确认）：
 * 子域名 > VITE_TENANT_ID > ?tenant=xxx > 'default'
 *
 * 纯同步、无副作用，main.ts 启动时调用一次。
 */
export function resolveTenantId(): string {
  return fromSubdomain() ?? fromEnv() ?? fromQuery() ?? DEFAULT_TENANT_ID
}
