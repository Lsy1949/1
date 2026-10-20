// 文章详情页（/articles/:id）· 页面层负责取数与跳转，正文/推荐/评论区拆至 RichBody/RelatedSidebar/Comments
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Result, Skeleton } from 'antd'
import { ArrowLeftOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { ApiError, articleApi } from '@/api'
import ReadProgress from '@/components/ReadProgress'
import InitialAvatar from '@/components/InitialAvatar'
import { Comments, RelatedSidebar, RichBody } from '@/features/article'
import { useReveal } from '@/hooks/useReveal'
import { useI18n } from '@/i18n'
import { toArticleItem } from './articleQuery'
import './ArticleDetailView.css'

const formatViews = (n: number) => {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

export default function ArticleDetailView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()

  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  // v-reveal（标题/摘要/作者行）
  const titleRef = useReveal<HTMLHeadingElement>()
  const summaryRef = useReveal<HTMLParagraphElement>({ delay: 120 })
  const authorRowRef = useReveal<HTMLDivElement>({ delay: 200 })

  // 详情：404 走「资源不存在」分支，其余错误展示重试；不重试 404
  const { data: detail, isPending, isError, error, refetch } = useQuery({
    queryKey: ['article', id],
    queryFn: ({ signal }) => articleApi.fetchArticleDetail(id!, signal),
    enabled: Boolean(id),
    retry: false,
  })

  // 相关推荐：详情就绪后再取，避免无效请求
  const { data: relatedData } = useQuery({
    queryKey: ['article', id, 'related'],
    queryFn: ({ signal }) => articleApi.fetchRelatedArticles(id!, 4, signal),
    enabled: Boolean(id) && Boolean(detail),
  })

  const article = useMemo(() => (detail ? toArticleItem(detail, t) : null), [detail, t])
  const related = useMemo(
    () => (relatedData ?? []).map(dto => toArticleItem(dto, t)),
    [relatedData, t],
  )

  const isNotFound = isError && error instanceof ApiError && error.status === 404

  // 文章不存在：保持原行为回文章中心
  useEffect(() => {
    if (isNotFound) navigate('/articles', { replace: true })
  }, [isNotFound, navigate])

  // 切换文章：重置互动状态并回到顶部（等价原 loadArticle 中的处理）
  useEffect(() => {
    setLiked(false)
    setBookmarked(false)
  }, [id])

  useEffect(() => {
    if (detail) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [detail])

  const goToList = () => navigate('/articles/list')
  const openRelated = (relatedId: number) => navigate(`/articles/${relatedId}`)

  if (!id || isNotFound) return null

  // 首次加载：详情版式骨架
  if (isPending) {
    return (
      <div className="article-detail-page">
        <ReadProgress />
        <div className="article-state">
          <Skeleton active title={{ width: '72%' }} paragraph={{ rows: 2 }} />
          <Skeleton active title={false} paragraph={{ rows: 8 }} />
        </div>
      </div>
    )
  }

  // 加载失败：提示 + 重试
  if (isError) {
    return (
      <div className="article-detail-page">
        <ReadProgress />
        <div className="article-state">
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

  if (!article) return null

  return (
    <div className="article-detail-page">
      <ReadProgress />

      {/* 顶部返回栏 · 紧贴 navbar */}
      <div className="top-bar">
        <button className="back-btn" onClick={goToList}>
          <ArrowLeftOutlined />
          <span>{t('common.back')}</span>
        </button>
        <span className="top-mark">{article.categoryLabel} · No.{String(article.id).padStart(2, '0')}</span>
      </div>

      {/* 标题区 · 纯排版 */}
      <header className="detail-header">
        <div className="header-eyebrow">
          <span className="eyebrow-cat">{article.categoryLabel}</span>
          <span className="eyebrow-sep">/</span>
          <span className="eyebrow-date">{article.date}</span>
        </div>
        <h1 ref={titleRef} className="detail-title">{article.title}</h1>
        <p ref={summaryRef} className="detail-summary">{article.summary}</p>

        {/* 作者 + meta · 编辑式定义行 */}
        <div ref={authorRowRef} className="author-row">
          <div className="author-block">
            {/* InitialAvatar 无 className 透传，包一层保持 .author-avatar 样式钩子 */}
            <div className="author-avatar">
              <InitialAvatar name={article.author} size={44} />
            </div>
            <div className="author-info">
              <span className="author-name">{article.author}</span>
              <span className="author-title">{article.authorTitle}</span>
            </div>
          </div>
          <div className="meta-divider"></div>
          <div className="meta-stats">
            <span className="meta-item"><ClockCircleOutlined />{article.readTime}</span>
            <span className="meta-item"><EyeOutlined />{formatViews(article.views)}</span>
          </div>
        </div>
      </header>

      {/* 双栏布局: 正文 + 右侧推荐 */}
      <div className="article-grid">
        {/* 主栏: 正文（含封面首图）+ 操作栏 */}
        <RichBody
          article={article}
          liked={liked}
          bookmarked={bookmarked}
          onToggleLike={() => setLiked(v => !v)}
          onToggleBookmark={() => setBookmarked(v => !v)}
        />

        {/* 右侧推荐栏 · sticky */}
        <RelatedSidebar related={related} onOpen={openRelated} />
      </div>

      {/* 评论区 */}
      <Comments />
    </div>
  )
}
