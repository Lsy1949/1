import { createStore } from './createStore'
import {
  getDefaultConfig,
  mergeTenantConfig,
} from '@/config/tenant/default'
import { resolveTenantId } from '@/config/tenant/resolve'
import { bootstrapTenantConfig, refreshTenantConfig } from '@/config/tenant/loader'
import type { TenantConfig, TenantFeatures } from '@/config/tenant/types'
import { setTenantPaletteScope } from '@/hooks/useTheme'
import { DEFAULT_PALETTE, isPaletteKey } from '@/styles/palette'

// 类型从 config/tenant 统一转出（保持 Vue 版从 @/stores 引用的兼容性）
export type {
  TenantBrand,
  TenantTheme,
  TenantAssets,
  TenantFeatures,
  TenantPropaganda,
  TenantPropagandaFeature,
  TenantConfig,
} from '@/config/tenant/types'
export { DEFAULT_TENANT_ID, DEFAULT_BRAND_PRIMARY } from '@/config/tenant/default'
export { resolveTenantId } from '@/config/tenant/resolve'

/** localStorage 品牌色缓存 key（index.html 防闪烁脚本读取） */
export const BRAND_PRIMARY_CACHE_KEY = 'tenant:brand-primary'

/** L2 覆写样式表元素 id */
const OVERRIDE_STYLE_ID = 'tenant-theme-overrides'

/** 与明暗无关的 token：可直接 inline 注入，不参与暗色重定义 */
const MODE_AGNOSTIC_TOKENS = new Set(['--brand-radius', '--brand-font-family'])

/**
 * 注入 L2 白名单语义 token 覆写。
 *
 * 关键点：明暗敏感 token 必须写成**样式表规则**而非 inline style。
 * inline style 优先级高于任何选择器，会压过 dark-mode.css 的暗色重定义，
 * 导致切到暗色后输入框 / 导航仍是浅色（租户覆写是浅色取值）。
 *
 * 这里用 `html:not(.dark)` 作用域（优先级 0,1,1）承载覆写值：
 * 既高于浅色 `:root`（0,1,0），又低于暗色 `:root.dark`（0,2,0），
 * 与既定注入顺序「palette → tenant overrides → dark 变量重定义」一致
 * —— 即租户覆写默认只在浅色生效，暗色由官方暗色 token 接管。
 */
function applyOverrides(overrides: Record<string, string>): void {
  const root = document.documentElement
  let styleEl = document.getElementById(OVERRIDE_STYLE_ID) as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = OVERRIDE_STYLE_ID
    document.head.appendChild(styleEl)
  }

  const lightDecls: string[] = []
  for (const [key, value] of Object.entries(overrides)) {
    if (MODE_AGNOSTIC_TOKENS.has(key)) {
      root.style.setProperty(key, value)
    } else {
      lightDecls.push(`${key}: ${value};`)
    }
  }
  styleEl.textContent = lightDecls.length ? `html:not(.dark){${lightDecls.join('')}}` : ''
}

/** 把配置应用到全局：palette 作用域 / L2 overrides / 标题 / favicon / 品牌色缓存 */
function applyConfig(c: TenantConfig): void {
  try {
    // L1 · 应用租户 palette（只更新内存作用域，不写 localStorage，
    // 避免覆盖用户主动设置的 palette 偏好；缺失时回退默认 palette）
    const tenantDefault = isPaletteKey(c.theme.defaultPalette)
      ? c.theme.defaultPalette
      : DEFAULT_PALETTE
    setTenantPaletteScope(c.tenantId, tenantDefault)

    const root = document.documentElement

    // 清掉上一次租户注入的 inline brand-*，避免串色（档位已全部由
    // palettes.css 的 color-mix 从 seed 派生，inline 只承担 custom seed）
    const legacyKeys = [
      '--brand-primary',
      '--brand-primary-dark',
      '--brand-primary-deep',
      '--brand-primary-deeper',
      '--brand-primary-soft',
      '--brand-primary-faint',
      '--brand-primary-wash',
      '--brand-radius',
      '--brand-font-family',
    ]
    for (const k of legacyKeys) root.style.removeProperty(k)

    // L1 · custom 色板：seed 以 inline style 注入。
    // inline 优先级高于任何 @layer 与 [data-palette] 选择器，palettes.css
    // 的派生公式引用 var(--brand-primary)，全部档位自动跟随；
    // index.html 防闪烁脚本用 localStorage 缓存达成同一效果（首帧）。
    if (c.theme.defaultPalette === 'custom' && c.theme.customPrimaryColor) {
      root.style.setProperty('--brand-primary', c.theme.customPrimaryColor)
    }

    // L2 · 租户白名单语义 token 覆写（sanitizeOverrides 已在 merge 时过滤）
    applyOverrides(c.theme.themeOverrides ?? {})

    // 兼容字段：radius / fontFamily 也允许通过 theme 直给（与 L2 等价）
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

    // 写入品牌色缓存，供下次加载 index.html 内联脚本防 FOUC
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
 * 传 selector 时只订阅选中值：useTenantStore((s) => s.config.routes)
 */
export function useTenantStore<T = TenantStoreValue>(
  selector?: (value: TenantStoreValue) => T,
): T {
  return store.useStore(selector)
}

/** 非 React 基础设施层（axios 拦截器 / SignalR 连接）读取入口 */
export function getTenantStore(): TenantStoreValue {
  return store.getSnapshot()
}

/** main.tsx 启动引导入口（等价 Vue main.ts mount 前调用 bootstrapTenant()） */
export function bootstrapTenant(): Promise<void> {
  return bootstrap()
}
