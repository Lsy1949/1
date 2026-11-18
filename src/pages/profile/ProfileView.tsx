// 个人中心视图（登录守卫由布局层 ProtectedRoute 统一承担，本视图不再自行判断）
// 职责边界：个人中心只负责「我是谁」——身份名片 / 基础资料 / 心理档案。
// 预约与收藏归咨询中心「我的」，测评与成长记录归测评中心「我的」，此处只给入口，不重复列表。
import { useState } from 'react'
import { ConfigProvider } from 'antd'
import {
  CalendarOutlined,
  HeartOutlined,
  SettingOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUserStore } from '@/stores/useUserStore'
import { RESPONSIVE_TOKEN } from '@/styles/theme'
import { BasicSection, Hero, PsychSection } from '@/features/profile'
import type { ProfileFormData, PsychFormData } from '@/features/profile'
import { useProfileBookings, useProfileFavorites } from './profileQuery'
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
  const userStore = useUserStore()

  const info = (userStore.profile || {}) as UserExtra

  // 仅取条数用于入口角标；预约/收藏的详情与操作统一在咨询中心「我的」
  const { data: bookings = [] } = useProfileBookings()
  const { data: favoriteIds = [] } = useProfileFavorites()

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

  const roleLabel = userStore.role === 'teacher'
    ? t('profile.card.profile.roleTeacher')
    : userStore.role === 'admin'
      ? t('profile.card.profile.roleAdmin')
      : t('profile.card.profile.roleStudent')

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
        onViewGrowth={() => navigate('/assessment?tab=dashboard')}
      />

      {/* ===== 快捷入口：只做跳转，内容归属各中心「我的」 ===== */}
      <div className="profile-quick-actions">
        <button
          type="button"
          className="profile-quick-action"
          onClick={() => navigate('/counseling?tab=mine')}
        >
          <CalendarOutlined />
          {t('profile.card.bookings.title')}
          {bookings.length > 0 && <span className="profile-quick-count">{bookings.length}</span>}
        </button>
        <button
          type="button"
          className="profile-quick-action"
          onClick={() => navigate('/counseling?tab=mine')}
        >
          <HeartOutlined />
          {t('profile.card.favorites.title')}
          {favoriteIds.length > 0 && <span className="profile-quick-count">{favoriteIds.length}</span>}
        </button>
        <button
          type="button"
          className="profile-quick-action"
          onClick={() => navigate('/assessment?tab=mine')}
        >
          <TrophyOutlined />
          {t('profile.card.quick.assess')}
        </button>
        <span className="profile-quick-spacer" />
        <button type="button" className="profile-quick-action" onClick={() => navigate('/settings')}>
          <SettingOutlined />
          {t('profile.card.quick.settings')}
        </button>
      </div>

      {/* ===== 01 基础资料 ===== */}
      <BasicSection id="sec-profile" form={profileForm} onFormChange={setProfileForm} />

      {/* ===== 02 心理档案 ===== */}
      <PsychSection form={psychForm} onFormChange={setPsychForm} />

      <p className="profile-scope-hint">{t('profile.scopeHint')}</p>
      </div>
    </ConfigProvider>
  )
}
