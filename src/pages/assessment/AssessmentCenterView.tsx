import { useEffect, useMemo, useState } from 'react'
import { App as AntApp, ConfigProvider, Tabs } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ModuleCover from '@/components/ModuleCover'
import {
  DashboardPanel,
  MinePanel,
  ScaleDialog,
  ScalePanel,
} from '@/features/assessment'
import { ASSESSMENT_STORAGE_KEY, categories, scaleList, scales } from '@/features/assessment'
import type { AssessmentRecord, ScaleInfo } from '@/features/assessment'
import { useI18n } from '@/i18n'
import './AssessmentCenterView.css'

/**
 * assessment 作用域组件 token：
 * 页签「极简文字」外观（原 AssessmentCenterView.css 的 .ant-tabs-* 覆写）、
 * 历史表格表头（原 AssessmentDashboardPanel.css .ant-table-thead 背景/文字色）、
 * 历史筛选下拉（原 .history-filter .ant-select-selector 覆写）收敛为
 * 嵌套 ConfigProvider 官方注入，仅作用于本页。
 * 字重/字距、表格字体、nav 底线隐藏等无对应 token 的维度仍保留在组件 css。
 */
const assessmentThemeComponents = {
  Tabs: {
    titleFontSize: 14,
    itemColor: 'var(--ink-400)',
    itemSelectedColor: 'var(--navy-950)',
    horizontalItemPadding: '0 20px 14px 0',
    horizontalItemGutter: 0,
    horizontalMargin: '0 0 36px 0',
    inkBarColor: 'var(--navy-950)',
  },
  Table: {
    headerBg: 'var(--slate-50)',
    headerColor: 'var(--slate-800)',
  },
  Select: {
    borderRadius: 8,
    colorBorder: 'var(--neutral-100)',
    selectorBg: 'var(--slate-50)',
    hoverBorderColor: 'var(--brand-primary)',
    activeBorderColor: 'var(--neutral-100)',
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
  const [activeCategory, setActiveCategory] = useState('all')

  // 弹窗状态
  const [activeScaleKey, setActiveScaleKey] = useState('')
  const [result, setResult] = useState<AssessmentRecord | null>(null)
  const [allHistory, setAllHistory] = useState<AssessmentRecord[]>([])
  const [dialogVisible, setDialogVisible] = useState(false)
  const [dialogMode, setDialogMode] = useState<'intro' | 'result'>('intro')

  // 分类导航（附数量）
  const panelCategories = useMemo(
    () =>
      categories.map((c) => ({
        ...c,
        count: c.key === 'all' ? scaleList.length : scaleList.filter((s) => s.category === c.key).length,
      })),
    []
  )

  const filteredScales = useMemo(() => {
    return scaleList.filter((scale) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        scale.name.toLowerCase().includes(q) ||
        scale.desc.toLowerCase().includes(q) ||
        scale.tags.some((tag) => tag.toLowerCase().includes(q))
      const matchesCategory = activeCategory === 'all' || scale.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, activeCategory])

  const completedKeys = useMemo(() => allHistory.map((h) => h.scaleKey), [allHistory])

  // --- 逻辑方法 ---

  // el-tabs @tab-change → antd Tabs onChange
  function handleTabChange(key: string) {
    setMainTab(key)
    if (key === 'dashboard' || key === 'mine') loadHistory()
  }

  function handleScaleClick(scale: ScaleInfo) {
    if (!scale.available) {
      message.info(t('assessment.comingSoonTip', { name: scale.name }))
      return
    }
    setActiveScaleKey(scale.key)
    // 检查是否有历史结果且路由要求显示结果
    if (searchParams.get('view') === 'result' && searchParams.get('scale') === scale.key) {
      const lastRecord = allHistory.find((h) => h.scaleKey === scale.key)
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
    // router.push({ name: 'assessment-take', params }) → navigate 路径跳转
    navigate(`/assessment/take/${activeScaleKey}`)
  }

  function loadHistory() {
    setAllHistory(JSON.parse(localStorage.getItem(ASSESSMENT_STORAGE_KEY) || '[]'))
  }

  function viewHistory(row: AssessmentRecord) {
    setActiveScaleKey(row.scaleKey)
    setResult(row)
    setMainTab('scales')
    setDialogMode('result')
    setDialogVisible(true)
  }

  // 清空历史记录：ElMessageBox.confirm → modal.confirm（来自 AntApp 上下文）
  function clearAllHistory() {
    modal.confirm({
      title: t('assessment.history.clearTitle'),
      content: t('assessment.history.clearConfirm'),
      okText: t('assessment.history.clearOk'),
      cancelText: t('common.cancel'),
      icon: <ExclamationCircleFilled />,
      onOk() {
        localStorage.removeItem(ASSESSMENT_STORAGE_KEY)
        setAllHistory([])
        message.success(t('assessment.history.cleared'))
      },
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
   * 首次挂载与 query 变化都会执行，行为等价且去除了 Vue 版的重复逻辑。
   */
  useEffect(() => {
    const history: AssessmentRecord[] = JSON.parse(
      localStorage.getItem(ASSESSMENT_STORAGE_KEY) || '[]'
    )
    setAllHistory(history)

    const s = searchParams.get('scale')
    const v = searchParams.get('view')
    if (s && scales[s]) {
      setActiveScaleKey(s)
      if (v === 'result') {
        const lastRecord = history.find((h) => h.scaleKey === s)
        if (lastRecord) {
          setResult(lastRecord)
          setDialogMode('result')
          setDialogVisible(true)
        }
      } else if (v === 'intro') {
        setDialogMode('intro')
        setDialogVisible(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // AntD 5 Tabs 推荐 items 写法（替代 el-tabs + el-tab-pane 模板结构）
  const tabItems = [
    {
      key: 'scales',
      label: t('assessment.tabs.scales'),
      children: (
        <>
          <ModuleCover
            eyebrow="— Assessment"
            no={`No.${String(scaleList.length).padStart(2, '0')}`}
            title={t('assessment.cover.scales.title')}
            desc={t('assessment.cover.scales.desc')}
          />
          <ScalePanel
            categories={panelCategories}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
            scales={filteredScales}
            completedKeys={completedKeys}
            onActiveCategoryChange={setActiveCategory}
            onSearchQueryChange={setSearchQuery}
            onSelect={handleScaleClick}
          />
        </>
      ),
    },
    {
      key: 'mine',
      label: t('assessment.tabs.mine'),
      children: (
        <MinePanel
          history={allHistory}
          scales={scaleList}
          onView={viewHistory}
          onRetake={retakeAssessment}
          onClearHistory={clearAllHistory}
          onGoAssess={() => setMainTab('scales')}
        />
      ),
    },
    {
      key: 'dashboard',
      label: t('assessment.tabs.dashboard'),
      children: (
        <DashboardPanel
          history={allHistory}
          scales={scaleList}
          onView={viewHistory}
          onOpenScale={openScaleIntro}
        />
      ),
    },
  ]

  return (
    <ConfigProvider theme={{ components: assessmentThemeComponents }}>
      <div className="assessment-page">
      {/* 主体功能区：activeKey + onChange 受控（对应 v-model + @tab-change） */}
      <Tabs activeKey={mainTab} onChange={handleTabChange} items={tabItems} className="main-tabs" />

      {/* 测评介绍 / 结果弹窗：v-model:visible → 受控 open + onClose */}
      <ScaleDialog
        open={dialogVisible}
        mode={dialogMode}
        scaleKey={activeScaleKey}
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
