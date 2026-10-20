// 设置中心视图（登录守卫由布局层 ProtectedRoute 统一承担，本视图不再自行判断）
import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import {
  DataSection,
  Masthead,
  NotificationsSection,
  PreferencesSection,
  PrivacySection,
  SecuritySection,
} from '@/features/settings'
import type { MastheadSection } from '@/features/settings'
import { ConfigProvider } from 'antd'
import './SettingsView.css'

/**
 * settings 作用域组件 token（token 化试点）：
 * 页面级「印刷风」组件覆写（原散落 SettingsView.css 与各 Section css 的 .ant-* 规则）
 * 收敛为嵌套 ConfigProvider 官方注入，仅作用于本页，不影响其他模块：
 *  - Input/Select/DatePicker：直角 + ink-300 描边 + hover/focus 品牌色 + 无聚焦光晕
 *    （原 .settings-page 与 .pwd-form/.contact-dialog 的 radius/border/hover/focus 覆写）
 *  - Form：itemMarginBottom 0（原 .pwd-form .ant-form-item）、labelFontSize 12 +
 *    labelColor --ink-700（原 .pwd-form label 字号/颜色）
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
  Form: { itemMarginBottom: 0, labelFontSize: 12, labelColor: 'var(--text-regular)' },
}

export default function SettingsView() {
  const { t } = useI18n()

  /* ===== Sections / Navigation ===== */
  const sections = useMemo<MastheadSection[]>(() => [
    { id: 'sec-security', label: t('settings.card.security.title') },
    { id: 'sec-notifications', label: t('settings.card.notifications.title') },
    { id: 'sec-privacy', label: t('settings.card.privacy.title') },
    { id: 'sec-preferences', label: t('settings.card.preferences.title') },
    { id: 'sec-data', label: t('settings.card.data.title') }
  ], [t])

  const [activeSection, setActiveSection] = useState('sec-security')
  const observerRef = useRef<IntersectionObserver | null>(null)

  function scrollToSection(id: string) {
    const el = document.getElementById(id)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  // 等价 Vue 的 onMounted 建观察器 + onBeforeUnmount disconnect（cleanup 完整）
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    )
    sections.forEach((sec) => {
      const el = document.getElementById(sec.id)
      if (el) obs.observe(el)
    })
    observerRef.current = obs
    return () => {
      obs.disconnect()
      observerRef.current = null
    }
  }, [sections])

  return (
    <ConfigProvider theme={{ components: settingsThemeComponents }}>
      <div className="settings-page">
      {/* ============ Editorial Masthead ============ */}
      <Masthead sections={sections} activeSection={activeSection} onNavigate={scrollToSection} />

      {/* ============ Sections ============ */}
      <main className="settings-main custom-scroll">
        <SecuritySection />
        <NotificationsSection />
        <PrivacySection />
        <PreferencesSection />
        <DataSection />
      </main>

      {/* ============ Mobile TOC strip ============ */}
      <nav className="mobile-toc" aria-label="Settings sections">
        {sections.map((sec, i) => (
          <a
            key={sec.id}
            href="javascript:void(0)"
            className={`mtoc-item${activeSection === sec.id ? ' active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              scrollToSection(sec.id)
            }}
          >
            <span className="mtoc-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="mtoc-text">{sec.label}</span>
          </a>
        ))}
        </nav>
      </div>
    </ConfigProvider>
  )
}
