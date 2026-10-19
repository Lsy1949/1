import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { App as AntApp } from 'antd'
import { emitter } from '@/events'
import { getUserStore } from '@/stores/useUserStore'
import { isMobileUA } from '@/utils/device'
import PcDefaultLayout from '@/layouts/pc/DefaultLayout'
import MobileDefaultLayout from '@/layouts/mobile/DefaultLayout'
import ProtectedRoute from '@/layouts/ProtectedRoute'

// 设备分流（等价 Vue 版 createAppRouter 按设备加载 pc/mobile 路由表；
// SPA 生命周期内 UA 不变，模块级判定一次即可）
const DefaultLayout = isMobileUA() ? MobileDefaultLayout : PcDefaultLayout

// ---- 视图懒加载（等价 Vue 版路由表全部 lazy import，按需分片；pages 按业务子目录分组） ----
const HomePageView = lazy(() => import('@/pages/home/HomePageView'))
const CapsuleListView = lazy(() => import('@/pages/time-capsule/CapsuleListView'))
const CapsuleCreateView = lazy(() => import('@/pages/time-capsule/CapsuleCreateView'))
const CapsuleDetailView = lazy(() => import('@/pages/time-capsule/CapsuleDetailView'))
const SquareListView = lazy(() => import('@/pages/square/SquareListView'))
const SquareCreateView = lazy(() => import('@/pages/square/SquareCreateView'))
const SquareDetailView = lazy(() => import('@/pages/square/SquareDetailView'))
const AssessmentCenterView = lazy(() => import('@/pages/assessment/AssessmentCenterView'))
const AssessmentTakeView = lazy(() => import('@/pages/assessment/AssessmentTakeView'))
const ArticleCenterView = lazy(() => import('@/pages/article/ArticleCenterView'))
const ArticleListView = lazy(() => import('@/pages/article/ArticleListView'))
const ArticleDetailView = lazy(() => import('@/pages/article/ArticleDetailView'))
const CounselingCenterView = lazy(() => import('@/pages/counseling/CounselingCenterView'))
const AiConsultView = lazy(() => import('@/pages/ai/AiConsultView'))
const AiCompanionView = lazy(() => import('@/pages/ai/AiCompanionView'))
const ProfileView = lazy(() => import('@/pages/profile/ProfileView'))
const SettingsView = lazy(() => import('@/pages/settings/SettingsView'))
const LoginView = lazy(() => import('@/pages/auth/LoginView'))
const NotFoundView = lazy(() => import('@/pages/notfound/NotFoundView'))

/**
 * 全局事件桥（等价 Vue 版 main.ts 的 emitter 订阅）：
 * - 401 / 手动登出统一广播 user:logout → SPA 内跳登录页（不带 redirect 回跳）
 * - 页面关闭时：未勾选「记住我」则清除登录态持久化（下次进入需重新登录）
 */
function GlobalEvents() {
  const navigate = useNavigate()

  useEffect(() => {
    const onLogout = () => navigate('/login', { replace: true })
    emitter.on('user:logout', onLogout)

    const onBeforeUnload = () => {
      if (!getUserStore().rememberMe) localStorage.removeItem('user')
    }
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      emitter.off('user:logout', onLogout)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [navigate])

  return null
}

export default function App() {
  return (
    // AntApp 提供具备主题上下文的 message / modal（替代静态 ElMessage / ElMessageBox）
    <AntApp>
      <GlobalEvents />
      {/* 路由表 1:1 对齐 Vue 版 router/pc.ts（懒加载分片，Suspense 占位与原白屏一致） */}
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<DefaultLayout />}>
            <Route index element={<HomePageView />} />
            {/* ---- 时光胶囊 ---- */}
            <Route path="time-capsule" element={<CapsuleListView />} />
            <Route path="time-capsule/create" element={<CapsuleCreateView />} />
            <Route path="time-capsule/:id" element={<CapsuleDetailView />} />
            {/* ---- 心事广场 ---- */}
            <Route path="square" element={<SquareListView />} />
            <Route path="square/create" element={<SquareCreateView />} />
            <Route path="square/:id" element={<SquareDetailView />} />
            {/* ---- 心理测评 ---- */}
            <Route path="assessment" element={<AssessmentCenterView />} />
            {/* 原 Vue 命名路由 AssessmentTake（params.id = 量表 key）→ 路径参数 */}
            <Route path="assessment/take/:id" element={<AssessmentTakeView />} />
            {/* ---- 心晴阅读 ---- */}
            <Route path="articles" element={<ArticleCenterView />} />
            <Route path="articles/list" element={<ArticleListView />} />
            <Route path="articles/:id" element={<ArticleDetailView />} />
            {/* ---- 咨询中心 ---- */}
            <Route path="counseling" element={<CounselingCenterView />} />
            <Route path="counseling/ai-chat" element={<AiConsultView />} />
            <Route path="counseling/companion" element={<AiCompanionView />} />
            {/* ---- 用户（requiresAuth 由 ProtectedRoute 承担，等价路由守卫） ---- */}
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfileView />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute>
                  <SettingsView />
                </ProtectedRoute>
              }
            />
            {/* ---- 登录（旧版在 MainLayout 内以透明导航呈现，保持一致） ---- */}
            <Route path="login" element={<LoginView />} />
            {/* ---- 404 兜底（子路径 catch-all 覆盖全部未匹配路由） ---- */}
            <Route path="*" element={<NotFoundView />} />
          </Route>
          {/* 根路径兜底（Vue 版无此条，保持此前行为：未知入口回测评中心） */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AntApp>
  )
}
