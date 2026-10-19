import { useSyncExternalStore } from 'react'

export type ThemeMode = 'light' | 'dark' | 'auto'

/**
 * 主题切换（React 版，等价 VueUse useColorMode 方案）。
 *
 * - 用户偏好持久化沿用 storageKey 'theme-mode'（裸字符串，与 useColorMode
 *   的 useStorage 落盘格式一致），既有用户的偏好无缝继承
 * - 'auto' 表示跟随系统深色偏好；实际深色 = 'dark' 或 ('auto' 且系统深色)
 * - 实际深色变化自动切换 html.dark（dark-mode.css 体系消费），
 *   useColorMode 的 modes 全空等价：不向 html 挂任何其他 class/属性
 * - 模块级单例：全应用共享同一份偏好状态（与 Vue 版一致，无需 Provider）
 */

const STORAGE_KEY = 'theme-mode'

/** 读取持久化偏好（只接受合法值，脏数据回退 'auto'） */
function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored
  } catch {
    /* 读取失败按默认偏好 */
  }
  return 'auto'
}

// ---------- 模块级单例状态（对应 Vue 版模块顶层的 colorMode / systemDark） ----------

let themeModeValue: ThemeMode = readStoredMode()

// 系统深色偏好（模块顶层仅执行一次，无重复监听问题）
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
let systemDark = mediaQuery.matches

const modeListeners = new Set<() => void>()
const systemListeners = new Set<() => void>()

/** 当前是否实际为深色（auto 时跟随系统），并同步 html.dark */
function applyThemeClass(): void {
  const dark = themeModeValue === 'dark' || (themeModeValue === 'auto' && systemDark)
  document.documentElement.classList.toggle('dark', dark)
}

function emitModeChange(): void {
  for (const listener of modeListeners) listener()
}

function setThemeModeValue(mode: ThemeMode): void {
  if (mode === themeModeValue) return
  themeModeValue = mode
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* localStorage 不可用时仅保留内存偏好 */
  }
  applyThemeClass()
  emitModeChange()
}

function onSystemChange(e: MediaQueryListEvent): void {
  systemDark = e.matches
  applyThemeClass()
  for (const listener of systemListeners) listener()
}

mediaQuery.addEventListener('change', onSystemChange)

// 跨标签页同步（VueUse useStorage 的等价行为：他页改偏好，本页跟随）
window.addEventListener('storage', (e: StorageEvent) => {
  if (e.key !== STORAGE_KEY) return
  const next = e.newValue
  if (next !== 'light' && next !== 'dark' && next !== 'auto') return
  setThemeModeValue(next)
})

// 启动时立即应用一次（对应 Vue 版 watch(isDark, ..., { immediate: true })）
applyThemeClass()

// ---------- useSyncExternalStore 订阅接口 ----------

function subscribeMode(listener: () => void): () => void {
  modeListeners.add(listener)
  return () => {
    modeListeners.delete(listener)
  }
}

function getModeSnapshot(): ThemeMode {
  return themeModeValue
}

function subscribeSystem(listener: () => void): () => void {
  systemListeners.add(listener)
  return () => {
    systemListeners.delete(listener)
  }
}

function getSystemSnapshot(): boolean {
  return systemDark
}

/**
 * 与 Vue 版调用形态一致：const { isDark, themeMode, setThemeMode } = useTheme()
 * 差异仅一处：themeMode 由可写 ref 变为只读值 + setThemeMode(mode) 写入
 * （Vue 侧切换器 UI 也统一走 setThemeMode）。
 */
export function useTheme() {
  const themeMode = useSyncExternalStore(subscribeMode, getModeSnapshot)
  const systemDarkSnapshot = useSyncExternalStore(subscribeSystem, getSystemSnapshot)
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && systemDarkSnapshot)
  return { isDark, themeMode, setThemeMode: setThemeModeValue }
}
