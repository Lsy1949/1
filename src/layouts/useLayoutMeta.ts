import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * 路由 meta 等价层。
 *
 * Vue 版 Navbar / AppShell 读 route.meta（见 Vue src/router/pc.ts）：
 *   { noPadding: true, transparentNavbar: true } → '/' 与 '/login'
 *   { hideNavbar: true, hideFooter: true }       → '/assessment/take/:id' 与 404 兜底
 * React Router 无 meta，此处按同一路由表的路径规则从 location.pathname 推导，
 * 新增路由时需同步维护 KNOWN_ROUTE_PATTERNS。
 */
export function useLayoutMeta(): {
  transparentNavbar: boolean
  noPadding: boolean
  hideNavbar: boolean
  hideFooter: boolean
} {
  const { pathname } = useLocation()

  return useMemo(() => {
    // 首页与登录页：透明导航 + 无顶部占位
    if (pathname === '/' || pathname === '/login') {
      return { transparentNavbar: true, noPadding: true, hideNavbar: false, hideFooter: false }
    }
    // 测评作答页（'/assessment/take/*' 通配前缀）：沉浸式无导航无页脚
    if (pathname.startsWith('/assessment/take/')) {
      return { transparentNavbar: false, noPadding: false, hideNavbar: true, hideFooter: true }
    }
    // 404 兜底：不匹配任何已注册路由（对应 Vue ':pathMatch(.*)*' catch-all）
    if (!isKnownPath(pathname)) {
      return { transparentNavbar: false, noPadding: false, hideNavbar: true, hideFooter: true }
    }
    return { transparentNavbar: false, noPadding: false, hideNavbar: false, hideFooter: false }
  }, [pathname])
}

/** Vue router/pc.ts 已注册的完整路径模式（':xxx' 为参数段） */
const KNOWN_ROUTE_PATTERNS = [
  '/',
  '/login',
  '/time-capsule',
  '/time-capsule/create',
  '/time-capsule/:id',
  '/square',
  '/square/create',
  '/square/:id',
  '/assessment',
  '/assessment/take/:id',
  '/articles',
  '/articles/list',
  '/articles/:id',
  '/counseling',
  '/counseling/ai-chat',
  '/counseling/companion',
  '/profile',
  '/settings',
]

/** 小型通配匹配：段数一致，且逐段相等或模式段以 ':' 开头即命中 */
function isKnownPath(pathname: string): boolean {
  const segments = pathname.split('/')
  return KNOWN_ROUTE_PATTERNS.some((pattern) => {
    const patternSegments = pattern.split('/')
    if (patternSegments.length !== segments.length) return false
    return patternSegments.every(
      (seg, i) => seg.startsWith(':') || seg === segments[i],
    )
  })
}
