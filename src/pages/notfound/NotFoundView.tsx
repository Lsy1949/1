/**
 * 404 页面（4 屏整页翻页 + 4 个小游戏 + 自定义光标）
 * - 翻页：currentSlide state + isAnimating ref 锁 800ms；滚轮/触摸/键盘监听
 *   随 [currentSlide, activeGame] 重注册保持闭包新鲜，卸载完整清理
 * - 游戏模式：键盘交给 GameStage（方向键移动 / 空格同步 / Esc 退出）
 * - reveal-anim 重放：等价 watch(currentSlide) → nextTick 后重触发 in-view
 * - 命名路由 → 路径：home '/'、career /assessment、treehole /square
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'
import {
  NotFoundDots,
  NotFoundGameStage,
  NotFoundHero,
  NotFoundNav,
  NotFoundSlideCommunity,
  NotFoundSlideQuote,
  NotFoundSlideTopics,
} from '@/features/notfound'
import type { NotFoundGameStageHandle } from '@/features/notfound'
import './NotFoundView.css'

const darkSlides = [0, 2]

export function NotFoundView() {
  const navigate = useNavigate()
  const { t } = useI18n()

  /* ---------- 翻页控制 ---------- */
  const slideCount = 4
  const [currentSlide, setCurrentSlide] = useState(0)
  // isAnimating 仅用于逻辑判断（不渲染）→ ref
  const isAnimatingRef = useRef(false)
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function lockAnim() {
    isAnimatingRef.current = true
    if (animTimerRef.current) clearTimeout(animTimerRef.current)
    animTimerRef.current = setTimeout(() => {
      isAnimatingRef.current = false
    }, 800)
  }

  function nextSlide() {
    if (isAnimatingRef.current || currentSlide >= slideCount - 1) return
    lockAnim()
    setCurrentSlide(currentSlide + 1)
  }

  function prevSlide() {
    if (isAnimatingRef.current || currentSlide <= 0) return
    lockAnim()
    setCurrentSlide(currentSlide - 1)
  }

  function goToSlide(index: number) {
    if (isAnimatingRef.current || index === currentSlide) return
    lockAnim()
    setCurrentSlide(index)
  }

  /* ---------- 滚轮 / 触摸 / 键盘 ---------- */
  function handleWheel(e: WheelEvent) {
    if (activeGame) {
      // 游戏模式下不翻页
      return
    }
    if (isAnimatingRef.current) {
      e.preventDefault()
      return
    }
    if (e.deltaY > 30) {
      e.preventDefault()
      nextSlide()
    } else if (e.deltaY < -30) {
      e.preventDefault()
      prevSlide()
    }
  }

  const touchStartYRef = useRef(0)
  function handleTouchStart(e: TouchEvent) {
    touchStartYRef.current = e.touches[0].clientY
  }
  function handleTouchEnd(e: TouchEvent) {
    if (activeGame) return
    const dy = touchStartYRef.current - e.changedTouches[0].clientY
    if (Math.abs(dy) > 50) {
      if (dy > 0) nextSlide()
      else prevSlide()
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    // 游戏模式下：键盘交给游戏舞台（方向键移动 / 空格同步 / Esc 退出）
    if (activeGame) {
      gameStageRef.current?.handleKey(e)
      return
    }

    // 非游戏模式：方向键 / 空格翻页
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault()
      nextSlide()
    } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault()
      prevSlide()
    } else if (e.key === 'Home') {
      e.preventDefault()
      goToSlide(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      goToSlide(slideCount - 1)
    }
  }

  /* ---------- 深色 slide 判定 ---------- */
  const isDarkSlide = darkSlides.includes(currentSlide)

  /* ---------- 路由跳转 ---------- */
  function goTo(route: string) {
    navigate(route)
  }

  /* ---------- 翻页后重放 reveal-anim（等价 watch + nextTick） ---------- */
  useEffect(() => {
    const slideEl = document.querySelectorAll('.nf-slide')[currentSlide]
    if (!slideEl) return
    slideEl.querySelectorAll('.reveal-anim').forEach((el) => {
      const node = el as HTMLElement
      node.classList.remove('in-view')
      void node.offsetWidth
      node.classList.add('in-view')
    })
  }, [currentSlide])

  /* ---------- 小游戏系统 ---------- */
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const gameStageRef = useRef<NotFoundGameStageHandle | null>(null)

  function enterGame(id: string) {
    setActiveGame(id)
  }

  function exitGame() {
    setActiveGame(null)
  }

  /* ---------- 自定义光标 cursor-dot ---------- */
  const cursorDotRef = useRef<HTMLDivElement | null>(null)
  const [cursorHover, setCursorHover] = useState(false)
  const cursorRafRef = useRef<number | null>(null)
  const cursorXRef = useRef(0)
  const cursorYRef = useRef(0)
  const dotXRef = useRef(0)
  const dotYRef = useRef(0)
  const cursorVisibleRef = useRef(false)

  function handleMouseMove(e: MouseEvent) {
    cursorXRef.current = e.clientX
    cursorYRef.current = e.clientY
    if (!cursorVisibleRef.current) {
      cursorVisibleRef.current = true
      dotXRef.current = cursorXRef.current
      dotYRef.current = cursorYRef.current
      if (cursorDotRef.current) cursorDotRef.current.style.opacity = '1'
    }
    if (cursorRafRef.current === null) {
      cursorRafRef.current = requestAnimationFrame(updateCursorDot)
    }
    // 检测是否悬停在可交互元素上 → 光标点放大为圆环（替代系统手指样式）
    const target = e.target as HTMLElement
    const interactive = target.closest && target.closest(
      'a, button, .nf-topic, .nf-nav-link, .nf-nav-logo, .nf-dot, .nf-flip-hint, .nf-game-entry, .nf-game-back, .nf-memory-card, .nf-breath-wrap, .nf-note-action, .nf-write-submit, .nf-footer-link'
    )
    setCursorHover(!!interactive)
  }

  function updateCursorDot() {
    cursorRafRef.current = null
    dotXRef.current += (cursorXRef.current - dotXRef.current) * 0.32
    dotYRef.current += (cursorYRef.current - dotYRef.current) * 0.32
    if (cursorDotRef.current) {
      cursorDotRef.current.style.transform = `translate(${dotXRef.current}px, ${dotYRef.current}px) translate(-50%, -50%)`
    }
    if (
      Math.abs(cursorXRef.current - dotXRef.current) > 0.3 ||
      Math.abs(cursorYRef.current - dotYRef.current) > 0.3
    ) {
      cursorRafRef.current = requestAnimationFrame(updateCursorDot)
    }
  }

  function handleMouseLeave() {
    cursorVisibleRef.current = false
    if (cursorDotRef.current) cursorDotRef.current.style.opacity = '0'
  }

  /* ---------- 生命周期（光标 + 定时器：仅挂载/卸载各一次） ---------- */
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      if (animTimerRef.current) clearTimeout(animTimerRef.current)
      if (cursorRafRef.current !== null) cancelAnimationFrame(cursorRafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------- 翻页 / 游戏监听：依赖变化重注册保持闭包新鲜 ---------- */
  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('keydown', handleKeydown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide, activeGame])

  const trackStyle = useMemo(
    () => ({ transform: `translateY(-${currentSlide * 100}vh)` }),
    [currentSlide]
  )

  return (
    <div className={`nf-page${isDarkSlide ? ' is-dark-slide' : ''}`}>
      {/* 自定义光标 */}
      <div
        ref={cursorDotRef}
        className={`cursor-dot${cursorHover ? ' is-hover' : ''}`}
        aria-hidden="true"
      />

      {/* 固定导航栏 */}
      <NotFoundNav scrolled={currentSlide > 0} dark={isDarkSlide} onNavigate={goTo} />

      {/* 翻页指示器 */}
      <NotFoundDots count={slideCount} current={currentSlide} dark={isDarkSlide} onNavigate={goToSlide} />

      {/* 翻页提示（仅首页 · 非游戏模式） */}
      {currentSlide === 0 && !activeGame && (
        <div className="nf-flip-hint nf-fade-enter" onClick={nextSlide}>
          <span className="nf-flip-text">{t('notFound.hero.scroll')}</span>
          <span className="nf-flip-mouse">
            <span className="nf-flip-wheel" />
          </span>
        </div>
      )}

      {/* 翻页容器 */}
      <div className="nf-slides">
        <div className="nf-slides-track" style={trackStyle}>
          {/* Slide 0：Hero 杂志封面（深蓝渐变） */}
          <section className="nf-slide nf-slide-hero">
            <div className="nf-hero-grid-bg" aria-hidden="true" />

            <div className="nf-hero-stage">
              <NotFoundHero activeGame={activeGame} onEnter={enterGame} />

              {/* 游戏舞台（key 切换游戏时重挂载，等价 :key="activeGame"） */}
              {activeGame && (
                <NotFoundGameStage
                  key={activeGame}
                  ref={gameStageRef}
                  game={activeGame}
                  onExit={exitGame}
                />
              )}
            </div>

            <div className="nf-hero-foot">
              <div className="nf-hero-meta-left">
                <span>{t('notFound.hero.issue')}</span>
                <span>{t('notFound.hero.volume')}</span>
              </div>
              <span className="nf-hero-page">{t('notFound.hero.page')}</span>
            </div>
          </section>

          {/* Slide 1：专题选择区（浅蓝 · 杂志网格） */}
          <NotFoundSlideTopics onNavigate={goTo} />

          {/* Slide 2：Pull Quote 引语区（深蓝渐变） */}
          <NotFoundSlideQuote />

          {/* Slide 3：社区笔记区（浅蓝 · 杂志专栏） */}
          <NotFoundSlideCommunity />
        </div>
      </div>
    </div>
  )
}

export default NotFoundView
