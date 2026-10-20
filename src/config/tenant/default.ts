import type { TenantConfig, TenantFeatures } from './types'
import {
  DEFAULT_PALETTE,
  PALETTES,
  isPaletteKey,
  sanitizeOverrides,
  type PaletteKey,
} from '@/styles/palette'

/** 默认租户 ID */
export const DEFAULT_TENANT_ID = 'default'

/**
 * 保底品牌色（来自 palette.ts 的默认色板 primary）。
 * 项目里只有这一处业务硬编码默认色； palettes.css 的 :root fallback
 * 与 PALETTES[DEFAULT_PALETTE] 必须保持一致。
 */
export const DEFAULT_BRAND_PRIMARY = PALETTES[DEFAULT_PALETTE].primary

/**
 * 品牌深浅阶保底值（派生自默认 palette，与 palettes.css 一一对应）。
 * 租户通过 theme.defaultPalette 切换整套；如需单独覆写走 themeOverrides 白名单。
 */
export const DEFAULT_BRAND_SHADES = {
  dark: PALETTES[DEFAULT_PALETTE].primaryDark,
  deep: PALETTES[DEFAULT_PALETTE].primaryDeep,
  deeper: PALETTES[DEFAULT_PALETTE].primaryDeeper,
  soft: PALETTES[DEFAULT_PALETTE].primarySoft,
  faint: PALETTES[DEFAULT_PALETTE].primaryFaint,
  wash: PALETTES[DEFAULT_PALETTE].primaryWash,
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
      defaultPalette: DEFAULT_PALETTE,
      themeOverrides: {},
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
 *
 * 主题合并策略：
 *  1. defaultPalette 决定七档派生色（如未显式给 primaryColor 等字段时）
 *  2. 后端如显式给 primaryColor 等字段，则覆盖派生值（向后兼容旧接口）
 *  3. themeOverrides 走白名单过滤，非法 key / 值静默丢弃
 *
 * tenantId 始终以解析结果为准（而非后端回显）。
 */
export function mergeTenantConfig(partial: unknown, tenantId: string = DEFAULT_TENANT_ID): TenantConfig {
  const base = getDefaultConfig()
  const p =
    partial && typeof partial === 'object' ? (partial as Partial<TenantConfig>) : {}

  // 1. 决定本租户使用的 palette（默认 + 后端指定）
  const paletteKey: PaletteKey = isPaletteKey(p.theme?.defaultPalette)
    ? (p.theme!.defaultPalette as PaletteKey)
    : DEFAULT_PALETTE
  const palette = PALETTES[paletteKey]

  return {
    tenantId,
    brand: { ...base.brand, ...stripUndefined(p.brand) },
    theme: {
      // 七档优先用后端显式值；缺省时回退到 palette 派生
      primaryColor: normalizeColor(p.theme?.primaryColor, palette.primary),
      darkColor: normalizeColor(p.theme?.darkColor, palette.primaryDark),
      deepColor: normalizeColor(p.theme?.deepColor, palette.primaryDeep),
      deeperColor: normalizeColor(p.theme?.deeperColor, palette.primaryDeeper),
      softColor: normalizeColor(p.theme?.softColor, palette.primarySoft),
      faintColor: normalizeColor(p.theme?.faintColor, palette.primaryFaint),
      washColor: normalizeColor(p.theme?.washColor, palette.primaryWash),
      radius: typeof p.theme?.radius === 'string' && p.theme.radius ? p.theme.radius : base.theme.radius,
      fontFamily: typeof p.theme?.fontFamily === 'string' ? p.theme.fontFamily : base.theme.fontFamily,
      defaultPalette: paletteKey,
      themeOverrides: sanitizeOverrides(p.theme?.themeOverrides),
    },
    assets: { ...base.assets, ...stripUndefined(p.assets) },
    features: coerceFeatures(p.features, base.features),
  }
}
