/**
 * 【business】NewsSection —— 最新动态区块（编辑式行列表）
 * - 数据由 i18n 消息驱动，图片循环复用
 * - 阅读行为经 onRead 回调上抛页面
 * - scroll-reveal 为页面协议类（HomePageView IntersectionObserver 驱动），保持字面全局类
 */
import { useMemo } from 'react'
import { RightOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import imgNist from '@/assets/images/nist-bg.jpg'
import imgTsinghua from '@/assets/images/tsinghua-bg.jpg'
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
  const { t } = useI18n()

  // React 版 i18n 未提供 tm()（整段数组取值），等价方式：按索引点路径逐条 t() 探测，
  // t 对缺键回退返回 key 本身（与 vue-i18n 回退行为一致），据此终止循环。
  // 新闻数据（i18n 驱动，图片循环复用）
  const allNews = useMemo<AllNewsItem[]>(() => {
    const items: NewsItem[] = []
    for (let i = 0; ; i++) {
      const prefix = `home.news.items.${i}`
      if (t(`${prefix}.category`) === `${prefix}.category`) break
      items.push({
        category: t(`${prefix}.category`),
        title: t(`${prefix}.title`),
        summary: t(`${prefix}.summary`),
        date: t(`${prefix}.date`)
      })
    }
    return items.map((item, i) => ({
      ...item,
      id: i + 1,
      image: i % 2 === 0 ? imgNist : imgTsinghua
    }))
  }, [t])

  return (
    <section id="news" className={styles.newsSection}>
      <div className={styles.techBgPattern}></div>
      {/* container/relative/z-10 为全局工具类（main.css），保持字面量 */}
      <div className="container relative z-10">
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
      </div>
    </section>
  )
}

export default NewsSection
