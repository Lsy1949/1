/**
 * 【base】CommandPalette —— 命令面板纯 UI 组件
 * - 受控组件：显隐经 open/onUpdateOpen 控制，条目由 items 传入
 * - 选中行为通过 onSelect 回调上抛，跳转由业务层/页面处理
 * - 分组按 items 首现顺序展示，显示名经 groupLabels 映射
 * - 分层约束：禁止依赖 @/api、@/stores、@/realtime、@/events、路由库
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CommandPaletteProps, PaletteItem } from './types'
import styles from './CommandPalette.module.css'

/** 模糊匹配（子序列匹配，保持原有行为） */
function fuzzyMatch(text: string, q: string): boolean {
  if (!q) return true
  const lower = text.toLowerCase()
  const ql = q.toLowerCase()
  let qi = 0
  for (let i = 0; i < lower.length && qi < ql.length; i++) {
    if (lower[i] === ql[qi]) qi++
  }
  return qi === ql.length
}

export function CommandPalette({
  open = false,
  items = [],
  placeholder = '搜索…',
  groupLabels = {},
  onUpdateOpen,
  onSelect,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selIndex, setSelIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const resultsRef = useRef<HTMLDivElement | null>(null)

  // 开关动画托管：open=false 时延迟卸载以播放离场动画；session 递增保证每次打开重放进场动画
  const [mounted, setMounted] = useState(open)
  const [session, setSession] = useState(0)
  const closing = mounted && !open

  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    const timer = window.setTimeout(() => setMounted(false), 200)
    return () => window.clearTimeout(timer)
  }, [open])

  const close = () => onUpdateOpen?.(false)

  const filtered = useMemo(() => {
    const q = query.trim()
    if (!q) return items
    return items.filter(
      (it) => fuzzyMatch(it.title, q) || (it.desc && fuzzyMatch(it.desc, q))
    )
  }, [items, query])

  // 分组：按 items 首现顺序，避免 base 内置业务分组知识
  const groupedResults = useMemo(() => {
    const order: string[] = []
    const buckets = new Map<string, PaletteItem[]>()
    filtered.forEach((it) => {
      let list = buckets.get(it.group)
      if (!list) {
        list = []
        buckets.set(it.group, list)
        order.push(it.group)
      }
      list.push(it)
    })
    return order.map((g) => ({
      label: groupLabels[g] ?? g,
      items: buckets.get(g)!,
    }))
  }, [filtered, groupLabels])

  const flatResults = useMemo(
    () => groupedResults.flatMap((g) => g.items),
    [groupedResults]
  )

  const highlight = (text: string): string => {
    const q = query.trim()
    if (!q) return text
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(re, '<mark>$1</mark>')
  }

  const scrollIntoView = () => {
    // 协议类改经 styles 映射后，querySelector 用同一映射拼出真实类名（与 DOM 严格一致）
    resultsRef.current?.querySelector(`.${styles.cmdItem}.${styles.active}`)?.scrollIntoView({ block: 'nearest' })
  }

  const moveSel = (dir: number) => {
    const len = flatResults.length
    if (!len) return
    setSelIndex((i) => (i + dir + len) % len)
    requestAnimationFrame(scrollIntoView)
  }

  const execSel = () => {
    const item = flatResults[selIndex]
    if (item) onSelect?.(item)
  }

  const handleSelect = (item: PaletteItem) => onSelect?.(item)

  const handleQueryChange = (v: string) => {
    setQuery(v)
    setSelIndex(0)
  }

  // 打开时重置输入、聚焦输入框并重放进场动画（等价 watch open + Transition）
  useEffect(() => {
    if (open) setSession((s) => s + 1)
  }, [open])

  useEffect(() => {
    if (open && session > 0) {
      setQuery('')
      setSelIndex(0)
      inputRef.current?.focus()
    }
  }, [open, session])

  if (!mounted) return null

  return (
    <div
      key={session}
      className={`${styles.cmdBackdrop}${closing ? ` ${styles.closing}` : ''}`}
      onClick={close}
    >
      <div className={styles.cmdPanel} onClick={(e) => e.stopPropagation()}>
        {/* 搜索输入 */}
        <div className={styles.cmdInputRow}>
          <span className={styles.cmdPrompt}>›</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className={styles.cmdInput}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                moveSel(1)
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                moveSel(-1)
              } else if (e.key === 'Enter') {
                e.preventDefault()
                execSel()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                close()
              }
            }}
          />
          <kbd className={styles.cmdEsc}>ESC</kbd>
        </div>

        {/* 结果分组 */}
        {flatResults.length ? (
          <div ref={resultsRef} className={styles.cmdResults}>
            {groupedResults.map((group) => (
              <div key={group.label} className={styles.cmdGroup}>
                <div className={styles.cmdGroupLabel}>{group.label}</div>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.cmdItem}${flatResults[selIndex]?.id === item.id ? ` ${styles.active}` : ''}`}
                    onMouseEnter={() =>
                      setSelIndex(flatResults.findIndex((f) => f.id === item.id))
                    }
                    onClick={() => handleSelect(item)}
                  >
                    <span className={styles.cmdItemNum}>{item.num}</span>
                    <span className={styles.cmdItemBody}>
                      <span
                        className={styles.cmdItemTitle}
                        dangerouslySetInnerHTML={{ __html: highlight(item.title) }}
                      />
                      {item.desc ? <span className={styles.cmdItemDesc}>{item.desc}</span> : null}
                    </span>
                    {item.tag ? <span className={styles.cmdItemTag}>{item.tag}</span> : null}
                    <span className={styles.cmdItemArrow}>→</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : (
          /* 空状态 */
          <div className={styles.cmdEmpty}>
            <span className={styles.cmdEmptyEyebrow}>— No Match</span>
            <p className={styles.cmdEmptyText}>没有找到「{query}」相关内容</p>
          </div>
        )}

        {/* 底部提示 */}
        <div className={styles.cmdFooter}>
          <span className={styles.cmdFooterHint}><kbd>↑</kbd><kbd>↓</kbd> 导航</span>
          <span className={styles.cmdFooterHint}><kbd>↵</kbd> 选择</span>
          <span className={styles.cmdFooterHint}><kbd>ESC</kbd> 关闭</span>
        </div>
      </div>
    </div>
  )
}

export type { PaletteItem, CommandPaletteProps } from './types'

export default CommandPalette
