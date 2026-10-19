import type { TenantConfig } from './types'
import { getDefaultConfig, mergeTenantConfig } from './default'
import { fetchTenantConfig } from '@/api/modules/tenant'

/** 缓存 key 按租户隔离，切租户不串色 */
const CACHE_PREFIX = 'tenant:config:'
/** 无缓存时等待接口的上限（确认要求：1.5 秒） */
const FETCH_TIMEOUT_MS = 1500

function cacheKey(tenantId: string): string {
  return CACHE_PREFIX + tenantId
}

function readCache(tenantId: string): Partial<TenantConfig> | null {
  try {
    const raw = localStorage.getItem(cacheKey(tenantId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Partial<TenantConfig>) : null
  } catch {
    return null
  }
}

function writeCache(tenantId: string, config: Partial<TenantConfig>): void {
  try {
    localStorage.setItem(cacheKey(tenantId), JSON.stringify(config))
  } catch {
    /* localStorage 不可用（隐私模式等）时静默跳过 */
  }
}

/** AbortController 双保险（实例层另有 1.5s timeout） */
async function fetchWithTimeout(tenantId: string): Promise<Partial<TenantConfig> | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetchTenantConfig(tenantId, controller.signal)
  } finally {
    clearTimeout(timer)
  }
}

export interface TenantBootstrapResult {
  /** 永远是完整配置（mergeTenantConfig 保证字段级保底） */
  config: TenantConfig
  fromCache: boolean
}

/**
 * 启动加载策略（确认要求）：
 * - 有缓存 → 立即返回缓存（渲染不等待），调用方自行触发后台静默刷新
 * - 无缓存 → 等待接口最多 1.5s，成功则写缓存；失败/超时走保底默认配置
 * 全程静默降级，绝不抛错白屏。
 */
export async function bootstrapTenantConfig(tenantId: string): Promise<TenantBootstrapResult> {
  const cached = readCache(tenantId)
  if (cached) {
    return { config: mergeTenantConfig(cached, tenantId), fromCache: true }
  }

  const remote = await fetchWithTimeout(tenantId)
  if (remote) {
    writeCache(tenantId, remote)
    return { config: mergeTenantConfig(remote, tenantId), fromCache: false }
  }

  return { config: mergeTenantConfig(null, tenantId), fromCache: false }
}

/**
 * 后台静默刷新：成功返回新完整配置（调用方热更新 + 重写缓存），
 * 失败返回 null（调用方保留旧配置，无感）。
 */
export async function refreshTenantConfig(tenantId: string): Promise<TenantConfig | null> {
  const remote = await fetchWithTimeout(tenantId)
  if (!remote) return null
  writeCache(tenantId, remote)
  return mergeTenantConfig(remote, tenantId)
}

/** 兜底：任何异常路径下的完整默认配置（防御性导出；参数入签名保持调用方一致） */
export function fallbackTenantConfig(_tenantId: string): TenantConfig {
  return getDefaultConfig()
}
