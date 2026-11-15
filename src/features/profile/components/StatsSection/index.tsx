// 03 活动统计区块 · 编辑式数字排
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './StatsSection.module.css'

export interface StatsSectionProps {
  id?: string
  /** 真实数据覆盖（缺省沿用展示用基准值） */
  values?: Partial<Record<'assessments' | 'counseling' | 'moments' | 'favorites' | 'capsules', number>>
}

export function StatsSection({ id, values }: StatsSectionProps) {
  const { t } = useTranslation()

  const stats = useMemo(
    () =>
      [
        { key: 'assessments', value: 12, label: t('profile.card.stats.assessments') },
        { key: 'counseling', value: 3, label: t('profile.card.stats.counseling') },
        { key: 'moments', value: 8, label: t('profile.card.stats.moments') },
        { key: 'favorites', value: 24, label: t('profile.card.stats.favorites') },
        { key: 'capsules', value: 5, label: t('profile.card.stats.capsules') },
      ].map((item) => ({
        ...item,
        value: values?.[item.key as keyof NonNullable<StatsSectionProps['values']>] ?? item.value,
      })),
    [t, values]
  )

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
