/**
 * 【business】Carousel —— 首页全屏轮播（无缝循环 + 拖拽/惯性 + 自动播放）
 * - slides 由页面注入（i18n 驱动，语言切换实时更新）
 * - 文字内容独立层基于 realIndex 渲染，避免无缝跳转时重复触发动画
 * - 跳转行为上抛页面：onSlideAction（主按钮）/ onLearnMore / onScrollDown
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LeftOutlined, RightOutlined, DownOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import type { CarouselSlide } from '../types'
import styles from './Carousel.module.css'

export interface CarouselProps {
  slides: CarouselSlide[]
  onSlideAction: (slide: CarouselSlide) => void
  onLearnMore: () => void
  onScrollDown: () => void
}

export function Carousel({ slides, onSlideAction, onLearnMore, onScrollDown }: CarouselProps) {
  const { t } = useI18n()

  // 轮播图相关状态（渲染依赖用 state，逻辑锁/高频值用 ref）
  const [currentIndex, setCurrentIndex] = useState(1) // 从1开始，因为0是克隆的末尾项
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [disableTransition, setDisableTransition] = useState(false)
  const isAnimatingRef = useRef(false) // 过渡动画进行中锁，防止重复操作导致越界
  const isDraggingRef = useRef(false)
  const dragOffsetRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isPausedRef = useRef(false)

  // 拖拽切换相关状态
  const startXRef = useRef(0)
  const lastXRef = useRef(0)
  const lastTimeRef = useRef(0)
  const velocityRef = useRef(0)
  const rafRef = useRef(0)
  // 无缝跳转双 rAF 句柄（卸载时清理）
  const jumpRafOuterRef = useRef(0)
  const jumpRafInnerRef = useRef(0)

  // 生成展示用的轮播图（首尾各克隆一项）
  const displaySlides = useMemo(() => {
    if (slides.length === 0) return []
    return [
      slides[slides.length - 1],
      ...slides,
      slides[0]
    ]
  }, [slides])

  // 当前真实索引（0-based），用于导航点 active 状态
  const realIndex = useMemo(() => {
    const total = displaySlides.length
    if (total === 0) return 0
    if (currentIndex <= 0) return slides.length - 1
    if (currentIndex >= total - 1) return 0
    return currentIndex - 1
  }, [displaySlides, currentIndex, slides.length])

  // 当前显示的幻灯片数据（基于真实索引，无缝跳转时保持稳定）
  const currentSlide = slides[realIndex] || slides[0]

  // 轮播图控制函数（定时器经 ref 调用最新闭包，避免过期 state）
  const nextSlideRef = useRef<() => void>(() => {})

  const nextSlide = () => {
    if (isAnimatingRef.current || isDraggingRef.current || disableTransition) return
    isAnimatingRef.current = true
    setCurrentIndex(prev => prev + 1)
  }

  const prevSlide = () => {
    if (isAnimatingRef.current || isDraggingRef.current || disableTransition) return
    isAnimatingRef.current = true
    setCurrentIndex(prev => prev - 1)
  }

  const goToSlide = (index: number) => {
    if (isAnimatingRef.current || isDraggingRef.current || disableTransition) return
    // index 为真实索引(0-based)，+1 跳过首部克隆项
    const target = index + 1
    if (target === currentIndex) return
    isAnimatingRef.current = true
    setCurrentIndex(target)
  }

  useEffect(() => {
    nextSlideRef.current = nextSlide
  })

  const startCarousel = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      nextSlideRef.current()
    }, 5000)
  }, [])

  const pauseCarousel = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    isPausedRef.current = true
  }, [])

  const resumeCarousel = useCallback(() => {
    isPausedRef.current = false
    startCarousel()
  }, [startCarousel])

  const getClientX = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    return 'touches' in e ? e.touches[0].clientX : e.clientX
  }

  const handleDragStart = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (disableTransition || isAnimatingRef.current) return
    // 文本选中与拖拽由容器类（carouselContainer）的 user-select:none / -webkit-user-drag:none 控制
    // 不再调用 preventDefault，避免触发 passive listener 警告
    isDraggingRef.current = true
    setIsDragging(true)
    const clientX = getClientX(e)
    startXRef.current = clientX
    lastXRef.current = clientX
    lastTimeRef.current = performance.now()
    velocityRef.current = 0
    pauseCarousel()
  }

  const handleDragMove = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return

    const currentX = getClientX(e)
    const currentTime = performance.now()
    const deltaTime = currentTime - lastTimeRef.current

    if (deltaTime > 0) {
      velocityRef.current = (currentX - lastXRef.current) / deltaTime
    }

    lastXRef.current = currentX
    lastTimeRef.current = currentTime

    // 使用 requestAnimationFrame 优化渲染性能
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      dragOffsetRef.current = currentX - startXRef.current
      setDragOffset(dragOffsetRef.current)
    })
  }

  const handleDragEnd = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const offset = dragOffsetRef.current
    const threshold = 100
    const velocityThreshold = 0.5 // 惯性触发阈值
    let shouldSwitch = false
    let direction = 0 // -1 上一张, 1 下一张

    // 结合位移和速度判断切换
    if (Math.abs(offset) > threshold || Math.abs(velocityRef.current) > velocityThreshold) {
      if (offset > 0 || velocityRef.current > velocityThreshold) {
        direction = -1
        shouldSwitch = true
      } else {
        direction = 1
        shouldSwitch = true
      }
    }

    if (shouldSwitch) {
      // 直接修改 currentIndex，不调用 nextSlide/prevSlide（避免被 isAnimating 锁拦截）
      isAnimatingRef.current = true
      setCurrentIndex(prev => prev + direction)
    } else if (offset !== 0) {
      // 未触发切换但存在位移：清零后会产生回弹过渡，同样加锁
      isAnimatingRef.current = true
    }
    // dragOffset 清零：切换时过渡到新位置，未切换时回弹到原位
    dragOffsetRef.current = 0
    setDragOffset(0)
    velocityRef.current = 0
    resumeCarousel()
  }

  const handleMouseLeave = () => {
    if (isDraggingRef.current) {
      handleDragEnd()
    }
    resumeCarousel()
  }

  // 无缝跳转：到达克隆项边界时，禁用过渡瞬间归位
  const handleTransitionEnd = () => {
    const total = displaySlides.length
    if (currentIndex >= total - 1) {
      // 到达尾部克隆项，跳回首部真实项
      setDisableTransition(true)
      setCurrentIndex(1)
      // 双 rAF 确保浏览器完成重绘后再恢复过渡，避免闪烁
      jumpRafOuterRef.current = requestAnimationFrame(() => {
        jumpRafInnerRef.current = requestAnimationFrame(() => {
          setDisableTransition(false)
          isAnimatingRef.current = false
        })
      })
    } else if (currentIndex <= 0) {
      // 到达首部克隆项，跳回尾部真实项
      setDisableTransition(true)
      setCurrentIndex(total - 2)
      jumpRafOuterRef.current = requestAnimationFrame(() => {
        jumpRafInnerRef.current = requestAnimationFrame(() => {
          setDisableTransition(false)
          isAnimatingRef.current = false
        })
      })
    } else {
      isAnimatingRef.current = false
    }
  }

  // 图片预加载
  const preloadImages = () => {
    slides.forEach(slide => {
      const img = new Image()
      img.src = slide.image
    })
  }

  useEffect(() => {
    preloadImages()
    startCarousel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startCarousel])

  // 卸载清理：定时器 / 拖拽 rAF / 无缝跳转双 rAF
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      cancelAnimationFrame(jumpRafOuterRef.current)
      cancelAnimationFrame(jumpRafInnerRef.current)
    }
  }, [])

  return (
    <section className={styles.carouselSection}>
      <div
        className={styles.carouselContainer}
        onMouseEnter={pauseCarousel}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onTouchCancel={handleDragEnd}
      >
        <div
          className={`${styles.carouselTrack}${isDragging ? ` ${styles.isDragging}` : ''}${disableTransition ? ` ${styles.noTransition}` : ''}`}
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
            transition: (isDragging || disableTransition) ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {displaySlides.map((slide, index) => (
            <div key={index} className={styles.carouselSlide}>
              <div className={styles.slideImage}>
                <img src={slide.image} alt={slide.title} />
                <div className={styles.imageOverlay}></div>
              </div>
            </div>
          ))}
        </div>
        {/* 文字内容独立层：基于 realIndex 渲染（key 重挂载触发淡入动画），避免无缝跳转时重复触发动画 */}
        <div className={styles.slideContentOverlay}>
          <div key={realIndex} className={styles.slideText}>
            <span className={styles.slideTag}>{currentSlide.tag || t('home.carousel.exploreTag')}</span>
            <h2>{currentSlide.title}</h2>
            <p>{currentSlide.description}</p>
            <div className={styles.slideActions}>
              <button className={`${styles.carouselButton} ${styles.primary}`} onClick={() => onSlideAction(currentSlide)}>
                {currentSlide.buttonText}
              </button>
              <button className={`${styles.carouselButton} ${styles.secondary}`} onClick={onLearnMore}>
                {t('home.carousel.learnMore')}
              </button>
            </div>
          </div>
        </div>
        {/* 轮播图导航点 */}
        <div className={styles.carouselIndicators}>
          {slides.map((_slide, index) => (
            <button
              type="button"
              key={index}
              className={`${styles.carouselIndicator}${realIndex === index ? ` ${styles.active}` : ''} btn-reset`}
              aria-label={t('home.carousel.gotoSlide', { index: index + 1 })}
              aria-current={realIndex === index ? 'true' : undefined}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
        {/* 轮播图左右箭头 */}
        <button className={`${styles.carouselBtn} ${styles.prev}`} aria-label="Previous slide" onClick={prevSlide}>
          <LeftOutlined />
        </button>
        <button className={`${styles.carouselBtn} ${styles.next}`} aria-label="Next slide" onClick={nextSlide}>
          <RightOutlined />
        </button>

        {/* 向下滚动指示器 */}
        <button
          type="button"
          className={`${styles.scrollDownIndicator} btn-reset`}
          aria-label={t('home.carousel.scrollDown')}
          onClick={onScrollDown}
        >
          <span className={styles.scrollText}>{t('home.carousel.scrollDown')}</span>
          <DownOutlined className={styles.scrollIcon} />
        </button>
      </div>
    </section>
  )
}

export default Carousel
