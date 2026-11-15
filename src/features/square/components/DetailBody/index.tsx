// 广场详情页 · 正文 + 底部互动栏
// 正文只承载「标题句之后」的内容；图片走 antd Image.PreviewGroup（可点开大图）
import { Image } from 'antd'
import { ShareAltOutlined, StarOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import RichTextViewer from '@/components/RichTextViewer'
import type { PostItem } from '../types'
import styles from './DetailBody.module.css'

export interface DetailBodyProps {
  post: PostItem
  /** 正文 HTML（已剔除作为标题的首句）；为空时仅渲染图片 */
  body?: string
  onLike: () => void
  onShare: () => void
}

export function DetailBody({ post, body, onLike, onShare }: DetailBodyProps) {
  const { t } = useTranslation()
  const photos = post.photos ?? []

  return (
    <>
      {/* 正文 */}
      <article className={styles.richContent}>
        {body ? (
          <div className={styles.prose}>
            <span className={styles.quoteMark} aria-hidden="true">
              “
            </span>
            <RichTextViewer html={body} className={styles.contentText} />
          </div>
        ) : null}

        {photos.length > 0 && (
          <Image.PreviewGroup>
            <div className={`${styles.photoGrid} photo-count-${Math.min(photos.length, 4)}`}>
              {photos.map((photo, i) => (
                <Image
                  key={i}
                  src={photo}
                  alt={t('square.create.photo.alt')}
                  className={styles.contentPhoto}
                />
              ))}
            </div>
          </Image.PreviewGroup>
        )}
      </article>

      {/* 互动栏 */}
      <footer className={styles.detailFooter}>
        <div className={styles.footerLine}></div>
        <div className={styles.footerRow}>
          <span className={styles.footerMark}>— End</span>
          <div className={styles.footerActions}>
            <button
              className={`${styles.actionBtn}${post.liked ? ` ${styles.active}` : ''}`}
              onClick={onLike}
              aria-pressed={post.liked}
            >
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
