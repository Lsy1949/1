import { get, post } from '../request'
import type {
  ArticleCommentCreateDTO,
  ArticleCommentDTO,
  ArticleDetailDTO,
  ArticleListItemDTO,
  ArticleListQuery,
} from '../types'

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
  return get<ArticleListItemDTO[]>('articles', {
    params: { category: query.category ?? 'all', keyword: query.keyword ?? '' },
    signal,
  })
}

/** 文章详情（不存在时后端返回 404） */
export function fetchArticleDetail(
  id: number | string,
  signal?: AbortSignal,
): Promise<ArticleDetailDTO> {
  return get<ArticleDetailDTO>(`articles/${id}`, { signal })
}

/** 相关推荐（同分类优先，数量由 limit 控制） */
export function fetchRelatedArticles(
  id: number | string,
  limit = 4,
  signal?: AbortSignal,
): Promise<ArticleListItemDTO[]> {
  return get<ArticleListItemDTO[]>(`articles/${id}/related`, {
    params: { limit },
    signal,
  })
}

/** 文章评论列表（楼层 + 楼中楼） */
export function fetchArticleComments(
  id: number | string,
  signal?: AbortSignal,
): Promise<ArticleCommentDTO[]> {
  return get<ArticleCommentDTO[]>(`articles/${id}/comments`, { signal })
}

/** 发表评论 / 楼中楼回复（replyTo 存在即回复），返回最新评论列表 */
export function addArticleComment(
  id: number | string,
  input: ArticleCommentCreateDTO,
): Promise<ArticleCommentDTO[]> {
  return post<ArticleCommentDTO[]>(`articles/${id}/comments`, input)
}

/** 评论点赞切换，返回更新后的评论列表 */
export function toggleArticleCommentLike(
  id: number | string,
  commentId: number,
): Promise<ArticleCommentDTO[]> {
  return post<ArticleCommentDTO[]>(`articles/${id}/comments/${commentId}/like`, {})
}
