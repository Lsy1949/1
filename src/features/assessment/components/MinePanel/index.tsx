import { useMemo, useState } from 'react'
import { App as AntApp, Button, Empty, Select, Tag } from 'antd'
import {
  CalendarOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  SendOutlined,
  TrophyOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { AssessmentPointsDTO } from '@/api/types'
import type { AssessmentRecord } from '../types'
import styles from './MinePanel.module.css'

interface Props {
  /** 服务端已按时间倒序下发 */
  history: AssessmentRecord[]
  /** 成长档案（次数 / 积分 / 等级 / 勋章 / 明细）全部由服务端算好，前端只渲染 */
  points?: AssessmentPointsDTO
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

/** 勋章图标属展示映射（服务端只下发展示标识与解锁状态） */
const BADGE_ICON: Record<string, string> = {
  first: '🌱',
  multi: '🔀',
  mental: '💚',
  career: '🧭',
  depth: '🔍',
  master: '🏆',
}

/** 我的面板：只渲染服务端下发的成长档案与历史记录，不做任何业务计算 */
export default function MinePanel({
  history,
  points,
  onView,
  onRetake,
  onClearHistory,
  onGoAssess,
}: Props) {
  const { t } = useTranslation()

  // 取值 + 文案映射；次数、等级、进度、勋章解锁、月度目标等规则全部在服务端
  const growthPoints = points?.balance ?? 0
  const totalEarned = points?.totalEarned ?? 0
  const totalCompleted = points?.completed ?? history.length
  const assessmentDays = points?.assessmentDays ?? 0
  const unlockedBadges = points?.unlockedBadges ?? 0
  const userLevel = points?.level ?? 1
  const levelProgress = points?.levelProgress ?? 0
  const pointsToNext = points?.pointsToNext ?? 0
  const joinDate = points?.joinDate ?? ''
  const growthStatus = t(`assessment.profile.status.${points?.growthStatusKey ?? 'new'}`)
  const badges = (points?.badges ?? []).map((badge) => ({
    ...badge,
    icon: BADGE_ICON[badge.key] ?? '🏅',
    name: t(`assessment.profile.badgeDefs.${badge.key}.name`),
    desc: t(`assessment.profile.badgeDefs.${badge.key}.desc`),
  }))
  const ledger = points?.ledger ?? []
  const sortedHistory = history // 服务端已按时间倒序

  // 记录台账属「我的」：支持按量表筛选与导出（纯交互/格式化，不涉及业务规则）
  const { message } = AntApp.useApp()
  const [historyFilter, setHistoryFilter] = useState('all')
  const filterOptions = useMemo(() => {
    const seen = new Map<string, string>()
    history.forEach((record) => {
      if (!seen.has(record.scaleKey)) seen.set(record.scaleKey, record.scaleName)
    })
    return [
      { value: 'all', label: t('assessment.history.allScales') },
      ...[...seen].map(([value, label]) => ({ value, label })),
    ]
  }, [history, t])
  const shownHistory =
    historyFilter === 'all' ? sortedHistory : sortedHistory.filter((r) => r.scaleKey === historyFilter)

  function exportHistory() {
    if (history.length === 0) {
      message.warning(t('assessment.history.noExport'))
      return
    }
    const headers = [
      t('assessment.history.csvHeaders.date'),
      t('assessment.history.csvHeaders.scale'),
      t('assessment.history.csvHeaders.score'),
      t('assessment.history.csvHeaders.level'),
      t('assessment.history.csvHeaders.title'),
    ]
    const rows = history.map((h) => [h.date, h.scaleName, h.score, h.level, h.title])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `assessment_history_${dayjs().format('YYYYMMDD')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    message.success(t('assessment.history.exported'))
  }

  return (
    <div className={styles.mineWrapper}>
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

      {/* 我的勋章（测评历史移至面板最底部） */}
      <div>
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

      {/* 积分明细：账本口径，逐条可追溯（对齐 docs/assessment-points.md） */}
      <div>
        <div className={styles.sectionHeader}>
          <h3><WalletOutlined /> {t('assessment.points.ledgerTitle')}</h3>
          <span className={styles.badgesCount}>
            {t('assessment.points.totalEarned')} · {totalEarned}
          </span>
        </div>
        {ledger.length > 0 ? (
          <ul className={styles.ledgerList}>
            {ledger.slice(0, 6).map((item) => (
              <li key={item.id} className={styles.ledgerItem}>
                <span className={styles.ledgerSource}>
                  {item.rule === 'migrate.v1'
                    ? t('assessment.points.ruleMigrate')
                    : t('assessment.points.ruleComplete', { name: item.scaleName ?? '' })}
                </span>
                <span className={styles.ledgerDate}>{item.createdAt}</span>
                <span className={styles.ledgerDelta}>+{item.delta}</span>
                <span className={styles.ledgerBalance}>{item.balanceAfter}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.ledgerEmpty}>{t('assessment.points.ledgerEmpty')}</p>
        )}
        <p className={styles.ledgerHint}>
          {t('assessment.points.capHint', { limit: points?.dailyLimit ?? 3 })}
        </p>
      </div>

      {/* 历史测评台账（全部记录，可筛选 / 导出 / 清空） */}
      <div>
        <div className={styles.sectionHeader}>
          <h3><ClockCircleOutlined /> {t('assessment.profile.historyTitle')}</h3>
          {history.length > 0 && (
            <div className={styles.historyActions}>
              <Select
                size="small"
                className={styles.historyFilter}
                value={historyFilter}
                onChange={setHistoryFilter}
                options={filterOptions}
              />
              <Button type="link" icon={<DownloadOutlined />} onClick={exportHistory}>
                {t('assessment.dashboard.exportCsv')}
              </Button>
              <Button type="link" onClick={onClearHistory}>
                {t('assessment.profile.clearHistory')}
              </Button>
            </div>
          )}
        </div>
        {history.length > 0 ? (
          <div className={`${styles.timeline} custom-scroll`}>
            {shownHistory.map((record, idx) => (
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
            <Empty description={t('assessment.profile.historyEmpty')} styles={{ image: { height: 80 } }}>
              <Button type="primary" onClick={onGoAssess}>
                {t('assessment.profile.goAssess')}
              </Button>
            </Empty>
          </div>
        )}
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
  const { t } = useTranslation()

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
