/** 首页区块组件共享类型（features/home） */

/** 轮播幻灯片 */
export interface CarouselSlide {
  title: string
  tag: string
  description: string
  buttonText: string
  image: string
}

/** 最新动态条目（由 i18n 消息展开补充 id/image） */
export interface NewsItem {
  category: string
  title: string
  summary: string
  date: string
}
