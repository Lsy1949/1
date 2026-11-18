/**
 * profile feature 对外出口：外部一律 import from '@/features/profile'。
 * 个人中心只保留「我是谁」相关区块：身份名片 / 基础资料 / 心理档案。
 * 预约、收藏、测评成长、账号注销分别归各自中心与账号设置，不在此重复。
 */
export { default as BasicSection } from './components/BasicSection'
export { default as Hero } from './components/Hero'
export { default as PsychSection } from './components/PsychSection'
export type { ProfileFormData, PsychFormData } from './components/types'
