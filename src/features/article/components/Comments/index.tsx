// 评论区（ArticleDetailView），纯前端本地演示数据，状态自持
import { useState } from 'react'
import { StarFilled } from '@ant-design/icons'
import InitialAvatar from '@/components/InitialAvatar'
import { useI18n } from '@/i18n'
import styles from './Comments.module.css'

interface CommentItem {
  id: number
  author: string
  content: string
  time: string
  likes: number
  liked: boolean
  isAnonymous?: boolean
}

const initialComments: CommentItem[] = [
  { id: 1, author: '林晓', content: '读完之后深有感触，尤其是关于建立微小秩序的部分，让我重新审视了自己的日常。', time: '3小时前', likes: 24, liked: false },
  { id: 2, author: '陈默', content: '正念练习确实有效，我坚持了三个月，焦虑感明显减轻了。推荐大家试试。', time: '5小时前', likes: 18, liked: false },
  { id: 3, author: '匿名同学', content: '感谢分享，正在经历迷茫期，这篇文章像一盏灯。', time: '昨天', likes: 31, liked: false, isAnonymous: true },
  { id: 4, author: '周琳', content: '与其试图掌控一切，不如学会与不确定性共处。这句话我要记下来。', time: '2天前', likes: 12, liked: false }
]

export function Comments() {
  const { t } = useI18n()
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<CommentItem[]>(initialComments)

  const submitComment = () => {
    const text = commentText.trim()
    if (!text) return
    setComments(prev => [
      { id: Date.now(), author: '王同学', content: text, time: '刚刚', likes: 0, liked: false },
      ...prev
    ])
    setCommentText('')
  }

  // Vue 版直接 mutate comment.liked/likes；React 版以 map 不可变替换，行为一致
  const toggleCommentLike = (id: number) => {
    setComments(prev => prev.map(c =>
      c.id === id ? { ...c, liked: !c.liked, likes: c.likes + (c.liked ? -1 : 1) } : c
    ))
  }

  return (
    <section className={styles.commentsSection}>
      <div className={styles.commentsHeader}>
        <span className={styles.commentsEyebrow}>— Discussion</span>
        <h2 className={styles.commentsTitle}>{t('article.detail.comments.title')}</h2>
        <span className={styles.commentsCount}>{t('article.detail.comments.count', { n: comments.length })}</span>
      </div>

      {/* 评论输入 */}
      <div className={styles.commentInputWrap}>
        <InitialAvatar name="王同学" size={40} />
        <div className={styles.commentInputArea}>
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder={t('article.detail.comments.placeholder')}
            className={styles.commentTextarea}
            rows={3}
          ></textarea>
          <button
            className={styles.commentSubmitBtn}
            disabled={!commentText.trim()}
            onClick={submitComment}
          >
            {t('article.detail.comments.submit')}
          </button>
        </div>
      </div>

      {/* 评论列表 */}
      {comments.length > 0 ? (
        <div className={styles.commentsList}>
          {comments.map(comment => (
            <div key={comment.id} className={styles.commentItem}>
              <InitialAvatar name={comment.author} size={40} isAnonymous={comment.isAnonymous} />
              <div className={styles.commentBody}>
                <div className={styles.commentMeta}>
                  <span className={styles.commentAuthor}>{comment.isAnonymous ? t('article.detail.comments.anon') : comment.author}</span>
                  <span className={styles.commentTime}>{comment.time}</span>
                </div>
                <p className={styles.commentContent}>{comment.content}</p>
                <button
                  className={`${styles.commentLikeBtn}${comment.liked ? ` ${styles.liked}` : ''}`}
                  onClick={() => toggleCommentLike(comment.id)}
                >
                  <StarFilled />
                  <span>{comment.likes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.commentsEmpty}>
          {t('article.detail.comments.empty')}
        </div>
      )}
    </section>
  )
}

export default Comments
