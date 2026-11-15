// 广场详情页 · 评论区：与文章详情 1:1（贴吧式楼中楼：折叠回复 + 行内回复框 + 平铺楼层）
// 数据与发布/点赞行为由页面注入；组件只保留输入框、回复目标、楼层折叠三个 UI 状态
import { useMemo, useState } from 'react'
import { Button, Result, Skeleton } from 'antd'
import { LikeFilled, LikeOutlined } from '@ant-design/icons'
import InitialAvatar from '@/components/InitialAvatar'
import { useTranslation } from 'react-i18next'
import type { CommentItem, SquareCommentCreateInput } from '../types'
import styles from './DetailComments.module.css'

/** 演示用户（仅用于输入区头像展示，落库身份由后端决定） */
const CURRENT_USER = '王同学'

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
  const { t } = useTranslation()

  const [commentText, setCommentText] = useState('')
  // 行内回复状态：floorId 定位楼层、targetId 是实际被回复的评论、replyTo 是展示用昵称
  const [replyTarget, setReplyTarget] = useState<{
    floorId: number
    targetId: number
    replyTo?: string
  } | null>(null)
  const [replyText, setReplyText] = useState('')
  // 楼中楼默认折叠，按楼层记录展开态
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const nameOf = (c: CommentItem) => (c.isAnonymous ? t('square.detail.anonymous') : c.author)

  const authorById = useMemo(() => {
    const map = new Map<number, string>()
    comments.forEach((c) => map.set(c.id, c.isAnonymous ? t('square.detail.anonymous') : c.author))
    return map
  }, [comments, t])

  // 楼层归组：回复沿 parentId 上溯到顶层评论，产出「楼层 + 楼中楼」结构（与文章评论同构）
  const floors = useMemo(() => {
    const byId = new Map(comments.map((c) => [c.id, c]))
    const rootOf = (c: CommentItem) => {
      let cur = c
      const seen = new Set<number>()
      while (cur.parentId != null && byId.has(cur.parentId) && !seen.has(cur.id)) {
        seen.add(cur.id)
        cur = byId.get(cur.parentId)!
      }
      return cur
    }

    const list = comments
      .filter((c) => c.parentId == null)
      .map((c) => ({ comment: c, replies: [] as CommentItem[] }))
    const index = new Map(list.map((f) => [f.comment.id, f]))

    comments.forEach((c) => {
      if (c.parentId == null) return
      const floor = index.get(rootOf(c).id)
      // 父楼层缺失时降级为独立楼层，避免回复被吞掉
      if (floor) floor.replies.push(c)
      else list.push({ comment: c, replies: [] })
    })

    // 楼中楼按时间正序还原对话顺序（顶层楼层仍保持接口的倒序）
    list.forEach((floor) => floor.replies.sort((a, b) => a.id - b.id))

    return list
  }, [comments])

  const submitComment = async () => {
    const text = commentText.trim()
    if (!text || isSubmitting) return
    try {
      await onSubmit({ content: text })
      setCommentText('')
    } catch {
      /* 接口错误由页面 mutation 统一提示 */
    }
  }

  /** 打开/切换行内回复框（同一目标再点一次即收起） */
  const openReply = (floorId: number, targetId: number, replyToAuthor?: string) => {
    const same = replyTarget?.targetId === targetId && replyTarget.replyTo === replyToAuthor
    if (same) {
      setReplyTarget(null)
      setReplyText('')
    } else {
      setReplyTarget({ floorId, targetId, replyTo: replyToAuthor })
      setReplyText('')
    }
  }

  const submitReply = async () => {
    const text = replyText.trim()
    if (!replyTarget || !text || isSubmitting) return
    try {
      await onSubmit({ content: text, parentId: replyTarget.targetId })
      setExpanded((prev) => ({ ...prev, [replyTarget.floorId]: true }))
      setReplyTarget(null)
      setReplyText('')
    } catch {
      /* 接口错误由页面 mutation 统一提示 */
    }
  }

  return (
    <section className={styles.commentsSection}>
      <div className={styles.commentsHeader}>
        <span className={styles.commentsEyebrow}>— Discussion</span>
        <h2 className={styles.commentsTitle}>{t('square.detail.comments.title')}</h2>
        {!isLoading && !isError && (
          <span className={styles.commentsCount}>
            {t('square.detail.comments.count', { n: comments.length })}
          </span>
        )}
      </div>

      {/* 发表评论 · 独立入口（与楼层内回复分离） */}
      <div className={styles.commentInputWrap}>
        <InitialAvatar name={CURRENT_USER} size={40} />
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
            disabled={!commentText.trim() || isSubmitting}
            onClick={() => void submitComment()}
          >
            {t('square.detail.comments.submit')}
          </button>
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
      ) : floors.length > 0 ? (
        <div className={styles.commentsList}>
          {floors.map(({ comment, replies }) => (
            <div key={comment.id} className={styles.commentItem}>
              <div className={styles.commentAvatar}>
                <InitialAvatar name={comment.author} size={40} isAnonymous={comment.isAnonymous} />
              </div>
              <div className={styles.commentBody}>
                <div className={styles.commentMeta}>
                  <span className={styles.commentAuthor}>{nameOf(comment)}</span>
                </div>
                <p className={styles.commentContent}>{comment.content}</p>
                <div className={styles.commentActions}>
                  <span className={styles.commentTime}>{comment.createdAt}</span>
                  <span className={styles.actionsSpacer} />
                  <button
                    className={`${styles.commentReplyBtn}${replyTarget?.targetId === comment.id ? ` ${styles.active}` : ''}`}
                    onClick={() => openReply(comment.id, comment.id)}
                  >
                    {t('square.detail.comments.reply')}
                  </button>
                  <button
                    className={`${styles.commentLikeBtn}${comment.liked ? ` ${styles.liked}` : ''}`}
                    disabled={isSubmitting}
                    onClick={() => onLike(comment.id)}
                  >
                    {comment.liked ? <LikeFilled /> : <LikeOutlined />}
                    <span>
                      {comment.likes > 0 ? comment.likes : t('square.detail.comments.like')}
                    </span>
                  </button>
                </div>

                {/* 楼中楼 · 折叠开关 + 平铺列表（一条垂直线） */}
                {replies.length > 0 && (
                  <div className={styles.repliesWrap}>
                    <button
                      className={styles.repliesToggle}
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }))
                      }
                    >
                      {expanded[comment.id]
                        ? t('square.detail.comments.collapseReplies')
                        : t('square.detail.comments.replies', { n: replies.length })}
                    </button>

                    {expanded[comment.id] && (
                      <div className={styles.repliesList}>
                        {replies.map((reply) => (
                          <div key={reply.id} className={styles.replyItem}>
                            <div className={styles.replyAvatar}>
                              <InitialAvatar name={reply.author} size={26} />
                            </div>
                            <div className={styles.replyBody}>
                              <div className={styles.replyMeta}>
                                <span className={styles.replyAuthor}>{nameOf(reply)}</span>
                                {reply.parentId != null &&
                                  reply.parentId !== comment.id &&
                                  authorById.has(reply.parentId) && (
                                    <span className={styles.replyToName}>
                                      {t('square.detail.comments.replyTo', {
                                        name: authorById.get(reply.parentId),
                                      })}
                                    </span>
                                  )}
                              </div>
                              <p className={styles.replyContent}>{reply.content}</p>
                              <div className={styles.replyActions}>
                                <span className={styles.replyTime}>{reply.createdAt}</span>
                                <button
                                  className={styles.replyBtn}
                                  onClick={() =>
                                    openReply(comment.id, reply.id, nameOf(reply))
                                  }
                                >
                                  {t('square.detail.comments.reply')}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 行内回复框 · 挂在楼层底部；回复楼中楼内回复时 placeholder 带 @目标 */}
                {replyTarget?.floorId === comment.id && (
                  <div className={styles.replyBox}>
                    <InitialAvatar name={CURRENT_USER} size={30} />
                    <div className={styles.replyBoxArea}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={
                          replyTarget.replyTo
                            ? t('square.detail.comments.replyPlaceholder', {
                                name: replyTarget.replyTo,
                              })
                            : t('square.detail.comments.placeholder')
                        }
                        className={styles.replyTextarea}
                        rows={2}
                      ></textarea>
                      <div className={styles.replyBoxActions}>
                        <button
                          className={styles.replyCancelBtn}
                          onClick={() => {
                            setReplyTarget(null)
                            setReplyText('')
                          }}
                        >
                          {t('square.detail.comments.cancelReply')}
                        </button>
                        <button
                          className={styles.replySubmitBtn}
                          disabled={!replyText.trim() || isSubmitting}
                          onClick={() => void submitReply()}
                        >
                          {t('square.detail.comments.reply')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.commentsEmpty}>{t('square.detail.comments.empty')}</div>
      )}
    </section>
  )
}

export default DetailComments
