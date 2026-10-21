/**
 * 【business】BackTop —— 回到顶部 + 快速导航菜单
 * - 自持 scroll 监听控制显隐；锚点滚动为纯 DOM 操作
 * - services/features 为历史遗留锚点（对应区块已不存在，点击无效果），保持原行为
 * - 快速导航为非模态 hover 菜单（docs/design-language.md §4.4）：
 *   鼠标 150ms 展开 / 250ms 收起；键盘 Tab 聚焦、ArrowUp 展开、Esc 关闭并归还焦点；
 *   不做焦点圈闭（非模态），菜单在 DOM 中紧随便触发器，Tab 顺序为「触发器 → 菜单项」。
 *   触屏不提供悬浮菜单（已知限制）：点击仅回顶。
 */
import { useEffect, useRef, useState } from 'react'
import type { FocusEvent as ReactFocusEvent, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import { VerticalAlignTopOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import { scrollBehavior } from '@/utils/motion'
import styles from './BackTop.module.css'

// 节流函数优化性能
const throttle = (fn: (...args: unknown[]) => void, delay: number) => {
  let last = 0
  return (...args: unknown[]) => {
    const now = Date.now()
    if (now - last >= delay) {
      fn(...args)
      last = now
    }
  }
}

const HOVER_OPEN_DELAY = 150
const HOVER_CLOSE_DELAY = 250
const MENU_ID = 'backtop-quick-nav'

// 导航菜单相关
const navSections = [
  { id: 'top', nameKey: 'home.nav.top' },
  { id: 'news', nameKey: 'home.nav.news' },
  { id: 'about', nameKey: 'home.nav.about' },
  { id: 'services', nameKey: 'home.nav.services' },
  { id: 'features', nameKey: 'home.nav.features' },
  { id: 'contact', nameKey: 'home.nav.contact' }
]

export function BackTop() {
  const { t } = useI18n()

  const [open, setOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const openTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)
  const pendingFocusRef = useRef(false)
  // Esc/Enter 关闭后会把焦点归还触发器；抑制这次程序化 focus 触发的自动重开
  const suppressFocusOpenRef = useRef(false)

  const clearTimer = (timer: { current: number | null }) => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  const scrollToSection = (id: string) => {
    const behavior = scrollBehavior()
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior })
    } else {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior })
      }
    }
  }

  /** 关闭菜单；焦点在菜单内时归还给触发器（非模态浮层不会自动做） */
  const closeMenu = () => {
    clearTimer(openTimer)
    clearTimer(closeTimer)
    setOpen(false)
    const active = document.activeElement
    if (menuRef.current && active && menuRef.current.contains(active)) {
      // 归还焦点前先抑制，避免 :focus-visible 路径把菜单再次打开
      suppressFocusOpenRef.current = true
      triggerRef.current?.focus()
    }
  }

  /** 打开菜单；focusFirst 时在提交后把焦点移到第一项 */
  const openMenu = (focusFirst = false) => {
    clearTimer(closeTimer)
    clearTimer(openTimer)
    if (focusFirst) {
      if (open) {
        itemRefs.current[0]?.focus()
        return
      }
      pendingFocusRef.current = true
      setOpen(true)
      return
    }
    if (open) return
    openTimer.current = window.setTimeout(() => {
      openTimer.current = null
      setOpen(true)
    }, HOVER_OPEN_DELAY)
  }

  // 展开后按需聚焦第一项（等 tabIndex 随 open 更新完成）
  useEffect(() => {
    if (!open || !pendingFocusRef.current) return
    pendingFocusRef.current = false
    itemRefs.current[0]?.focus()
  }, [open])

  // 滚动事件处理（节流）
  useEffect(() => {
    const handleScroll = throttle(() => {
      setScrollY(window.scrollY)
    }, 100)
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // 按钮隐藏（回到顶部）时收起菜单并清理定时器
  useEffect(() => {
    if (scrollY > 100) return
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current)
      openTimer.current = null
    }
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setOpen(false)
  }, [scrollY])

  // 卸载清理
  useEffect(() => () => {
    if (openTimer.current !== null) window.clearTimeout(openTimer.current)
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
  }, [])

  const handlePointerEnter = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    clearTimer(closeTimer)
    if (open) return
    if (openTimer.current !== null) return
    openTimer.current = window.setTimeout(() => {
      openTimer.current = null
      setOpen(true)
    }, HOVER_OPEN_DELAY)
  }

  const handlePointerLeave = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    clearTimer(openTimer)
    if (!open) return
    if (closeTimer.current !== null) return
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null
      setOpen(false)
    }, HOVER_CLOSE_DELAY)
  }

  // Tab 聚焦触发器时展开（:focus-visible 过滤触屏点击产生的聚焦）
  const handleTriggerFocus = (e: ReactFocusEvent<HTMLButtonElement>) => {
    // 程序化归还焦点（Esc/Enter 关闭后）不应重新展开
    if (suppressFocusOpenRef.current) {
      suppressFocusOpenRef.current = false
      return
    }
    if (!e.currentTarget.matches(':focus-visible')) return
    clearTimer(closeTimer)
    setOpen(true)
  }

  // 焦点整体离开「触发器 + 菜单」时收起
  const handleBlur = (e: ReactFocusEvent<HTMLDivElement>) => {
    if (containerRef.current?.contains(e.relatedTarget as Node | null)) return
    if (!open) return
    closeMenu()
  }

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      if (!open) return
      e.preventDefault()
      // 焦点在菜单内时 closeMenu 负责归还；否则主动还给触发器
      const active = document.activeElement
      const focusWasInMenu = Boolean(menuRef.current && active && menuRef.current.contains(active))
      closeMenu()
      if (!focusWasInMenu) {
        // Esc 时焦点本就在触发器上：抑制随后 blur/focus 路径的自动重开
        suppressFocusOpenRef.current = true
        triggerRef.current?.focus()
      }
      return
    }

    if (!open) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const items = itemRefs.current.filter((el): el is HTMLButtonElement => Boolean(el))
      if (!items.length) return
      const currentIndex = items.findIndex(el => el === document.activeElement)
      if (currentIndex < 0) return
      e.preventDefault()
      const dir = e.key === 'ArrowDown' ? 1 : -1
      const next = (currentIndex + dir + items.length) % items.length
      items[next]?.focus()
    }
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.backToTopContainer}${scrollY > 100 ? ` ${styles.visible}` : ''}`}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.backToTopBtn} btn-reset`}
        aria-expanded={open}
        aria-controls={MENU_ID}
        // 点击只回顶并收起，不 toggle 菜单
        onClick={() => {
          scrollToSection('top')
          closeMenu()
        }}
        onFocus={handleTriggerFocus}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowUp') return
          e.preventDefault()
          openMenu(true)
        }}
      >
        <span className={styles.btnContent}>
          <VerticalAlignTopOutlined className={styles.mainIcon} />
          <span className={styles.btnText}>TOP</span>
        </span>
        <span className={styles.navHint} aria-hidden="true">
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
        </span>
      </button>

      {/* 非模态菜单：与触发器同处 DOM 流（不 Portal），紧跟其后保证 Tab 顺序 */}
      <div
        ref={menuRef}
        id={MENU_ID}
        role="group"
        aria-label={t('home.nav.quick')}
        aria-hidden={!open}
        className={`${styles.navMenu}${open ? ` ${styles.isOpen}` : ''}`}
      >
        <span className={styles.navMenuTitle} aria-hidden="true">{t('home.nav.quick')}</span>
        <ul className={styles.menuList}>
          {navSections.map((item, i) => (
            <li key={item.id}>
              <button
                ref={el => { itemRefs.current[i] = el }}
                type="button"
                className={`${styles.menuItem} btn-reset`}
                tabIndex={open ? 0 : -1}
                onClick={() => {
                  scrollToSection(item.id)
                  closeMenu()
                }}
              >
                <span>{t(item.nameKey)}</span>
                <span className={styles.itemDot} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default BackTop
