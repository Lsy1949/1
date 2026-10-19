/**
 * assessment feature 对外出口：外部一律 import from '@/features/assessment'。
 * 五个面板组件 + data/types 的页面消费成员；
 * getCategoryName、TAG_COLOR 等仅 feature 内部消费，不出口。
 */
export { default as DashboardPanel } from './components/DashboardPanel'
export { default as MinePanel } from './components/MinePanel'
export { default as QuestionCard } from './components/QuestionCard'
export { default as ScaleDialog } from './components/ScaleDialog'
export { default as ScalePanel } from './components/ScalePanel'
export {
  ASSESSMENT_STORAGE_KEY,
  categories,
  scaleList,
  scaleOptions,
  scales,
} from './components/data'
export type {
  AssessmentRecord,
  OptionItem,
  ScaleInfo,
  ScaleResult,
} from './components/types'
