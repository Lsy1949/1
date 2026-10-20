import { useMemo, useState, type ReactNode } from 'react'
import { App as AntApp, Button, Empty, Select, Table, Tag, Tooltip } from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import {
  AimOutlined,
  ArrowDownOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CheckOutlined,
  DownloadOutlined,
  LineChartOutlined,
  PieChartOutlined,
  QuestionCircleFilled,
  RiseOutlined,
  RobotOutlined,
  StarOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import ModuleCover from '@/components/ModuleCover'
import { useReveal } from '@/hooks/useReveal'
import { useI18n } from '@/i18n'
import ScaleIcon from '@/components/ScaleIcon'
import { TAG_COLOR } from '../MinePanel'
import { getCategoryName } from '../data'
import type { AssessmentRecord, ScaleInfo } from '../types'
import styles from './DashboardPanel.module.css'

interface Props {
  history: AssessmentRecord[]
  scales: ScaleInfo[]
  onView: (record: AssessmentRecord) => void
  onOpenScale: (key: string) => void
}

// --- 成长看板侧边栏导航（图标以 ReactNode 形态存放，替代 Vue 存组件引用） ---
const dashboardNav: { key: string; name: string; icon: ReactNode }[] = [
  { key: 'overview', name: '数据概览', icon: <LineChartOutlined /> },
  { key: 'radar', name: '身心能量', icon: <AimOutlined /> },
  { key: 'trend', name: '情绪趋势', icon: <RiseOutlined /> },
  { key: 'distribution', name: '测评分布', icon: <PieChartOutlined /> },
  { key: 'ai', name: 'AI 洞察', icon: <RobotOutlined /> },
  { key: 'progress', name: '进步对比', icon: <TrophyOutlined /> },
  { key: 'recommend', name: '智能推荐', icon: <StarOutlined /> },
  { key: 'history', name: '历史足迹', icon: <UnorderedListOutlined /> },
]

const radarLabels = ['情绪调节', '压力耐受', '职业驱动', '思维深度', '社交能量', '自我认知']

function getRadarPoints(radius: number) {
  return Array.from({ length: 6 })
    .map((_, i) => {
      const angle = ((i * 60 - 90) * Math.PI) / 180
      return `${100 + radius * Math.cos(angle)},${100 + radius * Math.sin(angle)}`
    })
    .join(' ')
}

function polarPoint(val: number, i: number, scale = 80) {
  const angle = ((i * 60 - 90) * Math.PI) / 180
  const r = (val / 100) * scale
  return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`
}

function polarXY(i: number, radius: number) {
  const angle = ((i * 60 - 90) * Math.PI) / 180
  return { x: 100 + radius * Math.cos(angle), y: 100 + radius * Math.sin(angle) }
}

/** 成长看板面板：侧栏导航 + 7 个内容区，可视化数据全部由 history 派生 */
export default function DashboardPanel({ history, scales, onView, onOpenScale }: Props) {
  const { t } = useI18n()
  const { message } = AntApp.useApp() // 替代静态 ElMessage，带主题上下文
  const layoutRef = useReveal<HTMLDivElement>({ delay: 80 })

  const totalCompleted = history.length
  const growthPoints = history.length * 10

  // 测评天数（不同日期的数量）
  const assessmentDays = useMemo(() => new Set(history.map((h) => h.date)).size, [history])

  // --- 侧边栏选中态（原 ref → useState） ---
  const [activeDashboard, setActiveDashboard] = useState('overview')

  // 平均分（归一化到 100）
  const avgScore = useMemo(() => {
    const maxScores: Record<string, number> = { phq9: 27, gad7: 21, pss: 40, riasec: 18, mbti: 40 }
    const scored = history.filter((h) => typeof h.score === 'number' && maxScores[h.scaleKey])
    if (scored.length === 0) return 0
    const sum = scored.reduce((acc, h) => acc + (h.score / maxScores[h.scaleKey]) * 100, 0)
    return Math.round(sum / scored.length)
  }, [history])

  // 最爱维度
  const favoriteCategory = useMemo(() => {
    const catCount: Record<string, number> = {}
    history.forEach((h) => {
      const scale = scales.find((s) => s.key === h.scaleKey)
      if (scale) catCount[scale.category] = (catCount[scale.category] || 0) + 1
    })
    const sorted = Object.entries(catCount).sort((a, b) => b[1] - a[1])
    if (sorted.length === 0) return '尚未探索'
    return getCategoryName(sorted[0][0])
  }, [history, scales])

  // 月度目标
  const monthlyGoal = useMemo(() => {
    const target = 4
    const now = new Date()
    const monthRecords = history.filter((h) => {
      const d = new Date(h.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    return {
      current: monthRecords.length,
      target,
      percent: Math.min(100, Math.round((monthRecords.length / target) * 100)),
    }
  }, [history])

  // --- 身心能量雷达图 ---
  const radarDataPoints = useMemo(() => {
    const base = [60, 60, 50, 50, 60, 70]
    if (history.length > 0) {
      history.forEach((h) => {
        if (h.scaleKey === 'phq9') base[0] = Math.min(95, 100 - h.score * 3)
        if (h.scaleKey === 'pss') base[1] = Math.min(95, 100 - h.score * 2)
        if (h.scaleKey === 'riasec') base[2] = 85
        if (h.scaleKey === 'mbti') base[5] = 90
      })
    }
    return base.map((val, i) => polarPoint(val, i)).join(' ')
  }, [history])

  // 群体均值（mock）
  const radarAvgPoints = useMemo(
    () => [55, 58, 52, 50, 55, 58].map((val, i) => polarPoint(val, i)).join(' '),
    []
  )

  // --- 情绪趋势 ---
  const [trendRange, setTrendRange] = useState<'7d' | '30d' | 'all'>('all')

  const trendData = useMemo(() => {
    let data = history.filter((h) => h.scaleKey === 'phq9' || h.scaleKey === 'gad7')
    const now = new Date()
    if (trendRange === '7d') {
      const ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      data = data.filter((h) => new Date(h.date) >= ago)
    } else if (trendRange === '30d') {
      const ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      data = data.filter((h) => new Date(h.date) >= ago)
    }
    return data
      .slice(0, 10)
      .reverse()
      .map((h) => ({
        date: dayjs(h.date).format('MM-DD'),
        phq: h.scaleKey === 'phq9' ? (h.score / 27) * 100 : 0,
        gad: h.scaleKey === 'gad7' ? (h.score / 21) * 100 : 0,
      }))
  }, [history, trendRange])

  // 趋势平均线
  const trendAvgLine = useMemo(() => {
    const valid = trendData.filter((p) => p.phq > 0 || p.gad > 0)
    if (valid.length === 0) return 0
    const sum = valid.reduce((acc, p) => acc + Math.max(p.phq, p.gad), 0)
    return Math.round(sum / valid.length)
  }, [trendData])

  // --- AI 洞察 ---
  const aiInsights = useMemo(() => {
    if (history.length === 0) return { summary: '', strength: '', risk: '', suggestion: '' }
    const hasPsych = history.some((h) => ['phq9', 'gad7'].includes(h.scaleKey))
    const hasCareer = history.some((h) => ['riasec', 'mbti'].includes(h.scaleKey))

    let summary = '您近期完成了多个维度的测评，展现出较好的自我探索意识。'
    let strength = '具备良好的自我觉察力，愿意主动关注内心状态。'
    let risk = '目前数据点较少，建议持续测评以监测状态变化。'
    let suggestion = '建议保持每两周一次的测评频率，建立个人成长基线。'

    if (hasPsych && hasCareer) {
      summary = '您的探索覆盖了心理健康与生涯发展两大核心维度，呈现全面的自我认知图谱。'
      strength = '性格倾向与职业兴趣高度契合，具备清晰的自我定位能力。'
      risk = '在面临高压力时，情绪调节能力仍有提升空间，可能影响职业效能发挥。'
      suggestion = '建议结合情绪管理练习与职业规划，形成个性化的成长方案。'
    } else if (hasPsych) {
      summary = '您关注心理健康状态，展现了良好的自我关怀意识。'
      strength = '能够主动识别情绪信号，这是心理韧性的重要基础。'
      risk = '仅关注情绪维度可能忽略职业与认知层面的潜能。'
      suggestion = '建议补充生涯发展类测评，全面探索自我潜能。'
    } else if (hasCareer) {
      summary = '您正在积极探索职业方向，展现了前瞻性的规划意识。'
      strength = '对职业兴趣与性格有清晰认知，有助于精准定位发展方向。'
      risk = '缺乏情绪状态基线数据，可能在压力下难以察觉情绪变化。'
      suggestion = '建议补充心理健康类测评，建立完整的自我认知图谱。'
    }

    return { summary, strength, risk, suggestion }
  }, [history])

  // --- 测评分布（环形图） ---
  const categoryDistribution = useMemo(() => {
    const catCount: Record<string, number> = {}
    history.forEach((h) => {
      const scale = scales.find((s) => s.key === h.scaleKey)
      if (scale) {
        const name = getCategoryName(scale.category)
        catCount[name] = (catCount[name] || 0) + 1
      }
    })
    const colors = [
      'var(--brand-primary)',
      'var(--cat-geekblue)',
      'var(--cat-green)',
      'var(--cat-gold)',
      'var(--cat-purple)',
      'var(--cat-red)',
      'var(--cat-gray)',
    ]
    return Object.entries(catCount)
      .map(([name, value], i) => ({
        name,
        value,
        color: colors[i % colors.length],
        percent: Math.round((value / history.length) * 100),
      }))
  }, [history, scales])

  // 环形图 SVG 路径
  const donutSegments = useMemo(() => {
    const data = categoryDistribution
    if (data.length === 0) return []
    const total = data.reduce((acc, d) => acc + d.value, 0)
    let cumulative = 0
    const radius = 70
    const cx = 90
    const cy = 90
    return data.map((d) => {
      const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2
      cumulative += d.value
      const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2
      const x1 = cx + radius * Math.cos(startAngle)
      const y1 = cy + radius * Math.sin(startAngle)
      const x2 = cx + radius * Math.cos(endAngle)
      const y2 = cy + radius * Math.sin(endAngle)
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
      // 单段且占满时无法用 arc 绘制，需特殊处理
      if (data.length === 1 || (cumulative === total && d.value === total)) {
        return { ...d, path: '', isFull: true }
      }
      return {
        ...d,
        path: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        isFull: false,
      }
    })
  }, [categoryDistribution])

  // --- 进步对比（同量表历次分数变化） ---
  const progressComparison = useMemo(() => {
    const grouped: Record<string, AssessmentRecord[]> = {}
    history.forEach((h) => {
      if (!grouped[h.scaleKey]) grouped[h.scaleKey] = []
      grouped[h.scaleKey].push(h)
    })
    const comparisons = [] as {
      scaleName: string
      scaleKey: string
      prevScore: number
      currScore: number
      diff: number
      trend: string
      date: string
      isLowerBetter: boolean
    }[]
    Object.entries(grouped).forEach(([key, records]) => {
      if (records.length >= 2) {
        const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        const prev = sorted[sorted.length - 2]
        const curr = sorted[sorted.length - 1]
        const diff = curr.score - prev.score
        comparisons.push({
          scaleName: curr.scaleName,
          scaleKey: key,
          prevScore: prev.score,
          currScore: curr.score,
          diff,
          trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
          date: curr.date,
          isLowerBetter: ['phq9', 'gad7', 'pss', 'sas'].includes(key),
        })
      }
    })
    return comparisons
  }, [history])

  // --- 智能推荐 ---
  const recommendations = useMemo(() => {
    const completedKeys = new Set(history.map((h) => h.scaleKey))
    const recs = [] as { key: string; reason: string }[]
    if (completedKeys.has('phq9') && !completedKeys.has('gad7')) {
      recs.push({ key: 'gad7', reason: '完成焦虑测评，全面了解情绪状态' })
    }
    if (completedKeys.has('gad7') && !completedKeys.has('phq9')) {
      recs.push({ key: 'phq9', reason: '补充抑郁测评，建立情绪基线' })
    }
    if (completedKeys.has('riasec') && !completedKeys.has('mbti')) {
      recs.push({ key: 'mbti', reason: '结合性格类型，深化职业探索' })
    }
    if (completedKeys.has('mbti') && !completedKeys.has('riasec')) {
      recs.push({ key: 'riasec', reason: '探索职业兴趣，匹配性格倾向' })
    }
    if (recs.length < 3) {
      scales
        .filter((s) => s.available && !completedKeys.has(s.key))
        .slice(0, 3 - recs.length)
        .forEach((s) => {
          recs.push({ key: s.key, reason: '尝试新的测评维度，拓展自我认知' })
        })
    }
    return recs
      .slice(0, 3)
      .map((rec) => ({ ...rec, scale: scales.find((s) => s.key === rec.key) }))
  }, [history, scales])

  // --- 历史足迹 ---
  const [historyFilter, setHistoryFilter] = useState('all')
  const historyFilterOptions = useMemo(() => {
    const opts = [{ key: 'all', label: t('assessment.history.allScales') }]
    const doneKeys = [...new Set(history.map((h) => h.scaleKey))]
    doneKeys.forEach((k) => {
      const scale = scales.find((s) => s.key === k)
      if (scale) opts.push({ key: k, label: scale.name })
    })
    return opts
  }, [history, scales, t])

  const filteredHistory = useMemo(
    () => (historyFilter === 'all' ? history : history.filter((h) => h.scaleKey === historyFilter)),
    [history, historyFilter]
  )

  // el-table 列配置 → antd Table columns（作用域插槽 → render 函数）
  const historyColumns: TableProps<AssessmentRecord>['columns'] = [
    { title: t('assessment.dashboard.col.date'), dataIndex: 'date', width: 120 },
    { title: t('assessment.dashboard.col.scale'), dataIndex: 'scaleName' },
    { title: t('assessment.dashboard.col.score'), dataIndex: 'score', width: 80 },
    {
      title: t('assessment.dashboard.col.conclusion'),
      dataIndex: 'level',
      width: 120,
      render: (_, record) => (
        <Tag color={TAG_COLOR[record.levelTag]}>{record.level}</Tag>
      ),
    },
    {
      title: t('assessment.dashboard.col.action'),
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => onView(record)}>
          {t('assessment.dashboard.detail')}
        </Button>
      ),
    },
  ]

  // 导出 CSV
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

  // v-show → 保持挂载、以 display 切换（与 Vue v-show 行为一致，图表状态不丢失）
  const show = (key: string): React.CSSProperties | undefined =>
    activeDashboard === key ? undefined : { display: 'none' }

  return (
    <div className={styles.dashboardWrapper}>
      <ModuleCover
        eyebrow="— Growth Dashboard"
        no={`No.${String(totalCompleted).padStart(2, '0')}`}
        title={t('assessment.cover.dashboard.title')}
        desc={t('assessment.cover.dashboard.desc')}
      />
      <div ref={layoutRef} className={styles.dashboardLayout}>
        {/* 左侧导航 */}
        <aside className={styles.dashboardSidebar}>
          {dashboardNav.map((item) => (
            <div
              key={item.key}
              className={`${styles.navItem}${activeDashboard === item.key ? ` ${styles.active}` : ''}`}
              onClick={() => setActiveDashboard(item.key)}
            >
              {item.icon}
              <span>{item.name}</span>
            </div>
          ))}
        </aside>

        {/* 右侧内容 */}
        <div className={styles.dashboardContent}>
          {/* 数据概览 */}
          <div className={styles.contentSection} style={show('overview')}>
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon}><CheckOutlined /></div>
                <div className={styles.kpiInfo}>
                  <span className={styles.kpiValue}>{totalCompleted}</span>
                  <span className={styles.kpiLabel}>{t('assessment.dashboard.kpi.total')}</span>
                </div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon}><TrophyOutlined /></div>
                <div className={styles.kpiInfo}>
                  <span className={styles.kpiValue}>{growthPoints}</span>
                  <span className={styles.kpiLabel}>{t('assessment.dashboard.kpi.points')}</span>
                </div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon}><BarChartOutlined /></div>
                <div className={styles.kpiInfo}>
                  <span className={styles.kpiValue}>{avgScore}</span>
                  <span className={styles.kpiLabel}>{t('assessment.dashboard.kpi.avg')}</span>
                </div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon}><CalendarOutlined /></div>
                <div className={styles.kpiInfo}>
                  <span className={styles.kpiValue}>{assessmentDays}</span>
                  <span className={styles.kpiLabel}>{t('assessment.dashboard.kpi.days')}</span>
                </div>
              </div>
            </div>

            <div className={styles.goalBanner}>
              <div className={styles.goalInfo}>
                <div className={styles.goalTitle}>
                  <AimOutlined /> {t('assessment.dashboard.monthlyGoal')}
                </div>
                <div className={styles.goalDesc}>
                  {t('assessment.dashboard.goalDesc', {
                    target: monthlyGoal.target,
                    done: monthlyGoal.current,
                    dim: favoriteCategory,
                  })}
                </div>
              </div>
              <div className={styles.goalProgressWrap}>
                <div className={styles.goalProgressBar}>
                  <div className={styles.goalProgressFill} style={{ width: `${monthlyGoal.percent}%` }} />
                </div>
                <span className={styles.goalPercent}>{monthlyGoal.percent}%</span>
              </div>
            </div>

            <div className={`${styles.panel} ${styles.dashboardCard}`}>
              <div className={styles.cardHeader}>
                <h3><LineChartOutlined /> {t('assessment.dashboard.quickEntry')}</h3>
              </div>
              <div className={styles.quickEntryGrid}>
                {dashboardNav.slice(1).map((item) => (
                  <div
                    key={item.key}
                    className={styles.quickEntryItem}
                    onClick={() => setActiveDashboard(item.key)}
                  >
                    <div className={styles.quickEntryIcon}>{item.icon}</div>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 身心能量 */}
          <div className={styles.contentSection} style={show('radar')}>
            <div className={`${styles.panel} ${styles.dashboardCard}`}>
              <div className={styles.cardHeader}>
                <h3>{t('assessment.dashboard.radar')}</h3>
                {/* el-tooltip → antd Tooltip */}
                <Tooltip title={t('assessment.dashboard.radarTip')}>
                  <QuestionCircleFilled />
                </Tooltip>
              </div>
              <div className={`${styles.radarContainer} ${styles.radarLarge}`}>
                <svg viewBox="0 0 200 200" className={styles.radarSvg}>
                  {Array.from({ length: 5 }, (_, n) => (
                    <polygon key={n} points={getRadarPoints((n + 1) * 20)} className={styles.radarBgPoly} />
                  ))}
                  {Array.from({ length: 6 }, (_, i) => {
                    const { x, y } = polarXY(i, 80)
                    return <line key={i} x1="100" y1="100" x2={x} y2={y} className={styles.radarAxis} />
                  })}
                  <polygon points={radarAvgPoints} className={styles.radarAvgPoly} />
                  <polygon points={radarDataPoints} className={styles.radarDataPoly} />
                  {radarLabels.map((label, i) => {
                    const { x, y } = polarXY(i, 95)
                    return (
                      <text key={label} x={x} y={y} className={styles.radarLabel}>
                        {label}
                      </text>
                    )
                  })}
                </svg>
              </div>
              <div className={styles.radarLegend}>
                {/* dot 为跨 feature 共享协议类（全局 html.dark .dot 规则保留），保留字面量 */}
                <div className={styles.legendItem}><span className="dot self" /> {t('assessment.dashboard.yourStatus')}</div>
                <div className={styles.legendItem}><span className="dot avg" /> {t('assessment.dashboard.groupAvg')}</div>
              </div>
            </div>
          </div>

          {/* 情绪趋势 */}
          <div className={styles.contentSection} style={show('trend')}>
            <div className={`${styles.panel} ${styles.dashboardCard}`}>
              <div className={styles.cardHeader}>
                <h3>{t('assessment.dashboard.moodTrend')}</h3>
                <div className={styles.trendControls}>
                  <div className={styles.rangeTabs}>
                    {(['7d', '30d', 'all'] as const).map((range) => (
                      <span
                        key={range}
                        className={trendRange === range ? styles.active : ''}
                        onClick={() => setTrendRange(range)}
                      >
                        {range === '7d'
                          ? t('assessment.dashboard.range7')
                          : range === '30d'
                            ? t('assessment.dashboard.range30')
                            : t('assessment.dashboard.rangeAll')}
                      </span>
                    ))}
                  </div>
                  <div className={styles.chartLegend}>
                    <span className={`${styles.legendDot} ${styles.phq}`} /> PHQ-9
                    <span className={`${styles.legendDot} ${styles.gad}`} /> GAD-7
                  </div>
                </div>
              </div>
              <div className={`${styles.trendChartContainer} ${styles.trendLarge}`}>
                <div className={styles.yAxis}>
                  <span>{t('assessment.dashboard.high')}</span>
                  <span>{t('assessment.dashboard.mid')}</span>
                  <span>{t('assessment.dashboard.low')}</span>
                </div>
                <div className={styles.chartArea}>
                  {trendAvgLine > 0 && (
                    <div className={styles.avgLine} style={{ bottom: `${trendAvgLine}%` }}>
                      <span className={styles.avgLabel}>
                        {t('assessment.dashboard.avgLabel')} {trendAvgLine}%
                      </span>
                    </div>
                  )}
                  {trendData.map((point, idx) => (
                    <div key={idx} className={styles.trendBarGroup}>
                      {point.phq > 0 && <div className={`${styles.bar} ${styles.phq}`} style={{ height: `${point.phq}%` }} />}
                      {point.gad > 0 && <div className={`${styles.bar} ${styles.gad}`} style={{ height: `${point.gad}%` }} />}
                      <div className={styles.barDate}>{point.date}</div>
                    </div>
                  ))}
                  {trendData.length === 0 && (
                    <div className={styles.chartEmpty}>{t('assessment.dashboard.noTrendData')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 测评分布 */}
          <div className={styles.contentSection} style={show('distribution')}>
            <div className={`${styles.panel} ${styles.dashboardCard}`}>
              <div className={styles.cardHeader}>
                <h3><PieChartOutlined /> {t('assessment.dashboard.typeDist')}</h3>
              </div>
              {categoryDistribution.length > 0 ? (
                <div className={`${styles.donutWrapper} ${styles.donutLarge}`}>
                  <svg viewBox="0 0 180 180" className={`${styles.donutSvg} ${styles.donutSvgLarge}`}>
                    {/* SVG 展示属性不支持 var()，改用 style 以便分类色随主题切换 */}
                    {donutSegments.map((seg, i) =>
                      seg.isFull ? (
                        <circle key={i} cx="90" cy="90" r="70" style={{ fill: seg.color }} opacity="0.85" />
                      ) : (
                        <path key={i} d={seg.path} style={{ fill: seg.color }} opacity="0.85" />
                      )
                    )}
                    <text x="90" y="84" textAnchor="middle" className={styles.donutCenterVal}>
                      {totalCompleted}
                    </text>
                    <text x="90" y="102" textAnchor="middle" className={styles.donutCenterLabel}>
                      {t('assessment.dashboard.totalLabel')}
                    </text>
                  </svg>
                  <div className={styles.donutLegend}>
                    {categoryDistribution.map((d, i) => (
                      <div key={i} className={styles.donutLegendItem}>
                        <span className={styles.legendDot} style={{ background: d.color }} />
                        <span className={styles.legendName}>{d.name}</span>
                        <span className={styles.legendVal}>{d.value} ({d.percent}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.chartEmptyState}>
                  <Empty description={t('assessment.dashboard.distEmpty')} imageStyle={{ height: 80 }} />
                </div>
              )}
            </div>
          </div>

          {/* AI 洞察 */}
          <div className={styles.contentSection} style={show('ai')}>
            <div className={`${styles.panel} ${styles.dashboardCard} ${styles.aiSummaryCard}`}>
              <div className={styles.aiHeader}>
                <div className={styles.aiIcon}><RobotOutlined /></div>
                <h3>{t('assessment.dashboard.aiInsight')}</h3>
              </div>
              <div className="ai-body">
                {history.length > 0 ? (
                  <div className={styles.aiInsightGrid}>
                    <div className={styles.insightItem}>
                      <div className={styles.iTitle}>{t('assessment.dashboard.summary')}</div>
                      <p>{aiInsights.summary}</p>
                    </div>
                    <div className={`${styles.insightItem} ${styles.insightStrength}`}>
                      <div className={styles.iTitle}>{t('assessment.dashboard.strength')}</div>
                      <p>{aiInsights.strength}</p>
                    </div>
                    <div className={`${styles.insightItem} ${styles.insightRisk}`}>
                      <div className={styles.iTitle}>{t('assessment.dashboard.risk')}</div>
                      <p>{aiInsights.risk}</p>
                    </div>
                    <div className={`${styles.insightItem} ${styles.insightSuggestion}`}>
                      <div className={styles.iTitle}>{t('assessment.dashboard.suggestion')}</div>
                      <p>{aiInsights.suggestion}</p>
                    </div>
                  </div>
                ) : (
                  <div className={styles.aiEmpty}>
                    <p>{t('assessment.dashboard.aiEmpty')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 进步对比 */}
          <div className={styles.contentSection} style={show('progress')}>
            <div className={`${styles.panel} ${styles.dashboardCard}`}>
              <div className={styles.cardHeader}>
                <h3><RiseOutlined /> {t('assessment.dashboard.progress')}</h3>
              </div>
              {progressComparison.length > 0 ? (
                <div className={styles.comparisonList}>
                  {progressComparison.map((cmp, idx) => {
                    const isGood = cmp.isLowerBetter ? cmp.diff < 0 : cmp.diff > 0
                    const arrow =
                      cmp.diff === 0 ? (
                        <ArrowRightOutlined />
                      ) : (cmp.diff > 0 && !cmp.isLowerBetter) || (cmp.diff < 0 && cmp.isLowerBetter) ? (
                        <ArrowUpOutlined />
                      ) : (
                        <ArrowDownOutlined />
                      )
                    const tagText = cmp.isLowerBetter
                      ? cmp.diff < 0
                        ? t('assessment.dashboard.improve')
                        : cmp.diff > 0
                          ? t('assessment.dashboard.attention')
                          : t('assessment.dashboard.flat')
                      : cmp.diff > 0
                        ? t('assessment.dashboard.up')
                        : cmp.diff < 0
                          ? t('assessment.dashboard.down')
                          : t('assessment.dashboard.flat')
                    return (
                      <div key={idx} className={styles.comparisonItem}>
                        <div className={styles.cmpInfo}>
                          <div className={styles.cmpName}>{cmp.scaleName}</div>
                          <div className={styles.cmpDate}>{t('assessment.dashboard.recent')}{cmp.date}</div>
                        </div>
                        <div className={styles.cmpScores}>
                          <span className={styles.cmpPrev}>{cmp.prevScore}</span>
                          {/* up/down/stable 为运行时趋势类（协议类，保留字面量） */}
                          <span className={`${styles.cmpArrow} ${cmp.trend}`}>{arrow}</span>
                          <span className={styles.cmpCurr}>{cmp.currScore}</span>
                          <span className={`${styles.cmpDiff} ${isGood ? styles.good : styles.bad}`}>
                            {cmp.diff > 0 ? '+' : ''}{cmp.diff}
                          </span>
                        </div>
                        <div
                          className={`${styles.cmpTag} ${
                            isGood ? styles.good : cmp.diff === 0 ? styles.stable : styles.bad
                          }`}
                        >
                          {tagText}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className={styles.chartEmptyState}>
                  <Empty description={t('assessment.dashboard.progressEmpty')} imageStyle={{ height: 80 }} />
                </div>
              )}
            </div>
          </div>

          {/* 智能推荐 */}
          <div className={styles.contentSection} style={show('recommend')}>
            <div className={`${styles.panel} ${styles.dashboardCard} ${styles.recommendCard}`}>
              <div className={styles.cardHeader}>
                <h3><RobotOutlined /> {t('assessment.dashboard.recommend')}</h3>
              </div>
              <div className={styles.recommendList}>
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={styles.recommendItem}
                    onClick={() => onOpenScale(rec.key)}
                  >
                    {/* cat- 为运行时动态分类类（协议类，保留字面量） */}
                    <div className={`${styles.recIcon} cat-${rec.scale?.category || ''}`}>
                      <ScaleIcon name={rec.scale?.icon} />
                    </div>
                    <div className={styles.recInfo}>
                      <div className={styles.recName}>{rec.scale?.name}</div>
                      <div className={styles.recReason}>{rec.reason}</div>
                    </div>
                    <ArrowRightOutlined className={styles.recArrow} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 历史足迹 */}
          <div className={styles.contentSection} style={show('history')}>
            <div className={`${styles.panel} ${styles.dashboardCard}`}>
              <div className={styles.cardHeader}>
                <h3><UnorderedListOutlined /> {t('assessment.dashboard.history')}</h3>
                <div className={styles.historyActions}>
                  {/* el-select v-model → antd Select 受控 value + onChange */}
                  <Select
                    size="small"
                    className={styles.historyFilter}
                    value={historyFilter}
                    onChange={setHistoryFilter}
                    placeholder={t('assessment.dashboard.filterScale')}
                    options={historyFilterOptions.map((opt) => ({ value: opt.key, label: opt.label }))}
                  />
                  <Button type="link" icon={<DownloadOutlined />} onClick={exportHistory}>
                    {t('assessment.dashboard.exportCsv')}
                  </Button>
                </div>
              </div>
              <div className={styles.historyTableWrapper}>
                {/* el-table stripe/max-height → antd Table rowClassName 斑马纹 + scroll.y */}
                <Table
                  columns={historyColumns}
                  dataSource={filteredHistory}
                  rowKey={(_, index) => String(index)}
                  pagination={false}
                  scroll={{ y: 500 }}
                  rowClassName={(_, index) => (index % 2 === 1 ? 'striped-row' : '')}
                />
                {history.length === 0 && (
                  <div className={styles.historyEmpty}>{t('assessment.dashboard.noHistory')}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
