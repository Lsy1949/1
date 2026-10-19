// 广场详情页 · 评论区：输入 + 列表（状态自持，父级用 key=post.id 在切文时重建）
import { useState } from 'react'
import { StarOutlined } from '@ant-design/icons'
import InitialAvatar from '@/components/InitialAvatar'
import { useI18n } from '@/i18n'
import { defaultCommentsSeed } from '../data'
import type { CommentItem } from '../types'
import styles from './DetailComments.module.css'

export function DetailComments() {
  const { t } = useI18n()

  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<CommentItem[]>(() => defaultCommentsSeed.map((c) => ({ ...c })))

  const submitComment = () => {
    const text = commentText.trim()
    if (!text) return
    setComments((prev) => [
      {
        id: Date.now(),
        author: '王同学',
        content: text,
        time: t('square.detail.createdAt', { date: '刚刚' }).replace(/.*·\s*/, '刚刚'),
        likes: 0,
        liked: false
      },
      ...prev
    ])
    setCommentText('')
  }

  // 原 Vue 版直接改 comment.liked/likes（深层响应式）→ React 以不可变更新等价实现
  const toggleCommentLike = (comment: CommentItem) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === comment.id ? { ...c, liked: !c.liked, likes: c.likes + (c.liked ? 1 : -1) } : c
      )
    )
  }

  return (
    <section className={styles.commentsSection}>
      <div className={styles.commentsHeader}>
        <h2 className={styles.commentsTitle}>{t('square.detail.comments.title')}</h2>
        <span className={styles.commentsCount}>{t('square.detail.comments.count', { n: comments.length })}</span>
      </div>

      {/* 评论输入 */}
      <div className={styles.commentInputWrap}>
        <InitialAvatar name="王同学" size={40} />
        <div className={styles.commentInputArea}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={t('square.detail.comments.placeholder')}
            className={styles.commentTextarea}
            rows={3}
          ></textarea>
          <button
            className={styles.commentSubmitBtn}
            disabled={!commentText.trim()}
            onClick={submitComment}
          >
            {t('square.detail.comments.submit')}
          </button>
        </div>
      </div>

      {/* 评论列表 */}
      {comments.length > 0 ? (
        <div className={styles.commentsList}>
          {comments.map((comment) => (
            <div key={comment.id} className={styles.commentItem}>
              <InitialAvatar name={comment.author} size={40} isAnonymous={comment.isAnonymous} />
              <div className={styles.commentBody}>
                <div className={styles.commentMeta}>
                  <span className={styles.commentAuthor}>{comment.isAnonymous ? t('square.detail.anonymous') : comment.author}</span>
                  <span className={styles.commentTime}>{comment.time}</span>
                </div>
                <p className={styles.commentContent}>{comment.content}</p>
                <button
                  className={`${styles.commentLikeBtn}${comment.liked ? ` ${styles.liked}` : ''}`}
                  onClick={() => toggleCommentLike(comment)}
                >
                  <StarOutlined />
                  <span>{comment.likes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.commentsEmpty}>
          {t('square.detail.comments.empty')}
        </div>
      )}
    </section>
  )
}

export default DetailComments
