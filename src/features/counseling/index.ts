/**
 * counseling feature 对外出口：外部一律 import from '@/features/counseling'。
 * 四个页内 Panel 组件 + 预约面板 imperative handle 类型 + 共享视图模型类型。
 * 数据由页面通过 props 注入，feature 内不直接访问 API / 静态数据文件。
 */
export { default as BookingPanel } from './components/BookingPanel'
export { default as ConsultantsPanel } from './components/ConsultantsPanel'
export { default as FaqPanel } from './components/FaqPanel'
export { default as NoticePanel } from './components/NoticePanel'
export type { BookingPanelHandle } from './components/BookingPanel'
export type {
  BookingCreateInput,
  BookingItem,
  ConsultationType,
  Counselor,
  FaqItem,
} from './components/types'
