/**
 * 多租户配置类型定义。
 *
 * 【假设 A1】后端接口契约未定，以下为本地先行类型；
 * 后端提供 OpenAPI 后由 openapi-typescript 生成类型替换，
 * 字段不兼容时只需调整本文件与 loader 的映射，不影响其余代码。
 * 接口路径暂定 GET /tenant/config（Q6 确认为公开接口）。
 */

import type { PaletteKey, TenantThemeOverrides } from '@/styles/palette'

/** 品牌：每个高校的独立标识 */
export interface TenantBrand {
  /** 租户（高校）名称 */
  name: string
  /** Logo 图片 URL（空字符串 = 使用内置默认） */
  logo: string
  /** Favicon URL */
  favicon: string
  /** 版权声明 */
  copyright: string
}

/**
 * 主题：三层定制模型
 *
 *  L1 · defaultPalette：预置色板 key（blue/green/purple/orange）或 'custom'。
 *       'custom' 需同时给 customPrimaryColor（6 位 hex），seed 以
 *       <html> inline style 注入，全部档位由派生公式自动生成。
 *       用户可在偏好里覆盖预置色板（localStorage 带 tenantId 前缀），切租户不串。
 *
 *  L2 · themeOverrides：白名单语义 token 覆写（仅 --bg-* / --text-* /
 *       --border-* / --shadow-* / --navbar-* / --brand-radius / --brand-font-family），
 *       禁止覆盖底层色阶（--blue-300 等）以免破坏对比度系统。
 *
 *  L3 · 局部样式：业务方通过 [data-tenant] 作用域变量或组件 variant 实现，
 *       禁止后端注入裸 CSS 字符串。
 *
 *  以下 primaryColor/darkColor/... 七档是 L1 seed 经 deriveShades() 派生的
 *  "计算结果"（与 palettes.css 的 color-mix 同公式），保留供 antd token
 *  桥接使用（TenantProvider.useTenantTokens）。后端字段可省略，
 *  前端根据 defaultPalette / customPrimaryColor 自动填充。
 */
export interface TenantTheme {
  /** 品牌主色（驱动 antd 全部色阶） */
  primaryColor: string
  /** 品牌深阶：hover / 按压（对应 --brand-primary-dark） */
  darkColor: string
  /** 品牌更深阶（对应 --brand-primary-deep） */
  deepColor: string
  /** 品牌最深阶（对应 --brand-primary-deeper） */
  deeperColor: string
  /** 品牌浅色高亮底（对应 --brand-primary-soft） */
  softColor: string
  /** 品牌极浅底（对应 --brand-primary-faint） */
  faintColor: string
  /** 品牌页面浅底（对应 --brand-primary-wash） */
  washColor: string
  /** 全局圆角 */
  radius: string
  /** 全局字体（空字符串 = 系统默认） */
  fontFamily: string
  /** L1 · 租户默认色板（预置 key 或 'custom'） */
  defaultPalette?: PaletteKey
  /**
   * L1 · 自定义品牌 seed（仅 defaultPalette='custom' 时生效）。
   * 契约：6 位 hex（派生公式与 CSS/TS 校验均只接受 hex）；
   * 非法或缺失时整体回退默认色板 blue。
   */
  customPrimaryColor?: string
  /** L2 · 白名单语义 token 覆写 */
  themeOverrides?: TenantThemeOverrides
}

/** 业务资源：租户可自定义的静态素材 */
export interface TenantAssets {
  /** 登录页背景图 URL（空字符串 = 使用内置默认） */
  loginBackground: string
  /** 首页 Banner 图 URL（空字符串 = 使用内置默认） */
  homeBanner: string
}

/** 功能开关：按租户启停业务模块 */
export interface TenantFeatures {
  timeCapsule: boolean
  square: boolean
  assessment: boolean
  counseling: boolean
  articles: boolean
}

/** 租户配置（完整形态，字段级保底后 guarantee 完整） */
export interface TenantConfig {
  tenantId: string
  brand: TenantBrand
  theme: TenantTheme
  /**
   * 该租户启用的路由清单（path 全集见 config/routes.ts 的 APP_ROUTE_PATHS，
   * 由注册表派生）。后端随租户配置一起下发，只做「裁剪」、不下发组件。
   *
   * fail-open / fail-closed 边界（merge 行为，见 default.ts）：
   *  - 完全未下发 routes → 全量启用（fail-open，后端零成本接入）
   *  - 一旦下发 → 按快照严格裁剪（fail-closed：前端新增页面必须同步
   *    后端清单，否则新页面对已下发清单的租户渲染 403）
   *  - 含非法 path（前端注册表中不存在）→ 该项静默丢弃，防下发前端没有的页面
   *  - 不在清单内的 path：路由仍注册，渲染 403（"该学校未开通"，
   *    与 FeatureGuard 同体验），用户直接输 URL 也能得到可理解反馈
   *
   * 与 features 的关系（两者同时生效、正交并存）：
   *  - feature = 模块级合同开关（菜单过滤 + 路由守卫双用，粗粒度）
   *  - routes  = path 级快照裁剪（路由可达性 + 导航入口同步过滤，细粒度）
   *  - 首页/登录/403/404 为结构性路由，豁免裁剪（routes.ts tenantExempt）
   */
  routes: string[]
  assets: TenantAssets
  features: TenantFeatures
}
