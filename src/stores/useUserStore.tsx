import { createStore } from './createStore'
import { fetchMe } from '@/api/modules/auth'
import { resolveTenantId } from '@/config/tenant/resolve'

export type UserRole = 'student' | 'teacher' | 'admin' | ''

/**
 * 会话三态（P2：取代"持久化 profile 乐观恢复"）：
 * - 'loading'        启动探测中（/api/me 未返回）。受保护路由显示 loading，不做跳转决策
 * - 'authenticated'  已登录（/api/me 200 或登录成功写入 profile）
 * - 'anonymous'      未登录（/api/me 401 / 登出 / 会话失效）
 * profile 不再持久化：登录态唯一权威是后端 /api/me，杜绝"陈旧已登录"闪烁。
 */
export type SessionStatus = 'loading' | 'authenticated' | 'anonymous'

export interface UserInfo {
  id: string
  name: string
  avatar?: string
  roleId: string
}

export interface UserStoreValue {
  // ---------- state ----------
  session: SessionStatus
  profile: UserInfo | null
  rememberMe: boolean
  // ---------- getters ----------
  /** 派生：session === 'authenticated'。loading 期间为 false（消费方语义见三态注释） */
  isLoggedIn: boolean
  role: UserRole
  isStudent: boolean
  isTeacher: boolean
  isAdmin: boolean
  // ---------- actions ----------
  setProfile: (value: UserInfo | null) => void
  setRememberMe: (value: boolean) => void
  reset: () => void
  restoreFromMe: () => Promise<void>
}

/**
 * 用户 store：只保存全局状态，不发请求。
 * 登录 / 登出等 API 调用由 server 层完成，成功后调用这里的 action 更新状态。
 * profile / rememberMe 持久化等价 pinia-plugin-persistedstate
 * （persist: true → localStorage key = store id = 'user'，读取时兼容旧数据）。
 */

/**
 * 持久化只保留 rememberMe（登录页"保存登录信息"勾选）。
 * profile 不落盘：旧数据里的 profile / token 字段读取时忽略，
 * 会话态由每次启动的 /api/me 探测决定（见 SessionStatus 注释）。
 */
function readPersistedUser(): { rememberMe: boolean } {
  const fallback = { rememberMe: false }
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return fallback
    const p = parsed as Partial<{ rememberMe: unknown }>
    return { rememberMe: p.rememberMe === true }
  } catch {
    return fallback
  }
}

interface UserState {
  session: SessionStatus
  profile: UserInfo | null
  rememberMe: boolean
}

// ---------- actions（模块级单例，组件内外共用同一实例） ----------
function setProfile(value: UserInfo | null): void {
  // 写入 profile 即认定已登录（唯一调用方 restoreFromMe / 登录成功链路）
  store.setState({ profile: value, ...(value ? { session: 'authenticated' as const } : {}) })
}

function setRememberMe(value: boolean): void {
  store.setState({ rememberMe: value })
}

/** 清空认证状态（401 拦截器与登出共用）。只改状态：不 emit、不 navigate、不停 SignalR */
function reset(): void {
  store.setState({ session: 'anonymous', profile: null, rememberMe: false })
}

/**
 * 登录态恢复（应用启动 / 登录成功后调用）。
 * - 200 且租户匹配 → setProfile（session → authenticated）
 * - 401 / 租户不符 / 5xx / 网络错 → session → anonymous（静默，不报错不重试）
 *
 * 与旧"乐观恢复"的差异：profile 不再持久化，探测失败没有可保持的陈旧态，
 * 统一落 anonymous——受保护路由才做跳转决策，本函数从不 emit / navigate。
 */
async function restoreFromMe(): Promise<void> {
  try {
    const me = await fetchMe()
    // 租户防御（前端第二层）：mock/契约要求会话租户 ≠ 站点租户时服务端返回 401；
    // 若后端偏离契约返回了 200 + 他校 profile，前端视为未登录、静默丢弃，不报错
    if (typeof me.tenantId === 'string' && me.tenantId !== resolveTenantId()) {
      store.setState({ session: 'anonymous', profile: null })
      return
    }
    setProfile({
      id: me.userId ?? '',
      name: me.name ?? '',
      roleId: (me.roleId as string) ?? '',
      avatar: me.avatar,
    })
  } catch {
    /* 401 / 5xx / 网络错：视为未登录（三态下无乐观态可保持），静默 */
    store.setState({ session: 'anonymous', profile: null })
  }
}

// ---------- getters 拼装（变更时重建，快照引用稳定） ----------
function toValue(s: UserState): UserStoreValue {
  const role = (s.profile?.roleId as UserRole) ?? ''
  return {
    ...s,
    // 派生：登录态 = 会话已认证（loading 期间为 false，见 SessionStatus）
    isLoggedIn: s.session === 'authenticated',
    role,
    isStudent: role === 'student',
    isTeacher: role === 'teacher',
    isAdmin: role === 'admin',
    setProfile,
    setRememberMe,
    reset,
    restoreFromMe,
  }
}

const store = createStore<UserState, UserStoreValue>(
  { session: 'loading', profile: null, rememberMe: readPersistedUser().rememberMe },
  toValue,
)

// 持久化：只落盘 rememberMe（profile/session 不持久化，见 readPersistedUser 注释；
// 旧数据中的 profile/token 字段随首次写回被自然覆盖清除）
store.subscribe(() => {
  try {
    localStorage.setItem('user', JSON.stringify({ rememberMe: store.getState().rememberMe }))
  } catch {
    /* localStorage 不可用（隐私模式等）时静默跳过 */
  }
})

/**
 * 组件内使用（调用形态与 Pinia 版一致）：const userStore = useUserStore()
 * 字段名逐一对应 state / getters / actions。
 * 传 selector 时只订阅选中值：useUserStore((s) => s.isLoggedIn)
 */
export function useUserStore<T = UserStoreValue>(
  selector?: (value: UserStoreValue) => T,
): T {
  return store.useStore(selector)
}

/** 非 React 基础设施层（axios 拦截器 / SignalR 连接）读取入口 */
export function getUserStore(): UserStoreValue {
  return store.getSnapshot()
}
