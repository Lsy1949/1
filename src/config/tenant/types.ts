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
 *  L1 · defaultPalette：从预置色板（PALETTES）中选一套作为租户默认。
 *       用户可在偏好里覆盖（localStorage 带 tenantId 前缀），切租户不串。
 *
 *  L2 · themeOverrides：白名单语义 token 覆写（仅 --bg-* / --text-* /
 *       --border-* / --shadow-* / --navbar-* / --brand-radius / --brand-font-family），
 *       禁止覆盖底层色阶（--blue-300 等）以免破坏对比度系统。
 *
 *  L3 · 局部样式：业务方通过 [data-tenant] 作用域变量或组件 variant 实现，
 *       禁止后端注入裸 CSS 字符串。
 *
 *  以下 primaryColor/darkColor/... 七档是 L1 palette 计算后的"派生结果"，
 *  保留供 antd token 桥接使用（TenantProvider.useTenantTokens）。
 *  后端字段可省略，前端根据 defaultPalette 自动填充。
 */
export interface TenantTheme {
  /** 品牌主色（驱动 Element Plus / Vant 全部色阶） */
  primaryColor: string
  /** 品牌深阶：hover / 按压（对应 --brand-primary-dark） */
  darkColor: string
  /** 品牌更深阶（对应 --brand-primary-deep） */
  deepColor: string
  /** 品牌最深阶（对应 --brand-primary-deeper） */
  deeperColor: string
  /** 品牌浅蓝高亮底（对应 --brand-primary-soft） */
  softColor: string
  /** 品牌极浅底（对应 --brand-primary-faint） */
  faintColor: string
  /** 品牌页面浅底（对应 --brand-primary-wash） */
  washColor: string
  /** 全局圆角 */
  radius: string
  /** 全局字体（空字符串 = 系统默认） */
  fontFamily: string
  /** L1 · 租户默认色板 */
  defaultPalette?: PaletteKey
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
  assets: TenantAssets
  features: TenantFeatures
}
