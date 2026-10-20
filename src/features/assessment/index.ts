/**
 * assessment feature 对外出口：外部一律 import from '@/features/assessment'。
 * 五个面板组件 + 类型；量表数据与计分逻辑已迁至 mocks，由页面通过 props 注入。
 */
export { default as DashboardPanel } from './components/DashboardPanel'
export { default as MinePanel } from './components/MinePanel'
export { default as QuestionCard } from './components/QuestionCard'
export { default as ScaleDialog } from './components/ScaleDialog'
export { default as ScalePanel } from './components/ScalePanel'
export type {
  AssessmentAnswerInput,
  AssessmentCategoryKey,
  AssessmentRecord,
  AssessmentSubmitInput,
  OptionItem,
  ScaleDetail,
  ScaleInfo,
  ScaleResult,
} from './components/types'
