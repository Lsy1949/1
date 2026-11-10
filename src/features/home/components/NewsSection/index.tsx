/**
 * 【business】NewsSection —— 最新动态区块（编辑式行列表）
 * - 数据来自后端（MSW mock）：GET /api/articles?category=daily 的最新 4 篇，
 *   与文章中心「每日精选」同一数据源；分类标签按 key 走 i18n
 * - 行渲染复用通用组件 ArticleRowList
 * - 阅读行为经 onRead 回调上抛页面
 * - scroll-reveal 为页面协议类（HomePageView IntersectionObserver 驱动），经 reveal 透传
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { articleApi } from '@/api'
import PageContainer from '@/components/PageContainer'
import { ArticleRowList, type RowItem } from '@/components/ArticleRowList'
import styles from './NewsSection.module.css'

export interface NewsSectionProps {
  onRead: (id: number) => void
}

/** 区块展示条数（与设计稿四行一致） */
const NEWS_LIMIT = 4

export function NewsSection({ onRead }: NewsSectionProps) {
  const { t } = useTranslation()

  const { data } = useQuery({
    queryKey: ['home', 'news'],
    queryFn: ({ signal }) => articleApi.fetchArticleList({ category: 'daily' }, signal),
  })

  // DTO → 行视图模型：分类标签由 i18n 解析（接口只下发 key）
  const allNews = useMemo<RowItem[]>(
    () =>
      (data ?? []).slice(0, NEWS_LIMIT).map(dto => ({
        id: dto.id,
        category: t(`article.categories.${dto.category}`),
        title: dto.title,
        summary: dto.summary,
        date: dto.date,
        image: dto.image,
      })),
    [data, t],
  )

  return (
    <section id="news" className={styles.newsSection}>
      <div className={styles.techBgPattern}></div>
      {/* PageContainer 透传 relative z-10（全局工具类）：压住 .techBgPattern 背景装饰 */}
      <PageContainer className="relative z-10">
        <div className={`${styles.sectionHeader} scroll-reveal`}>
          <span className={styles.sectionBadge}>{t('home.news.badge')}</span>
          <h2>{t('home.news.title')}</h2>
          <p className={styles.sectionSubtitle}>{t('home.news.subtitle')}</p>
        </div>
        {/* 数据就绪后再渲染行：避免请求期间闪现「暂无内容」空态 */}
        {data && (
          <ArticleRowList articles={allNews} onOpen={(news) => onRead(news.id)} reveal />
        )}
      </PageContainer>
    </section>
  )
}

export default NewsSection
