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
 *
 * 【租户差异化】（mock 即契约：后端按 X-Tenant-Id 过滤，前端不传租户参数）
 * 各租户一套数据，图片明显不同（色值/构图差异），便于肉眼验证内容隔离；
 * tsinghua 的 marquee 刻意为空数组 —— 验证「空数据区块隐藏、不兜底别校」。
 * key 仍按 i18n 下标语义；不同租户共用同一 i18n 文案是 mock 的简化，
 * 真实环境如需校际文案差异，由后端在 DTO 增加 title 直出字段（见契约文档待确认）。
 */

/** `GET /api/home/carousel` —— 顺序即轮播顺序 */
const CAROUSEL_DEFAULT: CarouselSlideDTO[] = [
  { key: 'slide1', image: imgNist, ctaRoute: '/assessment' },
  { key: 'slide2', image: imgTsinghua, ctaRoute: '/time-capsule' },
  { key: 'slide3', image: imgNist, ctaRoute: '/counseling' },
]
const CAROUSEL_NIST: CarouselSlideDTO[] = [
  { key: 'slide1', image: imgNist, ctaRoute: '/assessment' },
  { key: 'slide2', image: imgNist, ctaRoute: '/time-capsule' },
]
const CAROUSEL_TSINGHUA: CarouselSlideDTO[] = [
  { key: 'slide1', image: imgTsinghua, ctaRoute: '/assessment' },
  { key: 'slide2', image: imgTsinghua, ctaRoute: '/articles' },
  { key: 'slide3', image: imgTsinghua, ctaRoute: '/counseling' },
]

/** `GET /api/home/news` —— key 为 i18n 数组下标（`home.news.items.{key}`） */
const NEWS_DEFAULT: NewsItemDTO[] = [
  { id: 1, key: '0', image: imgNist },
  { id: 2, key: '1', image: imgTsinghua },
  { id: 3, key: '2', image: imgNist },
  { id: 4, key: '3', image: imgTsinghua },
]
const NEWS_NIST: NewsItemDTO[] = [
  { id: 101, key: '0', image: imgNist },
  { id: 102, key: '1', image: imgNist },
]
const NEWS_TSINGHUA: NewsItemDTO[] = [
  { id: 201, key: '0', image: imgTsinghua },
  { id: 202, key: '1', image: imgTsinghua },
  { id: 203, key: '2', image: imgTsinghua },
]

/** `GET /api/home/marquee` —— 顺序即滚动顺序 */
const MARQUEE_DEFAULT: MarqueeItemDTO[] = [
  { key: 'users' },
  { key: 'experts' },
  { key: 'satisfaction' },
  { key: 'aiPsych' },
  { key: 'support' },
  { key: 'slogan' },
]
const MARQUEE_NIST: MarqueeItemDTO[] = [
  { key: 'users' },
  { key: 'slogan' },
]
/** 空数据场景：tsinghua 跑马灯为空 → 前端区块隐藏，不得兜底别校数据 */
const MARQUEE_TSINGHUA: MarqueeItemDTO[] = []

/** `GET /api/home/nav` —— 快速导航锚点（结构数据，各租户一致） */
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

/** 按租户分发的首页数据集（未知租户回退 default，与 tenant/config 约定一致） */
export const HOME_CONTENT_BY_TENANT: Record<
  string,
  { carousel: CarouselSlideDTO[]; news: NewsItemDTO[]; marquee: MarqueeItemDTO[] }
> = {
  default: { carousel: CAROUSEL_DEFAULT, news: NEWS_DEFAULT, marquee: MARQUEE_DEFAULT },
  nist: { carousel: CAROUSEL_NIST, news: NEWS_NIST, marquee: MARQUEE_NIST },
  tsinghua: { carousel: CAROUSEL_TSINGHUA, news: NEWS_TSINGHUA, marquee: MARQUEE_TSINGHUA },
}

export function homeContentFor(tenantId: string) {
  return HOME_CONTENT_BY_TENANT[tenantId] ?? HOME_CONTENT_BY_TENANT.default
}
