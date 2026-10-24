import { http } from 'msw'
import { mocked, ok } from '../utils/response'
import { MENU_MOCK } from '../data/menu'
import type { MenuItemDTO } from '@/api/types/menu'

/**
 * 菜单接口。
 *
 * `GET /api/menu`
 *  - 返回菜单树（key / path / i18nKey / feature / children）
 *  - 真实后端可按 tenantId 重排 / 过滤；当前 mock 与 fallback 菜单等价
 */
export const menuHandlers = [
  http.get(
    '/api/menu',
    mocked(() => ok<MenuItemDTO[]>(MENU_MOCK)),
  ),
]
