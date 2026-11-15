/**
 * counseling feature 对外出口：外部一律 import from '@/features/counseling'。
 * 五个页内 Panel 组件 + 预约面板 imperative handle 类型 + 共享视图模型类型。
 * 数据由页面通过 props 注入，feature 内不直接访问 API / 静态数据文件。
 */
export { default as BookingPanel } from './components/BookingPanel'
export { default as ConsultantsPanel } from './components/ConsultantsPanel'
export { default as FaqPanel } from './components/FaqPanel'
export { default as MinePanel } from './components/MinePanel'
export { default as NoticePanel } from './components/NoticePanel'
/* 预约详情 / 改约 / 评价：咨询中心与「我的」页面共用同一套弹层 */
export { BookingDetailDrawer } from './components/BookingPanel/BookingDetailDrawer'
export { RescheduleModal } from './components/BookingPanel/RescheduleModal'
export { FeedbackModal } from './components/BookingPanel/FeedbackModal'
export { maskContact } from './components/format'
export type { BookingPanelHandle } from './components/BookingPanel'
export type {
  BookingDetailDrawerProps,
} from './components/BookingPanel/BookingDetailDrawer'
export type {
  BookingCreateInput,
  BookingFeedback,
  BookingItem,
  ConsultationType,
  Counselor,
  CounselingSummary,
  CounselorAccentKey,
  FaqItem,
} from './components/types'
