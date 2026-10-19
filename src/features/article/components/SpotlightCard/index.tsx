// 今日焦点卡（ArticleCenterView），点击上抛 onOpen
import { ArrowRightOutlined } from '@ant-design/icons'
import InitialAvatar from '@/components/InitialAvatar'
import { useI18n } from '@/i18n'
import type { ArticleItem } from '../types'
import styles from './SpotlightCard.module.css'

interface SpotlightCardProps {
  article: ArticleItem
  onOpen?: (article: ArticleItem) => void
}

export function SpotlightCard({ article, onOpen }: SpotlightCardProps) {
  const { t } = useI18n()

  return (
    <div className={styles.moduleSpotlight}>
      <div className={styles.moduleHeader}>
        <h3 className={styles.moduleTitle}>{t('article.spotlight.title')}</h3>
        <span className={styles.articleCount}>{t('article.spotlight.sub')}</span>
      </div>
      <div
        className={`${styles.spotlightCard}${article.image ? '' : ` ${styles.noCover}`}`}
        onClick={() => onOpen?.(article)}
      >
        {article.image ? (
          <div className={styles.spotlightImage}>
            <img src={article.image} alt={article.title} loading="lazy" />
            <span className={styles.spotlightStamp}>FEATURED · 01</span>
          </div>
        ) : (
          <span className={styles.spotlightQuoteDeco} aria-hidden="true">"</span>
        )}
        <div className={styles.spotlightContent}>
          <div className={styles.spotlightMeta}>
            <span className={styles.categoryTag}>{article.categoryLabel}</span>
            <span className={styles.dot}></span>
            <span className={styles.readBadge}>{article.readTime} read</span>
          </div>
          <h2 className={styles.spotlightTitle}>{article.title}</h2>
          <p className={styles.spotlightDesc}>{article.summary}</p>
          <div className={styles.spotlightFooter}>
            <div className={styles.spotlightAuthor}>
              {/* InitialAvatar 无 className 透传，包一层保持头像样式钩子 */}
              <div className={styles.authorAvatar}>
                <InitialAvatar name={article.author} size={48} />
              </div>
              <div className={styles.authorInfo}>
                <span className={styles.authorName}>{article.author}</span>
                <span className={styles.authorTitle}>{article.authorTitle}</span>
              </div>
            </div>
            <button className={styles.readMore}>
              <span>{t('article.spotlight.read')}</span>
              <ArrowRightOutlined />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpotlightCard
