/**
 * 测评中心（页面层）：量表目录与历史记录均由接口提供，三个面板共享三态兜底。
 * 计分与历史持久化在服务端，页面不再读写 localStorage。
 *
 * 桌面优先结构（与咨询中心同一设计语言）：
 *   Hero（品牌主张 + 关键数据 + 主行动）
 *   └─ Workspace：左侧索引式导航（吸顶） + 右侧面板
 * 三块面板常驻挂载（hidden 切换）：看板图表状态不丢失，切回即用。
 * ?tab= 与 URL 同步，便于分享与刷新保持。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { App as AntApp, Button, ConfigProvider, Result, Skeleton } from 'antd'
import {
  ArrowRightOutlined,
  BarChartOutlined,
  ExclamationCircleFilled,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DashboardPanel, MinePanel, ScaleDialog, ScalePanel } from '@/features/assessment'
import type { AssessmentCategoryKey, AssessmentRecord, ScaleInfo } from '@/features/assessment'
import { useTranslation } from 'react-i18next'
import { useReveal } from '@/hooks/useReveal'
import {
  useAssessmentHistory,
  useAssessmentPoints,
  useAssessmentScale,
  useAssessmentScales,
  useClearAssessmentHistory,
} from '../assessmentQuery'
import './index.css'

/** 分类导航（名称走 i18n；数量由接口数据派生） */
const CATEGORY_KEYS: AssessmentCategoryKey[] = [
  'all',
  'mental',
  'career',
  'cognitive',
  'esports',
  'learning',
  'social',
]

type MainTab = 'scales' | 'dashboard' | 'mine'

const MAIN_TABS: { key: MainTab; no: string; Icon: typeof BarChartOutlined }[] = [
  { key: 'scales', no: '01', Icon: UnorderedListOutlined },
  { key: 'dashboard', no: '02', Icon: BarChartOutlined },
  { key: 'mine', no: '03', Icon: UserOutlined },
]

const TAB_PARAM: Record<string, MainTab> = {
  scales: 'scales',
  dashboard: 'dashboard',
  mine: 'mine',
}

/** 面板头：与咨询中心同源（eyebrow / No. / 大标题 / 一句话说明） */
function PanelHead({
  eyebrow,
  no,
  title,
  desc,
}: {
  eyebrow: string
  no: string
  title: string
  desc: string
}) {
  return (
    <header className="as-panel-head">
      <div className="as-ph-top">
        <span className="as-ph-eyebrow">{eyebrow}</span>
        <span className="as-ph-no">{no}</span>
      </div>
      <h2 className="as-ph-title" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="as-ph-desc">{desc}</p>
    </header>
  )
}

/**
 * assessment 作用域组件 token：看板历史表头与筛选下拉的收敛外观，仅作用于本页。
 */
const assessmentThemeComponents = {
  Table: {
    headerBg: 'var(--bg-soft)',
    headerColor: 'var(--text-regular)',
  },
  Select: {
    borderRadius: 8,
    colorBorder: 'var(--border-light)',
    selectorBg: 'var(--bg-soft)',
    hoverBorderColor: 'var(--brand-primary)',
    activeBorderColor: 'var(--border-light)',
    activeOutlineColor: 'transparent',
  },
}

