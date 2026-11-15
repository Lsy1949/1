/**
 * 账号设置视图（登录守卫由布局层 ProtectedRoute 统一承担）
 * 桌面优先布局，与咨询中心 / 测评中心同一套编辑式语言：
 *   Hero（标题主张 + 账号名片）
 *   └─ Workspace：左侧索引导航（吸顶） + 右侧分组面板（01–05）
 * 右侧五个区块常驻堆叠，由 IntersectionObserver 反推当前锚点高亮左侧导航。
 */
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import {
  ArrowLeftOutlined,
  BellOutlined,
  EyeInvisibleOutlined,
  FolderOpenOutlined,
  LockOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import InitialAvatar from '@/components/InitialAvatar'
import {
  DataSection,
  NotificationsSection,
  PreferencesSection,
  PrivacySection,
  SecuritySection,
} from '@/features/settings'
import { useUserStore } from '@/stores/useUserStore'
import { useReveal } from '@/hooks/useReveal'
import { RESPONSIVE_TOKEN } from '@/styles/theme'
import './SettingsView.css'

/**
 * settings 作用域组件 token（token 化试点）：
 * 页面级「印刷风」组件覆写（原散落 SettingsView.css 与各 Section css 的 .ant-* 规则）
 * 收敛为嵌套 ConfigProvider 官方注入，仅作用于本页，不影响其他模块：
 *  - Input/Select/DatePicker：直角 + ink-300 描边 + hover/focus 品牌色 + 无聚焦光晕
 *  - Form：itemMarginBottom 0（原 .pwd-form .ant-form-item）、labelFontSize 12 +
 *    labelColor --text-regular（原 .pwd-form label 字号/颜色）
 * 不可 token 化的字重/字距/大写变换仍保留在区块组件 module css（见 SecuritySection.module.css）。
 */
const settingsThemeComponents = {
  /* 描边 / hover / focus 描边色已由 src/main.tsx 全局 Input token 提供，
     这里仅保留页面专属差异：直角 + 无聚焦光圈 */
  Input: {
    borderRadius: 0,
    activeShadow: 'none',
  },
  Select: {
    borderRadius: 0,
    colorBorder: 'var(--border-strong)',
    hoverBorderColor: 'var(--brand-primary)',
    activeBorderColor: 'var(--brand-primary)',
    activeShadow: 'none',
  },
  DatePicker: {
    borderRadius: 0,
    colorBorder: 'var(--border-strong)',
    hoverBorderColor: 'var(--brand-primary)',
    activeBorderColor: 'var(--brand-primary)',
    activeShadow: 'none',
  },
  Form: { itemMarginBottom: 0, labelFontSize: RESPONSIVE_TOKEN.fontSizeSM, labelColor: 'var(--text-regular)' },
}

/** 左侧索引导航项：编号 / 页签名 / 一句说明（编号与右侧区块头一一对应） */
type SectionKey = 'security' | 'notifications' | 'privacy' | 'preferences' | 'data'

interface RailItem {
  key: SectionKey
  id: string
  no: string
  Icon: typeof LockOutlined
}

const RAIL_ITEMS: RailItem[] = [
  { key: 'security', id: 'sec-security', no: '01', Icon: LockOutlined },
  { key: 'notifications', id: 'sec-notifications', no: '02', Icon: BellOutlined },
  { key: 'privacy', id: 'sec-privacy', no: '03', Icon: EyeInvisibleOutlined },
  { key: 'preferences', id: 'sec-preferences', no: '04', Icon: SettingOutlined },
  { key: 'data', id: 'sec-data', no: '05', Icon: FolderOpenOutlined },
]

export default function SettingsView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const userStore = useUserStore()
  const heroRef = useReveal<HTMLElement>()

  const info = userStore.profile
  const displayName = info?.name || ''

  const roleLabel = useMemo(() => {
    const r = userStore.role || info?.roleId || 'student'
    if (r === 'teacher') return t('profile.card.profile.roleTeacher')
    if (r === 'admin') return t('profile.card.profile.roleAdmin')
    return t('profile.card.profile.roleStudent')
  }, [userStore.role, info?.roleId, t])

  /* ===== 索引导航 / 滚动反查 ===== */
  const [activeSection, setActiveSection] = useState(RAIL_ITEMS[0].id)

  function scrollToSection(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 96
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' })
  }

  // 滚动反查当前区块：取「区块顶端已越过 #96 阈值线」的最后一个区块。
  // 相比只处理 isIntersecting 的观察器，向上回滚时也能正确回到上一项。
  useEffect(() => {
    let frame = 0
    const pickActive = () => {
      let current = RAIL_ITEMS[0].id
      RAIL_ITEMS.forEach((sec) => {
        const el = document.getElementById(sec.id)
        if (el && el.getBoundingClientRect().top - 96 <= 2) current = sec.id
      })
      setActiveSection(current)
    }
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        pickActive()
      })
    }
    pickActive()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <ConfigProvider theme={{ components: settingsThemeComponents }}>
      <div className="settings-page">
        {/* ============ Hero · 标题主张 + 账号名片 ============ */}
        <section ref={heroRef} className="st-hero">
          <div className="st-hero-main">
            <span className="st-eyebrow">{t('settings.eyebrow')}</span>
            <h1 className="st-title" dangerouslySetInnerHTML={{ __html: t('settings.title') }} />
            <p className="st-desc">{t('settings.desc')}</p>

            <div className="st-actions">
              <button type="button" className="st-cta-ghost" onClick={() => navigate('/profile')}>
                <ArrowLeftOutlined />
                {t('settings.hero.backProfile')}
              </button>
            </div>
          </div>

          <aside className="st-account">
            <div className="st-account-top">
              <InitialAvatar name={displayName || 'U'} size={52} />
              <div className="st-account-id">
                <span className="st-account-label">{t('settings.hero.accountLabel')}</span>
                <span className="st-account-name">{displayName || t('nav.user.guest')}</span>
              </div>
            </div>
            <p className="st-account-hint">{t('settings.hero.accountHint')}</p>
            <dl className="st-account-meta">
              <div className="st-account-meta-item">
                <dt>{t('settings.hero.role')}</dt>
                <dd>{roleLabel}</dd>
              </div>
              <div className="st-account-meta-item">
                <dt>{t('settings.hero.status')}</dt>
                <dd>
                  <span className="st-status-dot" aria-hidden="true" />
                  {t('settings.hero.statusNormal')}
                </dd>
              </div>
            </dl>
          </aside>
        </section>

        {/* ============ Workspace · 索引导航 + 分组面板 ============ */}
        <div className="st-workspace">
          <nav className="st-rail" aria-label={t('settings.eyebrow')}>
            <span className="st-rail-cap">Index</span>
            {RAIL_ITEMS.map(({ key, id, no, Icon }) => {
              const active = activeSection === id
              return (
                <button
                  key={id}
                  type="button"
                  className={`st-rail-item${active ? ' is-active' : ''}`}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => scrollToSection(id)}
                >
                  <span className="st-rail-num">{no}</span>
                  <span className="st-rail-text">
                    <span className="st-rail-label">
                      <Icon />
                      {t(`settings.card.${key}.title`)}
                    </span>
                    <span className="st-rail-desc">{t(`settings.rail.${key}`)}</span>
                  </span>
                </button>
              )
            })}
            <p className="st-rail-foot">{t('settings.rail.hint')}</p>
          </nav>

          <main className="st-panel">
            <SecuritySection />
            <NotificationsSection />
            <PrivacySection />
            <PreferencesSection />
            <DataSection />
          </main>
        </div>
      </div>
    </ConfigProvider>
  )
}
