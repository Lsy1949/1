/**
 * 首页 domain DTO。
 *
 * 建模原则：后端只下发「结构」（标识 key / 媒体 URL / 跳转目标），
 * 展示文案继续由 i18n 按 key 解析 —— 项目已有完整 i18n 体系，
 * 把文案搬进接口会让中英文案出现两份数据源。
 * 若后端改为直接下发本地化文案，只需扩展本文件的字段与组件取值处。
 */

/** 轮播单项 */
export interface CarouselSlideDTO {
  /** 稳定标识；前端据此拼 i18n 键 `home.carousel.{key}.{field}` */
  key: string
  /** 背景图 URL */
  image: string
  /** 主按钮跳转路由（空字符串 = 前端按按钮文案回退处理） */
  ctaRoute: string
}

/** 最新动态条目 */
export interface NewsItemDTO {
  id: number
  /** 稳定标识；前端据此拼 i18n 键 `home.news.items.{key}.{field}` */
  key: string
  /** 列表缩略图 URL */
  image: string
}

/** 跑马灯条目（数组顺序即展示顺序） */
export interface MarqueeItemDTO {
  /** i18n 键后缀，前端拼 `home.marquee.{key}` */
  key: string
}

/** 快速导航锚点 */
export interface NavSectionDTO {
  /** 目标区块 id（与页面内元素 id 对应） */
  id: string
  /** i18n 键，前端直接 t(nameKey) */
  nameKey: string
}

/** 关于我们区块的统计数字（文案在 i18n，数字由接口给） */
export interface AboutStatDTO {
  /** i18n 键后缀，前端拼 `home.about.stats.{key}` */
  key: string
  value: number
  suffix: string
}
