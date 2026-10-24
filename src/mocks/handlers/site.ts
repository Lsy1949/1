import { http } from 'msw'
import { mocked, ok } from '../utils/response'
import { TENANT_MOCKS } from '../data/tenant'
import { DEFAULT_TENANT_ID } from '@/config/tenant/default'

/**
 * 站点级接口（mock 即契约）。
 *
 * - GET /api/site/routes：按 X-Tenant-Id 返回该租户路由快照。
 *   【单一数据源】从 TENANT_MOCKS[tenantId].routes 派生（与 /api/tenant/config 同源），
 *   保证两处永不分叉：config 下发 enabled 白名单，此处展开为全量快照
 *   （注册表内 path 未出现在白名单 → enabled: false）。
 * - GET /api/tenants/public：主域登录页学校选择器数据源（公开信息，无需登录）
 */

interface SiteRouteDTO {
  path: string
  componentKey: string
  enabled: boolean
  redirect?: string
}

/** 全量路由注册表快照：与 src/config/routes.ts 的 APP_ROUTES 同源（path + componentKey） */
const FULL_ROUTES: ReadonlyArray<{ path: string; componentKey: string }> = [
  { path: '/', componentKey: 'home' },
  { path: '/time-capsule', componentKey: 'capsule-list' },
  { path: '/time-capsule/create', componentKey: 'capsule-create' },
  { path: '/time-capsule/:id', componentKey: 'capsule-detail' },
  { path: '/square', componentKey: 'square-list' },
  { path: '/square/create', componentKey: 'square-create' },
  { path: '/square/:id', componentKey: 'square-detail' },
  { path: '/assessment', componentKey: 'assessment' },
  { path: '/assessment/take/:id', componentKey: 'assessment-take' },
  { path: '/articles', componentKey: 'articles' },
  { path: '/articles/list', componentKey: 'articles-list' },
  { path: '/articles/:id', componentKey: 'articles-detail' },
  { path: '/counseling', componentKey: 'counseling' },
  { path: '/counseling/ai-chat', componentKey: 'counseling-ai' },
  { path: '/counseling/companion', componentKey: 'counseling-companion' },
  { path: '/profile', componentKey: 'profile' },
  { path: '/settings', componentKey: 'settings' },
  { path: '/login', componentKey: 'login' },
]

/**
 * 从租户配置派生路由快照：
 * - config.routes 缺省 → 全量启用
 * - config.routes 为白名单 → 注册表内 path 在名单中 enabled: true，否则 false
 */
function routesFor(tenantId: string): SiteRouteDTO[] {
  const enabledList = TENANT_MOCKS[tenantId]?.routes
  return FULL_ROUTES.map(r => ({
    ...r,
    enabled: enabledList ? enabledList.includes(r.path) : true,
  }))
}

/**
 * 主域登录页学校选择器数据源（公开信息）。
 * 第一项 default = 主站本身（社会人士），选中后 tenantId=default 登录留本站。
 * name 为站点身份标识，由后端直出，前端不做 i18n（契约 §2.3）。
 */
const PUBLIC_TENANTS = [
  { tenantId: DEFAULT_TENANT_ID, name: '社会人士（本站）', logo: '' },
  { tenantId: 'nist', name: '南京信息职业技术学院 · 青野心旅', logo: '' },
  { tenantId: 'tsinghua', name: '清华大学 · 紫荆心旅', logo: '' },
]

export const siteHandlers = [
  http.get(
    '/api/site/routes',
    mocked(({ request }) => {
      const tenantId = request.headers.get('X-Tenant-Id') ?? DEFAULT_TENANT_ID
      return ok(routesFor(tenantId))
    }),
  ),
  http.get('/api/tenants/public', mocked(() => ok(PUBLIC_TENANTS))),
]
