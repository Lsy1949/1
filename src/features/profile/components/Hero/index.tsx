// 个人中心 Hero 封面 · 杂志期刊式首屏
import { useMemo } from 'react'
import { BankOutlined, BarChartOutlined, EditOutlined } from '@ant-design/icons'
import InitialAvatar from '@/components/InitialAvatar'
import { useI18n } from '@/i18n'
import styles from './Hero.module.css'

export interface HeroProps {
  name: string
  role: string
  school: string
  studentId: string
  bio: string
  onEditProfile: () => void
  onViewStats: () => void
}

export function Hero({ name, role, school, studentId, bio, onEditProfile, onViewStats }: HeroProps) {
  const { t } = useI18n()

  const issueNo = useMemo(() => String(new Date().getMonth() + 1).padStart(2, '0'), [])

  return (
    <header className={styles.hero}>
      <div className={styles.heroBg} aria-hidden="true"></div>
      <div className={styles.heroInner}>
        <div className={styles.heroTopline}>
          <span className={styles.heroEyebrow}>{t('profile.eyebrow')} / PROFILE</span>
          <span className={styles.heroIssue}>No.{issueNo}</span>
        </div>

        {/* Vue 版 v-html：i18n 文案内含 <em> 强调 */}
        <h1 className={styles.heroTitle} dangerouslySetInnerHTML={{ __html: t('profile.title') }}></h1>
        <p className={styles.heroSub}>{t('profile.desc')}</p>

        <div className={styles.heroDivider} aria-hidden="true"></div>

        <div className={styles.heroGrid}>
          <div className={styles.heroPortrait}>
            <InitialAvatar name={name || 'U'} size={96} />
            <span className={styles.heroRole}>{role}</span>
          </div>
          <div className={styles.heroDetail}>
            <div className={styles.heroName}>{name || t('nav.user.guest')}</div>
            <div className={styles.heroMeta}>
              <span className={styles.metaItem}>
                <BankOutlined />
                {school || '—'}
              </span>
              <span className={styles.metaDot}>/</span>
              <span className={styles.metaItem}>{t('profile.hero.studentId')} · {studentId || '—'}</span>
              <span className={styles.metaDot}>/</span>
              <span className={styles.metaItem}>{t('profile.hero.joinDate')} · 2024-09-01</span>
            </div>
            <p className={styles.heroBio}>{bio || t('profile.hero.bioEmpty')}</p>
          </div>
          <div className={styles.heroCta}>
            <button className={styles.ctaBtn} onClick={onEditProfile}>
              <EditOutlined />
              {t('profile.hero.editProfile')}
            </button>
            <button className={`${styles.ctaBtn} ${styles.ghost}`} onClick={onViewStats}>
              <BarChartOutlined />
              {t('profile.hero.viewStats')}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Hero
