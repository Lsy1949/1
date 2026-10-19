// ---------- Store 出口（导出名与 Vue 版逐一对齐） ----------
// 实现为模块级外部 store（createStore + useSyncExternalStore）：
// - 组件内用 useXxxStore()（响应式订阅）
// - axios 拦截器 / SignalR 等非 React 层用 getXxxStore()（直读快照）

export { useUserStore, getUserStore } from './useUserStore'
export type { UserRole, UserInfo, UserStoreValue } from './useUserStore'

export { useAppStore, getAppStore } from './useAppStore'
export type { ThemeType, DeviceType, AppLocale, AppStoreValue } from './useAppStore'

export {
  useTenantStore,
  getTenantStore,
  BRAND_PRIMARY_CACHE_KEY,
  resolveTenantId,
} from './useTenantStore'
export type {
  TenantBrand,
  TenantTheme,
  TenantAssets,
  TenantFeatures,
  TenantConfig,
  TenantStoreValue,
} from './useTenantStore'

export { useRealtimeStore, getRealtimeStore } from './useRealtimeStore'
export type { ConnectionState, RealtimeStoreValue } from './useRealtimeStore'
export type { SignalRMessagePayload } from '@/events'
