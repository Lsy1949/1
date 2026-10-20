/**
 * square feature 对外出口：外部一律 import from '@/features/square'。
 * 组件由页面通过 props 注入数据；feature 内不直接访问 API / 静态数据文件。
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
export type {
  CommentItem,
  FeedItem,
  MemberItem,
  PostItem,
  SquareCommentCreateInput,
  SquareCreateInput,
  SquareMood,
  TopicItem,
} from './components/types'
