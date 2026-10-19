// 文章详情页（/articles/:id）· 页面层负责取数与跳转，正文/推荐/评论区拆至 RichBody/RelatedSidebar/Comments
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getArticleById, getRelatedArticles, type ArticleItem } from '@/api/mock/articles'
import { ArrowLeftOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons'
import ReadProgress from '@/components/ReadProgress'
import InitialAvatar from '@/components/InitialAvatar'
import { Comments, RelatedSidebar, RichBody } from '@/features/article'
import { useReveal } from '@/hooks/useReveal'
import { useI18n } from '@/i18n'
import './ArticleDetailView.css'

const formatViews = (n: number) => {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

export default function ArticleDetailView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()

  const [article, setArticle] = useState<ArticleItem | null>(null)
  const [related, setRelated] = useState<ArticleItem[]>([])
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  // v-reveal（标题/摘要/作者行）
  const titleRef = useReveal<HTMLHeadingElement>()
  const summaryRef = useReveal<HTMLParagraphElement>({ delay: 120 })
  const authorRowRef = useReveal<HTMLDivElement>({ delay: 200 })

  const loadArticle = (articleId: string) => {
    const data = getArticleById(articleId)
    if (!data) {
      // 原命名路由 articles → '/articles'
      navigate('/articles', { replace: true })
      return
    }
    setArticle(data)
    setRelated(getRelatedArticles(data, 4))
    setLiked(false)
    setBookmarked(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  // 原 onMounted + watch(route.params.id) 合并为 id 变化的 effect（挂载执行一次 + 参数变化重载）
  useEffect(() => {
    if (id) loadArticle(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const goToList = () => navigate('/articles/list')
  const openRelated = (relatedId: number) => navigate(`/articles/${relatedId}`)

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
