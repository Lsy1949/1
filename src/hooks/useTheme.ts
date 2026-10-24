import { useEffect, useState } from 'react'
import { DEFAULT_PALETTE, isPresetPaletteKey, type PaletteKey, type PresetKey } from '@/styles/palette'
import { DEFAULT_TENANT_ID } from '@/config/tenant/default'

/**
 * 主题管理（palette + mode 两维）
 *
 *  - palette：用户偏好 / 租户默认，二选一；localStorage 按 tenantId 隔离
 *  - mode：light / dark / system，localStorage 全局共用
 *
 * localStorage 键位：
 *  - theme:mode                                全局明暗偏好
 *  - theme:palette:{tenantId}                  当前租户下的用户偏好
 *  - tenant:brand-primary                      防 FOUC 兜底（同租户内）
 *
 * 监听 storage 事件，跨标签页同步。
 */

export type ThemeMode = 'light' | 'dark' | 'system'

const MODE_KEY = 'theme:mode'
const PALETTE_KEY_PREFIX = 'theme:palette:'

function paletteKey(tenantId: string): string {
  return PALETTE_KEY_PREFIX + tenantId
}

// ---------- 读取 ----------

function readMode(): ThemeMode {
  const v = localStorage.getItem(MODE_KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

/** 读用户偏好；无则返回 null（调用方决定 fallback 到租户默认或全局默认）。
 *  只接受预置 key：localStorage 只可能由用户 UI 写入（预设），'custom' 仅存在
 *  于后端配置——残留的 'custom' 在此被拒绝，避免压过租户默认色板后静默回退 blue */
function readUserPalette(tenantId: string): PresetKey | null {
  const v = localStorage.getItem(paletteKey(tenantId))
  return isPresetPaletteKey(v) ? v : null
}

// ---------- 系统暗色监听 ----------

const media = window.matchMedia('(prefers-color-scheme: dark)')

function systemDark(): boolean {
  return media.matches
}

function isDarkNow(mode: ThemeMode): boolean {
  return mode === 'dark' || (mode === 'system' && systemDark())
}

// ---------- 应用 ----------

function applyModeDom(mode: ThemeMode): void {
  const dark = isDarkNow(mode)
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  root.style.colorScheme = dark ? 'dark' : 'light'
}

function applyPaletteDom(palette: PaletteKey): void {
  const root = document.documentElement
  if (root.dataset.palette !== palette) {
    root.dataset.palette = palette
  }
}

// ---------- 模块级共享状态 ----------

let currentMode: ThemeMode = readMode()
let currentTenantId = DEFAULT_TENANT_ID
let currentPalette: PaletteKey = readUserPalette(currentTenantId) ?? DEFAULT_PALETTE

function applyAllDom(): void {
  applyModeDom(currentMode)
  applyPaletteDom(currentPalette)
}

applyAllDom()

// ---------- 监听器（React 订阅） ----------

type Listener = () => void
const listeners = new Set<Listener>()

function emit(): void {
  listeners.forEach((fn) => fn())
}

// 系统主题跟随
media.addEventListener('change', () => {
  if (currentMode === 'system') {
    applyModeDom(currentMode)
    emit()
  }
})

// 跨标签页同步
window.addEventListener('storage', (e) => {
  if (!e.key) return
  if (e.key === MODE_KEY) {
    currentMode = readMode()
    applyModeDom(currentMode)
    emit()
  } else if (e.key === paletteKey(currentTenantId)) {
    const next = readUserPalette(currentTenantId) ?? currentPalette
    if (next !== currentPalette) {
      currentPalette = next
      applyPaletteDom(currentPalette)
      emit()
    }
  }
})

// ---------- 公开 API ----------

export function setMode(mode: ThemeMode): void {
  if (currentMode === mode) return
  currentMode = mode
  localStorage.setItem(MODE_KEY, mode)
  applyModeDom(mode)
  emit()
}

/**
 * 用户主动切换 palette（UI 操作）。只接受预置 key —— 'custom' 属租户配置，
 * 用户 UI 选不到，也不写入 localStorage。
 *  - 写入 localStorage（按 tenantId 隔离）
 *  - 更新 DOM 与 antd token（通过 emit 通知 AntdThemeBridge）
 */
export function setUserPalette(palette: PresetKey, tenantId?: string): void {
  const tid = tenantId ?? currentTenantId
  if (tid === currentTenantId && currentPalette === palette) return

  localStorage.setItem(paletteKey(tid), palette)

  if (tid === currentTenantId) {
    currentPalette = palette
    applyPaletteDom(palette)
    emit()
  }
}

/**
 * 租户初始化时调用：设定当前租户 + 计算生效 palette
 *
 * 优先级：用户偏好（localStorage） > 租户默认 > 全局默认 'blue'
 *
 * 注意：此函数**不写入 localStorage**，仅更新内存与 DOM。
 * 用户后续若调用 setUserPalette 才会持久化。
 */
export function setTenantPaletteScope(tenantId: string, tenantDefault?: PaletteKey): void {
  currentTenantId = tenantId
  const userPref = readUserPalette(tenantId)
  const next = userPref ?? tenantDefault ?? DEFAULT_PALETTE
  if (next !== currentPalette) {
    currentPalette = next
    applyPaletteDom(next)
    emit()
  }
}

// ---------- React Hook ----------

export interface ThemeState {
  mode: ThemeMode
  palette: PaletteKey
  isDark: boolean
  setMode: (mode: ThemeMode) => void
  setPalette: (palette: PresetKey) => void
  /** @deprecated 兼容旧 API，使用 mode 代替。当前 mode === 'system' 时返回 'auto' 保持业务兼容 */
  themeMode: ThemeMode | 'auto'
  /** @deprecated 兼容旧 API，使用 setMode 代替。'auto' 自动规约到 'system' */
  setThemeMode: (mode: ThemeMode | 'auto') => void
}

export function useTheme(): ThemeState {
  // 用 useState + 手动订阅，避免 useSyncExternalStore 在模块单例下的边界问题
  const [, force] = useState(0)
  useEffect(() => {
    const rerender = (): void => force((n) => n + 1)
    listeners.add(rerender)
    return () => {
      listeners.delete(rerender)
    }
  }, [])

  return {
    mode: currentMode,
    palette: currentPalette,
    isDark: isDarkNow(currentMode),
    setMode,
    setPalette: (p: PresetKey) => setUserPalette(p),
    themeMode: currentMode === 'system' ? 'auto' : currentMode,
    setThemeMode: (m) => setMode(m === 'auto' ? 'system' : m),
  }
}
