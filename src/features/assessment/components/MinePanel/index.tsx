import { useMemo } from 'react'
import { Button, Empty, Tag } from 'antd'
import {
  CalendarOutlined,
  ClockCircleOutlined,
  SendOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import ModuleCover from '@/components/ModuleCover'
import { useI18n } from '@/i18n'
import type { AssessmentRecord, ScaleInfo } from '../types'
import styles from './MinePanel.module.css'

interface Props {
  history: AssessmentRecord[]
  scales: ScaleInfo[]
  onView: (record: AssessmentRecord) => void
  onRetake: (record: AssessmentRecord) => void
  onClearHistory: () => void
  onGoAssess: () => void
}

/**
 * el-tag type → antd Tag color 的语义映射
 * （success/processing/warning/error 为 antd 预设状态色；primary 用 purple 近似）
 */
export const TAG_COLOR: Record<string, 'success' | 'processing' | 'warning' | 'error' | 'purple'> = {
  success: 'success',
  info: 'processing',
  warning: 'warning',
  danger: 'error',
  primary: 'purple',
}

/** 我的面板：个人信息数据栏 + 历史时间轴 + 勋章，成长数据从 history 派生 */
export default function MinePanel({
  history,
  scales,
  onView,
  onRetake,
  onClearHistory,
  onGoAssess,
}: Props) {
  const { t } = useI18n()

  // --- 成长数据（Vue computed → useMemo，依赖 history/scales） ---
  const { growthPoints, totalCompleted, sortedHistory, joinDate, assessmentDays, growthStatus, userLevel, levelProgress, pointsToNext, badges, unlockedBadges } = useMemo(() => {
    const total = history.length
    const points = total * 10

    // 历史记录按时间倒序
    const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // 加入日期（首次测评日期或默认）
    let joined = '2024-09-01'
    if (history.length > 0) {
      joined = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date
    }

    // 测评天数（不同日期的数量）
    const days = new Set(history.map((h) => h.date)).size

    // 成长状态文案
    const status = total === 0 ? '即将启程' : total < 3 ? '初露锋芒' : total < 6 ? '稳步成长' : total < 10 ? '深度探索' : '自我大师'

    // 用户等级（基于成长积分）
    const level = points >= 150 ? 5 : points >= 100 ? 4 : points >= 60 ? 3 : points >= 30 ? 2 : 1

    // 等级进度（当前等级内的百分比）
    const thresholds = [0, 30, 60, 100, 150]
    let progress = 100
    if (level < 5) {
      const current = thresholds[level - 1]
      const next = thresholds[level]
      progress = Math.min(100, Math.round(((points - current) / (next - current)) * 100))
    }

    // 距下一级所需积分
    const toNext = level >= 5 ? 0 : thresholds[level] - points

    // 勋章列表
    const categoriesDone = new Set(
      history.map((h) => scales.find((s) => s.key === h.scaleKey)?.category)
    ).size
    const hasMental = history.some((h) => scales.find((sc) => sc.key === h.scaleKey)?.category === 'mental')
    const hasCareer = history.some((h) => scales.find((sc) => sc.key === h.scaleKey)?.category === 'career')

    const list = [
      { key: 'first', icon: '🌱', name: '初心萌芽', desc: '完成第一次测评', unlocked: total >= 1 },
      { key: 'multi', icon: '🔀', name: '多元探索', desc: '完成2种不同类型测评', unlocked: categoriesDone >= 2 },
      { key: 'mental', icon: '💚', name: '心理关怀', desc: '完成心理健康类测评', unlocked: hasMental },
      { key: 'career', icon: '🧭', name: '生涯启航', desc: '完成生涯发展类测评', unlocked: hasCareer },
      { key: 'depth', icon: '🔍', name: '深度探索', desc: '完成3次以上测评', unlocked: total >= 3 },
      { key: 'master', icon: '🏆', name: '自我大师', desc: '完成5次以上测评', unlocked: total >= 5 },
    ]

    return {
      growthPoints: points,
      totalCompleted: total,
      sortedHistory: sorted,
      joinDate: joined,
      assessmentDays: days,
      growthStatus: status,
      userLevel: level,
      levelProgress: progress,
      pointsToNext: toNext,
      badges: list,
      unlockedBadges: list.filter((b) => b.unlocked).length,
    }
  }, [history, scales])

  return (
    <div className={styles.mineWrapper}>
      {/* 模块封面 · 编辑式 */}
      <ModuleCover
        eyebrow="— My Profile"
        no={`No.${String(userLevel).padStart(2, '0')}`}
        title={t('assessment.cover.mine.title')}
        desc={t('assessment.cover.mine.desc')}
      />

      {/* 个人信息 · 编辑式定义列表 */}
      <MineProfileStats
        totalCompleted={totalCompleted}
        growthPoints={growthPoints}
        assessmentDays={assessmentDays}
        unlockedBadges={unlockedBadges}
        userLevel={userLevel}
        joinDate={joinDate}
        growthStatus={growthStatus}
        pointsToNext={pointsToNext}
        levelProgress={levelProgress}
      />

      {/* 历史测评时间轴 */}
      <div className="history-section">
        <div className={styles.sectionHeader}>
          <h3><ClockCircleOutlined /> {t('assessment.profile.historyTitle')}</h3>
          {history.length > 0 && (
            <Button type="link" onClick={onClearHistory}>
              {t('assessment.profile.clearHistory')}
            </Button>
          )}
        </div>
        {history.length > 0 ? (
          <div className={styles.timeline}>
            {sortedHistory.map((record, idx) => (
              <div key={idx} className={styles.timelineItem}>
                {/* dot- 为运行时动态等级类（协议类，保留字面量） */}
                <div className={`${styles.timelineDot} dot-${record.levelTag}`} />
                <div className={styles.timelineCard}>
                  <div className={styles.timelineTop}>
                    <span className={styles.timelineTitle}>{record.scaleName}</span>
                    <span className={styles.timelineDate}><ClockCircleOutlined /> {record.date}</span>
                  </div>
                  <div className={styles.timelineBody}>
                    {/* el-tag :type + round → antd Tag color（round 用样式近似） */}
                    <Tag color={TAG_COLOR[record.levelTag]} style={{ borderRadius: 999 }}>
                      {record.level}
                    </Tag>
                    <span className={styles.timelineScore}>{record.score}{t('assessment.unit.score')}</span>
                    <span className={styles.timelineResultTitle}>{record.title}</span>
                  </div>
                  <div className={styles.timelineActions}>
                    <Button size="small" color="primary" variant="outlined" onClick={() => onView(record)}>
                      {t('assessment.profile.viewDetails')}
                    </Button>
                    <Button size="small" onClick={() => onRetake(record)}>
                      {t('assessment.profile.retake')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            {/* el-empty 默认插槽内容 → antd Empty 的 children */}
            <Empty description={t('assessment.profile.historyEmpty')}>
              <Button type="primary" onClick={onGoAssess}>
                {t('assessment.profile.goAssess')}
              </Button>
            </Empty>
          </div>
        )}
      </div>

      {/* 我的勋章 */}
      <div className="badges-section">
        <div className={styles.sectionHeader}>
          <h3><TrophyOutlined /> {t('assessment.profile.badgesTitle')}</h3>
          <span className={styles.badgesCount}>
            {unlockedBadges}/{badges.length} {t('assessment.profile.unlocked')}
          </span>
        </div>
        <div className={styles.badgesGrid}>
          {badges.map((badge) => (
            <div
              key={badge.key}
              className={`${styles.badgeCard} ${badge.unlocked ? styles.unlocked : styles.locked}`}
            >
              <div className={styles.badgeIcon}>{badge.icon}</div>
              <div className={styles.badgeInfo}>
                <div className={styles.badgeName}>{badge.name}</div>
                <div className={styles.badgeDesc}>{badge.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** 个人信息数据栏（内联子组件，保持与原模板块级结构一致） */
function MineProfileStats(props: {
  totalCompleted: number
  growthPoints: number
  assessmentDays: number
  unlockedBadges: number
  userLevel: number
  joinDate: string
  growthStatus: string
  pointsToNext: number
  levelProgress: number
}) {
  const { t } = useI18n()

  return (
    <div className={styles.profileEditorial}>
      <div className={styles.profileStats}>
        <div className={styles.profileStat}>
          <span className={styles.psNum}>{props.totalCompleted}</span>
          <span className={styles.psLabel}>{t('assessment.profile.completed')}</span>
        </div>
        <div className={styles.profileDivider} />
        <div className={styles.profileStat}>
          <span className={styles.psNum}>{props.growthPoints}</span>
          <span className={styles.psLabel}>{t('assessment.profile.growthPoints')}</span>
        </div>
        <div className={styles.profileDivider} />
        <div className={styles.profileStat}>
          <span className={styles.psNum}>{props.assessmentDays}</span>
          <span className={styles.psLabel}>{t('assessment.profile.assessmentDays')}</span>
        </div>
        <div className={styles.profileDivider} />
        <div className={styles.profileStat}>
          <span className={styles.psNum}>{props.unlockedBadges}</span>
          <span className={styles.psLabel}>{t('assessment.profile.badges')}</span>
        </div>
        <div className={styles.profileDivider} />
        <div className={`${styles.profileStat} ${styles.level}`}>
          <span className={styles.psNum}>Lv.{props.userLevel}</span>
          <span className={styles.psLabel}>{t('assessment.profile.growthLevel')}</span>
        </div>
      </div>
      <div className={styles.profileMetaRow}>
        <span className={styles.pmItem}>
          <CalendarOutlined /> {t('assessment.profile.joinedOn', { date: props.joinDate })}
        </span>
        <span className={styles.pmSep}>·</span>
        <span className={styles.pmItem}><SendOutlined /> {props.growthStatus}</span>
        <span className={styles.pmSep}>·</span>
        <span className={styles.pmItem}>{t('assessment.profile.toNextLevel', { points: props.pointsToNext })}</span>
      </div>
      <div className={styles.levelBarWrap}>
        <div className={styles.levelBarTrack}>
          <div className={styles.levelBarFill} style={{ width: `${props.levelProgress}%` }} />
        </div>
        <span className={styles.levelBarPct}>{props.levelProgress}%</span>
      </div>
    </div>
  )
}
