import type { ReactNode } from 'react'
import { useTenantStore } from '@/stores/useTenantStore'
import { useTheme } from '@/hooks/useTheme'
import { PALETTES, deriveShades, isHexColor } from '@/styles/palette'

/**
 * 租户配置同样是模块级单例 store（axios 拦截器/SignalR 层共享），
 * Provider 仅保持组合语义；组件内统一用 useTenantStore() 读取。
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export default TenantProvider

/**
 * 租户主题 + 当前生效 palette → antd token 映射
 *
 * 数据源优先级（高 → 低）：
 *  1. 用户主动切换的预置 palette（useTheme.palette，存在内存 + localStorage）
 *  2. 租户配置的 seed（defaultPalette / custom，mergeTenantConfig 计算后
 *     落入 theme.primaryColor）
 *
 * hover/active 由 deriveShades() 与 CSS 同公式派生（antd 算法需要实色，
 * 无法引用 color-mix 表达式）。'custom' 色板无预置取值，直接走 theme.*。
 *
 * 由于 theme.* 已经是 merge 后值，palette 改变时它也必然已是该 palette 的派生；
 * 但用户主动切换时 palette 变化**先于** tenantConfig 重算（不需要后端往返），
 * 这里直接以 useTheme.palette 查表覆盖，保证 UI 立即响应。
 *
 * fontFamily 透传租户配置（空字符串 = 未配置）：main.tsx 的 AntdThemeBridge
 * 以系统字体栈兜底，保证 antd 组件字体与 body（--brand-font-family）一致
 * 吃到租户覆写。注意仅覆盖 theme.fontFamily 显式通道；themeOverrides 里
 * 的 --brand-font-family 只作用于 CSS 变量层，antd 组件不跟随（既有行为）。
 */
export function useTenantTokens(): {
  colorPrimary: string
  colorPrimaryHover: string
  colorPrimaryActive: string
  colorInfo: string
  colorLink: string
  borderRadius: number
  fontFamily: string
} {
  const { config } = useTenantStore()
  const { palette } = useTheme()
  const theme = config.theme

  // 用户主动切换的预置 palette 优先；custom / 未知值回退租户 merge 后的 seed
  const preset = palette !== 'custom' ? PALETTES[palette] : undefined
  const primary = preset?.primary ?? theme.primaryColor

  // hover/active 与 CSS 同公式派生，但仅当 seed 可派生（6 位 hex）：
  //  - 预置色板：PALETTES 常量恒为 hex ✓
  //  - 租户 seed：theme.primaryColor 源自 merge（customPrimaryColor 契约即 hex），
  //    但后端显式覆盖 primaryColor 允许任意合法 CSS color（如 'red'，向后兼容
  //    旧接口）——此时 deriveShades 会抛错（fail-fast），回退 merge 派生的
  //    darkColor/deepColor（恒有值），保证 antd hover 不退化、不与 CSS 分裂
  const seed = preset?.primary ?? (isHexColor(theme.primaryColor) ? theme.primaryColor : null)
  const shades = seed ? deriveShades(seed) : null

  return {
    colorPrimary: primary,
    colorPrimaryHover: shades?.dark ?? theme.darkColor,
    colorPrimaryActive: shades?.deep ?? theme.deepColor,
    colorInfo: primary,
    colorLink: primary,
    borderRadius: Number.parseFloat(theme.radius) || 8,
    fontFamily: theme.fontFamily,
  }
}
