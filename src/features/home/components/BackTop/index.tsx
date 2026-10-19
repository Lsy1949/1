/**
 * 【business】BackTop —— 回到顶部 + 快速导航菜单
 * - 自持 scroll 监听控制显隐；锚点滚动为纯 DOM 操作
 * - services/features 为历史遗留锚点（对应区块已不存在，点击无效果），保持原行为
 */
import { useEffect, useState } from 'react'
import { VerticalAlignTopOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
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

  const [showNavMenu, setShowNavMenu] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  const scrollToSection = (id: string) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

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

  return (
    <div
      className={`${styles.backToTopContainer}${scrollY > 100 ? ` ${styles.visible}` : ''}`}
      onMouseEnter={() => setShowNavMenu(true)}
      onMouseLeave={() => setShowNavMenu(false)}
    >
      {/* <transition name="fade-slide"> → is-open 类切换过渡（视觉等价） */}
      <div className={`${styles.navMenu}${showNavMenu ? ` ${styles.isOpen}` : ''}`}>
        <div className={styles.navMenuTitle}>{t('home.nav.quick')}</div>
        {navSections.map(item => (
          <div key={item.id} className={styles.menuItem} onClick={() => scrollToSection(item.id)}>
            <span>{t(item.nameKey)}</span>
            <div className={styles.itemDot}></div>
          </div>
        ))}
      </div>

      <div className={styles.backToTopBtn} onClick={() => scrollToSection('top')}>
        <div className={styles.btnContent}>
          <VerticalAlignTopOutlined className={styles.mainIcon} />
          <span className={styles.btnText}>TOP</span>
        </div>
        <div className={styles.navHint}>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
        </div>
      </div>
    </div>
  )
}

export default BackTop
