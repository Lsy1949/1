import { get } from '../request'
import type { MenuItemDTO } from '../types/menu'

/**
 * 菜单模块 API。
 *
 * 后端只下发菜单树（含 feature 关联与排序），路由表仍为前端静态定义；
 * 菜单 path 须在前端路由表中存在，否则渲染层会过滤（防 404）。
 */

/** 获取导航菜单（租户维度） */
export function fetchMenu(signal?: AbortSignal): Promise<MenuItemDTO[]> {
  return get<MenuItemDTO[]>('menu', { signal })
}
