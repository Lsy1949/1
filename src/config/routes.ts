/**
 * 路由单一配置文件（新增页面只改这里 + 建页面文件，不再动 App.tsx）。
 *
 * 设计：
 *  - 本表是 path → 组件的唯一注册处，声明式表达守卫元数据：
 *      feature      → FeatureGuard（租户模块开关，关闭渲染 403）
 *      requiresAuth → ProtectedRoute（未登录跳 /login）
 *  - 组件必须在前端打包：后端/租户配置只做「裁剪」（routes 清单决定该
 *    租户启用哪些 path，见 config/tenant/types.ts），不下发组件。
 *  - APP_ROUTE_PATHS / isKnownRoutePath 由本表派生（useMenu 的菜单 path
 *    校验依赖），不再手工维护第二份清单。
 *  - path 为相对布局路由的子路径（与 <Route path> 一致）：首页用
 *    path: '' + index: true；'*' 为 404 catch-all（不参与 path 校验集）。
 *  - 路由集合 1:1 对齐 Vue 版 router/pc.ts（迁移基线）；动态参数路由
 *    （:id）记录为模板形式，不作为菜单入口。
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { matchPath } from 'react-router-dom'
import type { TenantFeatures } from './tenant/types'

export interface AppRouteConfig {
  /** 子路径（相对布局路由；'' + index=true 表示首页） */
  path: string
  /** 页面组件（懒加载，保持按需分片） */
  component: LazyExoticComponent<ComponentType>
  /** 首页标志（渲染为 <Route index>，不写 path） */
  index?: boolean
  /** 租户模块开关：有值则受 FeatureGuard 守卫 */
  feature?: keyof TenantFeatures
  /** 登录守卫：true 时未登录跳 /login?from=当前页 */
  requiresAuth?: boolean
  /**
   * 租户裁剪豁免：结构性路由（首页 / 登录 / 403 / 404 catch-all）必须
   * 永远可达，不参与租户 routes 清单判断 ——
   * · '*'（404）被裁会让所有未知 URL 误显示 403
   * · /login 被裁 → 未登录跳转死锁；/403 被裁 → 错误页自引用
   *
   * ⚠️ 与 requiresAuth 互斥：两者不应同时为 true（豁免后裁剪失效，
   * 「永远可达且必须登录」的语义不成立，属配置错误）。
   */
  tenantExempt?: boolean
  /** 业务分组（仅可读性/注释用途） */
  group?: string
}

// ---- 页面懒加载（原 App.tsx 迁入，按需分片不变） ----
const HomePageView = lazy(() => import('@/pages/home/HomePageView'))
const CapsuleListView = lazy(() => import('@/pages/time-capsule/CapsuleListView'))
const CapsuleCreateView = lazy(() => import('@/pages/time-capsule/CapsuleCreateView'))
const CapsuleDetailView = lazy(() => import('@/pages/time-capsule/CapsuleDetailView'))
const SquareListView = lazy(() => import('@/pages/square/SquareListView'))
const SquareCreateView = lazy(() => import('@/pages/square/SquareCreateView'))
const SquareDetailView = lazy(() => import('@/pages/square/SquareDetailView'))
const AssessmentCenterView = lazy(() => import('@/pages/assessment/AssessmentCenterView'))
const AssessmentTakeView = lazy(() => import('@/pages/assessment/AssessmentTakeView'))
const ArticleCenterView = lazy(() => import('@/pages/article/ArticleCenterView'))
const ArticleListView = lazy(() => import('@/pages/article/ArticleListView'))
const ArticleDetailView = lazy(() => import('@/pages/article/ArticleDetailView'))
const CounselingCenterView = lazy(() => import('@/pages/counseling/CounselingCenterView'))
const AiConsultView = lazy(() => import('@/pages/ai/AiConsultView'))
const AiCompanionView = lazy(() => import('@/pages/ai/AiCompanionView'))
const ProfileView = lazy(() => import('@/pages/profile/ProfileView'))
const SettingsView = lazy(() => import('@/pages/settings/SettingsView'))
const LoginView = lazy(() => import('@/pages/auth/LoginView'))
const NotFoundView = lazy(() => import('@/pages/notfound/NotFoundView'))
/** 403 页：独立导出供租户裁剪守卫复用（与 /403 路由共用同一分片） */
export const LazyForbiddenView = lazy(() => import('@/pages/error/ForbiddenView'))

