/**
 * 首页（页面层）：仅负责数据组装与跨区块跳转/滚动。
 * 区块实现见 features/home/components/*（数据 props 入、行为回调出）。
 *
 * 轮播数据来自统一接口 `GET /api/home/carousel`（DEV 下由 MSW 拦截）：
 * 接口只下发结构 `{ key, image, ctaRoute }`，文案在本页用 useI18n() 按 key 组装，
 * 保证语言切换即时生效、且接口不成为第二份文案来源。
 */
import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { App, Skeleton } from 'antd'
import { useI18n } from '@/i18n'
import { get, type CarouselSlideDTO } from '@/api'
import { Carousel, Marquee, NewsSection, AboutSection, ContactSection, BackTop } from '@/features/home'
// AI 客服悬浮窗（Vue 版 <AiAssistantFab />，全局浮动于首页）
import { AssistantFab } from '@/features/ai'
import type { CarouselSlide } from '@/features/home'
import { scrollBehavior } from '@/utils/motion'
import './HomePageView.css'

// Vue 命名路由 → react-router 路径（home→'/'、articles→'/articles'、assessment→'/assessment'、
// counseling→'/counseling'、time-capsule→'/time-capsule'、square→'/square'）

/* 输入框外观已统一由 src/main.tsx 的全局 Input token 提供，
   首页差异只在 ContactSection.module.css 里覆写 --input-bg 变量 */

export function HomePageView() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { message } = App.useApp()

  // 轮播数据：统一请求封装 get()（自动解包 { code, data, message } 信封）
  // 请求进行中 → Skeleton 占位；失败 → 居中错误提示 + 重试
  const { data: carouselDtos, isError, refetch } = useQuery({
    queryKey: ['home', 'carousel'],
    queryFn: () => get<CarouselSlideDTO[]>('home/carousel')
  })

  // 接口结构（key/image/ctaRoute）+ i18n → 渲染用 CarouselSlide
  // useMemo 依赖 t：语言切换时按同一 key 重新取文案
  const carouselSlides = useMemo<CarouselSlide[]>(
    () =>
      (carouselDtos ?? []).map(slide => ({
        key: slide.key,
        image: slide.image,
        ctaRoute: slide.ctaRoute,
        title: t(`home.carousel.${slide.key}.title`),
        tag: t(`home.carousel.${slide.key}.tag`),
        description: t(`home.carousel.${slide.key}.desc`),
        buttonText: t(`home.carousel.${slide.key}.btn`)
      })),
    [carouselDtos, t]
  )

  // 轮播主按钮：直接消费接口下发的 ctaRoute（为空表示该入口未配置，给出提示）
  const onSlideAction = (slide: CarouselSlide) => {
    if (slide.ctaRoute) {
      navigate(slide.ctaRoute)
    } else {
      message.success(t('home.carousel.preparing', { text: slide.buttonText }))
    }
  }

  // 「了解我们」→ 滚动到关于区块
  const onLearnMore = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: scrollBehavior() })
  }

  // 下滚指示 → 滚动到最新动态
  const onScrollDown = () => {
    document.getElementById('news')?.scrollIntoView({ behavior: scrollBehavior() })
  }

  // 阅读动态 → 文章中心（保持原跳转行为）
  const onReadNews = (_id: number) => {
    navigate('/articles')
  }

  // 监听滚轮事件实现首屏自动滚动
  // 不调用 preventDefault（wheel 在某些浏览器中被视为 passive），
  // 改用锁标志避免重复触发 smooth 滚动
  const wheelLockRef = useRef(false)
  useEffect(() => {
    let lockTimer: ReturnType<typeof setTimeout> | null = null
    const handleWheel = (e: WheelEvent) => {
      if (wheelLockRef.current) return
      // 只有在顶部区域且向下滚动时触发
      if (window.scrollY < 10 && e.deltaY > 0) {
        wheelLockRef.current = true
        document.getElementById('news')?.scrollIntoView({ behavior: scrollBehavior() })
        lockTimer = setTimeout(() => { wheelLockRef.current = false }, 800)
      }
    }
    window.addEventListener('wheel', handleWheel)
    return () => {
      window.removeEventListener('wheel', handleWheel)
      if (lockTimer) clearTimeout(lockTimer)
    }
  }, [])

  // 跨区块「滚动显现」观察器：为所有 .scroll-reveal 元素加 is-visible
  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        }
      })
    }

    const obs = new IntersectionObserver(observerCallback, {
      threshold: 0.1
    })

    document.querySelectorAll('.scroll-reveal').forEach(el => {
      obs.observe(el)
    })

    // 断开 IntersectionObserver，避免内存泄漏
    return () => {
      obs.disconnect()
    }
  }, [])

  return (
    <div className="animated-homepage">
      {/* 轮播图区域：接口数据就绪前用 Skeleton 占位（保持首屏高度，避免内容到位时跳动）；
          请求失败且无数据时展示错误提示与重试 */}
      {carouselSlides.length > 0 ? (
        <Carousel
          slides={carouselSlides}
          onSlideAction={onSlideAction}
          onLearnMore={onLearnMore}
          onScrollDown={onScrollDown}
        />
      ) : (
        <section className="home-carousel-skeleton">
          <div className="home-carousel-skeleton-inner">
            {isError ? (
              <div className="home-carousel-error">
                <p>{t('common.loadFailed')}</p>
                <button type="button" onClick={() => void refetch()}>
                  {t('common.retry')}
                </button>
              </div>
            ) : (
              <Skeleton active title={{ width: '42%' }} paragraph={{ rows: 2 }} />
            )}
          </div>
        </section>
      )}

      {/* 跑马灯 · 滚动信息条 */}
      <Marquee />

      {/* 最新动态 */}
      <NewsSection onRead={onReadNews} />

      {/* 关于我们 */}
      <AboutSection />

      {/* 联系我们 */}
      <ContactSection />

      {/* 回到顶部与快速导航 */}
      <BackTop />

      {/* AI 客服悬浮窗 */}
      <AssistantFab />
    </div>
  )
}

export default HomePageView
