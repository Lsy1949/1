import { get } from '../request'
import type { ArticleDetailDTO, ArticleListItemDTO, ArticleListQuery } from '../types'

/**
 * 文章模块 API。
 *
 * 列表过滤（category / keyword）由后端完成，前端只传参；
 * 分类标签不走接口，页面按 category 拼 i18n 键。
 */

/** 文章列表 */
export function fetchArticleList(
  query: ArticleListQuery = {},
  signal?: AbortSignal,
): Promise<ArticleListItemDTO[]> {
  return get<ArticleListItemDTO[]>('/api/articles', {
    params: { category: query.category ?? 'all', keyword: query.keyword ?? '' },
    signal,
  })
}

/** 文章详情（不存在时后端返回 404） */
export function fetchArticleDetail(
  id: number | string,
  signal?: AbortSignal,
): Promise<ArticleDetailDTO> {
  return get<ArticleDetailDTO>(`/api/articles/${id}`, { signal })
}

/** 相关推荐（同分类优先，数量由 limit 控制） */
export function fetchRelatedArticles(
  id: number | string,
  limit = 4,
  signal?: AbortSignal,
): Promise<ArticleListItemDTO[]> {
  return get<ArticleListItemDTO[]>(`/api/articles/${id}/related`, {
    params: { limit },
    signal,
  })
}
