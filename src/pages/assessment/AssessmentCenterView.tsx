/**
 * 测评中心（页面层）：量表目录与历史记录均由接口提供，三个页签共享三态兜底。
 * 计分与历史持久化在服务端，页面不再读写 localStorage。
 */
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { App as AntApp, Button, ConfigProvider, Result, Skeleton, Tabs } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ModuleCover from '@/components/ModuleCover'
import {
  DashboardPanel,
  MinePanel,
  ScaleDialog,
  ScalePanel,
} from '@/features/assessment'
import type { AssessmentCategoryKey, AssessmentRecord, ScaleInfo } from '@/features/assessment'
import { useI18n } from '@/i18n'
import {
  useAssessmentHistory,
  useAssessmentScale,
  useAssessmentScales,
  useClearAssessmentHistory,
} from './assessmentQuery'
import './AssessmentCenterView.css'

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

/**
 * assessment 作用域组件 token：
 * 页签「极简文字」外观、历史表格表头、历史筛选下拉收敛为嵌套 ConfigProvider 注入，仅作用于本页。
 */
const assessmentThemeComponents = {
  Tabs: {
    titleFontSize: 14,
    itemColor: 'var(--text-faint)',
    itemSelectedColor: 'var(--text-heading)',
    horizontalItemPadding: '0 20px 14px 0',
    horizontalItemGutter: 0,
    horizontalMargin: '0 0 36px 0',
    inkBarColor: 'var(--text-heading)',
  },
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
  const [searchParams] = useSearchParams()
  const { t } = useI18n()
  const { message, modal } = AntApp.useApp() // 替代 ElMessage / ElMessageBox

  const [mainTab, setMainTab] = useState('scales')
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
  const clearHistory = useClearAssessmentHistory()

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

  // --- 逻辑方法 ---

  function handleTabChange(key: string) {
    setMainTab(key)
  }

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
    setMainTab('scales')
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

  // AntD 5 Tabs 推荐 items 写法
  const tabItems = [
    {
      key: 'scales',
      label: t('assessment.tabs.scales'),
      children: (
        <>
          <ModuleCover
            eyebrow="— Assessment"
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
    },
    {
      key: 'mine',
      label: t('assessment.tabs.mine'),
      children: gateHistory(
        <MinePanel
          history={history}
          scales={scales}
          onView={viewHistory}
          onRetake={retakeAssessment}
          onClearHistory={clearAllHistory}
          onGoAssess={() => setMainTab('scales')}
        />,
      ),
    },
    {
      key: 'dashboard',
      label: t('assessment.tabs.dashboard'),
      children: gateHistory(
        <DashboardPanel
          history={history}
          scales={scales}
          onView={viewHistory}
          onOpenScale={openScaleIntro}
        />,
      ),
    },
  ]

  return (
    <ConfigProvider theme={{ components: assessmentThemeComponents }}>
      <div className="assessment-page">
        <Tabs
          className="main-tabs"
          activeKey={mainTab}
          onChange={handleTabChange}
          items={tabItems}
        />

        {/* 量表弹窗：介绍 / 结果，数据由页面注入 */}
        <ScaleDialog
          open={dialogVisible}
          mode={dialogMode}
          scaleInfo={activeScaleInfo}
          scaleDetail={activeScaleDetail}
          result={result}
          onClose={() => setDialogVisible(false)}
          onStart={startAssessment}
          onDownload={mockDownload}
          onShare={mockShare}
        />
      </div>
    </ConfigProvider>
  )
}
