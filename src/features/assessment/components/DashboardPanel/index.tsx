import { useMemo, useRef, useState, useEffect, type ReactNode } from 'react'
import { Empty, Tooltip } from 'antd'
import { Line, Pie, Radar, type Chart } from '@ant-design/plots'
import dayjs from 'dayjs'
import type { I18nKey } from '@/i18n/dataHelper'
import {
  AimOutlined,
  AppstoreOutlined,
  ArrowDownOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CheckOutlined,
  LineChartOutlined,
  PieChartOutlined,
  QuestionCircleFilled,
  RiseOutlined,
  RobotOutlined,
  StarOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { useReveal } from '@/hooks/useReveal'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/hooks/useTheme'
import { readCssColor } from '@/utils/cssVar'
import ScaleIcon from '@/components/ScaleIcon'
import type { AssessmentPointsDTO } from '@/api/types'
import type { AssessmentRecord, ScaleInfo } from '../types'
import styles from './DashboardPanel.module.css'

interface Props {
  history: AssessmentRecord[]
  scales: ScaleInfo[]
  /** 账户指标（次数 / 平均分 / 活跃天数 / 覆盖分类等由服务端计算） */
  points?: AssessmentPointsDTO
  onOpenScale: (key: string) => void
}

// --- 成长看板侧边栏导航：只保留分析类分区，记录台账归「我的」 ---
const DASHBOARD_NAV: { key: string; icon: ReactNode }[] = [
  { key: 'overview', icon: <LineChartOutlined /> },
  { key: 'radar', icon: <AimOutlined /> },
  { key: 'trend', icon: <RiseOutlined /> },
  { key: 'distribution', icon: <PieChartOutlined /> },
  { key: 'ai', icon: <RobotOutlined /> },
  { key: 'progress', icon: <TrophyOutlined /> },
  { key: 'recommend', icon: <StarOutlined /> },
]

/** 雷达图长表行 / 环形图行（@ant-design/plots 均为长表数据形态） */
interface RadarDatum {
  dim: string
  kind: string
  value: number
}

interface DonutDatum {
  name: string
  value: number
}

/** 成长看板面板：侧栏导航 + 分析分区，只做趋势与洞察，记录台账在「我的」 */
export default function DashboardPanel({ history, scales, points, onOpenScale }: Props) {
  const { t } = useTranslation()
  const layoutRef = useReveal<HTMLDivElement>({ delay: 80 })
  // 订阅真实主题源（useTheme 同步翻 html.dark 后才 emit，重渲染时 token 必为新值）；
  // mode / palette 任一变化都重建图表配色（themeSignature 缓存随之失效）
  const { isDark, palette } = useTheme()

  // 图表配色：全部经 readCssColor 从语义 token 解析（禁止在图表配置中写死色值）；
  // 面积透明度走 fillOpacity 数值，不需要预合成 rgba
  const chartColors = useMemo(() => {
    const cat = {
      mental: readCssColor('var(--cat-geekblue)'),
      career: readCssColor('var(--cat-gold)'),
      cognitive: readCssColor('var(--cat-cyan)'),
      esports: readCssColor('var(--cat-red)'),
      learning: readCssColor('var(--cat-green)'),
      social: readCssColor('var(--cat-magenta)'),
    }
    const brand = readCssColor('var(--brand-primary)')
    const faint = readCssColor('var(--text-faint)')
    return {
      brand,
      faint,
      textHeading: readCssColor('var(--text-heading)'),
      textSecondary: readCssColor('var(--text-secondary)'),
      border: readCssColor('var(--border-strong)'),
      split: readCssColor('var(--border-light)'),
      bgCard: readCssColor('var(--bg-card)'),
      cat,
    }
  }, [isDark, palette])

  // 概览指标全部取服务端下发值（前端不做统计）
  const totalCompleted = points?.completed ?? 0
  const categoriesCovered = points?.categoriesCovered ?? 0
  const assessmentDays = points?.assessmentDays ?? 0

  // --- 侧边栏选中态（原 ref → useState） ---
  const [activeDashboard, setActiveDashboard] = useState('overview')

  /** 导航项名称（i18n） */
  const dashboardNav = useMemo(
    () =>
      DASHBOARD_NAV.map((item) => ({
        ...item,
        name: t(`assessment.dashboard.nav.${item.key}` as I18nKey),
      })),
    [t],
  )

  /** 雷达六维名称（i18n 数组） */
  const radarLabels = useMemo(
    () => t('assessment.dashboard.radarDims', { returnObjects: true }) as string[],
    [t],
  )

  // --- 图表实例 + 显隐切换后的尺寸重算 ---
  // 看板 section 为 v-show（保持挂载、图表状态不丢失），但 G2 autoFit 只监听
  // window resize —— 容器 display:none → block 的尺寸变化不触发重算，
  // 需在面板切换后手动 triggerResize（等价旧 useECharts 内置 ResizeObserver 的职责）
  const radarChartRef = useRef<Chart | null>(null)
  const trendChartRef = useRef<Chart | null>(null)
  const donutChartRef = useRef<Chart | null>(null)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      radarChartRef.current?.triggerResize()
      trendChartRef.current?.triggerResize()
      donutChartRef.current?.triggerResize()
    })
    return () => cancelAnimationFrame(id)
  }, [activeDashboard])

  // 平均分（归一化到 100）
  const avgScore = useMemo(() => {
    const maxScores: Record<string, number> = {
      phq9: 27, gad7: 21, pss: 30, riasec: 18, mbti: 40, reaction: 30,
      memory: 40, logic: 60, aim: 25, flick: 40, decision: 50, vark: 80,
      sas: 60, eq: 75,
    }
    const scored = history.filter((h) => typeof h.score === 'number' && maxScores[h.scaleKey])
    if (scored.length === 0) return 0
    const sum = scored.reduce((acc, h) => acc + (h.score / maxScores[h.scaleKey]) * 100, 0)
    return Math.round(sum / scored.length)
  }, [history])

  // 最爱维度：服务端算好分类标识，前端只取文案
  const favoriteCategory = points?.favoriteCategoryKey
    ? t(`assessment.categories.${points.favoriteCategoryKey}` as I18nKey)
    : t('assessment.dashboard.notExplored')

  // 月度目标：次数与百分比均由服务端给出
  const monthlyGoal = {
    current: points?.monthCompleted ?? 0,
    target: points?.monthlyTarget ?? 4,
    percent: points?.monthlyPercent ?? 0,
  }

  // --- 身心能量雷达：六维由对应量表「最新一次」结果归一化推导（0-100，越高越好） ---
  const radarUserValues = useMemo(() => {
    const byKey = new Map<string, AssessmentRecord>()
    history.forEach((h) => {
      const prev = byKey.get(h.scaleKey)
      if (!prev || h.date > prev.date) byKey.set(h.scaleKey, h)
    })
    const latest = (key: string) => byKey.get(key)?.score
    // 情绪/压力类分数越低越好 → 反向归一化
    const better = (key: string, max: number) => {
      const score = latest(key)
      return score === undefined ? null : Math.max(5, Math.round(100 - (score / max) * 100))
    }
    const topDetail = (key: string) => {
      const values = Object.values(byKey.get(key)?.details ?? {})
      return values.length ? Math.max(...values) : null
    }
    return [
      better('phq9', 27) ?? 62, // 情绪调节
      better('pss', 30) ?? 58, // 压力耐受
      topDetail('riasec') !== null ? Math.min(95, Math.round(((topDetail('riasec') ?? 0) / 10) * 100)) : 55, // 职业驱动
      better('logic', 60) ?? better('decision', 50) ?? 57, // 思维深度
      better('eq', 75) ?? better('sas', 60) ?? 52, // 社交能量
      byKey.has('mbti') ? 88 : byKey.has('vark') ? 72 : Math.min(80, Math.round((byKey.size / Math.max(1, scales.length)) * 100)), // 自我认知
    ]
  }, [history, scales])

  // 群体均值（mock 基准线）
  const radarGroupValues = [55, 58, 52, 50, 55, 58]

  // --- 情绪趋势：PHQ-9 / GAD-7 / PSS-10 三条「情绪指数」曲线（反向归一化，越高越好） ---
  const [trendRange, setTrendRange] = useState<'7d' | '30d' | 'all'>('all')

  // 长表数据形态（@ant-design/plots）：每行 { date, kind, value }，缺测为 null
  const trendChart = useMemo(() => {
    const defs = [
      { key: 'phq9', name: 'PHQ-9', color: chartColors.cat.mental, max: 27 },
      { key: 'gad7', name: 'GAD-7', color: chartColors.cat.career, max: 21 },
      { key: 'pss', name: 'PSS-10', color: chartColors.cat.cognitive, max: 30 },
    ]
    const days = trendRange === '7d' ? 7 : trendRange === '30d' ? 30 : null
    const records = history
      .filter((h) => defs.some((d) => d.key === h.scaleKey))
      .filter((h) => !days || dayjs(h.date).isAfter(dayjs().subtract(days, 'day')))
      .sort((a, b) => a.date.localeCompare(b.date))
    const dates = [...new Set(records.map((h) => dayjs(h.date).format('MM-DD')))]
    const rows = dates.flatMap((date) =>
      defs.map((def) => {
        const record = records.find(
          (h) => h.scaleKey === def.key && dayjs(h.date).format('MM-DD') === date
        )
        return {
          date,
          kind: def.name,
          value: record ? Math.max(5, Math.round(100 - (record.score / def.max) * 100)) : null,
        }
      }),
    )
    // 首条曲线（PHQ-9）均值参考线：仅统计有值日期
    const firstValues = rows.filter((r) => r.kind === defs[0].name && r.value !== null)
    const firstAvg = firstValues.length
      ? Math.round(firstValues.reduce((acc, r) => acc + (r.value ?? 0), 0) / firstValues.length)
      : null
    return { dates, rows, domain: defs.map((d) => d.name), range: defs.map((d) => d.color), firstAvg }
  }, [history, trendRange, chartColors])

  // --- AI 洞察（文案走 i18n：按已测维度选择一套洞察） ---
  const aiInsights = useMemo(() => {
    if (history.length === 0) return { summary: '', strength: '', risk: '', suggestion: '' }
    const hasPsych = history.some((h) => ['phq9', 'gad7'].includes(h.scaleKey))
    const hasCareer = history.some((h) => ['riasec', 'mbti'].includes(h.scaleKey))

    const variant = hasPsych && hasCareer ? 'both' : hasPsych ? 'psych' : hasCareer ? 'career' : 'base'

    return {
      summary: t(`assessment.dashboard.insight.${variant}.summary`),
      strength: t(`assessment.dashboard.insight.${variant}.strength`),
      risk: t(`assessment.dashboard.insight.${variant}.risk`),
      suggestion: t(`assessment.dashboard.insight.${variant}.suggestion`),
    }
  }, [history, t])

  // --- 测评分布（环形图：按分类聚合，颜色映射主题分类色；图例自绘以配合中心总计） ---
  const donutChart = useMemo(() => {
    const catCount: Record<string, number> = {}
    history.forEach((h) => {
      const scale = scales.find((s) => s.key === h.scaleKey)
      if (scale) catCount[scale.category] = (catCount[scale.category] || 0) + 1
    })
    const items: DonutDatum[] = []
    const colors: string[] = []
    Object.entries(catCount).forEach(([cat, value]) => {
      items.push({ name: t(`assessment.categories.${cat}` as I18nKey), value })
      colors.push(chartColors.cat[cat as keyof typeof chartColors.cat] ?? chartColors.brand)
    })
    return { items, colors }
  }, [history, scales, t, chartColors])
  const donutTotal = donutChart.items.reduce((acc, d) => acc + d.value, 0)

  // --- 雷达图长表（双系列：本人 / 群体均值） ---
  const yourSeries = t('assessment.dashboard.yourStatus')
  const groupSeries = t('assessment.dashboard.groupAvg')
  const radarData = useMemo<RadarDatum[]>(
    () => [
      ...radarLabels.map((dim, i) => ({ dim, kind: yourSeries, value: radarUserValues[i] })),
      ...radarLabels.map((dim, i) => ({ dim, kind: groupSeries, value: radarGroupValues[i] })),
    ],
    [yourSeries, groupSeries, radarUserValues],
  )

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

  // --- 智能推荐（推荐理由走 i18n） ---
  const recommendations = useMemo(() => {
    const completedKeys = new Set(history.map((h) => h.scaleKey))
    const recs = [] as { key: string; reason: string }[]
    if (completedKeys.has('phq9') && !completedKeys.has('gad7')) {
      recs.push({ key: 'gad7', reason: t('assessment.dashboard.rec.gad7AfterPhq9') })
    }
    if (completedKeys.has('gad7') && !completedKeys.has('phq9')) {
      recs.push({ key: 'phq9', reason: t('assessment.dashboard.rec.phq9AfterGad7') })
    }
    if (completedKeys.has('riasec') && !completedKeys.has('mbti')) {
      recs.push({ key: 'mbti', reason: t('assessment.dashboard.rec.mbtiAfterRiasec') })
    }
    if (completedKeys.has('mbti') && !completedKeys.has('riasec')) {
      recs.push({ key: 'riasec', reason: t('assessment.dashboard.rec.riasecAfterMbti') })
    }
    if (recs.length < 3) {
      scales
        .filter((s) => s.available && !completedKeys.has(s.key))
        .slice(0, 3 - recs.length)
        .forEach((s) => {
          recs.push({ key: s.key, reason: t('assessment.dashboard.rec.exploreNew') })
        })
    }
    return recs
      .slice(0, 3)
      .map((rec) => ({ ...rec, scale: scales.find((s) => s.key === rec.key) }))
  }, [history, scales, t])

  // v-show → 保持挂载、以 display 切换（与 Vue v-show 行为一致，图表状态不丢失）
  const show = (key: string): React.CSSProperties | undefined =>
    activeDashboard === key ? undefined : { display: 'none' }

  return (
    <div className={styles.dashboardWrapper}>
      <div ref={layoutRef} className={styles.dashboardLayout}>
        {/* 左侧导航 */}
        <aside className={styles.dashboardSidebar}>
          <span className={styles.sbCap}>Sections</span>
          {dashboardNav.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={activeDashboard === item.key}
              className={`${styles.navItem}${activeDashboard === item.key ? ` ${styles.active}` : ''}`}
              onClick={() => setActiveDashboard(item.key)}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
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
                <div className={styles.kpiIcon}><AppstoreOutlined /></div>
                <div className={styles.kpiInfo}>
                  <span className={styles.kpiValue}>{categoriesCovered}</span>
                  <span className={styles.kpiLabel}>{t('assessment.dashboard.kpi.categories')}</span>
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
                {/* AntV Charts（@ant-design/plots）：配色经 readCssColor 解析语义 token，
                    isDark 切换 theme + 配色重建 → 图表热更新；面积透明度走 fillOpacity */}
                <Radar
                  ref={radarChartRef}
                  theme={isDark ? 'dark' : 'light'}
                  className={styles.chartBox}
                  data={radarData}
                  xField="dim"
                  yField="value"
                  colorField="kind"
                  scale={{
                    y: { domain: [0, 100] },
                    x: { padding: 0 },
                    color: { domain: [yourSeries, groupSeries], range: [chartColors.brand, chartColors.faint] },
                  }}
                  axis={{
                    x: {
                      labelFill: chartColors.textSecondary,
                      labelFontSize: 12,
                      labelFontWeight: 600,
                      line: false,
                      tick: false,
                      grid: true,
                      gridStroke: chartColors.border,
                    },
                    y: { label: false, line: false, tick: false, grid: true, gridStroke: chartColors.border },
                  }}
                  legend={{
                    color: {
                      position: 'bottom',
                      itemMarker: 'circle',
                      itemMarkerSize: 8,
                      itemSpacing: 24,
                      itemLabelFill: chartColors.textSecondary,
                      itemLabelFontSize: 12,
                    },
                  }}
                  style={{
                    lineWidth: (d: RadarDatum) => (d.kind === yourSeries ? 2.5 : 1.5),
                    strokeDasharray: (d: RadarDatum) => (d.kind === groupSeries ? [4, 4] : undefined),
                  }}
                  area={{ style: { fillOpacity: (d: RadarDatum) => (d.kind === yourSeries ? 0.16 : 0.08) } }}
                  point={{ style: { r: (d: RadarDatum) => (d.kind === yourSeries ? 3 : 0) } }}
                />
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
                </div>
              </div>
              <div className={`${styles.trendChartContainer} ${styles.trendLarge}`}>
                {trendChart.dates.length > 0 ? (
                  <Line
                    ref={trendChartRef}
                    theme={isDark ? 'dark' : 'light'}
                    className={styles.chartBox}
                    data={trendChart.rows}
                    xField="date"
                    yField="value"
                    colorField="kind"
                    shape="smooth"
                    scale={{
                      y: { domain: [0, 100] },
                      color: { domain: trendChart.domain, range: trendChart.range },
                    }}
                    axis={{
                      x: {
                        labelFill: chartColors.faint,
                        labelFontSize: 11,
                        lineStroke: chartColors.border,
                        tick: false,
                        title: false,
                      },
                      y: {
                        labelFill: chartColors.faint,
                        labelFontSize: 11,
                        line: false,
                        tick: false,
                        grid: true,
                        gridStroke: chartColors.split,
                        title: false,
                      },
                    }}
                    legend={{
                      color: {
                        position: 'top',
                        itemMarker: 'circle',
                        itemMarkerSize: 8,
                        itemLabelFill: chartColors.textSecondary,
                        itemLabelFontSize: 12,
                      },
                    }}
                    style={{ lineWidth: 2.5 }}
                    area={{ style: { fillOpacity: 0.12 } }}
                    point={{ style: { r: 3.5 } }}
                    annotations={
                      trendChart.firstAvg !== null
                        ? [
                            {
                              // 首条曲线（PHQ-9）均值参考线：仅此一条，避免三条虚线互相干扰
                              type: 'lineY',
                              encode: { y: trendChart.firstAvg },
                              style: { stroke: chartColors.faint, lineWidth: 1, strokeDasharray: [4, 4] },
                              labels: [
                                {
                                  text: `${t('assessment.dashboard.avgLabel')} ${trendChart.firstAvg}`,
                                  position: 'right',
                                  fill: chartColors.faint,
                                  fontSize: 11,
                                },
                              ],
                            },
                          ]
                        : undefined
                    }
                  />
                ) : (
                  <div className={styles.chartEmpty}>{t('assessment.dashboard.noTrendData')}</div>
                )}
              </div>
            </div>
          </div>

          {/* 测评分布 */}
          <div className={styles.contentSection} style={show('distribution')}>
            <div className={`${styles.panel} ${styles.dashboardCard}`}>
              <div className={styles.cardHeader}>
                <h3><PieChartOutlined /> {t('assessment.dashboard.typeDist')}</h3>
              </div>
              {donutChart.items.length > 0 ? (
                <div className={`${styles.donutWrapper} ${styles.donutLarge}`}>
                  <div className={styles.donutChartWrap}>
                    <Pie
                      ref={donutChartRef}
                      theme={isDark ? 'dark' : 'light'}
                      className={styles.chartBox}
                      data={donutChart.items}
                      angleField="value"
                      colorField="name"
                      innerRadius={0.72}
                      radius={0.95}
                      scale={{
                        color: { domain: donutChart.items.map((d) => d.name), range: donutChart.colors },
                      }}
                      style={{ stroke: chartColors.bgCard, lineWidth: 2 }}
                      label={false}
                      legend={false}
                      tooltip={{
                        items: [
                          (d: DonutDatum) => ({
                            name: d.name,
                            value: t('assessment.dashboard.distTooltip', {
                              count: d.value,
                              percent: donutTotal ? Math.round((d.value / donutTotal) * 100) : 0,
                            }),
                          }),
                        ],
                      }}
                    />
                    {/* 中心总计（环形圆心 HTML overlay，颜色走语义 token） */}
                    <div className={styles.donutCenter} aria-hidden="true">
                      <span className={styles.donutCenterNum}>{donutTotal}</span>
                      <span className={styles.donutCenterLabel}>{t('assessment.dashboard.totalLabel')}</span>
                    </div>
                  </div>
                  {/* 图例自绘（右侧垂直排布），与中心总计布局解耦且完全走语义 token */}
                  <ul className={styles.donutLegend}>
                    {donutChart.items.map((d, i) => (
                      <li key={d.name} className={styles.donutLegendItem}>
                        <span className={styles.donutLegendDot} style={{ backgroundColor: donutChart.colors[i] }} />
                        <span>{d.name}</span>
                        <span className={styles.donutLegendCount}>{d.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className={styles.chartEmptyState}>
                  <Empty description={t('assessment.dashboard.distEmpty')} styles={{ image: { height: 80 } }} />
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
                  <Empty description={t('assessment.dashboard.progressEmpty')} styles={{ image: { height: 80 } }} />
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
        </div>
      </div>
    </div>
  )
}
