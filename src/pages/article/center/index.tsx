// 文章中心页（/articles）· 统一入口：网格/列表双视图切换（?view=list），页面层负责过滤/视图/标题区状态
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Result, Skeleton } from 'antd'
import { AppstoreOutlined, SearchOutlined, UnorderedListOutlined } from '@ant-design/icons'
import PageContainer from '@/components/PageContainer'
import ReadProgress from '@/components/ReadProgress'
import { ArticleRowList, type RowItem } from '@/components/ArticleRowList'
import { CardGrid, CollectionGrid, SpotlightCard } from '@/features/article'
import type { ArticleItem } from '@/features/article'
import { useTranslation } from 'react-i18next'
import { toArticleItem, useArticleList } from '../articleQuery'
import './index.css'

const ARTICLE_LIMIT = 6

export default function ArticleCenterView() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation()
  const categoryParam = searchParams.get('category') || 'all'

  // 视图模式：URL 即状态（?view=list 为列表，其余为网格），与 ?category 一样可分享/回退
  const viewMode: 'grid' | 'list' = searchParams.get('view') === 'list' ? 'list' : 'grid'

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

  // ArticleItem → 通用行条目（栏目展示名用 categoryLabel），列表视图复用 ArticleRowList
  const rows = useMemo<RowItem[]>(
    () =>
      articles.map(a => ({
        id: a.id,
        category: a.categoryLabel,
        title: a.title,
        summary: a.summary,
        date: a.date,
        image: a.image
      })),
    [articles],
  )

  // watch(() => route.query.category) 等价：仅跟随 URL query 变化同步分类（Navbar 子菜单跳转）。
  // 依赖只留 categoryParam——若把 activeCategory 也放进依赖，本页点击切换分类会被此
  // effect 立即回写成 URL 旧参数（默认 all），表现为「点击无反应」
  const prevParamRef = useRef(categoryParam)
  useEffect(() => {
    if (prevParamRef.current === categoryParam) return
    prevParamRef.current = categoryParam
    setActiveCategory(categoryParam || 'all')
    setSearchQuery('')
    setShowAllArticles(false)
  }, [categoryParam])

  // 分类 tabs：00 全部文章（全量 + 焦点/合集）+ 5 个内容频道，数据集互斥不重叠。
  // （旧「精选推荐 key=all」与全部文章共享数据导致激活冲突，已改为 featured 真精选数据）
  const categories = useMemo(() => [
    { label: t('article.grid.all'), key: 'all' },
    { label: t('article.categories.featured'), key: 'featured' },
    { label: t('article.categories.daily'), key: 'daily' },
    { label: t('article.categories.psychology'), key: 'psychology' },
    { label: t('article.categories.career'), key: 'career' },
    { label: t('article.categories.stories'), key: 'stories' }
  ], [t])

  // 文章详情 · 跳转独立详情页（CardGrid/ArticleRowList 的行点击都收敛到此）
  const openArticle = (article: { id: number }) => {
    navigate(`/articles/${article.id}`)
  }

  /** 视图切换：直接写 URL query；网格为默认视图（无 ?view）。
   *  activeCategory 始终回写——防止 searchParams 闭包过期时丢 category 参数
   *  （回写会触发 URL 同步 effect，param 未变化时 prevParamRef 会正确跳过重置） */
  function setViewMode(mode: 'grid' | 'list') {
    const next = new URLSearchParams(searchParams)
    if (activeCategory !== 'all') next.set('category', activeCategory)
    else next.delete('category')
    if (mode === 'list') next.set('view', 'list')
    else next.delete('view')
    setSearchParams(next, { replace: true })
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
    featured: { title: t('article.intro.featured.title'), eyebrow: '— Featured Picks', sub: t('article.intro.featured.sub') },
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

  /** 「查看全部」不再跳独立列表页：切换为列表视图（全部文章已并入本页双视图） */
  function goToAllArticles() {
    setViewMode('list')
  }

  function setCategory(key: string) {
    setActiveCategory(key)
    setSearchQuery('')
    setShowAllArticles(false)
    // URL 即状态：同步 category 参数（all 清除参数），刷新/分享后与 UI 一致
    const next = new URLSearchParams(searchParams)
    if (key === 'all') next.delete('category')
    else next.set('category', key)
    setSearchParams(next, { replace: true })
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
      <PageContainer className="page-intro">
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
      </PageContainer>

      {/* 导读栏 · sticky 紧贴 navbar · 6 个编号 tab（00 全部文章起）+ 视图切换（flex 单行布局） */}
      <section className="discovery-ribbon">
        <PageContainer className="ribbon-container">
          <div className="ribbon-scroll">
            {categories.map((cat, i) => (
              <div
                key={cat.key}
                className={`ribbon-item${activeCategory === cat.key ? ' active' : ''}`}
                onClick={() => setCategory(cat.key)}
              >
                <span className="item-num">{String(i).padStart(2, '0')}</span>
                <span className="item-label">{cat.label}</span>
              </div>
            ))}
          </div>

          {/* 视图切换 · 连体按钮组 */}
          <div className="view-toggle" role="group" aria-label={t('article.view.grid')}>
            <button
              className={`view-btn${viewMode === 'grid' ? ' active' : ''}`}
              onClick={() => setViewMode('grid')}
              title={t('article.view.grid')}
              aria-label={t('article.view.grid')}
            >
              <AppstoreOutlined />
            </button>
            <button
              className={`view-btn${viewMode === 'list' ? ' active' : ''}`}
              onClick={() => setViewMode('list')}
              title={t('article.view.list')}
              aria-label={t('article.view.list')}
            >
              <UnorderedListOutlined />
            </button>
          </div>
        </PageContainer>
      </section>

      <PageContainer className="main-content">
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

        {viewMode === 'list' ? (
          /* 列表视图：与首页「最新动态」同格式的编辑式行列表（展示全部匹配文章） */
          <div className="article-list-content">
            <ArticleRowList articles={rows} onOpen={openArticle} />
          </div>
        ) : (
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
        )}
      </PageContainer>
    </div>
  )
}
