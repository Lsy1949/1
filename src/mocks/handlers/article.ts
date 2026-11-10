import { http } from 'msw'
import { mocked, ok, fail } from '../utils/response'
import { articlesFor, commentsFor, MOCK_COMMENT_AUTHOR } from '../data/article'
import { API_CODE } from '@/api/types'
import { DEFAULT_TENANT_ID } from '@/config/tenant/default'
import type { ArticleCommentCreateDTO, ArticleCommentDTO, ArticleDetailDTO, ArticleListItemDTO } from '@/api/types'

/** 详情 DTO → 列表 DTO（去掉正文，模拟真实后端的列表瘦身） */
function toListItem(article: ArticleDetailDTO): ArticleListItemDTO {
  const { content, ...rest } = article
  void content
  return rest
}

function findArticle(
  pool: ArticleDetailDTO[],
  id: string | readonly string[] | undefined,
): ArticleDetailDTO | undefined {
  const numId = Number(id)
  return Number.isNaN(numId) ? undefined : pool.find(a => a.id === numId)
}

function tenantOf(request: Request): string {
  return request.headers.get('X-Tenant-Id') ?? DEFAULT_TENANT_ID
}

/**
 * 文章接口（文案/分类标签不走接口，分类标签由前端 i18n 解析）。
 *
 * 【mock 即契约】按请求头 X-Tenant-Id 分发各租户文章（见 data/article.ts 尾部）；
 * 前端不传租户参数；跨租户访问他校文章 id → 404。
 * 语义说明：404 是「在当前租户数据池里找不到该 id」（WHERE tenant_id = 当前租户
 * AND id = ?），不是「按 id 段推断归属再拒绝」——id 段隔离（1-10/101+/201+）
 * 只是 mock 数据编排约定，后端无需感知。
 */
export const articleHandlers = [
  // 列表：category=all|daily|featured|psychology|career|stories，keyword 模糊匹配标题/摘要
  http.get(
    '/api/articles',
    mocked(({ request }) => {
      const url = new URL(request.url)
      const category = url.searchParams.get('category') ?? 'all'
      const keyword = (url.searchParams.get('keyword') ?? '').trim().toLowerCase()

      let list = articlesFor(tenantOf(request))
      if (category !== 'all') {
        // featured=精选推荐（featured 标记）；daily=每日精选（按发布日期取最近 5 篇，
        // 与 featured 数据集差异化，避免两个 tab 内容完全相同）
        list =
          category === 'featured'
            ? list.filter(a => a.featured)
            : category === 'daily'
              ? [...list].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5)
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

  // 相关推荐：同分类优先，不足时用其他分类补齐（均限本租户池内）
  http.get(
    '/api/articles/:id/related',
    mocked(({ params, request }) => {
      const pool = articlesFor(tenantOf(request))
      const article = findArticle(pool, params.id)
      if (!article) return fail(API_CODE.NOT_FOUND, '文章不存在')

      const limit = Number(new URL(request.url).searchParams.get('limit') ?? 4) || 4
      const sameCategory = pool.filter(a => a.id !== article.id && a.category === article.category)
      const others = pool.filter(a => a.id !== article.id && a.category !== article.category)

      return ok<ArticleListItemDTO[]>(
        [...sameCategory, ...others].slice(0, limit).map(toListItem),
      )
    }),
  ),

  // 详情：不存在时 404，由页面区分「资源不存在」与「加载失败」
  http.get(
    '/api/articles/:id',
    mocked(({ params, request }) => {
      const article = findArticle(articlesFor(tenantOf(request)), params.id)
      return article
        ? ok<ArticleDetailDTO>(article)
        : fail(API_CODE.NOT_FOUND, '文章不存在')
    }),
  ),

  // 评论列表：文章不存在 → 404；未产生过评论的文章返回空数组
  http.get(
    '/api/articles/:id/comments',
    mocked(({ params, request }) => {
      const pool = articlesFor(tenantOf(request))
      if (!findArticle(pool, params.id)) return fail(API_CODE.NOT_FOUND, '文章不存在')
      return ok<ArticleCommentDTO[]>(commentsFor(Number(params.id)))
    }),
  ),

  // 发表评论 / 楼中楼回复：body { content, commentId?, replyTo? }
  // commentId 存在即回复该楼层；replyTo 仅用于展示指向，缺省取楼层作者
  http.post(
    '/api/articles/:id/comments',
    mocked(async ({ params, request }) => {
      const pool = articlesFor(tenantOf(request))
      if (!findArticle(pool, params.id)) return fail(API_CODE.NOT_FOUND, '文章不存在')

      const body = (await request.json()) as ArticleCommentCreateDTO
      const content = (body.content ?? '').trim()
      if (!content) return fail(API_CODE.BAD_REQUEST, '评论内容不能为空')

      const store = commentsFor(Number(params.id))
      const floorId = body.commentId
      if (floorId != null) {
        // 楼中楼回复：平铺挂在目标楼层下，指向关系由 replyTo 表达
        const floor = store.find(c => c.id === Number(floorId))
        if (!floor) return fail(API_CODE.NOT_FOUND, '回复目标不存在')
        floor.replies.push({
          id: Date.now(),
          author: MOCK_COMMENT_AUTHOR,
          content,
          time: '刚刚',
          replyTo: body.replyTo?.trim() || floor.author,
        })
      } else {
        // 顶层评论：prepend（最新在前）
        store.unshift({ id: Date.now(), author: MOCK_COMMENT_AUTHOR, content, time: '刚刚', likes: 0, liked: false, replies: [] })
      }
      return ok<ArticleCommentDTO[]>(store)
    }),
  ),

  // 评论点赞切换：返回更新后的整个列表（mock 简化，前端直接替换缓存）
  http.post(
    '/api/articles/:id/comments/:commentId/like',
    mocked(({ params, request }) => {
      const pool = articlesFor(tenantOf(request))
      if (!findArticle(pool, params.id)) return fail(API_CODE.NOT_FOUND, '文章不存在')

      const store = commentsFor(Number(params.id))
      const cid = Number(params.commentId)
      const floor = store.find(c => c.id === cid)
      if (!floor) return fail(API_CODE.NOT_FOUND, '评论不存在')

      floor.liked = !floor.liked
      floor.likes += floor.liked ? 1 : -1
      return ok<ArticleCommentDTO[]>(store)
    }),
  ),
]
