// 03 活动统计区块 · 编辑式数字排
import { useMemo } from 'react'
import { useI18n } from '@/i18n'
import styles from './StatsSection.module.css'

export interface StatsSectionProps {
  id?: string
}

export function StatsSection({ id }: StatsSectionProps) {
  const { t } = useI18n()

  const stats = useMemo(() => [
    { key: 'assessments', value: 12, label: t('profile.card.stats.assessments') },
    { key: 'counseling', value: 3, label: t('profile.card.stats.counseling') },
    { key: 'moments', value: 8, label: t('profile.card.stats.moments') },
    { key: 'favorites', value: 24, label: t('profile.card.stats.favorites') },
    { key: 'capsules', value: 5, label: t('profile.card.stats.capsules') }
  ], [t])

  return (
    <section id={id} className={styles.magSection}>
      <div className={styles.secHead}>
        <span className={styles.secNum}>03</span>
        <div className={styles.secTitles}>
          <h2 className={styles.secTitle}>{t('profile.card.stats.title')}</h2>
          <p className={styles.secDesc}>{t('profile.card.stats.desc')}</p>
        </div>
      </div>
      <div className={styles.statsRow}>
        {stats.map((s, i) => (
          <div key={s.key} className={styles.statBlock}>
            <span className={styles.statIndex}>{String(i + 1).padStart(2, '0')}</span>
            <span className={styles.statNum}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default StatsSection
