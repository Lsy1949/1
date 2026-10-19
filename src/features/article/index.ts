/**
 * article feature 对外出口：外部一律 import from '@/features/article'。
 * 七个内容区组件供 pages 层组合；ArticleItem 数据类型自 components/types 以 named type 导出。
 */
export { default as CardGrid } from './components/CardGrid'
export { default as CollectionGrid } from './components/CollectionGrid'
export { default as Comments } from './components/Comments'
export { default as RelatedSidebar } from './components/RelatedSidebar'
export { default as RichBody } from './components/RichBody'
export { default as RowList } from './components/RowList'
export { default as SpotlightCard } from './components/SpotlightCard'
export type { ArticleItem } from './components/types'
