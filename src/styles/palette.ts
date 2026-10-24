/**
 * 主题色板 · 唯一数据源（Single Source of Truth）
 *
 * 设计原则：
 *  - 所有预设色板的 key 与 seed（主色 hex）集中在本文件；
 *    其余档位不在 TS 里逐档维护 —— CSS 侧由 palettes.css 用
 *    color-mix 从 seed 派生，TS 侧由 deriveShades() 用同一配比算实色。
 *  - palettes.css 仅保留 :root seed fallback（防初始化时 FOUC）与
 *    [data-palette] 覆写规则；[data-palette] 由 applyPaletteDom() 运行时注入
 *    （index.html 内联脚本先行兜底）。
 *  - 'custom' 色板：后端给 paletteKey='custom' + customPrimaryColor(hex)，
 *    seed 以 <html> inline style 注入（优先级高于任何选择器/@layer），
 *    CSS 与 TS 的派生档位自动跟随，无需静态规则。
 *  - 租户定制走 L1（palette/custom seed）+ L2（themeOverrides 白名单）两层；
 *    底层色阶（如 --blue-300）禁止 override，避免破坏对比度系统性。
 */

// L1 · Palette（'custom' = 租户自定义 seed，无预置取值）
export type PaletteKey = 'blue' | 'green' | 'purple' | 'orange' | 'custom'

/** 预置色板 key（不含 'custom'：自定义色仅由租户配置下发，用户不可在 UI 自选） */
export type PresetKey = Exclude<PaletteKey, 'custom'>

export interface Palette {
  /** 展示名（用户偏好切换 UI 用） */
  label: string
  /** 品牌主色 seed：唯一取值。七档色阶由 CSS color-mix / deriveShades() 同公式派生 */
  primary: string
}

/**
 * 预置色板（仅 seed）
 *
 * 取色规则（保证 WCAG AA：浅色底文本对比度 ≥ 4.5）：
 *  - primary 作为强调 / 链接 / 按钮底色，需与 --text-inverse(#fff) 达标
 *  - 其余档位由 BRAND_SHADE_RATIOS 派生，不逐档手写
 *
 * 添加新色板时：只需一个 seed hex（并同步 palettes.css 增加
 * [data-palette] 覆写一行），且在浅色 / 深色模式下都要校验
 * 与文本色（--ink-900 / dark 下 #f1f5f9）的对比度。
 */
export const PALETTES: Record<PresetKey, Palette> = {
  blue: {
    label: '生涯蓝',
    primary: '#0052d9',
  },
  green: {
    label: '青野绿',
    primary: '#0e8a5f',
  },
  purple: {
    label: '紫苏紫',
    primary: '#6b3ac8',
  },
  orange: {
    label: '暖橙',
    primary: '#c2520a',
  },
}

// 预设色板 key 列表（用户偏好切换 UI 遍历用，不含 'custom'）
export const PALETTE_KEYS = Object.keys(PALETTES) as PresetKey[]

// 默认预设色板（类型收窄为 PresetKey：默认值必然是预置色板，
// 且 PALETTES[DEFAULT_PALETTE] 依赖该收窄才能通过索引检查）
export const DEFAULT_PALETTE: PresetKey = 'blue'

/**
 * 是否合法 palette key（含 'custom'）。仅用于**后端值**校验：
 * mergeTenantConfig / applyConfig 处理 theme.defaultPalette（custom 是合法取值）。
 * 用户偏好（localStorage / 切换 UI）请用 isPresetPaletteKey —— 用户选不到 custom。
 */
export function isPaletteKey(value: unknown): value is PaletteKey {
  return typeof value === 'string' && (value === 'custom' || value in PALETTES)
}

/**
 * 是否预置色板 key（不含 'custom'）。
 * localStorage 偏好只会由用户 UI 写入（预设 key），读取校验必须用本函数：
 * 若容许残留的 'custom' 通过，用户偏好会压过租户默认色板，而 custom 的
 * inline seed 尚未注入（由租户 bootstrap 负责），页面将静默回退 blue。
 */
export function isPresetPaletteKey(value: unknown): value is PresetKey {
  return typeof value === 'string' && value in PALETTES
}

// ============================================================
// 档位派生（与 styles/palettes.css 的 color-mix 公式严格同步）
// ============================================================

/**
 * 派生配比（seed 占比，百分比）。
 * ⚠️ 与 palettes.css 中同名档位的 color-mix 配比必须同步修改，
 * 否则 antd token（实色）与 CSS 变量（color-mix）会出现色差。
 * 配比按原手写色阶目视校准，替换/新增色板无需重新取值。
 */
export const BRAND_SHADE_RATIOS = {
  /** hover/active 深阶 */
  dark: 85,
  /** 更深阶 */
  deep: 74,
  /** 最深阶 */
  deeper: 64,
  /** 高亮底 */
  soft: 18,
  /** 极浅底 */
  faint: 8,
  /** 页面浅底 */
  wash: 4,
} as const

