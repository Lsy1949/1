import { createStore } from './createStore'
import {
  getDefaultConfig,
  mergeTenantConfig,
} from '@/config/tenant/default'
import { resolveTenantId } from '@/config/tenant/resolve'
import { bootstrapTenantConfig, refreshTenantConfig } from '@/config/tenant/loader'
import type { TenantConfig, TenantFeatures } from '@/config/tenant/types'

// 类型从 config/tenant 统一转出（保持 Vue 版从 @/stores 引用的兼容性）
export type {
  TenantBrand,
  TenantTheme,
  TenantAssets,
  TenantFeatures,
  TenantConfig,
} from '@/config/tenant/types'
export { DEFAULT_TENANT_ID, DEFAULT_BRAND_PRIMARY } from '@/config/tenant/default'
export { resolveTenantId } from '@/config/tenant/resolve'

/** localStorage 品牌色缓存 key（index.html 防闪烁脚本读取） */
export const BRAND_PRIMARY_CACHE_KEY = 'tenant:brand-primary'

/** 把配置应用到全局：CSS 变量 / 标题 / favicon / 品牌色缓存 */
function applyConfig(c: TenantConfig): void {
  try {
    const root = document.documentElement
    root.style.setProperty('--brand-primary', c.theme.primaryColor)
    root.style.setProperty('--brand-primary-dark', c.theme.darkColor)
    root.style.setProperty('--brand-primary-deep', c.theme.deepColor)
    root.style.setProperty('--brand-primary-deeper', c.theme.deeperColor)
    root.style.setProperty('--brand-primary-soft', c.theme.softColor)
    root.style.setProperty('--brand-primary-faint', c.theme.faintColor)
    root.style.setProperty('--brand-primary-wash', c.theme.washColor)
    if (c.theme.radius) root.style.setProperty('--brand-radius', c.theme.radius)
    if (c.theme.fontFamily) root.style.setProperty('--brand-font-family', c.theme.fontFamily)

    document.title = c.brand.name

    if (c.brand.favicon) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = c.brand.favicon
    }

    // 写入品牌色缓存，供下次加载 index.html 内联脚本防闪烁
    localStorage.setItem(BRAND_PRIMARY_CACHE_KEY, c.theme.primaryColor)
  } catch {
    /* DOM/localStorage 异常不影响应用运行 */
  }
}

export interface TenantStoreValue {
  // ---------- state ----------
  tenantId: string
  config: TenantConfig
  /** 本次启动配置来源：true = localStorage 缓存（已触发后台刷新） */
  fromCache: boolean
  /** bootstrap 是否已完成（无论成败） */
  loaded: boolean
  // ---------- actions ----------
  bootstrap: () => Promise<void>
  isFeatureEnabled: (key: keyof TenantFeatures) => boolean
}

interface TenantState {
  tenantId: string
  config: TenantConfig
  fromCache: boolean
  loaded: boolean
}

// ---------- actions ----------
/**
 * 启动引导：对应 Vue 版 main.ts 在 mount 前调用（React 版在 main.tsx 渲染前
 * 调用一次）。内部全链路静默降级，任何异常都以保底配置收场，绝不白屏。
 */
async function bootstrap(): Promise<void> {
  const { tenantId } = store.getState()
  try {
    const result = await bootstrapTenantConfig(tenantId)
    store.setState({ config: result.config, fromCache: result.fromCache })
    applyConfig(result.config)

    // 有缓存 → 已用缓存渲染，后台静默刷新成功则热更新（用户无感）
    if (result.fromCache) {
      void refreshTenantConfig(tenantId)
        .then((fresh) => {
          if (fresh) {
            store.setState({ config: fresh })
            applyConfig(fresh)
          }
        })
        .catch(() => {
          /* 刷新失败保留缓存配置 */
        })
    }
  } catch {
    // 防御性兜底：理论上 bootstrapTenantConfig 不会抛
    const guaranteed = mergeTenantConfig(null, tenantId)
    store.setState({ config: guaranteed })
    applyConfig(guaranteed)
  } finally {
    store.setState({ loaded: true })
  }
}

function isFeatureEnabled(key: keyof TenantFeatures): boolean {
  return store.getState().config.features[key]
}

// ---------- getters 拼装（变更时重建，快照引用稳定） ----------
function toValue(s: TenantState): TenantStoreValue {
  return {
    ...s,
    bootstrap,
    isFeatureEnabled,
  }
}

const store = createStore<TenantState, TenantStoreValue>(
  {
    tenantId: resolveTenantId(),
    config: getDefaultConfig(),
    fromCache: false,
    loaded: false,
  },
  toValue,
)

/**
 * 组件内使用（调用形态与 Pinia 版一致）：const tenantStore = useTenantStore()
 * （Vue 导出名即 useTenantStore，defineStore id 为 'tenant'，此处沿用导出名）
 */
export function useTenantStore(): TenantStoreValue {
  return store.useStore()
}

/** 非 React 基础设施层（axios 拦截器 / SignalR 连接）读取入口 */
export function getTenantStore(): TenantStoreValue {
  return store.getSnapshot()
}

/** main.tsx 启动引导入口（等价 Vue main.ts mount 前调用 bootstrapTenant()） */
export function bootstrapTenant(): Promise<void> {
  return bootstrap()
}
