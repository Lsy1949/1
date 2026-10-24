/**
 * 导航菜单 hook：后端下发菜单树，前端兜底四道防线。
 *
 * 1. path 校验：菜单 path 不在前端静态路由表内 → 过滤该节点（防 404）
 * 2. feature 过滤：feature 关闭 → 过滤（后端下发 + 前端守卫双道兜底）
 * 3. 租户路由裁剪过滤：path 不在该租户 routes 清单内 → 过滤
 *    （与路由层 403 同步——裁掉的模块不允许残留可视入口）
 * 4. 接口失败 fallback：query 出错时静默回退内置菜单常量，不白屏；
 *    fallback 同样过 1-3 道过滤，后端菜单失败时裁掉的入口不会重新露出
 *
 * 菜单属低频变更数据，staleTime 放长（10 分钟），切回窗口不主动刷新。
 */
import { useQuery } from '@tanstack/react-query'
import { menuApi } from '@/api'
import type { MenuItemDTO } from '@/api'
import { isKnownRoutePath } from '@/config/routes'
import { FALLBACK_MENU } from '@/layouts/fallbackMenu'
import { useTenantStore } from '@/stores/useTenantStore'

/** 过滤 path 不存在的节点（递归；子项全被滤掉时父节点仍保留——父级是聚合入口） */
function filterByRoute(items: MenuItemDTO[]): MenuItemDTO[] {
  return items.filter((item) => isKnownRoutePath(item.path))
}

/** 过滤 feature 关闭的节点（递归；父节点任一子 feature 开启即保留） */
function filterByFeature(items: MenuItemDTO[], isEnabled: (f: NonNullable<MenuItemDTO['feature']>) => boolean): MenuItemDTO[] {
  return items.filter((item) => {
    if (item.feature && !isEnabled(item.feature)) return false
    if (item.children?.length) {
      item.children = filterByFeature(item.children, isEnabled)
    }
    return true
  })
}

/** 过滤租户路由裁剪掉的节点（递归）：不在 routes 清单 → 整棵子树不展示 */
function filterByTenantRoutes(items: MenuItemDTO[], enabledRoutes: ReadonlySet<string>): MenuItemDTO[] {
  return items.filter((item) => {
    const keep = enabledRoutes.has(item.path)
    if (keep && item.children?.length) {
      item.children = filterByTenantRoutes(item.children, enabledRoutes)
    }
    return keep
  })
}

export function useMenu() {
  const tenantStore = useTenantStore()

  const query = useQuery({
    queryKey: ['menu'],
    queryFn: ({ signal }) => menuApi.fetchMenu(signal),
    staleTime: 10 * 60 * 1000,
  })

  // 接口失败/无数据 → fallback 菜单（内置常量，内容与 mock 等价）。
  // fallback 与接口数据走同一条过滤链：租户裁剪的入口在任何来源下都不露出
  const raw = query.data ?? FALLBACK_MENU

  const tenantRoutes = new Set(tenantStore.config.routes)
  const items = filterByTenantRoutes(
    filterByFeature(filterByRoute(raw), (f) => tenantStore.isFeatureEnabled(f)),
    tenantRoutes,
  )

  return { items, isError: query.isError }
}
