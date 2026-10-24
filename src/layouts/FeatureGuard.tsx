import { lazy, Suspense, type ReactNode } from 'react'
import { useTenantStore } from '@/stores/useTenantStore'
import type { TenantFeatures } from '@/config/tenant/types'

// 与 App.tsx 的 /403 路由共用同一懒加载分片，避免静态引入把 403 页打进主链
const ForbiddenView = lazy(() => import('@/pages/error/ForbiddenView'))

/**
 * 租户 feature 守卫：只负责 feature 开关，不负责登录。
 *
 * - feature 关闭 → 直接渲染 403（不要求登录：用户看"功能未开放"不应被要求先登录）
 * - feature 开启 → 不做任何拦截，访问控制交还给原有机制
 *   （原本公开的仍公开；需要登录的路由由 ProtectedRoute 处理）
 * - 响应式：通过 useTenantStore() 订阅 store，租户配置热更新后立即生效
 */
export default function FeatureGuard({
  feature,
  children,
}: {
  feature: keyof TenantFeatures
  children: ReactNode
}) {
  const tenantStore = useTenantStore()

  if (!tenantStore.isFeatureEnabled(feature)) {
    return (
      <Suspense fallback={null}>
        <ForbiddenView />
      </Suspense>
    )
  }
  return <>{children}</>
}
