// 广场详情页 · 标题区：心情/日期 + 大标题 + 作者行
// 标题取动态正文首句（由页面派生传入），让每条动态都有真正的「标题」
import InitialAvatar from '@/components/InitialAvatar'
import { useTranslation } from 'react-i18next'
import { moodMap } from '../moods'
import type { PostItem } from '../types'
import styles from './DetailHeader.module.css'

export interface DetailHeaderProps {
  post: PostItem
  /** 从正文首句派生的标题；缺失时回退到通用文案 */
  lead?: string
}

export function DetailHeader({ post, lead }: DetailHeaderProps) {
  const { t } = useTranslation()

  return (
    <header className={styles.detailHeader}>
      <div className={styles.headerEyebrow}>
        {post.mood ? <span className={styles.eyebrowMood}>{moodMap[post.mood]}</span> : null}
        <span className={styles.eyebrowDate}>{t('square.detail.createdAt', { date: post.createdAt })}</span>
      </div>

      {/* 原 v-html($t('square.detail.title'))：仅在缺少首句标题时回退 */}
      <h1 className={styles.detailTitle}>
        {lead ? (
          lead
        ) : (
          <span dangerouslySetInnerHTML={{ __html: t('square.detail.title') }} />
        )}
      </h1>

      {/* 作者行 */}
      <div className={styles.authorRow}>
        <div className={styles.authorBlock}>
          <InitialAvatar name={post.author} size={44} isAnonymous={post.isAnonymous} />
          <div className={styles.authorInfo}>
            <span className={styles.authorName}>
              {post.isAnonymous ? t('square.detail.anonymous') : post.author}
            </span>
            <span className={styles.authorTitle}>
              {post.type === 'capsule' ? t('square.list.capsuleBadge') : t('square.list.momentBadge')}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default DetailHeader
