// 文章列表页（/articles/list）· 页面层负责过滤状态与跳转，内容区拆至 RowList
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FireOutlined,
  ReadOutlined,
  SearchOutlined,
  StarOutlined
} from '@ant-design/icons'
import { Button, Result, Skeleton } from 'antd'
import type { ComponentType } from 'react'
import ReadProgress from '@/components/ReadProgress'
import { RowList } from '@/features/article'
import type { ArticleItem } from '@/features/article'
import { useI18n } from '@/i18n'
import { toArticleItem, useArticleList } from './articleQuery'
import './ArticleListView.css'

interface CategoryItem {
  label: string
  key: string
  Icon: ComponentType<{ className?: string }>
}

export default function ArticleListView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useI18n()
  const categoryParam = searchParams.get('category') || 'all'

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(() => searchParams.get('category') || 'all')

  // 服务端过滤：分类即时生效，关键词防抖 300ms
  const { data, isPending, isError, refetch } = useArticleList(activeCategory, searchQuery)
  const articles = useMemo<ArticleItem[]>(
    () => (data ?? []).map(dto => toArticleItem(dto, t)),
    [data, t],
  )

  // 文章分类数据（EP 图标 → AntD 图标映射）
  const categories = useMemo<CategoryItem[]>(() => [
    { label: t('article.categories.all'), key: 'all', Icon: AppstoreOutlined },
    { label: t('article.categories.daily'), key: 'daily', Icon: StarOutlined },
    { label: t('article.categories.featured'), key: 'featured', Icon: FireOutlined },
    { label: t('article.categories.psychology'), key: 'psychology', Icon: ReadOutlined },
    { label: t('article.categories.career'), key: 'career', Icon: ClockCircleOutlined },
    { label: t('article.categories.stories'), key: 'stories', Icon: EyeOutlined }
  ], [t])

  // watch(() => route.query.category) 等价：同步分类切换（Navbar 子菜单跳转）
  useEffect(() => {
    const next = categoryParam || 'all'
    if (next !== activeCategory) {
      setActiveCategory(next)
      setSearchQuery('')
    }
  }, [categoryParam, activeCategory])

  // 文章详情 · 跳转独立详情页
  const openArticle = (article: ArticleItem) => {
    navigate(`/articles/${article.id}`)
  }

  const setCategory = (key: string) => {
    setActiveCategory(key)
    setSearchQuery('')
  }

  const goBack = () => {
    navigate('/articles')
  }

  // 首次加载：行列表骨架
  if (isPending) {
    return (
      <div className="article-list-page">
        <ReadProgress />
        <div className="article-state">
          <Skeleton active title={{ width: '45%' }} paragraph={{ rows: 2 }} />
          <Skeleton active title={false} paragraph={{ rows: 8 }} />
        </div>
      </div>
    )
  }

  // 加载失败：提示 + 重试
  if (isError) {
    return (
      <div className="article-list-page">
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
    <div className="article-list-page">
      <ReadProgress />
      {/* 纯排版标题区 */}
      <div className="page-intro">
        <div className="intro-container">
          <div className="intro-left">
            <span className="intro-eyebrow">— Articles &amp; Stories</span>
            <h1 className="intro-title">{categories.find(c => c.key === activeCategory)?.label || t('article.categories.all')}</h1>
          </div>
          <div className="intro-right">
            <span className="intro-count">{String(articles.length).padStart(2, '0')}</span>
            <span className="intro-count-label">{t('article.stats.count')}</span>
          </div>
        </div>
      </div>

      {/* Section 1: Navigation Ribbon */}
      <section className="discovery-ribbon">
        <div className="ribbon-container">
          <button className="back-link" onClick={goBack}>
            <ArrowLeftOutlined />
            <span>{t('common.back')}</span>
          </button>
          <div className="ribbon-scroll">
            {categories.map(cat => (
              <div
                key={cat.key}
                className={`ribbon-item${activeCategory === cat.key ? ' active' : ''}`}
                onClick={() => setCategory(cat.key)}
              >
                <cat.Icon className="item-icon" />
                <span className="item-label">{cat.label}</span>
                <div className="item-indicator"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="main-content">
        {/* 搜索栏 */}
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

        {/* 文章列表：横向编辑式 */}
        <div className="article-list-content">
          <RowList articles={articles} onOpen={openArticle} />
        </div>
      </div>
    </div>
  )
}