export const APP_ROUTES: AppRouteConfig[] = [
  { path: '', index: true, component: HomePageView, tenantExempt: true, group: '首页' },

  // ---- 时光胶囊 ----
  { path: 'time-capsule', component: CapsuleListView, feature: 'timeCapsule', group: '时光胶囊' },
  { path: 'time-capsule/create', component: CapsuleCreateView, feature: 'timeCapsule', group: '时光胶囊' },
  { path: 'time-capsule/:id', component: CapsuleDetailView, feature: 'timeCapsule', group: '时光胶囊' },

  // ---- 心事广场 ----
  { path: 'square', component: SquareListView, feature: 'square', group: '心事广场' },
  { path: 'square/create', component: SquareCreateView, feature: 'square', group: '心事广场' },
  { path: 'square/:id', component: SquareDetailView, feature: 'square', group: '心事广场' },

  // ---- 心理测评（take 的 params.id = 量表 key，原 Vue 命名路由改路径参数） ----
  { path: 'assessment', component: AssessmentCenterView, feature: 'assessment', group: '心理测评' },
  { path: 'assessment/take/:id', component: AssessmentTakeView, feature: 'assessment', group: '心理测评' },

  // ---- 心晴阅读 ----
  { path: 'articles', component: ArticleCenterView, feature: 'articles', group: '心晴阅读' },
  { path: 'articles/list', component: ArticleListView, feature: 'articles', group: '心晴阅读' },
  { path: 'articles/:id', component: ArticleDetailView, feature: 'articles', group: '心晴阅读' },

  // ---- 咨询中心 ----
  { path: 'counseling', component: CounselingCenterView, feature: 'counseling', group: '咨询中心' },
  { path: 'counseling/ai-chat', component: AiConsultView, feature: 'counseling', group: '咨询中心' },
  { path: 'counseling/companion', component: AiCompanionView, feature: 'counseling', group: '咨询中心' },

  // ---- 用户（requiresAuth 由 ProtectedRoute 承担，等价路由守卫） ----
  { path: 'profile', component: ProfileView, requiresAuth: true, group: '用户' },
  { path: 'settings', component: SettingsView, requiresAuth: true, group: '用户' },

  // ---- 登录（旧版在 MainLayout 内以透明导航呈现，保持一致）----
  { path: 'login', component: LoginView, tenantExempt: true, group: '登录' },

  // ---- 错误页（403 支持 FeatureGuard / 租户裁剪复用；404 为 catch-all）----
  { path: '403', component: LazyForbiddenView, tenantExempt: true, group: '错误页' },
  { path: '*', component: NotFoundView, tenantExempt: true, group: '错误页' },
]

/** 相对子路径 → 完整路径（'' → '/'）。租户 routes 清单与菜单校验均用完整形式 */
export function toFullPath(rel: string): string {
  if (rel === '') return '/'
  return rel.startsWith('/') ? rel : `/${rel}`
}

/** 静态可校验 path 全集（派生自 APP_ROUTES；'*' catch-all 不参与） */
export const APP_ROUTE_PATHS: readonly string[] = APP_ROUTES.filter(
  (r) => r.path !== '*',
).map((r) => toFullPath(r.path))

/** path 是否存在于前端路由表（用于菜单渲染前校验，防 404） */
export function isKnownRoutePath(path: string): boolean {
  return APP_ROUTE_PATHS.includes(path)
}

/**
 * 实际 pathname 是否命中路由清单（支持 :id 动态段，与 <Route> 同语义 end: true）。
 *
 * 与 isKnownRoutePath 的分工：后者校验「模板 path 是否登记」，只做精确匹配；
 * 本函数校验「用户实际访问的 URL 能否被某条模板匹配」，必须走 matchPath，
 * 否则 /square/:id 这类动态路由会被误判为不可达。
 *
 * ⚠️ 必须在 store selector 中安全调用：保持纯函数（只依赖入参，不读
 * window.location / 时间 / 外部可变状态），否则 selector 返回值不稳定，
 * 会导致重复渲染或漏更新。
 */
export function isRouteReachable(pathname: string, routes: readonly string[]): boolean {
  return routes.some((route) => matchPath({ path: route, end: true }, pathname) !== null)
}
