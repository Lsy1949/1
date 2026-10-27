import type { ThemeConfig } from 'antd'

/**
 * 响应式尺寸 token 桥（Phase 0 基建）
 *
 * 职责：把 tokens.css「流体尺寸层 L0.5」的阶梯映射到 antd v6 token。
 * main.tsx 的 AntdThemeBridge 将本对象 spread 进 theme（token 层放
 * ...tokens 租户键之后、显式键 fontFamily 之前）；页面级嵌套
 * ConfigProvider 可直接引用 RESPONSIVE_TOKEN / RESPONSIVE_COMPONENTS
 * 补齐尺寸键（嵌套默认 inherit: true，会自动继承，通常无需重复配置）。
 *
 * 键类型约束（已核对 antd v6.6.7 类型定义）：
 *  - fontSize / fontSizeSM / fontSizeLG / fontSizeXL / controlHeight 的
 *    v6 类型是 number，无法引用 var(--fs-*) —— 用与 tokens.css
 *    1920 端点一致的数值锚定；需要流体的场景让组件 CSS 直接用
 *    var(--fs-*)（本项目页面样式走 CSS Module，天然可行）。
 *  - fontSizeHeading1~5 与 Modal/Card 等组件标题 token 的 v6 类型是
 *    number | string，可安全引用 var(--fs-*)（cssVar 模式下原样写入
 *    CSS 变量，运行时解析——与 AntdThemeBridge 中 Input 底色写
 *    var(--input-bg) 同一用法先例）。
 *
 * ⚠️ 刻意不写 borderRadius：租户 --brand-radius 已由 useTenantTokens()
 * 映射为 theme.token.borderRadius（经 ...tokens 通道注入），本层若再写
 * 同名键会压掉租户配置；同理不写任何颜色键与 fontFamily。
 */

/** 尺寸相关 antd v6 全局 token（spread 进 theme.token；1920 处与 antd 默认值全部相等，基准视口视觉零变化） */
export const RESPONSIVE_TOKEN = {
  /** 用途：全局正文字号（antd v6 seed token，类型仅 number）。数值 = --fs-base 的 1920 端点（clamp(14px, 0.7292vw, 17px)） */
  fontSize: 14,
  /** 用途：小号文字（antd v6 token）。数值 = --fs-xs 的 1920 端点 12px */
  fontSizeSM: 12,
  /** 用途：大号文字（antd v6 token）。数值 = --fs-md 的 1920 端点 16px */
  fontSizeLG: 16,
  /** 用途：超大号文字（antd v6 token）。数值 = --fs-lg 的 1920 端点 20px */
  fontSizeXL: 20,
  /** 用途：h1 标题字号（antd v6 token，接受 CSS 变量）→ --fs-3xl（1920=38px=antd 默认，更大视口流体放大至 46px） */
  fontSizeHeading1: 'var(--fs-3xl)',
  /** 用途：h2 标题字号（antd v6 token，接受 CSS 变量）→ --fs-2xl（1920=30px=antd 默认，3840 封顶 36px） */
  fontSizeHeading2: 'var(--fs-2xl)',
  /** 用途：h3 标题字号（antd v6 token，接受 CSS 变量）→ --fs-xl（1920=24px=antd 默认，3840 封顶 29px） */
  fontSizeHeading3: 'var(--fs-xl)',
  /** 用途：h4 标题字号（antd v6 token，接受 CSS 变量）→ --fs-lg（1920=20px=antd 默认，3840 封顶 24px） */
  fontSizeHeading4: 'var(--fs-lg)',
  /** 用途：h5 标题字号（antd v6 token，接受 CSS 变量）→ --fs-md（1920=16px=antd 默认，3840 封顶 19px） */
  fontSizeHeading5: 'var(--fs-md)',
  /** 用途：基础控件高度（antd v6 seed token，类型仅 number）。数值 = --sp-8 的 1920 端点 32px（= antd 默认，锚定声明） */
  controlHeight: 32,
} satisfies ThemeConfig['token']

/** 组件级标题字号（antd v6 组件 token，类型均接受 CSS 变量；1920 处与各自默认值相等，视觉零变化） */
export const RESPONSIVE_COMPONENTS = {
  /** 用途：Modal 标题字号（antd v6 Modal.titleFontSize，默认 16）→ --fs-md（1920=16） */
  Modal: {
    titleFontSize: 'var(--fs-md)',
  },
  /** 用途：Card 卡片头标题字号（antd v6 Card.headerFontSize/headerFontSizeSM，默认 16/14）→ --fs-md / --fs-base */
  Card: {
    headerFontSize: 'var(--fs-md)',
    headerFontSizeSM: 'var(--fs-base)',
  },
  /** 用途：Result 结果页标题字号（antd v6 Result.titleFontSize，默认 24）→ --fs-xl（1920=24） */
  Result: {
    titleFontSize: 'var(--fs-xl)',
  },
  /* 注：Notification 在 v6 的组件 token 中已无 titleFontSize（改为内部
     派生），故不在此配置——标题字号随全局 fontSize 通道走 */
} satisfies ThemeConfig['components']

/** 供 main.tsx AntdThemeBridge spread 的整体对象（只含尺寸语义，见文件头合并决策） */
export const responsiveTheme: Pick<ThemeConfig, 'token' | 'components'> = {
  token: RESPONSIVE_TOKEN,
  components: RESPONSIVE_COMPONENTS,
}
