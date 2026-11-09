/**
 * 【command-palette】AppCommandPalette —— 全局命令面板业务装配层
 * - 组装导航 / 文章 / 测评条目与分组文案（业务数据不进 base 层）
 * - 全局快捷键（Ctrl/⌘+K、/、ESC）在此注册
 * - 偏差说明：Vue 版选中后 emit('navigate', to) 由父层执行跳转；React 版
 *   遵循 React Router 最佳实践，改为组件内部 useNavigate() 直接
 *   navigate(target.to)，无需父层中转（非机械直译）。
 */
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCommandPalette } from '../../hooks/useCommandPalette'
import CommandPalette from '../CommandPalette'
import type { PaletteItem } from '../CommandPalette'

/** 业务条目：在纯 UI 条目上补充跳转目标 */
interface AppCmdItem extends PaletteItem {
  to: string
}

// 文章条目（模拟演示数据，等价 mock 后端内容，不做 i18n）
const articleItems: AppCmdItem[] = [
  { id: 'art-1', title: '如何在焦虑中找到内心的锚点', desc: '精选推荐', group: 'articles', to: '/articles' },
  { id: 'art-2', title: '大学生职业规划的五步法', desc: '职业发展', group: 'articles', to: '/articles' },
  { id: 'art-3', title: '正念冥想：从呼吸开始', desc: '心理健康', group: 'articles', to: '/articles' },
  { id: 'art-4', title: '拖延症背后的心理机制', desc: '心理健康', group: 'articles', to: '/articles' },
]

// 测评条目（模拟演示数据）
const assessItems: AppCmdItem[] = [
  { id: 'asm-1', title: 'SDS 抑郁自评量表', desc: '20题 · 约10分钟', group: 'assessment', to: '/assessment' },
  { id: 'asm-2', title: 'SAS 焦虑自评量表', desc: '20题 · 约10分钟', group: 'assessment', to: '/assessment' },
  { id: 'asm-3', title: 'MBTI 人格类型测试', desc: '93题 · 约15分钟', group: 'assessment', to: '/assessment' },
]

const groupLabels: Record<string, string> = {
  navigation: '— Navigate',
  articles: '— Articles',
  assessment: '— Assessment',
}

// 快捷键判定：输入类元素聚焦时不响应 '/' 唤起
const isTyping = (e: KeyboardEvent): boolean => {
  const target = e.target as HTMLElement | null
  const tag = target?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable === true
}

export function AppCommandPalette() {
  const { open, toggle, close } = useCommandPalette()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // 导航条目为界面文案，随语言切换重建（模块顶层禁止调用 t()，移入组件体内）
  const allItems = useMemo<AppCmdItem[]>(() => {
    const navItems: AppCmdItem[] = [
      { id: 'nav-home', title: t('command.nav.home'), desc: t('command.nav.homeDesc'), group: 'navigation', to: '/' },
      { id: 'nav-articles', title: t('command.nav.articles'), desc: t('command.nav.articlesDesc'), group: 'navigation', to: '/articles' },
      { id: 'nav-article-list', title: t('command.nav.articleList'), desc: t('command.nav.articleListDesc'), group: 'navigation', to: '/articles?view=list' },
      { id: 'nav-assessment', title: t('command.nav.assessment'), desc: t('command.nav.assessmentDesc'), group: 'navigation', to: '/assessment' },
      { id: 'nav-counseling', title: t('command.nav.counseling'), desc: t('command.nav.counselingDesc'), group: 'navigation', to: '/counseling' },
      { id: 'nav-capsule', title: t('command.nav.capsule'), desc: t('command.nav.capsuleDesc'), group: 'navigation', to: '/time-capsule' },
    ]
    const items = [...navItems, ...articleItems, ...assessItems]
    // 编号
    items.forEach((it, i) => {
      it.num = String(i + 1).padStart(2, '0')
    })
    return items
  }, [t])

  const idMap = useMemo(() => new Map(allItems.map((it) => [it.id, it])), [allItems])

  const onSelect = (item: PaletteItem) => {
    const target = idMap.get(item.id)
    if (!target) return
    close()
    // Vue 版此处为 emit('navigate', target.to)，见文件头偏差说明
    navigate(target.to)
  }

  const onOpenChange = (v: boolean) => {
    if (!v) close()
  }

  // 全局快捷键：Vue 版 onMounted/onUnmounted → useEffect + cleanup 移除
  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggle()
      } else if (e.key === '/' && !open && !isTyping(e)) {
        e.preventDefault()
        toggle()
      } else if (e.key === 'Escape' && open) {
        close()
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [open, toggle, close])

  return (
    <CommandPalette
      open={open}
      items={allItems}
      groupLabels={groupLabels}
      placeholder={t('command.placeholder')}
      onUpdateOpen={onOpenChange}
      onSelect={onSelect}
    />
  )
}

export default AppCommandPalette
