import { Outlet } from 'react-router-dom'
import AppShell from '@/layouts/components/AppShell'

/**
 * 移动端默认布局（Q4）：阶段 5 复用 AppShell 与响应式视图同构；
 * 后续逐页移动化时替换为移动端专用布局。
 * 路由出口 <Outlet /> 经 children 传入 AppShell 主体区。
 */
export default function DefaultLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
