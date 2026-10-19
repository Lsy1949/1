/**
 * settings feature 对外出口：外部一律 import from '@/features/settings'。
 * 六个区块组件供 pages 层组合；MastheadSection 为页面 ↔ 区块的 props 契约类型。
 */
export { default as DataSection } from './components/DataSection'
export { default as Masthead } from './components/Masthead'
export { default as NotificationsSection } from './components/NotificationsSection'
export { default as PreferencesSection } from './components/PreferencesSection'
export { default as PrivacySection } from './components/PrivacySection'
export { default as SecuritySection } from './components/SecuritySection'
export type { MastheadSection } from './components/types'
