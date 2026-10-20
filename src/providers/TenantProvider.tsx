import type { ReactNode } from 'react'
import { useTenantStore } from '@/stores/useTenantStore'
import { useTheme } from '@/hooks/useTheme'
import { PALETTES } from '@/styles/palette'

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
 *  1. 用户主动切换的 palette（useTheme.palette，存在内存 + localStorage）
 *  2. 租户 defaultPalette 派生的七档（mergeTenantConfig 计算后落入 theme.primaryColor 等）
 *
 * 由于 theme.* 已经是 merge 后值，palette 改变时它也必然已是该 palette 的派生；
 * 但用户主动切换时 palette 变化**先于** tenantConfig 重算（不需要后端往返），
 * 这里直接以 useTheme.palette 查表覆盖，保证 UI 立即响应。
 *
 * fontFamily 不在此覆盖——main.tsx 的 token 层有统一的系统字体兜底。
 */
export function useTenantTokens(): {
  colorPrimary: string
  colorPrimaryHover: string
  colorPrimaryActive: string
  colorInfo: string
  colorLink: string
  borderRadius: number
} {
  const { config } = useTenantStore()
  const { palette } = useTheme()
  const theme = config.theme

  // 用户主动切换的 palette 优先；否则用租户 merge 后的派生值（含 L1/L2 计算结果）
  const p = PALETTES[palette]
  const usePalette = palette && p
  const primary = usePalette ? p.primary : theme.primaryColor
  const dark = usePalette ? p.primaryDark : theme.darkColor
  const deep = usePalette ? p.primaryDeep : theme.deepColor

  return {
    colorPrimary: primary,
    colorPrimaryHover: dark,
    colorPrimaryActive: deep,
    colorInfo: primary,
    colorLink: primary,
    borderRadius: Number.parseFloat(theme.radius) || 8,
  }
}
