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
import { useECharts, type EChartsCoreOption } from '@/hooks/useECharts'
import { useI18n } from '@/i18n'
import { useTheme } from '@/hooks/useTheme'
import { readCssColor } from '@/utils/cssVar'
import ScaleIcon from '@/components/ScaleIcon'
import { TAG_COLOR } from '../MinePanel'
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

/** 把 readCssColor 解析出的 rgb(a) 颜色转为带透明度的 rgba（ECharts 渐变面积用） */
function withAlpha(resolved: string, alpha: number): string {
  const m = resolved.match(/rgba?\(([^)]+)\)/)
  if (!m) return resolved
  const [r, g, b] = m[1].split(',').map((v) => parseFloat(v))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** 成长看板面板：侧栏导航 + 7 个内容区，可视化数据全部由 history 派生 */
export default function DashboardPanel({ history, scales, onView, onOpenScale }: Props) {
  const { t } = useI18n()
  const { message } = AntApp.useApp() // 替代静态 ElMessage，带主题上下文
  const layoutRef = useReveal<HTMLDivElement>({ delay: 80 })
  // 订阅真实主题源（useTheme 同步翻 html.dark 后才 emit，重渲染时 token 必为新值）；
  // mode / palette 任一变化都重建图表配色（themeSignature 缓存随之失效）
  const { isDark, palette } = useTheme()

  // 图表配色：全部经 readCssColor 从语义 token 解析（禁止在 option 中写死色值）
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
      brandArea: withAlpha(brand, 0.16),
      faint,
      faintArea: withAlpha(faint, 0.08),
      textHeading: readCssColor('var(--text-heading)'),
      textSecondary: readCssColor('var(--text-secondary)'),
      border: readCssColor('var(--border-strong)'),
      split: readCssColor('var(--border-light)'),
      bgCard: readCssColor('var(--bg-card)'),
      cat,
    }
  }, [isDark, palette])

  const totalCompleted = history.length
  const growthPoints = history.length * 10

  // 测评天数（不同日期的数量）
  const assessmentDays = useMemo(() => new Set(history.map((h) => h.date)).size, [history])

  // --- 侧边栏选中态（原 ref → useState） ---
  const [activeDashboard, setActiveDashboard] = useState('overview')

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

  // 最爱维度
  const favoriteCategory = useMemo(() => {
    const catCount: Record<string, number> = {}
    history.forEach((h) => {
      const scale = scales.find((s) => s.key === h.scaleKey)
      if (scale) catCount[scale.category] = (catCount[scale.category] || 0) + 1
    })
    const sorted = Object.entries(catCount).sort((a, b) => b[1] - a[1])
    if (sorted.length === 0) return '尚未探索'
    return t(`assessment.categories.${sorted[0][0]}`)
  }, [history, scales, t])

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

  const trendSeries = useMemo(() => {
    const defs = [
      { key: 'phq9', name: 'PHQ-9', color: 'var(--cat-geekblue)', max: 27 },
      { key: 'gad7', name: 'GAD-7', color: 'var(--cat-gold)', max: 21 },
      { key: 'pss', name: 'PSS-10', color: 'var(--cat-cyan)', max: 30 },
    ]
    const days = trendRange === '7d' ? 7 : trendRange === '30d' ? 30 : null
    const records = history
      .filter((h) => defs.some((d) => d.key === h.scaleKey))
      .filter((h) => !days || dayjs(h.date).isAfter(dayjs().subtract(days, 'day')))
      .sort((a, b) => a.date.localeCompare(b.date))
    const dates = [...new Set(records.map((h) => dayjs(h.date).format('MM-DD')))]
    return {
      dates,
      series: defs.map((def) => ({
        ...def,
        values: dates.map((date) => {
          const record = records.find(
            (h) => h.scaleKey === def.key && dayjs(h.date).format('MM-DD') === date
          )
          return record ? Math.max(5, Math.round(100 - (record.score / def.max) * 100)) : null
        }),
      })),
    }
  }, [history, trendRange])

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

  // --- 测评分布（环形图数据：按分类聚合并映射主题分类色） ---
  const donutData = useMemo(() => {
    const catCount: Record<string, number> = {}
    history.forEach((h) => {
      const scale = scales.find((s) => s.key === h.scaleKey)
      if (scale) catCount[scale.category] = (catCount[scale.category] || 0) + 1
    })
    return Object.entries(catCount).map(([cat, value]) => ({
      name: t(`assessment.categories.${cat}`),
      value,
      itemStyle: { color: chartColors.cat[cat as keyof typeof chartColors.cat] ?? chartColors.brand },
    }))
  }, [history, scales, t, chartColors])
  const donutTotal = donutData.reduce((acc, d) => acc + d.value, 0)

  // --- 图表 option（依赖 chartColors：主题切换时自动重建） ---
  const radarOption = useMemo<EChartsCoreOption>(
    () => ({
      tooltip: { trigger: 'item' },
      legend: {
        bottom: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 24,
        textStyle: { color: chartColors.textSecondary, fontSize: 12 },
      },
      radar: {
        indicator: radarLabels.map((name) => ({ name, max: 100 })),
        radius: '60%',
        center: ['50%', '47%'],
        axisName: { color: chartColors.textSecondary, fontSize: 12, fontWeight: 600 },
        axisLine: { lineStyle: { color: chartColors.border } },
        splitLine: { lineStyle: { color: chartColors.border } },
        splitArea: { show: false },
      },
      series: [
        {
          type: 'radar',
          symbol: 'circle',
          symbolSize: 6,
          data: [
            {
              name: t('assessment.dashboard.yourStatus'),
              value: radarUserValues,
              itemStyle: { color: chartColors.brand },
              lineStyle: { width: 2.5, color: chartColors.brand },
              areaStyle: { color: chartColors.brandArea },
            },
            {
              name: t('assessment.dashboard.groupAvg'),
              value: radarGroupValues,
              symbol: 'none',
              itemStyle: { color: chartColors.faint },
              lineStyle: { width: 1.5, type: 'dashed', color: chartColors.faint },
              areaStyle: { color: chartColors.faintArea },
            },
          ],
        },
      ],
    }),
    [radarUserValues, chartColors, t]
  )

  const trendOption = useMemo<EChartsCoreOption>(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: {
        top: 0,
        right: 8,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: chartColors.textSecondary, fontSize: 12 },
      },
      grid: { left: 8, right: 24, top: 40, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: trendSeries.dates,
        boundaryGap: false,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: chartColors.border } },
        axisLabel: { color: chartColors.faint, fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        splitLine: { lineStyle: { color: chartColors.split } },
        axisLabel: { color: chartColors.faint, fontSize: 11 },
      },
      series: trendSeries.series.map((s, idx) => ({
        name: s.name,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        connectNulls: false,
        data: s.values,
        itemStyle: { color: readCssColor(s.color) },
        lineStyle: { width: 2.5, color: readCssColor(s.color) },
        areaStyle: { color: withAlpha(readCssColor(s.color), 0.12) },
        emphasis: { focus: 'series' },
        // 仅首条曲线绘制均值参考线，避免三条虚线互相干扰
        markLine:
          idx === 0
            ? {
                silent: true,
                symbol: 'none',
                lineStyle: { type: 'dashed', color: chartColors.faint },
                label: {
                  formatter: '均值 {c}',
                  color: chartColors.faint,
                  fontSize: 11,
                  position: 'insideEndTop',
                },
                data: [{ type: 'average' }],
              }
            : undefined,
      })),
    }),
    [trendSeries, chartColors]
  )

  const donutOption = useMemo<EChartsCoreOption>(
    () => ({
      tooltip: { trigger: 'item', formatter: '{b}：{c} 次（{d}%）' },
      legend: {
        orient: 'vertical',
        right: '4%',
        top: 'center',
        icon: 'circle',
        itemWidth: 9,
        itemHeight: 9,
        itemGap: 18,
        textStyle: { color: chartColors.textSecondary, fontSize: 13 },
      },
      title: {
        text: String(donutTotal),
        subtext: t('assessment.dashboard.totalLabel'),
        left: '27%',
        top: '38%',
        textAlign: 'center',
        textStyle: { fontSize: 30, fontWeight: 800, color: chartColors.textHeading },
        subtextStyle: { fontSize: 12, color: chartColors.faint },
      },
      series: [
        {
          type: 'pie',
          radius: ['58%', '80%'],
          center: ['27%', '50%'],
          padAngle: 2,
          itemStyle: { borderColor: chartColors.bgCard, borderWidth: 2, borderRadius: 8 },
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            scaleSize: 8,
            label: {
              show: true,
              formatter: '{b}\n{d}%',
              fontSize: 12,
              fontWeight: 600,
              color: chartColors.textHeading,
            },
          },
          data: donutData,
        },
      ],
    }),
    [donutData, donutTotal, chartColors, t]
  )

  const radarRef = useECharts(radarOption)
  const trendRef = useECharts(trendSeries.dates.length > 0 ? trendOption : null)
  const donutRef = useECharts(donutData.length > 0 ? donutOption : null)

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
                <div ref={radarRef} className={styles.chartBox} />
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
                {trendSeries.dates.length > 0 ? (
                  <div ref={trendRef} className={styles.chartBox} />
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
              {donutData.length > 0 ? (
                <div className={`${styles.donutWrapper} ${styles.donutLarge}`}>
                  <div ref={donutRef} className={styles.chartBox} />
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
                  rowKey={(record) => String(record.id)}
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
