// 广场详情页 · 正文 + 底部互动栏
import { ShareAltOutlined, StarOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import type { PostItem } from '../types'
import styles from './DetailBody.module.css'

export interface DetailBodyProps {
  post: PostItem
  onLike: () => void
  onShare: () => void
}

export function DetailBody({ post, onLike, onShare }: DetailBodyProps) {
  const { t } = useI18n()

  return (
    <>
      {/* 正文 */}
      <article className={styles.richContent}>
        <p className={styles.contentText}>{post.content}</p>
        {post.photos && post.photos.length > 0 && (
          <div className={styles.photoGrid}>
            {post.photos.map((photo, i) => (
              <img key={i} src={photo} className={styles.contentPhoto} alt={t('square.create.photo.alt')} loading="lazy" />
            ))}
          </div>
        )}
      </article>

      {/* 互动栏 */}
      <footer className={styles.detailFooter}>
        <div className={styles.footerLine}></div>
        <div className={styles.footerRow}>
          <span className={styles.footerMark}>— End</span>
          <div className={styles.footerActions}>
            <button className={`${styles.actionBtn}${post.liked ? ` ${styles.active}` : ''}`} onClick={onLike}>
              <StarOutlined />
              <span>{post.likes}</span>
            </button>
            <button className={styles.actionBtn} onClick={onShare}>
              <ShareAltOutlined />
              <span>{t('square.detail.share')}</span>
            </button>
          </div>
        </div>
      </footer>
    </>
  )
}

export default DetailBody
