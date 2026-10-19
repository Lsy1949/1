/**
 * profile feature 对外出口：外部一律 import from '@/features/profile'。
 * 六个区块组件供 pages 层组合；表单数据类型为页面 ↔ 区块的 props 契约。
 */
export { default as BasicSection } from './components/BasicSection'
export { default as DangerSection } from './components/DangerSection'
export { default as GrowthSection } from './components/GrowthSection'
export { default as Hero } from './components/Hero'
export { default as PsychSection } from './components/PsychSection'
export { default as StatsSection } from './components/StatsSection'
export type { ProfileFormData, PsychFormData } from './components/types'
