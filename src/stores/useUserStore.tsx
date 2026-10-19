import { createStore } from './createStore'

export type UserRole = 'student' | 'teacher' | 'admin' | ''

export interface UserInfo {
  id: string
  name: string
  avatar?: string
  roleId: string
}

export interface UserStoreValue {
  // ---------- state ----------
  token: string
  profile: UserInfo | null
  rememberMe: boolean
  // ---------- getters ----------
  isLoggedIn: boolean
  role: UserRole
  isStudent: boolean
  isTeacher: boolean
  isAdmin: boolean
  // ---------- actions ----------
  setToken: (value: string) => void
  setProfile: (value: UserInfo | null) => void
  setRememberMe: (value: boolean) => void
  reset: () => void
}

/**
 * 用户 store：只保存全局状态，不发请求。
 * 登录 / 登出等 API 调用由 server 层完成，成功后调用这里的 action 更新状态。
 * token / profile / rememberMe 持久化等价 pinia-plugin-persistedstate
 * （persist: true → localStorage key = store id = 'user'，读取时兼容旧数据）。
 */

/** Pinia persist 插件落盘格式：整份 state 的 JSON；读取做字段级防御 */
function readPersistedUser(): { token: string; profile: UserInfo | null; rememberMe: boolean } {
  const fallback = { token: '', profile: null, rememberMe: false }
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return fallback
    const p = parsed as Partial<{ token: unknown; profile: unknown; rememberMe: unknown }>
    return {
      token: typeof p.token === 'string' ? p.token : '',
      profile: p.profile && typeof p.profile === 'object' ? (p.profile as UserInfo) : null,
      rememberMe: p.rememberMe === true,
    }
  } catch {
    return fallback
  }
}

interface UserState {
  token: string
  profile: UserInfo | null
  rememberMe: boolean
}

// ---------- actions（模块级单例，组件内外共用同一实例） ----------
function setToken(value: string): void {
  store.setState({ token: value })
}

function setProfile(value: UserInfo | null): void {
  store.setState({ profile: value })
}

function setRememberMe(value: boolean): void {
  store.setState({ rememberMe: value })
}

/** 清空认证状态（401 拦截器与登出共用） */
function reset(): void {
  store.setState({ token: '', profile: null, rememberMe: false })
}

// ---------- getters 拼装（变更时重建，快照引用稳定） ----------
function toValue(s: UserState): UserStoreValue {
  const role = (s.profile?.roleId as UserRole) ?? ''
  return {
    ...s,
    isLoggedIn: s.token !== '',
    role,
    isStudent: role === 'student',
    isTeacher: role === 'teacher',
    isAdmin: role === 'admin',
    setToken,
    setProfile,
    setRememberMe,
    reset,
  }
}

const store = createStore<UserState, UserStoreValue>(readPersistedUser(), toValue)

// 持久化：与 persist 插件同等时机（每次 state 变更后整份写回 'user'）
store.subscribe(() => {
  try {
    localStorage.setItem('user', JSON.stringify(store.getState()))
  } catch {
    /* localStorage 不可用（隐私模式等）时静默跳过 */
  }
})

/**
 * 组件内使用（调用形态与 Pinia 版一致）：const userStore = useUserStore()
 * 字段名逐一对应 state / getters / actions。
 */
export function useUserStore(): UserStoreValue {
  return store.useStore()
}

/** 非 React 基础设施层（axios 拦截器 / SignalR 连接）读取入口 */
export function getUserStore(): UserStoreValue {
  return store.getSnapshot()
}
