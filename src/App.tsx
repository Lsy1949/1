import { Suspense, useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { App as AntApp } from 'antd'
import { emitter } from '@/events'
import { getUserStore } from '@/stores/useUserStore'
import { isMobileUA } from '@/utils/device'
import PcDefaultLayout from '@/layouts/pc/DefaultLayout'
import MobileDefaultLayout from '@/layouts/mobile/DefaultLayout'
import ProtectedRoute from '@/layouts/ProtectedRoute'
import FeatureGuard from '@/layouts/FeatureGuard'
import { useTenantStore } from '@/stores/useTenantStore'
import {
  APP_ROUTES,
  LazyForbiddenView,
  toFullPath,
  type AppRouteConfig,
} from '@/config/routes'

// 设备分流（等价 Vue 版 createAppRouter 按设备加载 pc/mobile 路由表；
// SPA 生命周期内 UA 不变，模块级判定一次即可）
const DefaultLayout = isMobileUA() ? MobileDefaultLayout : PcDefaultLayout

/**
 * 路由切换加载占位：顶部细进度条（无外部依赖）。
 * 150ms 延迟渲染：快速切换时（<150ms）完全不显示，避免闪烁；
 * 超过 150ms 才渲染进度条，给用户"正在加载"的反馈。
 */
function RouteLoadingFallback() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: '100%',
          background: 'var(--brand-primary)',
          transformOrigin: '0 50%',
          animation: 'route-loading 1s ease-in-out infinite',
          opacity: 0,
          animationDelay: '150ms',
          animationFillMode: 'forwards',
        }}
      />
      <style>{`
        @keyframes route-loading {
          0% { opacity: 0; transform: scaleX(0); }
          10% { opacity: 1; }
          50% { transform: scaleX(0.6); }
          100% { opacity: 1; transform: scaleX(1); }
        }
      `}</style>
    </div>
  )
}

/**
 * 全局事件桥（等价 Vue 版 main.ts 的 emitter 订阅）：
 * - 401 / 手动登出统一广播 user:logout → SPA 内跳登录页（不带 redirect 回跳）
 * - 页面关闭时：未勾选「记住我」则清除登录态持久化（下次进入需重新登录）
 */
function GlobalEvents() {
  const navigate = useNavigate()

  useEffect(() => {
    const onLogout = () => {
      // 恢复窗口内 /api/me 401 → reset+广播时，用户可能已在 /login，防重复 navigate。
      // 必须用 BASE_URL 拼登录页真实路径：GitHub Pages 子路径部署（/1/）下
      // window.location.pathname 是 '/1/login'，直接比 '/login' 永远不相等
      const loginPath = `${import.meta.env.BASE_URL.replace(/\/+$/, '')}/login`
      if (window.location.pathname !== loginPath) {
        navigate('/login', { replace: true })
      }
    }
    emitter.on('user:logout', onLogout)

    const onBeforeUnload = () => {
      if (!getUserStore().rememberMe) localStorage.removeItem('user')
    }
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      emitter.off('user:logout', onLogout)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [navigate])

  return null
}

/**
 * 单条路由渲染器：按 config/routes.ts 的声明组合守卫。
 * 包装顺序（外 → 内）：登录守卫 → 租户裁剪 403 → feature 403 → 页面。
 *
 * 行为矩阵（顺序：tenantExempt → requiresAuth → tenantEnabled(403) → feature(403)）：
 *   匿名 + 不需登录 + 已开通   → Page
 *   匿名 + 不需登录 + 未开通   → 403
 *   匿名 + 需登录   + 已开通   → /login?from=当前页
 *   匿名 + 需登录   + 未开通   → /login?from=当前页（不先 403：先确认"你是谁"再判定"能不能看"）
 *   已登录 + 不需登录 + 已开通 → Page
 *   已登录 + 不需登录 + 未开通 → 403
 *   已登录 + 需登录   + 已开通 → Page
 *   已登录 + 需登录   + 未开通 → 403
 *
 * - 租户未启用的 path 渲染 403（"该学校未开通"）而非摘除路由落 404。
 * - tenantExempt（首页/登录/403/404）跳过裁剪判断：结构性路由被裁
 *   会导致 404 全变 403、登录跳转死锁（详见 config/routes.ts 字段注释）。
 * - 守卫响应式：useTenantStore 订阅 store，租户配置热更新后立即生效。
 */
function RouteElement({ route }: { route: AppRouteConfig }) {
  const { config } = useTenantStore()
  const tenantEnabled =
    route.tenantExempt || config.routes.includes(toFullPath(route.path))
  const Page = route.component

  let el: ReactNode = <Page />
  if (route.feature) {
    el = (
      <FeatureGuard feature={route.feature}>{el}</FeatureGuard>
    )
  }
  if (!tenantEnabled) {
    el = <LazyForbiddenView />
  }
  if (route.requiresAuth) {
    // requiresAuth 最外层：匿名访问「未开通但需登录」的页 → /login?from= 而非 403
    el = <ProtectedRoute>{el}</ProtectedRoute>
  }
  return <>{el}</>
}

export default function App() {
  return (
    // AntApp 提供具备主题上下文的 message / modal（替代静态 ElMessage / ElMessageBox）
    <AntApp>
      <GlobalEvents />
      {/* 路由表由 config/routes.ts 配置驱动（懒加载分片 + 声明式守卫）；
          根路径兜底：布局外未知入口回首页 */}
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={<DefaultLayout />}>
            {APP_ROUTES.map((route) => (
              <Route
                key={route.path}
                path={route.index ? undefined : route.path}
                index={route.index}
                element={<RouteElement route={route} />}
              />
            ))}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AntApp>
  )
}
