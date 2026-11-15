// 广场详情页：参考文章详情的编辑式版式
// 顶部返回栏 + 大标题（取动态首句）+ 双栏（正文/评论 | 作者侧栏）
// 详情由接口提供，点赞复用列表页的乐观更新 Hook
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Result, Skeleton } from 'antd'
import ReadProgress from '@/components/ReadProgress'
import { htmlToText, plainTextToHtml, sanitizeHtml } from '@/components/RichTextEditor/sanitize'
import {
  DetailBody,
  DetailComments,
  DetailHeader,
  DetailTopBar,
  PostAside,
} from '@/features/square'
import { ApiError } from '@/api'
import { useTranslation } from 'react-i18next'
import { useSquareComments, useCreateComment, useSquareFeed, useToggleCommentLike, useToggleLike } from '../squareQuery'
import './index.css'

/**
 * 把净化后的 HTML 切成块级片段：
 * contentEditable 的首段常是「裸文本节点」（`今天很好。<div>…</div>`），
 * 这里把连续文本节点、<br> 一并收拢成段落，保证「段落数」判定可靠。
 */
function toBlocks(safeHtml: string): string[] {
  const holder = document.createElement('div')
  holder.innerHTML = safeHtml
  const blocks: string[] = []
  let textBuffer = ''

  const flushText = () => {
    const text = textBuffer.trim()
    textBuffer = ''
    if (text) blocks.push(`<p>${plainTextToHtml(text)}</p>`)
  }

  Array.from(holder.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      textBuffer += node.textContent ?? ''
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    if (el.tagName === 'BR') {
      textBuffer += '\n'
      return
    }
    flushText()
    blocks.push(el.outerHTML)
  })
  flushText()
  return blocks
}

/**
 * 把动态正文拆成「标题句 + 剩余正文」：
 * - 多块：首块文本作标题，其余块原样保留标签进入正文
 * - 单块 / 纯文本：沿用首句规则（6–48 字且以句末标点结束）作标题，剩余进入正文
 */
function splitPostContent(content: string): { lead: string; body: string } {
  const blocks = toBlocks(sanitizeHtml(content))

  if (blocks.length > 1) {
    const lead = htmlToText(blocks[0]).trim()
    const body = blocks.slice(1).join('')
    if (lead && body) return { lead, body }
  }

  const text = htmlToText(blocks.join(''))
  const match = text.match(/^([\s\S]{6,48}?)[。！？!?\n]/)
  if (match && text.length > match[0].length + 12) {
    const rest = text.slice(match[0].length).trim()
    return { lead: match[1].trim(), body: `<p>${plainTextToHtml(rest)}</p>` }
  }
  return { lead: text, body: '' }
}

export function SquareDetailView() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t } = useTranslation()
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

  const handleTopic = (tag: string) => {
    message.info('#' + tag)
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

  const { lead, body } = splitPostContent(post.content)

  return (
    <div className="square-detail-page">
      <ReadProgress />

      <div className="square-detail-shell">
        {/* 顶部返回栏 */}
        <DetailTopBar id={post.id} type={post.type} onBack={() => navigate('/square')} />

        {/* 双栏：正文 | 作者侧栏 */}
        <div className="square-detail-grid">
          <div className="square-detail-main">
            <DetailHeader post={post} lead={lead} />

            {/* 正文 + 互动栏 */}
            <DetailBody
              post={post}
              body={body}
              onLike={() => toggleLike.mutate(post.id)}
              onShare={handleShare}
            />
          </div>

          {/* 右侧栏：作者 / 互动数据 / 话题 */}
          <PostAside
            post={post}
            commentCount={post.commentCount}
            onTopic={handleTopic}
          />
        </div>

        {/* 评论区：与文章详情一致，铺满版心宽度（不并入左栏） */}
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
    </div>
  )
}

export default SquareDetailView