export default function AssessmentCenterView() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation()
  const { message, modal } = AntApp.useApp() // 替代 ElMessage / ElMessageBox

  const heroRef = useReveal<HTMLElement>()
  const panelRef = useRef<HTMLDivElement | null>(null)

  const mainTab: MainTab = TAB_PARAM[searchParams.get('tab') ?? ''] ?? 'scales'
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // 弹窗状态
  const [activeScaleKey, setActiveScaleKey] = useState('')
  const [result, setResult] = useState<AssessmentRecord | null>(null)
  const [dialogVisible, setDialogVisible] = useState(false)
  const [dialogMode, setDialogMode] = useState<'intro' | 'result'>('intro')

  // 接口数据
  const {
    data: scales = [],
    isPending: scalesPending,
    isError: scalesError,
    refetch: refetchScales,
  } = useAssessmentScales()
  const {
    data: history = [],
    isPending: historyPending,
    isError: historyError,
    refetch: refetchHistory,
  } = useAssessmentHistory()
  const { data: activeScaleDetail } = useAssessmentScale(activeScaleKey || undefined)
  // 积分走账本口径（余额 / 等级 / 明细），与历史上限解耦
  const { data: points } = useAssessmentPoints()
  const clearHistory = useClearAssessmentHistory()

  /** 切页签：写回 ?tab=（保留 scale/view 等既有参数） */
  function switchTab(key: MainTab) {
    const next = new URLSearchParams(searchParams)
    if (key === 'scales') next.delete('tab')
    else next.set('tab', key)
    setSearchParams(next, { replace: true })

    // 已滚过面板顶部时，切页签回到面板起点，避免停在半截内容处
    const el = panelRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    if (window.scrollY > top - 120) {
      window.scrollTo({ top: Math.max(top - 96, 0), behavior: 'smooth' })
    }
  }

  // 分类导航（附数量）
  const panelCategories = useMemo(
    () =>
      CATEGORY_KEYS.map((key) => ({
        key,
        name: t(`assessment.categories.${key}`),
        count: key === 'all' ? scales.length : scales.filter((s) => s.category === key).length,
      })),
    [scales, t],
  )

  const filteredScales = useMemo(() => {
    return scales.filter((scale) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        scale.name.toLowerCase().includes(q) ||
        scale.desc.toLowerCase().includes(q) ||
        scale.tags.some((tag) => tag.toLowerCase().includes(q))
      const matchesCategory = activeCategory === 'all' || scale.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [scales, searchQuery, activeCategory])

  const completedKeys = useMemo(() => history.map((h) => h.scaleKey), [history])

  const activeScaleInfo = useMemo<ScaleInfo | undefined>(
    () => scales.find((s) => s.key === activeScaleKey),
    [scales, activeScaleKey],
  )

  // 介绍弹窗里的「上次结果」入口：取该量表最近一条历史记录
  const activeLastRecord = useMemo<AssessmentRecord | null>(
    () => history.find((h) => h.scaleKey === activeScaleKey) ?? null,
    [history, activeScaleKey],
  )

  // Hero 数据：量表数取接口条数；其余全部为服务端下发指标（前端不做统计）
  const heroStats = useMemo(() => {
    return [
      { value: scales.length ? String(scales.length) : '—', label: t('assessment.hero.stats.scales') },
      { value: String(points?.completed ?? 0), label: t('assessment.hero.stats.completed') },
      { value: String(points?.balance ?? 0), label: t('assessment.hero.stats.points') },
      { value: `${points?.monthlyPercent ?? 0}%`, label: t('assessment.hero.stats.goal') },
    ]
  }, [scales.length, points, t])

  // --- 逻辑方法 ---

  function handleScaleClick(scale: ScaleInfo) {
    if (!scale.available) {
      message.info(t('assessment.comingSoonTip', { name: scale.name }))
      return
    }
    setActiveScaleKey(scale.key)
    // 从答题页返回时带 ?view=result：优先展示最近一次结果
    if (searchParams.get('view') === 'result' && searchParams.get('scale') === scale.key) {
      const lastRecord = history.find((h) => h.scaleKey === scale.key)
      if (lastRecord) {
        setResult(lastRecord)
        setDialogMode('result')
        setDialogVisible(true)
        return
      }
    }
    setResult(null)
    setDialogMode('intro')
    setDialogVisible(true)
  }

  // 从看板推荐打开介绍弹窗
  function openScaleIntro(key: string) {
    setActiveScaleKey(key)
    setDialogMode('intro')
    setDialogVisible(true)
  }

  function startAssessment() {
    setDialogVisible(false)
    navigate(`/assessment/take/${activeScaleKey}`)
  }

  function viewHistory(row: AssessmentRecord) {
    setActiveScaleKey(row.scaleKey)
    setResult(row)
    switchTab('scales')
    setDialogMode('result')
    setDialogVisible(true)
  }

  // 清空历史记录（接口 + 失效缓存）
  function clearAllHistory() {
    modal.confirm({
      title: t('assessment.history.clearTitle'),
      content: t('assessment.history.clearConfirm'),
      okText: t('assessment.history.clearOk'),
      cancelText: t('common.cancel'),
      icon: <ExclamationCircleFilled />,
      onOk: () => clearHistory.mutate(),
    })
  }

  // 重新测评
  function retakeAssessment(record: AssessmentRecord) {
    setActiveScaleKey(record.scaleKey)
    setDialogMode('intro')
    setDialogVisible(true)
  }

  // 结果报告占位动作
  function mockDownload() {
    message.success(t('assessment.dialog.reportGenerated'))
  }
  function mockShare() {
    message.info(t('assessment.dialog.shareCopied'))
  }

  /**
   * 原 onMounted + watch(route.query) 合并为一个 effect：
   * 首次挂载与 query 变化都会执行；数据到位后再决定是否弹出结果。
   */
  useEffect(() => {
    const scaleKey = searchParams.get('scale')
    const view = searchParams.get('view')
    if (!scaleKey || !scales.some((s) => s.key === scaleKey)) return

    setActiveScaleKey(scaleKey)
    if (view === 'result' && history.length > 0) {
      const lastRecord = history.find((h) => h.scaleKey === scaleKey)
      if (lastRecord) {
        setResult(lastRecord)
        setDialogMode('result')
        setDialogVisible(true)
      }
    } else if (view === 'intro') {
      setDialogMode('intro')
      setDialogVisible(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, scales, history])

  /** 量表目录三态兜底 */
  function gateScales(children: ReactNode) {
    if (scalesPending) {
      return (
        <div className="assessment-state">
          <Skeleton active title={{ width: '38%' }} paragraph={{ rows: 2 }} />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} active avatar title={{ width: '30%' }} paragraph={{ rows: 2 }} />
          ))}
        </div>
      )
    }
    if (scalesError) {
      return (
        <div className="assessment-state">
          <Result
            status="error"
            title={t('common.loadFailed')}
            extra={
              <Button type="primary" onClick={() => void refetchScales()}>
                {t('common.retry')}
              </Button>
            }
          />
        </div>
      )
    }
    return children
  }

  /** 历史记录三态兜底 */
  function gateHistory(children: ReactNode) {
    if (historyPending) {
      return (
        <div className="assessment-state">
          <Skeleton active title={{ width: '38%' }} paragraph={{ rows: 3 }} />
          <Skeleton active title={false} paragraph={{ rows: 6 }} />
        </div>
      )
    }
    if (historyError) {
      return (
        <div className="assessment-state">
          <Result
            status="error"
            title={t('common.loadFailed')}
            extra={
              <Button type="primary" onClick={() => void refetchHistory()}>
                {t('common.retry')}
              </Button>
            }
          />
        </div>
      )
    }
    return children
  }

  const panels: Record<MainTab, ReactNode> = {
    scales: (
      <>
        <PanelHead
          eyebrow={t('assessment.eyebrow.scales')}
          no={`No.${String(scales.length).padStart(2, '0')}`}
          title={t('assessment.cover.scales.title')}
          desc={t('assessment.cover.scales.desc')}
        />
        {gateScales(
          <ScalePanel
            categories={panelCategories}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
            scales={filteredScales}
            completedKeys={completedKeys}
            onActiveCategoryChange={setActiveCategory}
            onSearchQueryChange={setSearchQuery}
            onSelect={handleScaleClick}
          />,
        )}
      </>
    ),
    dashboard: (
      <>
        <PanelHead
          eyebrow={t('assessment.eyebrow.dashboard')}
          no={`No.${String(history.length).padStart(2, '0')}`}
          title={t('assessment.cover.dashboard.title')}
          desc={t('assessment.cover.dashboard.desc')}
        />
        {gateHistory(
          <DashboardPanel
            history={history}
            scales={scales}
            points={points}
            onView={viewHistory}
            onOpenScale={openScaleIntro}
          />,
        )}
      </>
    ),
    mine: (
      <>
        <PanelHead
          eyebrow={t('assessment.eyebrow.mine')}
          no={`No.${String(history.length).padStart(2, '0')}`}
          title={t('assessment.cover.mine.title')}
          desc={t('assessment.cover.mine.desc')}
        />
        {gateHistory(
          <MinePanel
            history={history}
            points={points}
            onView={viewHistory}
            onRetake={retakeAssessment}
            onClearHistory={clearAllHistory}
            onGoAssess={() => switchTab('scales')}
          />,
        )}
      </>
    ),
  }

  return (
    <ConfigProvider theme={{ components: assessmentThemeComponents }}>
      <div className="assessment-page">
        {/* ============ Hero ============ */}
        <section ref={heroRef} className="as-hero">
          <div className="as-hero-main">
            <span className="as-eyebrow">{t('assessment.hero.eyebrow')}</span>
            <h1
              className="as-title"
              dangerouslySetInnerHTML={{ __html: t('assessment.hero.title') }}
            />
            <p className="as-desc">{t('assessment.hero.desc')}</p>

            <div className="as-actions">
              <button type="button" className="as-cta" onClick={() => switchTab('scales')}>
                {t('assessment.hero.primary')}
                <ArrowRightOutlined />
              </button>
              <button type="button" className="as-cta-ghost" onClick={() => switchTab('dashboard')}>
                <BarChartOutlined />
                {t('assessment.hero.secondary')}
              </button>
            </div>

            <dl className="as-stats">
              {heroStats.map((item) => (
                <div key={item.label} className="as-stat">
                  <dt>{item.value}</dt>
                  <dd>{item.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* 装饰性「量表刻度」视觉锚点：纯 CSS，不承载信息 */}
          <div className="as-scale-visual" aria-hidden="true">
            <span className="as-tick t1" />
            <span className="as-tick t2" />
            <span className="as-tick t3" />
            <span className="as-tick t4" />
            <span className="as-tick t5" />
            <span className="as-arc a1" />
            <span className="as-arc a2" />
            <span className="as-core" />
          </div>
        </section>

        {/* ============ Workspace ============ */}
        <div className="as-workspace">
          <nav className="as-rail" role="tablist" aria-label={t('assessment.hero.eyebrow')}>
            <span className="as-rail-cap">Index</span>
            {MAIN_TABS.map(({ key, no, Icon }) => {
              const active = mainTab === key
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`as-rail-item${active ? ' is-active' : ''}`}
                  onClick={() => switchTab(key)}
                >
                  <span className="as-rail-num">{no}</span>
                  <span className="as-rail-text">
                    <span className="as-rail-label">
                      <Icon />
                      {t(`assessment.tabs.${key}`)}
                    </span>
                    <span className="as-rail-desc">{t(`assessment.rail.${key}`)}</span>
                  </span>
                </button>
              )
            })}
          </nav>

          <div className="as-panel" ref={panelRef}>
            {(Object.keys(panels) as MainTab[]).map((key) => (
              <div key={key} role="tabpanel" className="as-panel-body" hidden={mainTab !== key}>
                {panels[key]}
              </div>
            ))}
          </div>
        </div>

        {/* 量表弹窗：介绍 / 结果，数据由页面注入 */}
        <ScaleDialog
          open={dialogVisible}
          mode={dialogMode}
          scaleInfo={activeScaleInfo}
          scaleDetail={activeScaleDetail}
          result={result}
          lastRecord={dialogMode === 'intro' ? activeLastRecord : null}
          onClose={() => setDialogVisible(false)}
          onStart={startAssessment}
          onDownload={mockDownload}
          onShare={mockShare}
          onViewLast={() => {
            if (activeLastRecord) viewHistory(activeLastRecord)
          }}
        />
      </div>
    </ConfigProvider>
  )
}
