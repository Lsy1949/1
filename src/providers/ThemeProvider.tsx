import type { ReactNode } from 'react'

// 主题为模块级单例（useSyncExternalStore 订阅，等价 Vue 版 useColorMode），
// 非 React 基础设施层也要读写，因此无需 Context——Provider 仅保持
// main.tsx 的组合语义，并确保模块在应用启动时被加载（副作用：应用 html.dark）。
export { useTheme, type ThemeMode } from '@/hooks/useTheme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export default ThemeProvider
