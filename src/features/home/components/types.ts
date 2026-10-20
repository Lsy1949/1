/** 首页区块组件共享类型（features/home） */

/** 轮播幻灯片（页面层用接口 DTO + i18n 组装后注入 Carousel） */
export interface CarouselSlide {
  /** 稳定标识；页面据此拼 i18n 键 `home.carousel.{key}.{field}` */
  key: string
  title: string
  tag: string
  description: string
  buttonText: string
  image: string
  /** 主按钮跳转路由（自接口透传；空字符串 = 未配置，由页面给出提示） */
  ctaRoute: string
}

/** 最新动态条目（由 i18n 消息展开补充 id/image） */
export interface NewsItem {
  category: string
  title: string
  summary: string
  date: string
}
