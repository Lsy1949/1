// 04 成长足迹区块 · 概览 + 徽章墙 + 分年时间线
import { useMemo } from 'react'
import { EyeOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import type { GrowthItem } from '../types'
import styles from './GrowthSection.module.css'

export interface GrowthSectionProps {
  onViewAll: () => void
}

export function GrowthSection({ onViewAll }: GrowthSectionProps) {
  const { t } = useI18n()

  const growthTimeline = useMemo(() => [
    { type: 'milestone', kind: 'M', text: t('profile.card.growth.items.milestone') + ' · 100', date: '2025-06-20' },
    { type: 'assessment', kind: 'A', text: t('profile.card.growth.items.assessment') + ' · 抑郁自评量表', date: '2025-06-15' },
    { type: 'square', kind: 'S', text: t('profile.card.growth.items.square') + ' · 考前焦虑应对', date: '2025-06-08' },
    { type: 'comment', kind: 'C', text: t('profile.card.growth.items.comment') + ' · 时光胶囊', date: '2025-05-28' },
    { type: 'counseling', kind: 'C', text: t('profile.card.growth.items.counseling'), date: '2025-05-20' },
    { type: 'article', kind: 'F', text: t('profile.card.growth.items.article') + ' · 心理韧性', date: '2025-05-10' },
    { type: 'like', kind: 'L', text: t('profile.card.growth.items.like'), date: '2025-04-22' },
    { type: 'capsule', kind: 'T', text: t('profile.card.growth.items.capsule'), date: '2025-04-01' },
    { type: 'assessment', kind: 'A', text: t('profile.card.growth.items.assessment') + ' · MBTI', date: '2024-12-15' },
    { type: 'counseling', kind: 'C', text: t('profile.card.growth.items.counseling'), date: '2024-12-10' },
    { type: 'capsule', kind: 'T', text: t('profile.card.growth.items.capsule'), date: '2024-12-05' },
    { type: 'login', kind: 'L', text: t('profile.card.growth.items.login'), date: '2024-09-01' }
  ], [t])

  const growthSummary = useMemo(() => ({
    total: 48,
    activeDays: 127,
    streak: 12,
    badgeCount: 4
  }), [])

  const badges = useMemo(() => [
    { key: 'first', icon: 'badge-first', letter: 'I', name: t('profile.card.growth.badgeFirst'), desc: t('profile.card.growth.badgeFirstDesc'), earned: true },
    { key: 'explorer', icon: 'badge-explorer', letter: 'E', name: t('profile.card.growth.badgeExplorer'), desc: t('profile.card.growth.badgeExplorerDesc'), earned: true },
    { key: 'persistent', icon: 'badge-persistent', letter: 'P', name: t('profile.card.growth.badgePersistent'), desc: t('profile.card.growth.badgePersistentDesc'), earned: true },
    { key: 'collector', icon: 'badge-collector', letter: 'C', name: t('profile.card.growth.badgeCollector'), desc: t('profile.card.growth.badgeCollectorDesc'), earned: true }
  ], [t])

  const timelineGroups = useMemo(() => {
    const groups: Record<string, GrowthItem[]> = {}
    growthTimeline.forEach((item) => {
      const year = item.date.split('-')[0]
      if (!groups[year]) groups[year] = []
      groups[year].push(item)
    })
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((year) => ({
        year: year === '2025' ? t('profile.card.growth.year2025') : t('profile.card.growth.year2024'),
        items: groups[year]
      }))
  }, [growthTimeline, t])

  return (
    <section className={styles.magSection}>
      <div className={styles.secHead}>
        <span className={styles.secNum}>04</span>
        <div className={styles.secTitles}>
          <h2 className={styles.secTitle}>{t('profile.card.growth.title')}</h2>
          <p className={styles.secDesc}>{t('profile.card.growth.desc')}</p>
        </div>
        <button className={styles.secToggle} onClick={onViewAll}>
          <EyeOutlined />
          <span>{t('profile.card.growth.viewAll')}</span>
        </button>
      </div>

      {/* 成长概览 */}
      <div className={styles.growthSummary}>
        <div className={styles.gsHeader}>
          <span className={styles.gsLabel}>{t('profile.card.growth.summary')}</span>
          <span className={styles.gsLine}></span>
        </div>
        <div className={styles.gsStats}>
          <div className={styles.gsStat}>
            <span className={styles.gsNum}>{growthSummary.total}</span>
            <span className={styles.gsKey}>{t('profile.card.growth.totalActivities')}</span>
          </div>
          <div className={styles.gsStat}>
            <span className={styles.gsNum}>{growthSummary.activeDays}</span>
            <span className={styles.gsKey}>{t('profile.card.growth.activeDays')}</span>
          </div>
          <div className={styles.gsStat}>
            <span className={styles.gsNum}>{growthSummary.streak}</span>
            <span className={styles.gsKey}>{t('profile.card.growth.streak')}</span>
          </div>
          <div className={styles.gsStat}>
            <span className={styles.gsNum}>{growthSummary.badgeCount}</span>
            <span className={styles.gsKey}>{t('profile.card.growth.badges')}</span>
          </div>
        </div>
      </div>

      {/* 徽章墙（badge.icon 为 JS 数据驱动的语义标记类，全仓无样式定义，保留字面量） */}
      <div className={styles.badgeWall}>
        {badges.map((badge) => (
          <div key={badge.key} className={`${styles.badgeCard}${badge.earned ? ` ${styles.earned}` : ''}`}>
            <span className={`${styles.badgeIcon} ${badge.icon}`}>{badge.letter}</span>
            <div className={styles.badgeInfo}>
              <span className={styles.badgeName}>{badge.name}</span>
              <span className={styles.badgeDesc}>{badge.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 时间线（timelineKind 基础类 + JS 字符串驱动的 item.type 变体字面量混拼） */}
      <div className={styles.timelineGroups}>
        {timelineGroups.map((group) => (
          <div key={group.year} className={styles.timelineGroup}>
            <div className={styles.tgYearMark}>
              <span className={styles.tgYear}>{group.year}</span>
              <span className={styles.tgRule}></span>
            </div>
            <ol className={styles.timelineList}>
              {group.items.map((item, i) => (
                <li key={i} className={styles.timelineRow}>
                  <span className={styles.timelineNo}>{String(i + 1).padStart(2, '0')}</span>
                  <div className={styles.timelineBody}>
                    <span className={styles.timelineText}>{item.text}</span>
                    <span className={styles.timelineDate}>{item.date}</span>
                  </div>
                  <span className={`${styles.timelineKind} ${item.type}`}>{item.kind}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
        <p className={styles.timelineEnd}>{t('profile.card.growth.noMore')}</p>
      </div>
    </section>
  )
}

export default GrowthSection
