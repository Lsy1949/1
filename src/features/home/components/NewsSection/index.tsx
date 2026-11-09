/**
 * 【business】NewsSection —— 最新动态区块（编辑式行列表）
 * - 数据由 i18n 消息驱动，图片循环复用
 * - 阅读行为经 onRead 回调上抛页面
 * - scroll-reveal 为页面协议类（HomePageView IntersectionObserver 驱动），保持字面全局类
 */
import { useMemo } from 'react'
import { RightOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import imgNist from '@/assets/images/nist-bg.jpg'
import imgTsinghua from '@/assets/images/tsinghua-bg.jpg'
import PageContainer from '@/components/PageContainer'
import type { NewsItem } from '../types'
import styles from './NewsSection.module.css'

/** i18n 消息展开补充 id/image 后的行条目 */
interface AllNewsItem extends NewsItem {
  id: number
  image: string
}

export interface NewsSectionProps {
  onRead: (id: number) => void
}

export function NewsSection({ onRead }: NewsSectionProps) {
  const { t } = useTranslation()

  // 等价 Vue tm()：returnObjects 整段取新闻数组（i18n 驱动，图片循环复用）
  const allNews = useMemo<AllNewsItem[]>(() => {
    const items = t('home.news.items', { returnObjects: true }) as NewsItem[]
    return items.map((item, i) => ({
      ...item,
      id: i + 1,
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
        <div className={styles.newsRows}>
          {allNews.map((news, index) => (
            <div
              key={news.id}
              className={`${styles.newsRow} scroll-reveal`}
              style={{ transitionDelay: `${index * 80}ms` }}
              onClick={() => onRead(news.id)}
            >
              <div className={styles.newsRowNum}>
                <span className={styles.num}>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className={styles.newsRowBody}>
                <div className={styles.newsRowCat}>{news.category}</div>
                <h3 className={styles.newsRowTitle}>{news.title}</h3>
                <p className={styles.newsRowSummary}>{news.summary}</p>
              </div>
              <div className={styles.newsRowThumb}>
                <img src={news.image} alt={news.title} loading="lazy" />
              </div>
              <div className={styles.newsRowMeta}>
                <span className={styles.newsRowDate}>{news.date}</span>
                <RightOutlined className={styles.newsRowArrow} />
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </section>
  )
}

export default NewsSection
