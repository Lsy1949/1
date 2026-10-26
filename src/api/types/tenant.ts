/**
 * 租户 domain DTO。
 *
 * TenantConfig 的权威定义在 `src/config/tenant/types.ts`（多租户三层定制模型的完整形态）；
 * 本文件描述**接口上的形态**，两者刻意区分：
 *
 *  - `TenantConfig`     —— 前端内部使用的完整配置（mergeTenantConfig 做字段级保底后得到）
 *  - `TenantConfigDTO`  —— 后端返回的「可能缺任意字段」的形态
 *
 * 为什么嵌套层也要 Partial：服务端允许省略「由前端按色板派生」的七档色值
 * （只给 defaultPalette），若直接用 Partial<TenantConfig>，其嵌套的 theme 仍要求
 * 七档齐全，类型与契约不符。
 */
import type {
  TenantAssets,
  TenantBrand,
  TenantFeatures,
  TenantPropaganda,
  TenantTheme,
} from '@/config/tenant/types'

export type {
  TenantAssets,
  TenantBrand,
  TenantConfig,
  TenantFeatures,
  TenantPropaganda,
  TenantPropagandaFeature,
  TenantTheme,
} from '@/config/tenant/types'

/** `GET /api/tenant/config` 入参 */
export interface TenantConfigQuery {
  tenantId: string
}

/** `GET /api/tenant/config` 出参：任意层可缺字段，由 loader 保底填充 */
export interface TenantConfigDTO {
  tenantId?: string
  brand?: Partial<TenantBrand>
  theme?: Partial<TenantTheme>
  /** 登录页宣传区文案（缺省字段由前端内置文案保底） */
  propaganda?: Partial<TenantPropaganda>
  /** 该租户启用的路由清单（缺省 = 全量；path 须在前端注册表内，非法值丢弃） */
  routes?: string[]
  assets?: Partial<TenantAssets>
  features?: Partial<TenantFeatures>
}
