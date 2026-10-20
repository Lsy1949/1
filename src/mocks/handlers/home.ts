import { http } from 'msw'
import { mocked, ok } from '../utils/response'
import {
  ABOUT_STATS,
  CAROUSEL_SLIDES,
  MARQUEE_ITEMS,
  NAV_SECTIONS,
  NEWS_ITEMS,
} from '../data/home'
import type {
  AboutStatDTO,
  CarouselSlideDTO,
  MarqueeItemDTO,
  NavSectionDTO,
  NewsItemDTO,
} from '@/api/types'

/** 首页各区块数据接口（文案由 i18n 按 key 解析，见 data/home.ts 的建模约定） */
export const homeHandlers = [
  http.get('/api/home/carousel', mocked(() => ok<CarouselSlideDTO[]>(CAROUSEL_SLIDES))),
  http.get('/api/home/news', mocked(() => ok<NewsItemDTO[]>(NEWS_ITEMS))),
  http.get('/api/home/marquee', mocked(() => ok<MarqueeItemDTO[]>(MARQUEE_ITEMS))),
  http.get('/api/home/nav', mocked(() => ok<NavSectionDTO[]>(NAV_SECTIONS))),
  http.get('/api/home/about-stats', mocked(() => ok<AboutStatDTO[]>(ABOUT_STATS))),
]
