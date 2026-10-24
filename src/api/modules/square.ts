import { get, post } from '../request'
import type {
  SquareCommentCreateDTO,
  SquareCommentDTO,
  SquareCommentLikeDTO,
  SquareCreateDTO,
  SquareFeedDTO,
  SquareInfoDTO,
  SquareLikeDTO,
} from '../types'

/**
 * 广场模块 API。
 *
 * 列表数据聚合为 `info`；点赞、发布为写操作。
 */

/** 广场列表只读数据（feed / members / topics / 在线与今日新增） */
export function fetchSquareInfo(signal?: AbortSignal): Promise<SquareInfoDTO> {
  return get<SquareInfoDTO>('square/info', { signal })
}

/** 动态详情 */
export function fetchSquareFeed(
  id: number | string,
  signal?: AbortSignal,
): Promise<SquareFeedDTO> {
  return get<SquareFeedDTO>(`square/feed/${id}`, { signal })
}

/** 点赞 / 取消点赞（返回最新状态） */
export function toggleLike(id: number): Promise<SquareLikeDTO> {
  return post<SquareLikeDTO>(`square/feed/${id}/like`)
}

/** 发布动态 */
export function createFeed(input: SquareCreateDTO): Promise<SquareFeedDTO> {
  return post<SquareFeedDTO>('square/feed', input)
}

/** 评论列表（时间倒序） */
export function fetchComments(
  feedId: number | string,
  signal?: AbortSignal,
): Promise<SquareCommentDTO[]> {
  return get<SquareCommentDTO[]>(`square/feed/${feedId}/comments`, { signal })
}

/** 发布评论（parentId 表示回复某条评论） */
export function createComment(
  feedId: number | string,
  input: SquareCommentCreateDTO,
): Promise<SquareCommentDTO> {
  return post<SquareCommentDTO>(`square/feed/${feedId}/comments`, input)
}

/** 评论点赞 / 取消点赞 */
export function toggleCommentLike(id: number): Promise<SquareCommentLikeDTO> {
  return post<SquareCommentLikeDTO>(`square/comments/${id}/like`)
}
