// 广场详情页 · 评论区：输入 + 列表（含回复）
// 纯展示组件：评论数据与发布/点赞行为均由页面注入；组件只保留输入框与回复目标两个 UI 状态
import { useMemo, useState } from 'react'
import { Button, Empty, Input, Result, Skeleton } from 'antd'
import { StarOutlined } from '@ant-design/icons'
import InitialAvatar from '@/components/InitialAvatar'
import { useI18n } from '@/i18n'
import type { CommentItem, SquareCommentCreateInput } from '../types'
import styles from './DetailComments.module.css'

export interface DetailCommentsProps {
  comments: CommentItem[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  /** 发布评论；parentId 存在时为回复 */
  onSubmit: (input: SquareCommentCreateInput) => Promise<unknown>
  isSubmitting: boolean
  onLike: (id: number) => void
}

export function DetailComments({
  comments,
  isLoading,
  isError,
  onRetry,
  onSubmit,
  isSubmitting,
  onLike,
}: DetailCommentsProps) {
  const { t } = useI18n()

  const [commentText, setCommentText] = useState('')
  // 回复目标（纯 UI 状态，不参与数据缓存）
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null)

  const canSubmit = commentText.trim().length > 0 && !isSubmitting

  // 评论 id → 作者，用于展示「回复 @某人」
  const authorById = useMemo(() => {
    const map = new Map<number, string>()
    comments.forEach((c) => map.set(c.id, c.isAnonymous ? t('square.detail.anonymous') : c.author))
    return map
  }, [comments, t])

  const submitComment = async () => {
    const text = commentText.trim()
    if (!text || isSubmitting) return

    try {
      await onSubmit({ content: text, parentId: replyTo?.id })
      setCommentText('')
      setReplyTo(null)
    } catch {
      /* 接口错误由页面 mutation 统一提示 */
    }
  }

  return (
    <section className={styles.commentsSection}>
      <div className={styles.commentsHeader}>
        <h2 className={styles.commentsTitle}>{t('square.detail.comments.title')}</h2>
        {!isLoading && !isError && (
          <span className={styles.commentsCount}>
            {t('square.detail.comments.count', { n: comments.length })}
          </span>
        )}
      </div>

      {/* 评论输入 */}
      <div className={styles.commentInputWrap}>
        <InitialAvatar name="王同学" size={40} />
        <div className={styles.commentInputArea}>
          {replyTo && (
            <div className={styles.replyChip}>
              <span>
                {t('square.detail.comments.replyTo', {
                  name: replyTo.isAnonymous ? t('square.detail.anonymous') : replyTo.author,
                })}
              </span>
              <button type="button" className={styles.replyCancel} onClick={() => setReplyTo(null)}>
                {t('square.detail.comments.cancelReply')}
              </button>
            </div>
          )}
          <Input.TextArea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={t('square.detail.comments.placeholder')}
            className={styles.commentTextarea}
            maxLength={500}
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
          <Button
            type="primary"
            className={styles.commentSubmitBtn}
            disabled={!canSubmit}
            loading={isSubmitting}
            onClick={() => void submitComment()}
          >
            {t('square.detail.comments.submit')}
          </Button>
        </div>
      </div>

      {/* 评论列表：加载 / 错误 / 空态 / 数据 */}
      {isLoading ? (
        <div className={styles.commentsSkeleton}>
          <Skeleton active avatar paragraph={{ rows: 2 }} />
          <Skeleton active avatar paragraph={{ rows: 2 }} />
        </div>
      ) : isError ? (
        <Result
          status="error"
          title={t('common.loadFailed')}
          extra={
            <Button type="primary" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          }
        />
      ) : comments.length > 0 ? (
        <div className={styles.commentsList}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`${styles.commentItem}${comment.parentId != null ? ` ${styles.isReply}` : ''}`}
            >
              <InitialAvatar
                name={comment.author}
                size={40}
                isAnonymous={comment.isAnonymous}
              />
              <div className={styles.commentBody}>
                <div className={styles.commentMeta}>
                  <span className={styles.commentAuthor}>
                    {comment.isAnonymous ? t('square.detail.anonymous') : comment.author}
                  </span>
                  <span className={styles.commentTime}>{comment.createdAt}</span>
                </div>
                <p className={styles.commentContent}>{comment.content}</p>
                <div className={styles.commentActions}>
                  <button
                    className={`${styles.commentLikeBtn}${comment.liked ? ` ${styles.liked}` : ''}`}
                    onClick={() => onLike(comment.id)}
                  >
                    <StarOutlined />
                    <span>{comment.likes}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.commentReplyBtn}
                    onClick={() => setReplyTo(comment)}
                  >
                    {t('square.detail.comments.reply')}
                  </button>
                  {comment.parentId != null && authorById.has(comment.parentId) && (
                    <span className={styles.replyMark}>
                      {t('square.detail.comments.repliedTo', {
                        name: authorById.get(comment.parentId),
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.commentsEmpty}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('square.detail.comments.empty')}
          />
        </div>
      )}
    </section>
  )
}

export default DetailComments
