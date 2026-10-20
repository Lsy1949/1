// 文章列表 · 横向编辑式行（ArticleListView 内容区），点击行上抛 onOpen
import { ArrowRightOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { Empty } from 'antd'
import { useI18n } from '@/i18n'
import type { ArticleItem } from '../types'
import styles from './RowList.module.css'

interface RowListProps {
  articles: ArticleItem[]
  onOpen?: (article: ArticleItem) => void
}

export function RowList({ articles, onOpen }: RowListProps) {
  const { t } = useI18n()

  return (
    <>
      <div className={styles.articleRows}>
        {articles.map((article, i) => (
          <article
            key={article.id}
            className={styles.articleRow}
            onClick={() => onOpen?.(article)}
          >
            <div className={styles.rowIndex}>{i < 99 ? String(i + 1).padStart(2, '0') : String(i + 1)}</div>
            <div className={styles.rowBody}>
              <div className={styles.rowTags}>
                <span className={styles.rowCat}>{article.categoryLabel}</span>
                <span className={styles.rowDate}>{article.date}</span>
              </div>
              <h3 className={styles.rowTitle}>{article.title}</h3>
              <p className={styles.rowSummary}>{article.summary}</p>
              <div className={styles.rowMeta}>
                <span>{article.author}</span>
                <span className={styles.dot}></span>
                <span className={styles.rowRead}><ClockCircleOutlined />{article.readTime}</span>
                <span className={styles.dot}></span>
                <span className={styles.rowViews}><EyeOutlined />{article.views}</span>
              </div>
            </div>
            <div className={styles.rowImage}>
              <img src={article.image} alt={article.title} loading="lazy" />
              <span className={styles.rowArrow}><ArrowRightOutlined /></span>
            </div>
          </article>
        ))}
      </div>

      {articles.length === 0 && (
        <div className={styles.noResults}>
          <Empty description={t('article.empty')} />
        </div>
      )}
    </>
  )
}

export default RowList
