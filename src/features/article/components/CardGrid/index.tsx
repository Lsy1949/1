// 文章网格（ArticleCenterView），卡片点击上抛 onOpen；count 单独传入（原页面显示过滤后总数而非展示数）
import { ArrowRightOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { Empty } from 'antd'
import { useI18n } from '@/i18n'
import type { ArticleItem } from '../types'
import styles from './CardGrid.module.css'

interface CardGridProps {
  articles: ArticleItem[]
  title: string
  count: number
  showViewAll: boolean
  onOpen?: (article: ArticleItem) => void
  onViewAll?: () => void
}

export function CardGrid({ articles, title, count, showViewAll, onOpen, onViewAll }: CardGridProps) {
  const { t } = useI18n()

  return (
    <div className="module-grid">
      <div className={styles.moduleHeader}>
        <div className={styles.headerLeft}>
          <h3 className={styles.moduleTitle}>{title}</h3>
          <span className={styles.articleCount}>{count} {t('article.stats.count')}</span>
        </div>
        {showViewAll && (
          <button className={styles.viewAllLink} onClick={() => onViewAll?.()}>
            {t('article.grid.viewAll')} <ArrowRightOutlined />
          </button>
        )}
      </div>

      <div className={styles.articleGrid}>
        {articles.map(article => (
          <div
            key={article.id}
            className={`${styles.articleCard}${article.image ? '' : ` ${styles.noCover}`}`}
            onClick={() => onOpen?.(article)}
          >
            {article.image ? (
              <div className={styles.cardImage}>
                <img src={article.image} alt={article.title} loading="lazy" />
                <span className={styles.cardTag}>{article.categoryLabel}</span>
              </div>
            ) : (
              <div className={styles.cardNoCoverTop}>
                <span className={styles.noCoverEyebrow}>{article.categoryLabel}</span>
              </div>
            )}
            <div className={styles.cardInfo}>
              <div className={styles.cardMetaTop}>
                <span className={styles.authorName}>{article.author}</span>
                <span className={styles.dot}></span>
                <span className={styles.publishDate}>{article.date}</span>
              </div>
              <h4 className={styles.cardTitle}>{article.title}</h4>
              <p className={styles.cardSummary}>{article.summary}</p>
              <div className={styles.cardMeta}>
                <span className={styles.metaItem}><ClockCircleOutlined /> {article.readTime}</span>
                <span className={styles.metaItem}><EyeOutlined /> {article.views}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {articles.length === 0 && (
        <div className={styles.noResults}>
          <Empty description={t('article.empty')} />
        </div>
      )}
    </div>
  )
}

export default CardGrid
