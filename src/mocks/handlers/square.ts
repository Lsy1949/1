import { http } from 'msw'
import { mocked, ok, fail } from '../utils/response'
import {
  createComment,
  createFeed,
  findFeed,
  getSquareInfo,
  listComments,
  toggleCommentLike,
  toggleFeedLike,
} from '../data/square'
import { API_CODE } from '@/api/types'
import type {
  SquareCommentCreateDTO,
  SquareCommentDTO,
  SquareCommentLikeDTO,
  SquareCreateDTO,
  SquareFeedDTO,
  SquareInfoDTO,
  SquareLikeDTO,
} from '@/api/types'

/**
 * 广场接口。
 *
 * 点赞与发布都会真实改写 mock 存储（`mock:square-feed`）并持久化。
 */
export const squareHandlers = [
  http.get(
    '/api/square/info',
    mocked(() => ok<SquareInfoDTO>(getSquareInfo())),
  ),

  http.get(
    '/api/square/feed/:id',
    mocked(({ params }) => {
      const feed = findFeed(Number(params.id))
      return feed ? ok<SquareFeedDTO>(feed) : fail(API_CODE.NOT_FOUND, '动态不存在')
    }),
  ),

  http.post(
    '/api/square/feed/:id/like',
    mocked(({ params }) => {
      const result = toggleFeedLike(Number(params.id))
      return result ? ok<SquareLikeDTO>(result) : fail(API_CODE.NOT_FOUND, '动态不存在')
    }),
  ),

  http.post(
    '/api/square/feed',
    mocked(async ({ request }) => {
      const body = (await request.json()) as SquareCreateDTO
      if (!body?.content?.trim() && !body?.photos?.length) {
        return fail(API_CODE.BAD_REQUEST, '请填写内容或上传图片')
      }
      return ok<SquareFeedDTO>(createFeed(body))
    }),
  ),

  http.get(
    '/api/square/feed/:id/comments',
    mocked(({ params }) => {
      const feedId = Number(params.id)
      if (!findFeed(feedId)) return fail(API_CODE.NOT_FOUND, '动态不存在')
      return ok<SquareCommentDTO[]>(listComments(feedId))
    }),
  ),

  http.post(
    '/api/square/feed/:id/comments',
    mocked(async ({ request, params }) => {
      const body = (await request.json()) as SquareCommentCreateDTO
      if (!body?.content?.trim()) return fail(API_CODE.BAD_REQUEST, '评论内容不能为空')

      const created = createComment(Number(params.id), {
        content: body.content.trim(),
        parentId: body.parentId,
      })
      return created
        ? ok<SquareCommentDTO>(created)
        : fail(API_CODE.NOT_FOUND, '动态不存在')
    }),
  ),

  http.post(
    '/api/square/comments/:id/like',
    mocked(({ params }) => {
      const result = toggleCommentLike(Number(params.id))
      return result
        ? ok<SquareCommentLikeDTO>(result)
        : fail(API_CODE.NOT_FOUND, '评论不存在')
    }),
  ),
]
