// 04 · 偏好设置：语言 / 主题 / 默认首页
import { useMemo, useState } from 'react'
import { App as AntApp, Select } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useI18n, type AppLocale } from '@/i18n'
import { useTheme, type ThemeMode } from '@/hooks/useTheme'
import { useLocale } from '@/hooks/useLocale'
import styles from './PreferencesSection.module.css'

interface HomeOption {
  value: string
  label: string
}

export function PreferencesSection() {
  const { t } = useI18n()
  const { themeMode, setThemeMode, isDark } = useTheme()
  const { locale, setLocale } = useLocale()
  const { message } = AntApp.useApp() // 替代 ElMessage

  const [pref, setPref] = useState({ defaultHome: 'home' })

  const homeOpts = useMemo<HomeOption[]>(() => [
    { value: 'home', label: t('settings.card.preferences.homePage') },
    { value: 'assessment', label: t('settings.card.preferences.assessmentPage') },
    { value: 'articles', label: t('settings.card.preferences.articlesPage') }
  ], [t])

  // Vue 版 langModel/themeModel 中间 ref 简化：直接受控绑定 locale/themeMode
  function onLangChange(val: AppLocale) {
    setLocale(val)
    message.success(t('settings.card.preferences.languageChanged'))
  }

  function onThemeChange(val: ThemeMode | 'auto') {
    setThemeMode(val)
    message.success(t('settings.card.preferences.themeChanged'))
  }

  return (
    <section id="sec-preferences" className={styles.editorialSection}>
      <div className={styles.sectionMarker}>
        <span className={styles.markerNum}>04</span>
        <span className={styles.markerRule}></span>
        <SettingOutlined className={styles.markerIcon} />
        <span className={styles.markerLabel}>{t('settings.card.preferences.title')}</span>
      </div>
      <div className={styles.sectionHeadlineRow}>
        <h2 className={styles.sectionHeadline}>{t('settings.card.preferences.title')}</h2>
        <p className={styles.sectionDeck}>{t('settings.card.preferences.desc')}</p>
      </div>
      <div className={`${styles.editorialGrid} ${styles.threeCol}`}>
        <div className={styles.editorialCol}>
          <h3 className={styles.colTitle}>{t('settings.card.preferences.language')}</h3>
          <Select<AppLocale>
            value={locale}
            onChange={onLangChange}
            style={{ width: '100%' }}
            options={[
              { label: t('settings.card.preferences.zhCN'), value: 'zh-CN' },
              { label: t('settings.card.preferences.zhTW'), value: 'zh-TW' },
              { label: t('settings.card.preferences.enUS'), value: 'en-US' }
            ]}
          />
        </div>
        <div className={styles.editorialCol}>
          <h3 className={styles.colTitle}>{t('settings.card.preferences.theme')}</h3>
          <Select<ThemeMode | 'auto'>
            value={themeMode}
            onChange={onThemeChange}
            style={{ width: '100%' }}
            options={[
              { label: t('nav.theme.light'), value: 'light' },
              { label: t('nav.theme.dark'), value: 'dark' },
              { label: t('nav.theme.auto'), value: 'auto' }
            ]}
          />
          {themeMode === 'auto' && (
            <p className={styles.fieldStatus}>
              {t('settings.card.preferences.themeAutoHint')} ·{' '}
              {isDark ? t('settings.card.preferences.themeActualDark') : t('settings.card.preferences.themeActualLight')}
            </p>
          )}
        </div>
        <div className={styles.editorialCol}>
          <h3 className={styles.colTitle}>{t('settings.card.preferences.defaultHome')}</h3>
          <div className={styles.homeOptions}>
            {homeOpts.map((opt) => (
              <label
                key={opt.value}
                className={`${styles.homeOption}${pref.defaultHome === opt.value ? ` ${styles.checked}` : ''}`}
              >
                <input
                  type="radio"
                  name="default-home"
                  value={opt.value}
                  checked={pref.defaultHome === opt.value}
                  onChange={() => setPref((prev) => ({ ...prev, defaultHome: opt.value }))}
                />
                <span className={styles.homeLabel}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default PreferencesSection
