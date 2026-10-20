/**
 * 主题色板 · 唯一数据源（Single Source of Truth）
 *
 * 设计原则：
 *  - 所有预设色板的取值、key、antd token 派生规则集中在本文件
 *  - palettes.css 仅保留 :root 默认 fallback，避免初始化时 FOUC；
 *    [data-palette] 覆写由 applyPalette() 在运行时注入（或 SSR 时内联）
 *  - 租户定制走 L1（palette）+ L2（themeOverrides 白名单）两层；
 *    底层色阶（如 --blue-300）禁止 override，避免破坏对比度系统性
 */

// ============================================================
// L1 · Palette 预设（4 套预置主题色板）
// ============================================================

export type PaletteKey = 'blue' | 'green' | 'purple' | 'orange'

export interface Palette {
  /** 展示名（用户偏好切换 UI 用） */
  label: string
  /** 主色（驱动 --brand-primary 与 antd colorPrimary） */
  primary: string
  /** 深阶：hover/active */
  primaryDark: string
  /** 更深阶 */
  primaryDeep: string
  /** 最深阶 */
  primaryDeeper: string
  /** 浅蓝高亮底 */
  primarySoft: string
  /** 极浅底 */
  primaryFaint: string
  /** 页面浅底 */
  primaryWash: string
}

/**
 * 四套预置色板
 *
 * 取色规则（保证 WCAG AA 在浅色底文本对比度 ≥ 4.5）：
 *  - primary：饱和主色，作为强调/链接/按钮底色
 *  - dark/deep/deeper：依次递减亮度，用于 hover/active
 *  - soft/faint/wash：极低饱和度浅色，用于高亮底/页面底
 *
 * 添加新色板时：所有 7 个阶必须同步给出，且在浅色 / 深色模式下都要校验
 * 与文本色（--ink-900 / dark 下 #f1f5f9）的对比度。
 */
export const PALETTES: Record<PaletteKey, Palette> = {
  blue: {
    label: '生涯蓝',
    primary: '#0052d9',
    primaryDark: '#0040b0',
    primaryDeep: '#0040a8',
    primaryDeeper: '#003bb3',
    primarySoft: '#d0e7ff',
    primaryFaint: '#f0f7ff',
    primaryWash: '#f8fbff',
  },
  green: {
    label: '青野绿',
    primary: '#0e8a5f',
    primaryDark: '#0a6e4b',
    primaryDeep: '#0a6847',
    primaryDeeper: '#086144',
    primarySoft: '#c8ecd9',
    primaryFaint: '#ecfbf3',
    primaryWash: '#f6fdf9',
  },
  purple: {
    label: '紫苏紫',
    primary: '#6b3ac8',
    primaryDark: '#552ba3',
    primaryDeep: '#51289c',
    primaryDeeper: '#4a2591',
    primarySoft: '#e0d3f5',
    primaryFaint: '#f5effc',
    primaryWash: '#faf7fe',
  },
  orange: {
    label: '暖橙',
    primary: '#c2520a',
    primaryDark: '#9e4107',
    primaryDeep: '#973e07',
    primaryDeeper: '#8f3b06',
    primarySoft: '#fadfc8',
    primaryFaint: '#fdf1e6',
    primaryWash: '#fef9f3',
  },
}

export const PALETTE_KEYS = Object.keys(PALETTES) as PaletteKey[]

export const DEFAULT_PALETTE: PaletteKey = 'blue'

export function isPaletteKey(value: unknown): value is PaletteKey {
  return typeof value === 'string' && value in PALETTES
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
 *  2. dark-mode.css 中暗色对应变量（如有）
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
