/**
 * settings feature 对外出口：外部一律 import from '@/features/settings'。
 * 五个设置区块组件供 pages 层组合（页面自行搭建 Hero / 索引导航 / 面板骨架）。
 */
export { default as DataSection } from './components/DataSection'
export { default as NotificationsSection } from './components/NotificationsSection'
export { default as PreferencesSection } from './components/PreferencesSection'
export { default as PrivacySection } from './components/PrivacySection'
export { default as SecuritySection } from './components/SecuritySection'
