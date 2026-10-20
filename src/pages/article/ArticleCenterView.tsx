// 文章中心页（/articles）· 页面层负责过滤/焦点/标题区状态，内容区拆至 Spotlight/CardGrid/CollectionGrid
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Result, Skeleton } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import ReadProgress from '@/components/ReadProgress'
import { CardGrid, CollectionGrid, SpotlightCard } from '@/features/article'
import type { ArticleItem } from '@/features/article'
import { useI18n } from '@/i18n'
import { toArticleItem, useArticleList } from './articleQuery'
import './ArticleCenterView.css'

const ARTICLE_LIMIT = 6

export default function ArticleCenterView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useI18n()
  const categoryParam = searchParams.get('category') || 'all'

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(() => searchParams.get('category') || 'all')
  const [showAllArticles, setShowAllArticles] = useState(false)

  // 服务端过滤（分类即时生效 / 关键词防抖），加载与失败态在此统一收敛
  const { data, isPending, isError, refetch } = useArticleList(activeCategory, searchQuery)

  // 接口结构 + i18n → 组件视图模型（categoryLabel 由 key 解析，接口不下发文案）
  const articles = useMemo<ArticleItem[]>(
    () => (data ?? []).map(dto => toArticleItem(dto, t)),
    [data, t],
  )

  // watch(() => route.query.category) 等价：跟随 URL query 同步分类切换（Navbar 子菜单跳转）
  useEffect(() => {
    const next = categoryParam || 'all'
    if (next !== activeCategory) {
      setActiveCategory(next)
      setSearchQuery('')
      setShowAllArticles(false)
    }
  }, [categoryParam, activeCategory])

  // 文章分类数据（本页模板未渲染 icon，保留与列表页一致的 key）
  const categories = useMemo(() => [
    { label: t('article.categories.all'), key: 'all' },
    { label: t('article.categories.daily'), key: 'daily' },
    { label: t('article.categories.featured'), key: 'featured' },
    { label: t('article.categories.psychology'), key: 'psychology' },
    { label: t('article.categories.career'), key: 'career' },
    { label: t('article.categories.stories'), key: 'stories' }
  ], [t])

  // 文章详情 · 跳转独立详情页
  const openArticle = (article: ArticleItem) => {
    navigate(`/articles/${article.id}`)
  }

  // 焦点文章（取最新的一篇 featured；数据为空时为 undefined，渲染处判空）
  const spotlightArticle = useMemo(
    () => articles.find(a => a.featured),
    [articles]
  )

  // 分类专属标题区数据
  const categoryIntros = useMemo<Record<string, { title: string; eyebrow: string; sub: string }>>(() => ({
    all: { title: t('article.intro.all.title'), eyebrow: '— Articles &amp; Stories', sub: t('article.intro.all.sub') },
    daily: { title: t('article.intro.daily.title'), eyebrow: '— Daily Picks', sub: t('article.intro.daily.sub') },
    featured: { title: t('article.intro.featured.title'), eyebrow: '— Featured Stories', sub: t('article.intro.featured.sub') },
    psychology: { title: t('article.intro.psychology.title'), eyebrow: '— Psychology', sub: t('article.intro.psychology.sub') },
    career: { title: t('article.intro.career.title'), eyebrow: '— Career', sub: t('article.intro.career.sub') },
    stories: { title: t('article.intro.stories.title'), eyebrow: '— Growth Stories', sub: t('article.intro.stories.sub') }
  }), [t])

  const introData = useMemo(() => {
    const intro = categoryIntros[activeCategory] || categoryIntros.all
    const stats = activeCategory === 'all'
      ? [
          { num: '120', sup: '+', label: t('article.stats.articles') },
          { num: '06', sup: '', label: t('article.stats.categories') },
          { num: '24h', sup: '', label: t('article.stats.update') }
        ]
      : [
          { num: String(articles.length).padStart(2, '0'), sup: '', label: t('article.stats.count') },
          { num: '06', sup: '', label: t('article.stats.categories') },
          { num: '24h', sup: '', label: t('article.stats.update') }
        ]
    return { ...intro, stats }
  }, [categoryIntros, activeCategory, articles, t])

  // 最终展示的文章（处理"查看全部"逻辑）
  const displayedArticles = useMemo(() => {
    if (showAllArticles || activeCategory !== 'all' || searchQuery) {
      return articles
    }
    return articles.slice(0, ARTICLE_LIMIT)
  }, [showAllArticles, activeCategory, searchQuery, articles])

  const hasMoreArticles =
    articles.length > ARTICLE_LIMIT && !showAllArticles && activeCategory === 'all' && !searchQuery

  function goToAllArticles() {
    navigate('/articles/list')
  }

  function setCategory(key: string) {
    setActiveCategory(key)
    setSearchQuery('')
    setShowAllArticles(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 专题合集点击 → 以合集标题作为搜索词
  const onCollectionSelect = (title: string) => {
    setSearchQuery(title)
  }

  // 首次加载：编辑式骨架占位（保持版式高度，避免数据到位时跳动）
  if (isPending) {
    return (
      <div className="article-center">
        <ReadProgress />
        <div className="article-state">
          <Skeleton active title={{ width: '52%' }} paragraph={{ rows: 2 }} />
          <Skeleton active title={{ width: '32%' }} paragraph={{ rows: 6 }} />
        </div>
      </div>
    )
  }

  // 加载失败：提示 + 重试
  if (isError) {
    return (
      <div className="article-center">
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

  return (
    <div className="article-center">
      <ReadProgress />
      {/* 编辑式标题区 · 纯排版无卡片 · 随分类切换 */}
      <div className="page-intro">
        <div className="intro-container">
          <div className="intro-left">
            <span className="intro-eyebrow">{introData.eyebrow}</span>
            {/* 标题含语言包注入的 <em>/<br> 排版标记（v-html → dangerouslySetInnerHTML，静态可信文案） */}
            <h1 className="intro-title" dangerouslySetInnerHTML={{ __html: introData.title }}></h1>
            <p className="intro-sub">{introData.sub}</p>
          </div>
          <div className="intro-right">
            {introData.stats.map(stat => (
              <div key={stat.label} className="intro-stat">
                <span className="stat-num">{stat.num}{stat.sup && <sup>{stat.sup}</sup>}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 导读栏 · sticky 紧贴 navbar */}
      <section className="discovery-ribbon">
        <div className="ribbon-container">
          <div className="ribbon-scroll">
            {categories.map((cat, i) => (
              <div
                key={cat.key}
                className={`ribbon-item${activeCategory === cat.key ? ' active' : ''}`}
                onClick={() => setCategory(cat.key)}
              >
                <span className="item-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="item-label">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="main-content">
        {/* 极简搜索 */}
        <div className="search-wrapper">
          <div className="search-box">
            <SearchOutlined className="search-icon" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              type="text"
              placeholder={t('article.search')}
              className="search-input"
            />
          </div>
        </div>

        <div className="article-modules">
          {/* 今日焦点（无数据时不渲染，空态交由 CardGrid 的 Empty 呈现） */}
          {activeCategory === 'all' && !searchQuery && spotlightArticle && (
            <SpotlightCard
              article={spotlightArticle}
              onOpen={openArticle}
            />
          )}

          {/* 文章网格 */}
          <CardGrid
            articles={displayedArticles}
            title={categories.find(c => c.key === activeCategory)?.label || t('article.grid.all')}
            count={articles.length}
            showViewAll={hasMoreArticles}
            onOpen={openArticle}
            onViewAll={goToAllArticles}
          />

          {/* 专题合集 */}
          {activeCategory === 'all' && !searchQuery && (
            <CollectionGrid
              onSelect={onCollectionSelect}
              onViewAll={goToAllArticles}
            />
          )}
        </div>
      </div>
    </div>
  )
}
