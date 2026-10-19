/**
 * home feature 对外出口：外部一律 import from '@/features/home'。
 * 组件供 pages 层组合；类型仅暴露页面所需的对外契约。
 */
export { default as Carousel } from './components/Carousel'
export { default as Marquee } from './components/Marquee'
export { default as NewsSection } from './components/NewsSection'
export { default as AboutSection } from './components/AboutSection'
export { default as ContactSection } from './components/ContactSection'
export { default as BackTop } from './components/BackTop'
export type { CarouselSlide } from './components/types'
