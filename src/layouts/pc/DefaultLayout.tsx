import { Outlet } from 'react-router-dom'
import AppShell from '@/layouts/components/AppShell'

/**
 * PC 默认布局：AppShell（Navbar / Footer / CommandPalette /
 * grain-overlay / 页面过渡）。旧 MainLayout 已由 AppShell 取代。
 * 路由出口 <Outlet /> 经 children 传入 AppShell 主体区。
 */
export default function DefaultLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
