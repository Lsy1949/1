import type { TenantFeatures } from '@/config/tenant/types'

/**
 * 后端下发的菜单树节点。
 *
 * - 文案不下发，只下发 i18n key；图标只下发语义 key，前端自行映射组件
 * - path 必须能在前端静态路由表中找到，否则菜单不渲染（防 404）
 * - feature 可选：有值则该菜单受租户开关控制（前端守卫仍保留，两道兜底）
 * - 不含 permissions / roles / badge：当前无此需求，后端就绪后再扩
 */
export interface MenuItemDTO {
  key: string
  path: string
  i18nKey: string
  feature?: keyof TenantFeatures
  iconKey?: string
  children?: MenuItemDTO[]
}
