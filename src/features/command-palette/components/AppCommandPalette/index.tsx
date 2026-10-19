/**
 * 【command-palette】AppCommandPalette —— 全局命令面板业务装配层
 * - 组装导航 / 文章 / 测评条目与分组文案（业务数据不进 base 层）
 * - 全局快捷键（Ctrl/⌘+K、/、ESC）在此注册
 * - 偏差说明：Vue 版选中后 emit('navigate', to) 由父层执行跳转；React 版
 *   遵循 React Router 最佳实践，改为组件内部 useNavigate() 直接
 *   navigate(target.to)，无需父层中转（非机械直译）。
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCommandPalette } from '../../hooks/useCommandPalette'
import CommandPalette from '../CommandPalette'
import type { PaletteItem } from '../CommandPalette'

/** 业务条目：在纯 UI 条目上补充跳转目标 */
interface AppCmdItem extends PaletteItem {
  to: string
}

// 导航条目
const navItems: AppCmdItem[] = [
  { id: 'nav-home', title: '首页', desc: '生涯心旅主页', group: 'navigation', to: '/' },
  { id: 'nav-articles', title: '文章中心', desc: '阅读 · 看见更广阔的自己', group: 'navigation', to: '/articles' },
  { id: 'nav-article-list', title: '文章列表', desc: '全部文章', group: 'navigation', to: '/articles/list' },
  { id: 'nav-assessment', title: '测评中心', desc: '专业心理量表', group: 'navigation', to: '/assessment' },
  { id: 'nav-counseling', title: '心理咨询', desc: '专业咨询师预约', group: 'navigation', to: '/counseling' },
  { id: 'nav-capsule', title: '时光胶囊', desc: '写给未来的自己', group: 'navigation', to: '/time-capsule' },
]

// 文章条目（模拟）
const articleItems: AppCmdItem[] = [
  { id: 'art-1', title: '如何在焦虑中找到内心的锚点', desc: '精选推荐', group: 'articles', to: '/articles' },
  { id: 'art-2', title: '大学生职业规划的五步法', desc: '职业发展', group: 'articles', to: '/articles' },
  { id: 'art-3', title: '正念冥想：从呼吸开始', desc: '心理健康', group: 'articles', to: '/articles' },
  { id: 'art-4', title: '拖延症背后的心理机制', desc: '心理健康', group: 'articles', to: '/articles' },
]

// 测评条目（模拟）
const assessItems: AppCmdItem[] = [
  { id: 'asm-1', title: 'SDS 抑郁自评量表', desc: '20题 · 约10分钟', group: 'assessment', to: '/assessment' },
  { id: 'asm-2', title: 'SAS 焦虑自评量表', desc: '20题 · 约10分钟', group: 'assessment', to: '/assessment' },
  { id: 'asm-3', title: 'MBTI 人格类型测试', desc: '93题 · 约15分钟', group: 'assessment', to: '/assessment' },
]

const allItems: AppCmdItem[] = [...navItems, ...articleItems, ...assessItems]

// 编号
allItems.forEach((it, i) => {
  it.num = String(i + 1).padStart(2, '0')
})

const idMap = new Map(allItems.map((it) => [it.id, it]))

const groupLabels: Record<string, string> = {
  navigation: '— Navigate',
  articles: '— Articles',
  assessment: '— Assessment',
}

// 全局快捷键（自 base 组件上移至业务装配层）
const isTyping = (e: KeyboardEvent): boolean => {
  const target = e.target as HTMLElement | null
  const tag = target?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable === true
}

export function AppCommandPalette() {
  const { open, toggle, close } = useCommandPalette()
  const navigate = useNavigate()

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
      placeholder="搜索页面、文章、测评…"
      onUpdateOpen={onOpenChange}
      onSelect={onSelect}
    />
  )
}

export default AppCommandPalette
