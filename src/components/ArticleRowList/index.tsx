/**
 * 【通用】ArticleRowList —— 编辑式横向行列表
 * 首页「最新动态」与文章列表页共用同一行格式：
 * 编号 | 栏目 + 标题 + 摘要 | 缩略图 | 日期 + 箭头
 * 页面层负责把各自数据源映射为 RowItem；点击行经 onOpen 上抛。
 * reveal=true 时启用 scroll-reveal 逐行显现（首页协议类，行间 80ms 交错延迟）。
 */
import { RightOutlined } from '@ant-design/icons'
import { Empty } from 'antd'
import { useTranslation } from 'react-i18next'
import styles from './ArticleRowList.module.css'

/** 行条目视图模型（页面层把接口 / i18n 数据映射为该结构） */
export interface RowItem {
  id: number
  category: string
  title: string
  summary: string
  date: string
  image?: string
}

interface ArticleRowListProps {
  articles: RowItem[]
  onOpen?: (article: RowItem) => void
  /** 逐行 scroll-reveal（协议类由页面层 IntersectionObserver 驱动） */
  reveal?: boolean
}

export function ArticleRowList({ articles, onOpen, reveal = false }: ArticleRowListProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className={styles.articleRows}>
        {articles.map((article, i) => (
          <article
            key={article.id}
            className={`${styles.articleRow}${reveal ? ' scroll-reveal' : ''}`}
            style={reveal ? { transitionDelay: `${i * 80}ms` } : undefined}
            onClick={() => onOpen?.(article)}
          >
            <div className={styles.rowIndex}>
              <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div className={styles.rowBody}>
              <div className={styles.rowCat}>{article.category}</div>
              <h3 className={styles.rowTitle}>{article.title}</h3>
              <p className={styles.rowSummary}>{article.summary}</p>
            </div>
            <div className={styles.rowThumb}>
              {article.image && <img src={article.image} alt={article.title} loading="lazy" />}
            </div>
            <div className={styles.rowMeta}>
              <span className={styles.rowDate}>{article.date}</span>
              <RightOutlined className={styles.rowArrow} />
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

export default ArticleRowList
