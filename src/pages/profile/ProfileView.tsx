// 个人中心视图（登录守卫由布局层 ProtectedRoute 统一承担，本视图不再自行判断）
// 「我的」工作台：资料 / 心理档案 / 活动统计 / 我的预约 / 我的收藏 / 成长足迹 / 账号安全
import { useCallback, useMemo, useState } from 'react'
import { App as AntApp, ConfigProvider } from 'antd'
import {
  CalendarOutlined,
  ExclamationCircleFilled,
  HeartOutlined,
  MessageOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useUserStore } from '@/stores/useUserStore'
import { logout } from '@/features/auth'
import { counselingApi } from '@/api'
import { RESPONSIVE_TOKEN } from '@/styles/theme'
import {
  BasicSection,
  BookingsSection,
  DangerSection,
  FavoritesSection,
  GrowthSection,
  Hero,
  PsychSection,
  StatsSection,
} from '@/features/profile'
import type { ProfileFormData, PsychFormData } from '@/features/profile'
import {
  useCounselorDirectory,
  useProfileBookings,
  useProfileCancelBooking,
  useProfileFavorites,
  useProfileFeedback,
  useProfileRescheduleBooking,
  useProfileSaveFavorites,
} from './profileQuery'
import './ProfileView.css'

interface UserExtra {
  name?: string
  studentId?: string
  userId?: string
  school?: string
  enrollYear?: string
  gender?: string
  major?: string
  mbti?: string
  interests?: string[]
  bio?: string
  stressLevel?: string
  sleepQuality?: string
  roleId?: string
}

/**
 * profile 作用域组件 token：
 * mag-form「杂志式表单」外观（原 BasicSection.module.css / PsychSection.module.css
 * 的 .ant-* 覆写）收敛为嵌套 ConfigProvider 官方注入，仅作用于本页。
 * label 字重/字距/大写变换、radio-button 直角等无对应 token 的维度仍保留在组件 css。
 */
const profileThemeComponents = {
  Form: { itemMarginBottom: 0, labelFontSize: RESPONSIVE_TOKEN.fontSizeSM, labelColor: 'var(--text-muted)' },
  Input: { borderRadius: 0 },
  Select: { borderRadius: 0 },
}

