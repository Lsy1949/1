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
import type { ComponentType } from 'react'
import ReadProgress from '@/components/ReadProgress'
import { RowList } from '@/features/article'
import { articles, type ArticleItem } from '@/api/mock/articles'
import { useI18n } from '@/i18n'
import './ArticleListView.css'

interface CategoryItem {
  label: string
  key: string
  Icon: ComponentType<{ className?: string }>
}

export default function ArticleListView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t, locale } = useI18n()
  const categoryParam = searchParams.get('category') || 'all'

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(() => searchParams.get('category') || 'all')

  // 文章分类数据（EP 图标 → AntD 图标映射）
  const categories = useMemo<CategoryItem[]>(() => [
    { label: t('article.categories.all'), key: 'all', Icon: AppstoreOutlined },
    { label: t('article.categories.daily'), key: 'daily', Icon: StarOutlined },
    { label: t('article.categories.featured'), key: 'featured', Icon: FireOutlined },
    { label: t('article.categories.psychology'), key: 'psychology', Icon: ReadOutlined },
    { label: t('article.categories.career'), key: 'career', Icon: ClockCircleOutlined },
    { label: t('article.categories.stories'), key: 'stories', Icon: EyeOutlined }
  ], [t, locale])

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

  // 过滤文章
  const filteredArticles = useMemo(() => {
    let result = articles
    if (activeCategory !== 'all') {
      if (activeCategory === 'daily' || activeCategory === 'featured') {
        result = result.filter(a => a.featured)
      } else {
        result = result.filter(a => a.category === activeCategory)
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q))
    }
    return result
  }, [activeCategory, searchQuery])

  const setCategory = (key: string) => {
    setActiveCategory(key)
    setSearchQuery('')
  }

  const goBack = () => {
    navigate('/articles')
  }

  return (
    <div className="article-list-page">
      <ReadProgress />
      {/* 纯排版标题区 */}
      <div className="page-intro">
        <div className="intro-container">
          <div className="intro-left">
            <span className="intro-eyebrow">— Articles &amp; Stories</span>
            <h1 className="intro-title">{categories.find(c => c.key === activeCategory)?.label || '全部文章'}</h1>
          </div>
          <div className="intro-right">
            <span className="intro-count">{String(filteredArticles.length).padStart(2, '0')}</span>
            <span className="intro-count-label">篇 / 文章</span>
          </div>
        </div>
      </div>

      {/* Section 1: Navigation Ribbon */}
      <section className="discovery-ribbon">
        <div className="ribbon-container">
          <button className="back-link" onClick={goBack}>
            <ArrowLeftOutlined />
            <span>返回中心</span>
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
              placeholder="搜索文章标题或摘要..."
              className="search-input"
            />
          </div>
        </div>

        {/* 文章列表：横向编辑式 */}
        <div className="article-list-content">
          <RowList articles={filteredArticles} onOpen={openArticle} />
        </div>
      </div>
    </div>
  )
}
