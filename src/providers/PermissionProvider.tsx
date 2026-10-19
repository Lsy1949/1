import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useUserStore, type UserRole } from '@/stores/useUserStore'

interface PermissionContextValue {
  /** 当前登录角色（未登录为 ''） */
  role: UserRole
  /** 角色判定：hasRole('teacher', 'admin') */
  hasRole: (...roles: UserRole[]) => boolean
}

const PermissionContext = createContext<PermissionContextValue>({
  role: '',
  hasRole: () => false,
})

/**
 * 权限上下文：数据源为用户 store 的 role（student/teacher/admin）。
 * 路由级守卫由 ProtectedRoute 承担（requiresAuth），本层服务
 * 视图内按角色显隐的细粒度控制。
 */
export function PermissionProvider({ children }: { children: ReactNode }) {
  const { role } = useUserStore()

  const value = useMemo<PermissionContextValue>(
    () => ({
      role,
      hasRole: (...roles) => role !== '' && roles.includes(role),
    }),
    [role],
  )

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export function usePermission() {
  return useContext(PermissionContext)
}

export default PermissionProvider
