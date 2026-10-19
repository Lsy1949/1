import { createStore } from './createStore'

export type ThemeType = 'light' | 'dark'
export type DeviceType = 'pc' | 'mobile'
export type AppLocale = 'zh-CN' | 'zh-TW' | 'en-US'

/**
 * 应用级全局状态：设备 / 主题 / 语言。
 * - device：入口分流结果，不持久化
 * - theme：持久化用户偏好，setTheme 时同步 html.dark class
 * - locale：单一数据源仍是 localStorage 'locale'（与 Vue 版一致，key 不变），
 *   store 仅作状态镜像，setLocale 同步两处，不单独持久化
 */

const KNOWN_LOCALES: AppLocale[] = ['zh-CN', 'zh-TW', 'en-US']

/** 移动端 UA 特征（与 utils/device.ts 的 isMobileUA 同源，仅用于入口分流的同步决策） */
const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

function isMobileUA(): boolean {
  if (typeof window === 'undefined') return false
  return MOBILE_UA.test(window.navigator.userAgent)
}

/** Vue 版初始值取自 i18n.global.locale（内部即读 localStorage 'locale'），此处直接对齐该行为 */
function readInitialLocale(): AppLocale {
  try {
    const stored = localStorage.getItem('locale')
    if (stored && (KNOWN_LOCALES as string[]).includes(stored)) return stored as AppLocale
  } catch {
    /* 读取失败按默认语言 */
  }
  return 'zh-CN'
}

/** Pinia persist { pick: ['theme'] } 等价：key = store id = 'app'，值为 {"theme":"..."} JSON */
function readPersistedTheme(): ThemeType {
  try {
    const raw = localStorage.getItem('app')
    if (!raw) return 'light'
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      const theme = (parsed as { theme?: unknown }).theme
      if (theme === 'light' || theme === 'dark') return theme
    }
  } catch {
    /* 脏数据 / 读取失败回退默认 */
  }
  return 'light'
}

export interface AppStoreValue {
  // ---------- state ----------
  device: DeviceType
  theme: ThemeType
  locale: AppLocale
  // ---------- actions ----------
  setDevice: (value: DeviceType) => void
  setTheme: (value: ThemeType) => void
  toggleTheme: () => void
  setLocale: (value: AppLocale) => void
  applyTheme: () => void
}

interface AppState {
  device: DeviceType
  theme: ThemeType
  locale: AppLocale
}

// ---------- actions ----------
function setDevice(value: DeviceType): void {
  store.setState({ device: value })
}

function setTheme(value: ThemeType): void {
  store.setState({ theme: value })
  // 与 Vue 版 setTheme → applyTheme 同步 DOM 的语义一致，直接以目标值生效
  document.documentElement.classList.toggle('dark', value === 'dark')
}

function toggleTheme(): void {
  setTheme(store.getState().theme === 'light' ? 'dark' : 'light')
}

function setLocale(value: AppLocale): void {
  store.setState({ locale: value })
  // Vue 版同时写 i18n.global.locale.value；React 版 i18n 为 Context 实现，
  // 这里只负责 store 镜像与 localStorage（I18nProvider 读取同一 key 初始化）
  try {
    localStorage.setItem('locale', value)
  } catch {
    /* localStorage 不可用时静默跳过 */
  }
}

function applyTheme(): void {
  document.documentElement.classList.toggle('dark', store.getState().theme === 'dark')
}

// ---------- getters 拼装（变更时重建，快照引用稳定） ----------
function toValue(s: AppState): AppStoreValue {
  return {
    ...s,
    setDevice,
    setTheme,
    toggleTheme,
    setLocale,
    applyTheme,
  }
}

const store = createStore<AppState, AppStoreValue>(
  { device: isMobileUA() ? 'mobile' : 'pc', theme: readPersistedTheme(), locale: readInitialLocale() },
  toValue,
)

// 只持久化用户偏好 theme（对应 Vue 版 persist.pick）；device 每次由真实环境决定
store.subscribe(() => {
  try {
    localStorage.setItem('app', JSON.stringify({ theme: store.getState().theme }))
  } catch {
    /* localStorage 不可用时静默跳过 */
  }
})

// 注意：与 Vue 版一致，store 刻意不在激活时抢占 html.dark（启动时 DOM 应用由
// hooks/useTheme 全权负责），setTheme / toggleTheme / applyTheme 仅在
// 显式调用时生效，避免两套机制互相覆盖。

/**
 * 组件内使用（调用形态与 Pinia 版一致）：const appStore = useAppStore()
 */
export function useAppStore(): AppStoreValue {
  return store.useStore()
}

/** 非 React 基础设施层读取入口 */
export function getAppStore(): AppStoreValue {
  return store.getSnapshot()
}
