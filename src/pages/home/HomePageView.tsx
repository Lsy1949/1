/**
 * 首页（页面层）：仅负责数据组装与跨区块跳转/滚动。
 * 区块实现见 features/home/components/*（数据 props 入、行为回调出）。
 */
import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { App } from 'antd'
import { useI18n } from '@/i18n'
import { Carousel, Marquee, NewsSection, AboutSection, ContactSection, BackTop } from '@/features/home'
// AI 客服悬浮窗（Vue 版 <AiAssistantFab />，全局浮动于首页）
import { AssistantFab } from '@/features/ai'
import type { CarouselSlide } from '@/features/home'
import imgNist from '@/assets/images/nist-bg.jpg'
import imgTsinghua from '@/assets/images/tsinghua-bg.jpg'
import './HomePageView.css'

// Vue 命名路由 → react-router 路径（home→'/'、articles→'/articles'、assessment→'/assessment'、
// counseling→'/counseling'、time-capsule→'/time-capsule'、square→'/square'）

/* 输入框外观已统一由 src/main.tsx 的全局 Input token 提供，
   首页差异只在 ContactSection.module.css 里覆写 --input-bg 变量 */

export function HomePageView() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { message } = App.useApp()

  // 轮播图数据（useMemo 以支持语言切换时实时更新文案）
  const carouselSlides = useMemo<CarouselSlide[]>(() => [
    {
      title: t('home.carousel.slide1.title'),
      tag: t('home.carousel.slide1.tag'),
      description: t('home.carousel.slide1.desc'),
      buttonText: t('home.carousel.slide1.btn'),
      image: imgNist
    },
    {
      title: t('home.carousel.slide2.title'),
      tag: t('home.carousel.slide2.tag'),
      description: t('home.carousel.slide2.desc'),
      buttonText: t('home.carousel.slide2.btn'),
      image: imgTsinghua
    },
    {
      title: t('home.carousel.slide3.title'),
      tag: t('home.carousel.slide3.tag'),
      description: t('home.carousel.slide3.desc'),
      buttonText: t('home.carousel.slide3.btn'),
      image: imgNist
    }
  ], [t])

  // 轮播主按钮：按文案映射路由（slide1 → 测评中心, slide2 → 时光胶囊, slide3 → 心理咨询）
  const onSlideAction = (slide: CarouselSlide) => {
    const routeMap: Record<string, string> = {
      [t('home.carousel.slide1.btn')]: '/assessment',
      [t('home.carousel.slide2.btn')]: '/time-capsule',
      [t('home.carousel.slide3.btn')]: '/counseling'
    }
    const path = routeMap[slide.buttonText]
    if (path) {
      navigate(path)
    } else {
      message.success(t('home.carousel.preparing', { text: slide.buttonText }))
    }
  }

  // 「了解我们」→ 滚动到关于区块
  const onLearnMore = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
  }

  // 下滚指示 → 滚动到最新动态
  const onScrollDown = () => {
    document.getElementById('news')?.scrollIntoView({ behavior: 'smooth' })
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
        document.getElementById('news')?.scrollIntoView({ behavior: 'smooth' })
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
      {/* 轮播图区域 */}
      <Carousel
        slides={carouselSlides}
        onSlideAction={onSlideAction}
        onLearnMore={onLearnMore}
        onScrollDown={onScrollDown}
      />

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
