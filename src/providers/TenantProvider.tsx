import type { ReactNode } from 'react'
import { useTenantStore } from '@/stores/useTenantStore'
import type { TenantTheme } from '@/config/tenant/types'

/**
 * 租户配置同样是模块级单例 store（axios 拦截器/SignalR 层共享），
 * Provider 仅保持组合语义；组件内统一用 useTenantStore() 读取。
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export default TenantProvider

/**
 * 租户主题 → antd token 映射（AntdThemeBridge 消费）：
 * 深浅阶对应 TenantTheme 的非线性派生色（primaryColor 驱动）。
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
  const theme: TenantTheme = config.theme
  return {
    colorPrimary: theme.primaryColor,
    colorPrimaryHover: theme.darkColor,
    colorPrimaryActive: theme.deepColor,
    colorInfo: theme.primaryColor,
    colorLink: theme.primaryColor,
    borderRadius: Number.parseFloat(theme.radius) || 8,
  }
}
