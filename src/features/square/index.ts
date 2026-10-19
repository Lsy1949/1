/**
 * square feature 对外出口：外部一律 import from '@/features/square'。
 * 组件供 pages 层组合；mockPosts/PostItem 为详情页本地数据契约（后端接入前过渡）。
 */
export { default as CommunitySidebar } from './components/CommunitySidebar'
export { default as CreateForm } from './components/CreateForm'
export { default as CreateHeader } from './components/CreateHeader'
export { default as DailyPrompt } from './components/DailyPrompt'
export { default as DetailBody } from './components/DetailBody'
export { default as DetailComments } from './components/DetailComments'
export { default as DetailHeader } from './components/DetailHeader'
export { default as DetailTopBar } from './components/DetailTopBar'
export { default as FeedList } from './components/FeedList'
export { default as ListHeader } from './components/ListHeader'
export { mockPosts } from './components/data'
export type { PostItem } from './components/types'
