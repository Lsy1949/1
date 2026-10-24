import { http } from 'msw'
import { mocked, ok } from '../utils/response'
import { ABOUT_STATS, NAV_SECTIONS, homeContentFor } from '../data/home'
import { DEFAULT_TENANT_ID } from '@/config/tenant/default'
import type {
  AboutStatDTO,
  CarouselSlideDTO,
  MarqueeItemDTO,
  NavSectionDTO,
  NewsItemDTO,
} from '@/api/types'

/**
 * 首页各区块数据接口（文案由 i18n 按 key 解析，见 data/home.ts 的建模约定）。
 *
 * 【mock 即契约】按请求头 X-Tenant-Id 分发各租户内容；
 * 前端不传租户参数；空数组 → 前端区块隐藏，不得兜底别校数据。
 */
export const homeHandlers = [
  http.get(
    '/api/home/carousel',
    mocked(({ request }) =>
      ok<CarouselSlideDTO[]>(homeContentFor(request.headers.get('X-Tenant-Id') ?? DEFAULT_TENANT_ID).carousel),
    ),
  ),
  http.get(
    '/api/home/news',
    mocked(({ request }) =>
      ok<NewsItemDTO[]>(homeContentFor(request.headers.get('X-Tenant-Id') ?? DEFAULT_TENANT_ID).news),
    ),
  ),
  http.get(
    '/api/home/marquee',
    mocked(({ request }) =>
      ok<MarqueeItemDTO[]>(homeContentFor(request.headers.get('X-Tenant-Id') ?? DEFAULT_TENANT_ID).marquee),
    ),
  ),
  http.get('/api/home/nav', mocked(() => ok<NavSectionDTO[]>(NAV_SECTIONS))),
  http.get('/api/home/about-stats', mocked(() => ok<AboutStatDTO[]>(ABOUT_STATS))),
]
