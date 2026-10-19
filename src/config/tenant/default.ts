import type { TenantConfig, TenantFeatures } from './types'

/** 默认租户 ID */
export const DEFAULT_TENANT_ID = 'default'

/**
 * 保底品牌色。整个项目只允许两处硬编码默认色：
 * 本常量 + styles/brand.css 的初始变量（两者保持一致）。
 */
export const DEFAULT_BRAND_PRIMARY = '#0052d9'

/** 品牌深浅阶保底值（与 brand.css 一一对应，租户通过 theme 字段覆盖） */
export const DEFAULT_BRAND_SHADES = {
  dark: '#0040b0',
  deep: '#0040a8',
  deeper: '#003bb3',
  soft: '#d0e7ff',
  faint: '#f0f7ff',
  wash: '#f8fbff',
} as const

/** 完整保底配置：后端不可用 / 超时 / 字段缺失时的兜底，应用照常可用 */
export function getDefaultConfig(): TenantConfig {
  return {
    tenantId: DEFAULT_TENANT_ID,
    brand: {
      name: import.meta.env.VITE_APP_TITLE || '生涯心旅',
      logo: '',
      favicon: '/favicon.svg',
      copyright: `© ${new Date().getFullYear()} 生涯心旅`,
    },
    theme: {
      primaryColor: DEFAULT_BRAND_PRIMARY,
      darkColor: DEFAULT_BRAND_SHADES.dark,
      deepColor: DEFAULT_BRAND_SHADES.deep,
      deeperColor: DEFAULT_BRAND_SHADES.deeper,
      softColor: DEFAULT_BRAND_SHADES.soft,
      faintColor: DEFAULT_BRAND_SHADES.faint,
      washColor: DEFAULT_BRAND_SHADES.wash,
      radius: '6px',
      fontFamily: '',
    },
    assets: {
      loginBackground: '',
      homeBanner: '',
    },
    features: {
      timeCapsule: true,
      square: true,
      assessment: true,
      counseling: true,
      articles: true,
    },
  }
}

/** 剔除显式 undefined，避免展开时覆盖保底值 */
function stripUndefined<T extends object>(patch: T | undefined): Partial<T> {
  const out: Record<string, unknown> = {}
  if (!patch) return out as Partial<T>
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) out[key] = value
  }
  return out as Partial<T>
}

/** 颜色合法性（CSS hex / rgb / hsl / 命名色），非法值静默回退 */
const COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-z]+)$/i

function normalizeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && COLOR_RE.test(value.trim()) ? value.trim() : fallback
}

/** 功能开关只接受布尔，其余类型静默丢弃 */
function coerceFeatures(patch: TenantFeatures | undefined, base: TenantFeatures): TenantFeatures {
  const out = { ...base }
  if (!patch) return out
  for (const key of Object.keys(base) as Array<keyof TenantFeatures>) {
    const value = patch[key]
    if (typeof value === 'boolean') out[key] = value
  }
  return out
}

/**
 * 字段级深度保底合并：任何来源（缓存 / 接口）的部分配置，
 * 与默认配置合并后一定得到完整 TenantConfig。
 * tenantId 始终以解析结果为准（而非后端回显）。
 */
export function mergeTenantConfig(partial: unknown, tenantId: string = DEFAULT_TENANT_ID): TenantConfig {
  const base = getDefaultConfig()
  const p =
    partial && typeof partial === 'object' ? (partial as Partial<TenantConfig>) : {}

  return {
    tenantId,
    brand: { ...base.brand, ...stripUndefined(p.brand) },
    theme: {
      primaryColor: normalizeColor(p.theme?.primaryColor, base.theme.primaryColor),
      darkColor: normalizeColor(p.theme?.darkColor, base.theme.darkColor),
      deepColor: normalizeColor(p.theme?.deepColor, base.theme.deepColor),
      deeperColor: normalizeColor(p.theme?.deeperColor, base.theme.deeperColor),
      softColor: normalizeColor(p.theme?.softColor, base.theme.softColor),
      faintColor: normalizeColor(p.theme?.faintColor, base.theme.faintColor),
      washColor: normalizeColor(p.theme?.washColor, base.theme.washColor),
      radius: typeof p.theme?.radius === 'string' && p.theme.radius ? p.theme.radius : base.theme.radius,
      fontFamily: typeof p.theme?.fontFamily === 'string' ? p.theme.fontFamily : base.theme.fontFamily,
    },
    assets: { ...base.assets, ...stripUndefined(p.assets) },
    features: coerceFeatures(p.features, base.features),
  }
}
