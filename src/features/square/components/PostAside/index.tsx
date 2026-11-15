// 广场详情页 · 右侧栏：作者卡 + 互动数据 + 话题
// 纯展示 + 回调上抛（话题点击由页面负责）
import InitialAvatar from '@/components/InitialAvatar'
import { useTranslation } from 'react-i18next'
import { moodMap } from '../moods'
import type { PostItem } from '../types'
import styles from './PostAside.module.css'

export interface PostAsideProps {
  post: PostItem
  commentCount: number
  /** 点击话题标签 */
  onTopic: (tag: string) => void
}

export function PostAside({ post, commentCount, onTopic }: PostAsideProps) {
  const { t } = useTranslation()
  const authorName = post.isAnonymous ? t('square.detail.anonymous') : post.author

  return (
    <aside className={styles.aside}>
      {/* 作者卡 */}
      <section className={styles.authorCard}>
        <InitialAvatar name={post.author} size={56} isAnonymous={post.isAnonymous} />
        <div className={styles.authorMeta}>
          <span className={styles.authorName}>{authorName}</span>
          <span className={styles.authorType}>
            {post.type === 'capsule' ? t('square.list.capsuleBadge') : t('square.list.momentBadge')}
            {post.mood ? <span className={styles.moodMark}>{moodMap[post.mood]}</span> : null}
          </span>
        </div>
        {post.isAnonymous && <p className={styles.anonHint}>{t('square.detail.aside.anon')}</p>}
      </section>

      {/* 互动数据 */}
      <section className={styles.block}>
        <h4 className={styles.blockLabel}>{t('square.detail.aside.stats')}</h4>
        <dl className={styles.statList}>
          <div className={styles.statRow}>
            <dt>{t('square.detail.aside.likes')}</dt>
            <dd className={styles.statNum}>{post.likes}</dd>
          </div>
          <div className={styles.statRow}>
            <dt>{t('square.detail.aside.comments')}</dt>
            <dd className={styles.statNum}>{commentCount}</dd>
          </div>
          <div className={styles.statRow}>
            <dt>{t('square.detail.aside.published')}</dt>
            <dd className={styles.statDate}>{post.createdAt}</dd>
          </div>
        </dl>
      </section>

      {/* 相关话题 */}
      <section className={styles.block}>
        <h4 className={styles.blockLabel}>{t('square.detail.aside.topics')}</h4>
        {post.topics && post.topics.length > 0 ? (
          <div className={styles.topicList}>
            {post.topics.map((tag) => (
              <button key={tag} type="button" className={styles.topicTag} onClick={() => onTopic(tag)}>
                #{tag}
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>{t('square.detail.aside.noTopics')}</p>
        )}
      </section>
    </aside>
  )
}

export default PostAside
