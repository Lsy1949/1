import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useUserStore } from '@/stores/useUserStore'

/** from 不记录的路径（防回环：登录后跳回登录页 / 403 页） */
const FROM_EXCLUDED = new Set(['/login', '/403'])

/**
 * 路由守卫（等价 Vue router/guards.ts 的 requiresAuth 分支）：
 * - session === 'loading'       启动探测中 → 全屏 loading，不做跳转决策
 *   （避免探测未完成时把已登录用户误踢去 /login 的闪烁往返）
 * - session === 'anonymous'     未登录 → 跳 '/login?from=当前页'（replace）
 * - session === 'authenticated' 放行
 *
 * from 构成规则：
 * - from = pathname + search（不含 hash——hash 不向后端发送，且可能含敏感态）
 * - /login、/403 不记录 from（防回环）
 * - 登录成功后由 LoginView 做两道校验（isValidInternalPath + isRouteReachable）再回跳
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session } = useUserStore()
  const location = useLocation()

  if (session === 'loading') {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  if (session === 'anonymous') {
    const from = FROM_EXCLUDED.has(location.pathname)
      ? null
      : location.pathname + location.search
    return <Navigate to={from ? `/login?from=${encodeURIComponent(from)}` : '/login'} replace />
  }

  return <>{children}</>
}
