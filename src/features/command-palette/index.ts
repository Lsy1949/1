/**
 * command-palette feature 对外出口：外部一律 import from '@/features/command-palette'。
 * AppCommandPalette 为业务装配组件（全局快捷键 + 条目跳转，AppShell 挂载）；
 * useCommandPalette 为模块级单例开关（Navbar 触发）。CommandPalette 为纯内部 UI。
 */
export { default as AppCommandPalette } from './components/AppCommandPalette'
export { useCommandPalette } from './hooks/useCommandPalette'