/** 是否 6 位 hex（#rrggbb）。seed / 派生链路只接受该形态（与 customPrimaryColor 契约一致） */
export function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value)
}

/** 6 位 hex → [r, g, b]；派生链路只接受 hex（见 isHexColor） */
function hexToRgb(hex: string): [number, number, number] | null {
  if (!isHexColor(hex)) return null
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const toHex2 = (v: number): string =>
  Math.round(v).toString(16).padStart(2, '0')

/**
 * srgb 线性插值：等价 CSS `color-mix(in srgb, seed ratio%, base)`。
 * antd token 桥需要实色（antd 算法要解析颜色，无法引用 color-mix 表达式），
 * 故 TS 侧用同公式求值。
 *
 * 入口收紧：非 6 位 hex 直接抛错（fail-fast），不做静默兜底 ——
 * 静默返回 seed 会让 deriveShades 六档全部等于主色（antd hover 无变化），
 * 而 CSS 侧 color-mix 仍正常派生，形成 TS/CSS 双源静默分裂，最难排查。
 * 调用方（mergeTenantConfig / useTenantTokens）负责保证传入值合法。
 */
export function mixSrgb(seed: string, ratio: number, base: string): string {
  const s = hexToRgb(seed)
  const b = hexToRgb(base)
  if (!s || !b) {
    throw new Error(`mixSrgb: 仅接受 6 位 hex，实际 seed=${seed} base=${base}`)
  }
  const mixed = s.map((c, i) => c * ratio + b[i] * (1 - ratio))
  return `#${toHex2(mixed[0])}${toHex2(mixed[1])}${toHex2(mixed[2])}`
}

/** 品牌七档中的六个派生档（primary 即 seed 本身） */
export interface BrandShades {
  dark: string
  deep: string
  deeper: string
  soft: string
  faint: string
  wash: string
}

/** 从 seed 派生六档（配比见 BRAND_SHADE_RATIOS，与 palettes.css 同步）。
 *  seed 必须是 6 位 hex（非法抛错，见 mixSrgb），调用方负责保证。 */
export function deriveShades(seed: string): BrandShades {
  const r = BRAND_SHADE_RATIOS
  const p = (n: number): number => n / 100
  return {
    dark: mixSrgb(seed, p(r.dark), '#000000'),
    deep: mixSrgb(seed, p(r.deep), '#000000'),
    deeper: mixSrgb(seed, p(r.deeper), '#000000'),
    soft: mixSrgb(seed, p(r.soft), '#ffffff'),
    faint: mixSrgb(seed, p(r.faint), '#ffffff'),
    wash: mixSrgb(seed, p(r.wash), '#ffffff'),
  }
}

// ============================================================
// L2 · 租户级语义 token 覆写（白名单）
// ============================================================

/**
 * 允许租户覆写的语义 token（CSS 变量名）。
 *
 * 白名单原则：
 *  - 只允许"语义层"（surface / text / border / shadow / focus / link），
 *    禁止底层色阶（--blue-300、--ink-500 等）
 *  - 每个 key 必须是 CSS 自定义属性名（--xxx-*）
 *  - 值必须是合法 CSS color 或 length
 *
 * 新增白名单 key 时必须同步：
 *  1. tenant/types.ts 的 TenantThemeOverrides 注释
 *  2. semantic.css 中暗色对应变量（如有）
 *  3. 验收时校验明暗两态对比度
 */
export const TENANT_TOKEN_WHITELIST = [
  '--bg-page',
  '--bg-card',
  '--bg-soft',
  '--bg-mute',
  '--text-heading',
  '--text-primary',
  '--text-regular',
  '--text-secondary',
  '--text-muted',
  '--border-light',
  '--border-regular',
  '--border-strong',
  '--shadow-soft',
  '--shadow-medium',
  '--navbar-bg',
  '--navbar-bg-blur',
  '--brand-radius',
  '--brand-font-family',
] as const

export type TenantTokenKey = (typeof TENANT_TOKEN_WHITELIST)[number]

/** 租户覆写对象（键为白名单 token，值为 CSS 字符串） */
export type TenantThemeOverrides = Partial<Record<TenantTokenKey, string>>

/** 校验并过滤掉非白名单 / 非法值 */
export function sanitizeOverrides(input: unknown): TenantThemeOverrides {
  if (!input || typeof input !== 'object') return {}
  const out: TenantThemeOverrides = {}
  const allow = new Set<string>(TENANT_TOKEN_WHITELIST)
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!allow.has(key)) continue
    if (typeof value !== 'string' || !value.trim()) continue
    out[key as TenantTokenKey] = value.trim()
  }
  return out
}
