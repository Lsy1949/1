// 广场详情页 · 标题区：心情/日期 + 大标题 + 作者行
import InitialAvatar from '@/components/InitialAvatar'
import { useI18n } from '@/i18n'
import { moodMap } from '../moods'
import type { PostItem } from '../types'
import styles from './DetailHeader.module.css'

export interface DetailHeaderProps {
  post: PostItem
}

export function DetailHeader({ post }: DetailHeaderProps) {
  const { t } = useI18n()

  return (
    <header className={styles.detailHeader}>
      <div className={styles.headerEyebrow}>
        {post.mood ? <span className={styles.eyebrowMood}>{moodMap[post.mood]}</span> : null}
        <span className={styles.eyebrowDate}>{t('square.detail.createdAt', { date: post.createdAt })}</span>
      </div>
      {/* 原 v-html($t('square.detail.title'))，title 含 <em> 标签、来自本地 i18n，内容可信 */}
      <h1 className={styles.detailTitle} dangerouslySetInnerHTML={{ __html: t('square.detail.title') }}></h1>

      {/* 作者行 */}
      <div className={styles.authorRow}>
        <div className={styles.authorBlock}>
          <InitialAvatar name={post.author} size={44} isAnonymous={post.isAnonymous} />
          <div className={styles.authorInfo}>
            <span className={styles.authorName}>{post.isAnonymous ? t('square.detail.anonymous') : post.author}</span>
            <span className={styles.authorTitle}>{post.type === 'capsule' ? t('square.list.capsuleBadge') : t('square.list.momentBadge')}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default DetailHeader
