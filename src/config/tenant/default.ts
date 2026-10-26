import type { TenantConfig, TenantFeatures, TenantPropaganda } from './types'
import { APP_ROUTE_PATHS, isKnownRoutePath } from '@/config/routes'
import {
  DEFAULT_PALETTE,
  PALETTES,
  deriveShades,
  isHexColor,
  isPaletteKey,
  sanitizeOverrides,
  type PaletteKey,
} from '@/styles/palette'

/** 默认租户 ID */
export const DEFAULT_TENANT_ID = 'default'

/**
 * 保底品牌色（来自 palette.ts 的默认色板 primary）。
 * 项目里只有这一处业务硬编码默认色； palettes.css 的 :root seed fallback
 * 与 PALETTES[DEFAULT_PALETTE] 必须保持一致。
 */
export const DEFAULT_BRAND_PRIMARY = PALETTES[DEFAULT_PALETTE].primary

/**
 * 品牌深浅阶保底值（由默认 seed 经 deriveShades 派生，与 palettes.css
 * 的 color-mix 公式同源）。租户通过 theme.defaultPalette 切换整套；
 * 如需单独覆写走 themeOverrides 白名单。
 */
export const DEFAULT_BRAND_SHADES = deriveShades(DEFAULT_BRAND_PRIMARY)

/**
 * 登录页宣传区保底文案（后端未下发 propaganda / 字段非法时的兜底）。
 * 与组件旧硬编码内容一致，保证降级时视觉不变。
 */
const DEFAULT_PROPAGANDA: TenantPropaganda = {
  subtitle: '专为大学生打造的\n职业规划与心理减压平台',
  quote: '在这里，每一步成长都被看见，\n每一份焦虑都被温柔以待。',
  features: [
    { title: '职业规划指导', description: '专业职业规划师提供个性化指导' },
    { title: '心理压力缓解', description: '专业心理支持帮助缓解职业焦虑' },
    { title: '成长路径规划', description: '科学的技能提升路径助你成长' },
  ],
}

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
    /* 路由默认全量启用（保底配置不裁剪任何路由） */
    routes: [...APP_ROUTE_PATHS],
    propaganda: DEFAULT_PROPAGANDA,
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

/** 宣传文案：非空字符串才采纳，否则保底 */
function coerceText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

/**
 * 宣传区合并：字段级保底。
 * - subtitle / quote：非空字符串才生效
 * - features：只保留 title/description 均为字符串的条目（非法项静默丢弃）；
 *   未下发 / 非数组 → 保底清单；下发空数组 = 明确不要特性列表（保留空，不兜底）
 */
function coercePropaganda(
  patch: Partial<TenantPropaganda> | undefined,
  base: TenantPropaganda,
): TenantPropaganda {
  if (!patch) return base
  const features = Array.isArray(patch.features)
    ? patch.features.filter(
        (f): f is TenantPropaganda['features'][number] =>
          !!f &&
          typeof f === 'object' &&
          typeof f.title === 'string' &&
          f.title.trim() !== '' &&
          typeof f.description === 'string',
      )
    : base.features
  return {
    subtitle: coerceText(patch.subtitle, base.subtitle),
    quote: coerceText(patch.quote, base.quote),
    features,
  }
}

/**
 * 字段级深度保底合并：任何来源（缓存 / 接口）的部分配置，
 * 与默认配置合并后一定得到完整 TenantConfig。
 *
 * 主题合并策略：
 *  1. defaultPalette 决定 seed（预置 key → PALETTES[key].primary；
 *     'custom' + 合法 customPrimaryColor(6 位 hex) → 该 hex），
 *     七档由 deriveShades() 派生（与 palettes.css 同公式）
 *  2. 后端如显式给 primaryColor 等七档字段，则覆盖派生值（向后兼容旧接口）
 *  3. themeOverrides 走白名单过滤，非法 key / 值静默丢弃
 *  4. 'custom' 但 seed 非法/缺失 → 整体回退默认色板，绝不白屏或串色
 *
 * tenantId 始终以解析结果为准（而非后端回显）。
 */
export function mergeTenantConfig(partial: unknown, tenantId: string = DEFAULT_TENANT_ID): TenantConfig {
  const base = getDefaultConfig()
  const p =
    partial && typeof partial === 'object' ? (partial as Partial<TenantConfig>) : {}

  // 1. 决定本租户使用的 palette 与 seed
  const rawKey = isPaletteKey(p.theme?.defaultPalette)
    ? p.theme!.defaultPalette
    : DEFAULT_PALETTE
  // custom seed 只接受 6 位 hex（isHexColor 与 deriveShades 同源，避免两处正则漂移）
  const customSeed =
    typeof p.theme?.customPrimaryColor === 'string' &&
    isHexColor(p.theme.customPrimaryColor.trim())
      ? p.theme.customPrimaryColor.trim().toLowerCase()
      : ''
  const useCustom = rawKey === 'custom' && customSeed !== ''
  // 'custom' 但 seed 非法 → 回退默认预置色板
  const paletteKey: PaletteKey = useCustom ? 'custom' : rawKey === 'custom' ? DEFAULT_PALETTE : rawKey
  const seed = useCustom ? customSeed : PALETTES[paletteKey as Exclude<PaletteKey, 'custom'>].primary
  const shades = deriveShades(seed)

  // 路由裁剪：仅接受前端注册表内的 path（防下发前端不存在的页面，非法值静默丢弃）；
  // 缺省 / 过滤后为空 → 全量启用（保底绝不误杀路由）
  const rawRoutes = Array.isArray(p.routes)
    ? Array.from(
        new Set(p.routes.filter((x): x is string => typeof x === 'string' && isKnownRoutePath(x))),
      )
    : []
  const routes = rawRoutes.length > 0 ? rawRoutes : [...APP_ROUTE_PATHS]

  return {
    tenantId,
    brand: { ...base.brand, ...stripUndefined(p.brand) },
    theme: {
      // 七档优先用后端显式值；缺省时回退到 seed 派生
      primaryColor: normalizeColor(p.theme?.primaryColor, seed),
      darkColor: normalizeColor(p.theme?.darkColor, shades.dark),
      deepColor: normalizeColor(p.theme?.deepColor, shades.deep),
      deeperColor: normalizeColor(p.theme?.deeperColor, shades.deeper),
      softColor: normalizeColor(p.theme?.softColor, shades.soft),
      faintColor: normalizeColor(p.theme?.faintColor, shades.faint),
      washColor: normalizeColor(p.theme?.washColor, shades.wash),
      radius: typeof p.theme?.radius === 'string' && p.theme.radius ? p.theme.radius : base.theme.radius,
      fontFamily: typeof p.theme?.fontFamily === 'string' ? p.theme.fontFamily : base.theme.fontFamily,
      defaultPalette: paletteKey,
      customPrimaryColor: useCustom ? customSeed : undefined,
      themeOverrides: sanitizeOverrides(p.theme?.themeOverrides),
    },
    routes,
    propaganda: coercePropaganda(p.propaganda, base.propaganda),
    assets: { ...base.assets, ...stripUndefined(p.assets) },
    features: coerceFeatures(p.features, base.features),
  }
}
