// 文章正文（v-html + 首图注入）与底部操作栏（ArticleDetailView 主栏），点赞/收藏状态由页面持有
import { useMemo } from 'react'
import { ShareAltOutlined, StarFilled } from '@ant-design/icons'
import { useReveal } from '@/hooks/useReveal'
import { useI18n } from '@/i18n'
import type { ArticleItem } from '../types'
import styles from './RichBody.module.css'

interface RichBodyProps {
  article: ArticleItem
  liked: boolean
  bookmarked: boolean
  onToggleLike?: () => void
  onToggleBookmark?: () => void
}

export function RichBody({ article, liked, onToggleLike, onToggleBookmark }: RichBodyProps) {
  const { t } = useI18n()
  const contentRef = useReveal<HTMLElement>({ delay: 80 })

  // 正文 = 首图（有封面时注入）+ 内容；mock 静态可信数据
  const articleBody = useMemo(() => {
    const hero = article.image
      ? `<figure class="article-hero-img"><img src="${article.image}" alt="${article.title}"/><figcaption>— ${article.title}</figcaption></figure>`
      : ''
    return hero + (article.content || '')
  }, [article.image, article.title, article.content])

  return (
    <div className={styles.articleMain}>
      {/* 静态可信内容（v-html → dangerouslySetInnerHTML）；drop-cap 为全局工具类（main.css 首字下沉） */}
      <article
        ref={contentRef}
        className={`${styles.richContent} drop-cap`}
        dangerouslySetInnerHTML={{ __html: articleBody }}
      />

      {/* 底部操作栏 */}
      <footer className={styles.detailFooter}>
        <div className={styles.footerLine}></div>
        <div className={styles.footerRow}>
          <span className={styles.footerMark}>— End of Article</span>
          <div className={styles.footerActions}>
            <button
              className={`${styles.actionBtn}${liked ? ` ${styles.active}` : ''}`}
              onClick={() => onToggleLike?.()}
            >
              <StarFilled />
              <span>{liked ? t('article.detail.comments.liked') : t('article.detail.comments.like')}</span>
            </button>
            <button className={styles.actionBtn} onClick={() => onToggleBookmark?.()}>
              <ShareAltOutlined />
              <span>{t('square.detail.share')}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default RichBody
