/**
 * 【business】NewsSection —— 最新动态区块（编辑式行列表）
 * - 数据由 i18n 消息驱动，图片循环复用；行渲染复用通用组件 ArticleRowList
 * - 阅读行为经 onRead 回调上抛页面
 * - scroll-reveal 为页面协议类（HomePageView IntersectionObserver 驱动），经 reveal 透传
 */
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import imgNist from '@/assets/images/nist-bg.jpg'
import imgTsinghua from '@/assets/images/tsinghua-bg.jpg'
import PageContainer from '@/components/PageContainer'
import { ArticleRowList, type RowItem } from '@/components/ArticleRowList'
import type { NewsItem } from '../types'
import styles from './NewsSection.module.css'

export interface NewsSectionProps {
  onRead: (id: number) => void
}

export function NewsSection({ onRead }: NewsSectionProps) {
  const { t } = useTranslation()

  // 等价 Vue tm()：returnObjects 整段取新闻数组（i18n 驱动，图片循环复用）
  const allNews = useMemo<RowItem[]>(() => {
    const items = t('home.news.items', { returnObjects: true }) as NewsItem[]
    return items.map((item, i) => ({
      id: i + 1,
      category: item.category,
      title: item.title,
      summary: item.summary,
      date: item.date,
      image: i % 2 === 0 ? imgNist : imgTsinghua
    }))
  }, [t])

  return (
    <section id="news" className={styles.newsSection}>
      <div className={styles.techBgPattern}></div>
      {/* PageContainer 透传 relative z-10（全局工具类）：压住 .techBgPattern 背景装饰 */}
      <PageContainer className="relative z-10">
        <div className={`${styles.sectionHeader} scroll-reveal`}>
          <span className={styles.sectionBadge}>{t('home.news.badge')}</span>
          <h2>{t('home.news.title')}</h2>
          <p className={styles.sectionSubtitle}>{t('home.news.subtitle')}</p>
        </div>
        <ArticleRowList articles={allNews} onOpen={(news) => onRead(news.id)} reveal />
      </PageContainer>
    </section>
  )
}

export default NewsSection
