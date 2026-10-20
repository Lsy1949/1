// 广场详情页：返回栏 + 标题区 + 正文 + 评论区
// 详情由接口提供，点赞复用列表页的乐观更新 Hook
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Result, Skeleton } from 'antd'
import { DetailBody, DetailComments, DetailHeader, DetailTopBar } from '@/features/square'
import { ApiError } from '@/api'
import { useI18n } from '@/i18n'
import { useSquareComments, useCreateComment, useSquareFeed, useToggleCommentLike, useToggleLike } from './squareQuery'
import './SquareDetailView.css'

export function SquareDetailView() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t } = useI18n()
  const { message } = App.useApp()

  const {
    data: post,
    isPending,
    isError,
    error,
    refetch,
  } = useSquareFeed(id)
  const toggleLike = useToggleLike()

  const {
    data: comments = [],
    isPending: commentsPending,
    isError: commentsError,
    refetch: refetchComments,
  } = useSquareComments(id)
  const createComment = useCreateComment(id)
  const toggleCommentLike = useToggleCommentLike(id)

  const isNotFound = isError && error instanceof ApiError && error.status === 404

  // 动态不存在：保持原行为回到广场列表
  useEffect(() => {
    if (isNotFound) navigate('/square', { replace: true })
  }, [isNotFound, navigate])

  const handleShare = () => {
    if (!post) return
    message.success(
      t('square.detail.share') + ' · ' + (post.isAnonymous ? t('square.detail.anonymous') : post.author),
    )
  }

  if (!id || isNotFound) return null

  if (isPending) {
    return (
      <div className="square-detail-page">
        <div className="square-detail-state">
          <Skeleton active title={{ width: '62%' }} paragraph={{ rows: 2 }} />
          <Skeleton active title={false} paragraph={{ rows: 6 }} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="square-detail-page">
        <div className="square-detail-state">
          <Result
            status="error"
            title={t('common.loadFailed')}
            extra={
              <Button type="primary" onClick={() => void refetch()}>
                {t('common.retry')}
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  if (!post) return null

  return (
    <div className="square-detail-page">
      {/* 顶部返回栏 */}
      <DetailTopBar id={post.id} type={post.type} onBack={() => navigate('/square')} />

      {/* 标题区 */}
      <DetailHeader post={post} />

      {/* 正文 + 互动栏 */}
      <DetailBody
        post={post}
        onLike={() => toggleLike.mutate(post.id)}
        onShare={handleShare}
      />

      {/* 评论区（评论数据与行为均由页面注入） */}
      <DetailComments
        comments={comments}
        isLoading={commentsPending}
        isError={commentsError}
        onRetry={() => void refetchComments()}
        onSubmit={(input) => createComment.mutateAsync(input)}
        isSubmitting={createComment.isPending}
        onLike={toggleCommentLike.mutate}
      />
    </div>
  )
}

export default SquareDetailView
