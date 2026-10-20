/**
 * 文章域页面共享：列表查询 hook + DTO → 组件视图模型映射。
 *
 * 页面层职责：
 *  - 服务端过滤（category / keyword 交给接口，搜索防抖 300ms）
 *  - 分类标签按 key 走 i18n（接口不下发 categoryLabel）
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { articleApi } from '@/api'
import type { ArticleCategoryKey, ArticleListItemDTO } from '@/api'
import type { ArticleItem } from '@/features/article'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

type Translate = (key: string, params?: Record<string, unknown>) => string

/** 文章列表查询：分类即时生效，关键词防抖；切换时保留上一页数据避免闪屏 */
export function useArticleList(category: string, keyword: string) {
  const debouncedKeyword = useDebouncedValue(keyword.trim())

  return useQuery({
    queryKey: ['articles', { category, keyword: debouncedKeyword }],
    queryFn: ({ signal }) =>
      articleApi.fetchArticleList(
        {
          category: category as ArticleCategoryKey | 'all',
          keyword: debouncedKeyword || undefined,
        },
        signal,
      ),
    placeholderData: keepPreviousData,
  })
}

/** DTO → 组件视图模型：补上由 i18n 解析的分类标签 */
export function toArticleItem(dto: ArticleListItemDTO, t: Translate): ArticleItem {
  return { ...dto, categoryLabel: t(`article.categories.${dto.category}`) }
}