export default function ProfileView() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { message, modal } = AntApp.useApp() // 替代 ElMessage / ElMessageBox
  const userStore = useUserStore()

  const info = (userStore.profile || {}) as UserExtra

  // ===== 我的预约 / 收藏（与咨询中心共享缓存键） =====
  const queryClient = useQueryClient()
  const {
    data: bookings = [],
    isPending: bookingsPending,
    isError: bookingsError,
    refetch: refetchBookings,
  } = useProfileBookings()
  const { data: counselingInfo } = useCounselorDirectory()
  const cancelBooking = useProfileCancelBooking()
  const rescheduleBooking = useProfileRescheduleBooking()
  const submitFeedback = useProfileFeedback()

  const counselors = counselingInfo?.counselors ?? []
  // 收藏的老师 id（后端接口，与咨询中心共享缓存键）
  const { data: favoriteIds = [] } = useProfileFavorites()
  const saveFavorites = useProfileSaveFavorites()

  /** 收藏 / 取消收藏（整份替换保存） */
  function toggleFavorite(id: number) {
    const next = favoriteIds.includes(id)
      ? favoriteIds.filter((item) => item !== id)
      : [...favoriteIds, id]
    saveFavorites.mutate(next)
  }

  /** 改约弹窗查占用时段（按「老师 + 日期」缓存） */
  const fetchTakenSlots = useCallback(
    (counselorId: number, date: string) =>
      queryClient.fetchQuery({
        queryKey: ['counseling', 'availability', counselorId, date],
        queryFn: ({ signal }) =>
          counselingApi
            .fetchSlotAvailability(counselorId, date, signal)
            .then((res) => res.takenSlots),
        staleTime: 30_000,
      }),
    [queryClient],
  )

  // Vue 版 reactive 初始化语义等价：仅在挂载时取 store 快照一次
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: info.name || '',
    studentId: info.studentId || info.userId || '',
    school: info.school || '',
    enrollYear: info.enrollYear || '',
    gender: info.gender || '',
    major: info.major || ''
  })

  const [psychForm, setPsychForm] = useState<PsychFormData>({
    mbti: info.mbti || '',
    interests: info.interests ? [...info.interests] : ['阅读', '音乐'],
    bio: info.bio || '',
    stressLevel: info.stressLevel || 'mid',
    sleepQuality: info.sleepQuality || 'fair'
  })

  const roleLabel = useMemo(() => {
    const r = userStore.role || info.roleId || 'student'
    if (r === 'teacher') return t('profile.card.profile.roleTeacher')
    if (r === 'admin') return t('profile.card.profile.roleAdmin')
    return t('profile.card.profile.roleStudent')
  }, [userStore.role, info.roleId, t])

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleViewAll() {
    navigate('/square')
  }

  // ElMessageBox.confirm → modal.confirm；登出广播与页面跳转：logout() 后本页兜底跳首页
  function handleDelete() {
    modal.confirm({
      title: t('profile.card.danger.confirmTitle'),
      content: t('profile.card.danger.confirmMsg'),
      okText: t('profile.card.danger.confirmBtn'),
      cancelText: t('common.cancel'),
      icon: <ExclamationCircleFilled />,
      onOk() {
        logout()
        message.success(t('profile.card.danger.deleted'))
        navigate('/')
      }
    })
  }

  return (
    <ConfigProvider theme={{ components: profileThemeComponents }}>
      <div className="profile-page">
      {/* ===== Hero 封面 ===== */}
      <Hero
        name={profileForm.name}
        role={roleLabel}
        school={profileForm.school}
        studentId={profileForm.studentId}
        bio={psychForm.bio}
        onEditProfile={() => scrollToSection('sec-profile')}
        onViewStats={() => scrollToSection('sec-stats')}
      />

      {/* ===== 快捷入口：预约 / 收藏 / 设置 ===== */}
      <div className="profile-quick-actions">
        <button
          type="button"
          className="profile-quick-action"
          onClick={() => scrollToSection('sec-bookings')}
        >
          <CalendarOutlined />
          {t('profile.card.bookings.title')}
          {bookings.length > 0 && <span className="profile-quick-count">{bookings.length}</span>}
        </button>
        <button
          type="button"
          className="profile-quick-action"
          onClick={() => scrollToSection('sec-favorites')}
        >
          <HeartOutlined />
          {t('profile.card.favorites.title')}
        </button>
        <button type="button" className="profile-quick-action" onClick={() => navigate('/settings')}>
          <SettingOutlined />
          {t('profile.card.quick.settings')}
        </button>
        <span className="profile-quick-spacer" />
        <button type="button" className="profile-quick-action" onClick={() => navigate('/counseling')}>
          <MessageOutlined />
          {t('profile.card.quick.counseling')}
        </button>
      </div>

      {/* ===== 01 基础资料 ===== */}
      <BasicSection id="sec-profile" form={profileForm} onFormChange={setProfileForm} />

      {/* ===== 02 心理档案 ===== */}
      <PsychSection form={psychForm} onFormChange={setPsychForm} />

      {/* ===== 03 活动统计 ===== */}
      <StatsSection
        id="sec-stats"
        values={{
          counseling: bookings.length,
          favorites: favoriteIds.length,
        }}
      />

      {/* ===== 04 我的预约 ===== */}
      <BookingsSection
        id="sec-bookings"
        bookings={bookings}
        loading={bookingsPending}
        error={bookingsError}
        onRetry={() => void refetchBookings()}
        onGoBook={() => navigate('/counseling')}
        fetchTakenSlots={fetchTakenSlots}
        onCancel={cancelBooking.mutate}
        onReschedule={rescheduleBooking.mutate}
        onFeedback={submitFeedback.mutate}
        mutationPending={rescheduleBooking.isPending || submitFeedback.isPending}
      />

      {/* ===== 05 我的收藏 ===== */}
      <FavoritesSection
        id="sec-favorites"
        counselors={counselors}
        onBrowse={() => navigate('/counseling?tab=consultants')}
        onBook={(id) => navigate(`/counseling?counselor=${id}`)}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
      />

      {/* ===== 06 成长足迹 ===== */}
      <GrowthSection onViewAll={handleViewAll} />

      {/* ===== 危险操作（独立危险区，不参与 01–06 编号） ===== */}
      <DangerSection onConfirmDelete={handleDelete} />
      </div>
    </ConfigProvider>
  )
}
