/**
 * counseling feature 对外出口：外部一律 import from '@/features/counseling'。
 * 四个页内 Panel 组件 + 预约面板 imperative handle 类型 + 咨询师数据。
 * data.ts 其余成员与 types 仅 feature 内部消费，不出口。
 */
export { default as BookingPanel } from './components/BookingPanel'
export { default as ConsultantsPanel } from './components/ConsultantsPanel'
export { default as FaqPanel } from './components/FaqPanel'
export { default as NoticePanel } from './components/NoticePanel'
export { counselors } from './components/data'
export type { BookingPanelHandle } from './components/BookingPanel'
