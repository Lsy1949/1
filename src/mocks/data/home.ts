import type {
  AboutStatDTO,
  CarouselSlideDTO,
  MarqueeItemDTO,
  NavSectionDTO,
  NewsItemDTO,
} from '@/api/types'
import imgNist from '@/assets/images/nist-bg.jpg'
import imgTsinghua from '@/assets/images/tsinghua-bg.jpg'

/**
 * 首页内容 mock（模拟后端 `GET /api/home/*` 的返回）。
 *
 * 建模约定：接口只下发「结构」—— 标识 key / 媒体 URL / 跳转目标，
 * 展示文案仍由 i18n 按 key 解析（`home.carousel.{key}.title` 等），
 * 避免中英文案出现两份数据源。
 *
 * 素材走 Vite 资源导入：本文件的消费方（mocks/browser）仅在 DEV 动态载入，
 * 故这些图片不会进入生产包。
 */

/** `GET /api/home/carousel` —— 顺序即轮播顺序 */
export const CAROUSEL_SLIDES: CarouselSlideDTO[] = [
  { key: 'slide1', image: imgNist, ctaRoute: '/assessment' },
  { key: 'slide2', image: imgTsinghua, ctaRoute: '/time-capsule' },
  { key: 'slide3', image: imgNist, ctaRoute: '/counseling' },
]

/** `GET /api/home/news` —— key 为 i18n 数组下标（`home.news.items.{key}`） */
export const NEWS_ITEMS: NewsItemDTO[] = [
  { id: 1, key: '0', image: imgNist },
  { id: 2, key: '1', image: imgTsinghua },
  { id: 3, key: '2', image: imgNist },
  { id: 4, key: '3', image: imgTsinghua },
]

/** `GET /api/home/marquee` —— 顺序即滚动顺序 */
export const MARQUEE_ITEMS: MarqueeItemDTO[] = [
  { key: 'users' },
  { key: 'experts' },
  { key: 'satisfaction' },
  { key: 'aiPsych' },
  { key: 'support' },
  { key: 'slogan' },
]

/** `GET /api/home/nav` —— 快速导航锚点（id 需与页面内区块 id 对应） */
export const NAV_SECTIONS: NavSectionDTO[] = [
  { id: 'top', nameKey: 'home.nav.top' },
  { id: 'news', nameKey: 'home.nav.news' },
  { id: 'about', nameKey: 'home.nav.about' },
  { id: 'services', nameKey: 'home.nav.services' },
  { id: 'features', nameKey: 'home.nav.features' },
  { id: 'contact', nameKey: 'home.nav.contact' },
]

/** `GET /api/home/about-stats` —— 关于我们区块的数字（文案在 i18n） */
export const ABOUT_STATS: AboutStatDTO[] = [
  { key: 'statUsers', value: 10, suffix: 'k+' },
  { key: 'statExperts', value: 50, suffix: '+' },
  { key: 'statSatisfaction', value: 98, suffix: '%' },
]
