import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useUserStore } from '@/stores/useUserStore'

/**
 * 路由守卫（等价 Vue router/guards.ts 的 requiresAuth 分支）：
 * meta.requiresAuth 路由在未登录时跳 '/login'（replace），
 * 与旧守卫行为一致——不带 redirect 回跳。
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useUserStore()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
