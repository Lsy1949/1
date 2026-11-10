// 评论区（ArticleDetailView）· 贴吧式楼中楼：回复平铺在一条垂直线上（不缩进），
// 指向关系由「回复 @xxx」前缀表达（贴吧同款）。
// 数据全部来自后端（MSW mock）：GET/POST /api/articles/:id/comments*
import { useRef, useState } from 'react'
import { App as AntApp } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LikeFilled, LikeOutlined } from '@ant-design/icons'
import InitialAvatar from '@/components/InitialAvatar'
import { articleApi } from '@/api'
import type { ArticleCommentCreateDTO } from '@/api'
import { useTranslation } from 'react-i18next'
import styles from './Comments.module.css'

interface Props {
  /** 所属文章 id：评论按文章隔离，全部经接口读写 */
  articleId: number
}

/** 演示用户（仅用于输入区头像展示，落库身份由后端决定） */
const CURRENT_USER = '王同学'

export function Comments({ articleId }: Props) {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()
  const queryClient = useQueryClient()
  const [commentText, setCommentText] = useState('')
  // 回复状态与发评论完全分离：行内回复框挂在目标楼层下；
  // replyTo 记录被回复人昵称（平铺布局下的指向前缀）
  const [replyTarget, setReplyTarget] = useState<{ commentId: number; replyTo?: string } | null>(null)
  const [replyText, setReplyText] = useState('')
  // 楼中楼默认折叠，按楼层记录展开态
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const commentsKey = ['article', articleId, 'comments'] as const

  const { data: comments = [] } = useQuery({
    queryKey: commentsKey,
    queryFn: ({ signal }) => articleApi.fetchArticleComments(articleId, signal),
  })

  // 发表评论 / 楼中楼回复：接口返回最新列表，直接替换缓存
  const addComment = useMutation({
    mutationFn: (input: ArticleCommentCreateDTO) =>
      articleApi.addArticleComment(articleId, input),
    onSuccess: data => queryClient.setQueryData(commentsKey, data),
    onError: () => message.error(t('article.detail.comments.submitFailed')),
  })

  // 点赞切换：同样以接口返回值收敛缓存
  const toggleLike = useMutation({
    mutationFn: (commentId: number) => articleApi.toggleArticleCommentLike(articleId, commentId),
    onSuccess: data => queryClient.setQueryData(commentsKey, data),
    onError: () => message.error(t('article.detail.comments.submitFailed')),
  })

  const submitComment = () => {
    const text = commentText.trim()
    if (!text || addComment.isPending) return
    addComment.mutate({ content: text })
    setCommentText('')
  }

  /** 打开/切换行内回复框；点楼中楼内某条回复的「回复」时带上被回复人昵称 */
  const openReply = (commentId: number, replyToAuthor?: string) => {
    const same = replyTarget?.commentId === commentId && replyTarget.replyTo === replyToAuthor
    if (same) {
      setReplyTarget(null)
      setReplyText('')
    } else {
      setReplyTarget({ commentId, replyTo: replyToAuthor })
      setReplyText('')
    }
  }

  /** 提交回复：POST 到目标楼层（commentId 定位楼层 + replyTo 表达指向），成功后自动展开该楼层 */
  const submitReply = () => {
    const text = replyText.trim()
    if (!replyTarget || !text || addComment.isPending) return
    addComment.mutate({
      content: text,
      commentId: replyTarget.commentId,
      replyTo: replyTarget.replyTo,
    })
    setExpanded(prev => ({ ...prev, [replyTarget.commentId]: true }))
    setReplyTarget(null)
    setReplyText('')
  }

  const toggleReplies = (commentId: number) => {
    setExpanded(prev => ({ ...prev, [commentId]: !prev[commentId] }))
  }

  return (
    <section className={styles.commentsSection}>
      <div className={styles.commentsHeader}>
        <span className={styles.commentsEyebrow}>— Discussion</span>
        <h2 className={styles.commentsTitle}>{t('article.detail.comments.title')}</h2>
        <span className={styles.commentsCount}>{t('article.detail.comments.count', { n: comments.length })}</span>
      </div>

      {/* 发表评论 · 独立入口（与楼层内回复分离） */}
      <div className={styles.commentInputWrap}>
        <InitialAvatar name={CURRENT_USER} size={40} />
        <div className={styles.commentInputArea}>
          <textarea
            ref={textareaRef}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder={t('article.detail.comments.placeholder')}
            className={styles.commentTextarea}
            rows={3}
          ></textarea>
          <button
            className={styles.commentSubmitBtn}
            disabled={!commentText.trim() || addComment.isPending}
            onClick={submitComment}
          >
            {t('article.detail.comments.submit')}
          </button>
        </div>
      </div>

      {/* 评论列表 · 楼层平铺 + 楼中楼（数据源：GET /api/articles/:id/comments） */}
      {comments.length > 0 ? (
        <div className={styles.commentsList}>
          {comments.map(comment => (
            <div key={comment.id} className={styles.commentItem}>
              <div className={styles.commentAvatar}>
                <InitialAvatar name={comment.author} size={40} isAnonymous={comment.isAnonymous} />
              </div>
              <div className={styles.commentBody}>
                <div className={styles.commentMeta}>
                  <span className={styles.commentAuthor}>
                    {comment.isAnonymous ? t('article.detail.comments.anon') : comment.author}
                  </span>
                </div>
                <p className={styles.commentContent}>{comment.content}</p>
                <div className={styles.commentActions}>
                  <span className={styles.commentTime}>{comment.time}</span>
                  <span className={styles.actionsSpacer} />
                  <button
                    className={`${styles.commentReplyBtn}${replyTarget?.commentId === comment.id ? ` ${styles.active}` : ''}`}
                    onClick={() => openReply(comment.id)}
                  >
                    {t('article.detail.comments.reply')}
                  </button>
                  <button
                    className={`${styles.commentLikeBtn}${comment.liked ? ` ${styles.liked}` : ''}`}
                    disabled={toggleLike.isPending}
                    onClick={() => toggleLike.mutate(comment.id)}
                  >
                    {comment.liked ? <LikeFilled /> : <LikeOutlined />}
                    <span>{comment.likes > 0 ? comment.likes : t('article.detail.comments.like')}</span>
                  </button>
                </div>

                {/* 楼中楼 · 折叠开关 + 平铺列表（一条垂直线） */}
                {comment.replies.length > 0 && (
                  <div className={styles.repliesWrap}>
                    <button className={styles.repliesToggle} onClick={() => toggleReplies(comment.id)}>
                      {expanded[comment.id]
                        ? t('article.detail.comments.collapseReplies')
                        : t('article.detail.comments.replies', { n: comment.replies.length })}
                    </button>

                    {expanded[comment.id] && (
                      <div className={styles.repliesList}>
                        {comment.replies.map(reply => (
                          <div key={reply.id} className={styles.replyItem}>
                            <div className={styles.replyAvatar}>
                              <InitialAvatar name={reply.author} size={26} />
                            </div>
                            <div className={styles.replyBody}>
                              <div className={styles.replyMeta}>
                                <span className={styles.replyAuthor}>{reply.author}</span>
                                {reply.replyTo && (
                                  <span className={styles.replyToName}>
                                    {t('article.detail.comments.replyTo', { name: reply.replyTo })}
                                  </span>
                                )}
                              </div>
                              <p className={styles.replyContent}>{reply.content}</p>
                              <div className={styles.replyActions}>
                                <span className={styles.replyTime}>{reply.time}</span>
                                <button
                                  className={styles.replyBtn}
                                  onClick={() => openReply(comment.id, reply.author)}
                                >
                                  {t('article.detail.comments.reply')}
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
                {replyTarget?.commentId === comment.id && (
                  <div className={styles.replyBox}>
                    <InitialAvatar name={CURRENT_USER} size={30} />
                    <div className={styles.replyBoxArea}>
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder={
                          replyTarget.replyTo
                            ? t('article.detail.comments.replyPlaceholder', { name: replyTarget.replyTo })
                            : t('article.detail.comments.placeholder')
                        }
                        className={styles.replyTextarea}
                        rows={2}
                      ></textarea>
                      <div className={styles.replyBoxActions}>
                        <button
                          className={styles.replyCancelBtn}
                          onClick={() => { setReplyTarget(null); setReplyText('') }}
                        >
                          {t('article.detail.comments.cancelReply')}
                        </button>
                        <button
                          className={styles.replySubmitBtn}
                          disabled={!replyText.trim() || addComment.isPending}
                          onClick={submitReply}
                        >
                          {t('article.detail.comments.reply')}
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
        <div className={styles.commentsEmpty}>
          {t('article.detail.comments.empty')}
        </div>
      )}
    </section>
  )
}

export default Comments
