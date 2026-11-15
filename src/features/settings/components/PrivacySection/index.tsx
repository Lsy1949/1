// 03 · 隐私控制：可见性三选一卡片 + 两个开关
import { useMemo, useState } from 'react'
import { App as AntApp, Switch } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { SectionHead } from '../SectionHead'
import styles from './PrivacySection.module.css'

interface PrivacyState {
  visibility: string
  searchable: boolean
  showProfile: boolean
}

export function PrivacySection() {
  const { t } = useTranslation()
  const { message } = AntApp.useApp() // 替代 ElMessage

  const [privacy, setPrivacy] = useState<PrivacyState>({
    visibility: 'friends',
    searchable: true,
    showProfile: false
  })

  const visibilityOpts = useMemo(() => [
    { value: 'public', label: t('settings.card.privacy.visibilityPublic') },
    { value: 'friends', label: t('settings.card.privacy.visibilityFriends') },
    { value: 'private', label: t('settings.card.privacy.visibilityPrivate') }
  ], [t])

  function savePrivacy() {
    message.success(t('settings.card.privacy.saveSuccess'))
  }

  return (
    <section id="sec-privacy" className={styles.editorialSection}>
      <SectionHead
        no="03"
        title={t('settings.card.privacy.title')}
        desc={t('settings.card.privacy.desc')}
      />
      <h3 className={styles.colTitle}>{t('settings.card.privacy.visibility')}</h3>
      <div className={styles.visibilityGrid}>
        {visibilityOpts.map((opt, i) => (
          <label
            key={opt.value}
            className={`${styles.visOption}${privacy.visibility === opt.value ? ` ${styles.checked}` : ''}`}
          >
            <input
              type="radio"
              name="privacy-visibility"
              value={opt.value}
              checked={privacy.visibility === opt.value}
              onChange={() => setPrivacy((prev) => ({ ...prev, visibility: opt.value }))}
            />
            <span className={styles.visNum}>{String(i + 1).padStart(2, '0')}</span>
            <span className={styles.visLabel}>{opt.label}</span>
            <span className={styles.visCheck}><CheckOutlined /></span>
          </label>
        ))}
      </div>
      <ul className={styles.switchList}>
        <li className={styles.switchRow}>
          <div className={styles.switchText}>
            <span className={styles.switchLabel}>{t('settings.card.privacy.searchable')}</span>
          </div>
          <Switch
            checked={privacy.searchable}
            onChange={(v) => setPrivacy((prev) => ({ ...prev, searchable: v }))}
          />
        </li>
        <li className={styles.switchRow}>
          <div className={styles.switchText}>
            <span className={styles.switchLabel}>{t('settings.card.privacy.showProfile')}</span>
          </div>
          <Switch
            checked={privacy.showProfile}
            onChange={(v) => setPrivacy((prev) => ({ ...prev, showProfile: v }))}
          />
        </li>
      </ul>
      <div className={styles.fieldActions}>
        <button className={styles.editorialBtn} onClick={savePrivacy}>
          {t('settings.card.privacy.save')}
        </button>
      </div>
    </section>
  )
}

export default PrivacySection
