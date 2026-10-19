// 02 · 通知偏好：五项开关两栏排布
import { useMemo, useState } from 'react'
import { App as AntApp, Switch } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import styles from './NotificationsSection.module.css'

interface NotificationFlags {
  booking: boolean
  assessment: boolean
  comment: boolean
  activity: boolean
  marketing: boolean
}

type NotificationKey = keyof NotificationFlags

export function NotificationsSection() {
  const { t } = useI18n()
  const { message } = AntApp.useApp() // 替代 ElMessage

  const [notifications, setNotifications] = useState<NotificationFlags>({
    booking: true,
    assessment: true,
    comment: false,
    activity: true,
    marketing: false
  })

  const notifItems = useMemo<Array<{ key: NotificationKey; label: string; hint: string }>>(() => [
    { key: 'booking', label: t('settings.card.notifications.items.booking'), hint: t('settings.card.notifications.hints.booking') },
    { key: 'assessment', label: t('settings.card.notifications.items.assessment'), hint: t('settings.card.notifications.hints.assessment') },
    { key: 'comment', label: t('settings.card.notifications.items.comment'), hint: t('settings.card.notifications.hints.comment') },
    { key: 'activity', label: t('settings.card.notifications.items.activity'), hint: t('settings.card.notifications.hints.activity') },
    { key: 'marketing', label: t('settings.card.notifications.items.marketing'), hint: t('settings.card.notifications.hints.marketing') }
  ], [t])

  function saveNotifications() {
    message.success(t('settings.card.notifications.saveSuccess'))
  }

  function renderSwitchRow(item: { key: NotificationKey; label: string; hint: string }) {
    return (
      <li key={item.key} className={styles.switchRow}>
        <div className={styles.switchText}>
          <span className={styles.switchLabel}>{item.label}</span>
          <span className={styles.switchHint}>{item.hint}</span>
        </div>
        <Switch
          checked={notifications[item.key]}
          onChange={(v) => setNotifications((prev) => ({ ...prev, [item.key]: v }))}
        />
      </li>
    )
  }

  return (
    <section id="sec-notifications" className={styles.editorialSection}>
      <div className={styles.sectionMarker}>
        <span className={styles.markerNum}>02</span>
        <span className={styles.markerRule}></span>
        <BellOutlined className={styles.markerIcon} />
        <span className={styles.markerLabel}>{t('settings.card.notifications.title')}</span>
      </div>
      <div className={styles.sectionHeadlineRow}>
        <h2 className={styles.sectionHeadline}>{t('settings.card.notifications.title')}</h2>
        <p className={styles.sectionDeck}>{t('settings.card.notifications.desc')}</p>
      </div>
      <div className={`${styles.editorialGrid} ${styles.twoCol}`}>
        <div className={styles.editorialCol}>
          <ul className={styles.switchList}>
            {notifItems.slice(0, 3).map(renderSwitchRow)}
          </ul>
        </div>
        <div className={styles.editorialCol}>
          <ul className={styles.switchList}>
            {notifItems.slice(3).map(renderSwitchRow)}
          </ul>
          <div className={styles.fieldActions}>
            <button className={styles.editorialBtn} onClick={saveNotifications}>
              {t('settings.card.notifications.save')}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default NotificationsSection
