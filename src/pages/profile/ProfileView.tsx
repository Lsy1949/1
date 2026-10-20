// 个人中心视图（登录守卫由布局层 ProtectedRoute 统一承担，本视图不再自行判断）
import { useMemo, useState } from 'react'
import { App as AntApp, ConfigProvider } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { useUserStore } from '@/stores/useUserStore'
import { logout } from '@/features/auth'
import {
  BasicSection,
  DangerSection,
  GrowthSection,
  Hero,
  PsychSection,
  StatsSection,
} from '@/features/profile'
import type { ProfileFormData, PsychFormData } from '@/features/profile'
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
  Form: { itemMarginBottom: 0, labelFontSize: 11, labelColor: 'var(--text-muted)' },
  Input: { borderRadius: 0 },
  Select: { borderRadius: 0 },
}

export default function ProfileView() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { message, modal } = AntApp.useApp() // 替代 ElMessage / ElMessageBox
  const userStore = useUserStore()

  const info = (userStore.profile || {}) as UserExtra

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

      {/* ===== 01 基础资料 ===== */}
      <BasicSection id="sec-profile" form={profileForm} onFormChange={setProfileForm} />

      {/* ===== 02 心理档案 ===== */}
      <PsychSection form={psychForm} onFormChange={setPsychForm} />

      {/* ===== 03 活动统计 ===== */}
      <StatsSection id="sec-stats" />

      {/* ===== 04 成长足迹 ===== */}
      <GrowthSection onViewAll={handleViewAll} />

      {/* ===== 05 危险操作 ===== */}
      <DangerSection onConfirmDelete={handleDelete} />
      </div>
    </ConfigProvider>
  )
}
