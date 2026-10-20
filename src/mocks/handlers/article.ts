import { http } from 'msw'
import { mocked, ok, fail } from '../utils/response'
import { ARTICLES } from '../data/article'
import { API_CODE } from '@/api/types'
import type { ArticleDetailDTO, ArticleListItemDTO } from '@/api/types'

/** 详情 DTO → 列表 DTO（去掉正文，模拟真实后端的列表瘦身） */
function toListItem(article: ArticleDetailDTO): ArticleListItemDTO {
  const { content, ...rest } = article
  void content
  return rest
}

function findArticle(id: string | readonly string[] | undefined): ArticleDetailDTO | undefined {
  const numId = Number(id)
  return Number.isNaN(numId) ? undefined : ARTICLES.find(a => a.id === numId)
}

/**
 * 文章接口（文案/分类标签不走接口，分类标签由前端 i18n 解析）。
 *
 * 过滤在 mock 内完成，模拟真实后端的服务端筛选；
 * 延迟与错误注入统一由 mocked() 提供（300ms / VITE_MOCK_ERROR）。
 */
export const articleHandlers = [
  // 列表：category=all|daily|featured|psychology|career|stories，keyword 模糊匹配标题/摘要
  http.get(
    '/api/articles',
    mocked(({ request }) => {
      const url = new URL(request.url)
      const category = url.searchParams.get('category') ?? 'all'
      const keyword = (url.searchParams.get('keyword') ?? '').trim().toLowerCase()

      let list = ARTICLES
      if (category !== 'all') {
        list =
          category === 'daily' || category === 'featured'
            ? list.filter(a => a.featured)
            : list.filter(a => a.category === category)
      }
      if (keyword) {
        list = list.filter(
          a =>
            a.title.toLowerCase().includes(keyword) ||
            a.summary.toLowerCase().includes(keyword),
        )
      }

      return ok<ArticleListItemDTO[]>(list.map(toListItem))
    }),
  ),

  // 相关推荐：同分类优先，不足时用其他分类补齐
  http.get(
    '/api/articles/:id/related',
    mocked(({ params, request }) => {
      const article = findArticle(params.id)
      if (!article) return fail(API_CODE.NOT_FOUND, '文章不存在')

      const limit = Number(new URL(request.url).searchParams.get('limit') ?? 4) || 4
      const sameCategory = ARTICLES.filter(a => a.id !== article.id && a.category === article.category)
      const others = ARTICLES.filter(a => a.id !== article.id && a.category !== article.category)

      return ok<ArticleListItemDTO[]>(
        [...sameCategory, ...others].slice(0, limit).map(toListItem),
      )
    }),
  ),

  // 详情：不存在时 404，由页面区分「资源不存在」与「加载失败」
  http.get(
    '/api/articles/:id',
    mocked(({ params }) => {
      const article = findArticle(params.id)
      return article
        ? ok<ArticleDetailDTO>(article)
        : fail(API_CODE.NOT_FOUND, '文章不存在')
    }),
  ),
]
