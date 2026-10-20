/**
 * 广场（Square）domain DTO。
 *
 * 建模原则（同前序批次）：
 *  - 只下发结构与业务内容；心情 emoji 等 UI 映射、文案全部在前端。
 *  - 点赞状态由后端记录（`liked`），前端只做乐观更新与最终对齐。
 */

export type SquareFeedType = 'moment' | 'capsule'
export type SquareMood = 'happy' | 'excited' | 'calm' | 'sad' | 'hopeful'

/** 动态 */
export interface SquareFeedDTO {
  id: number
  type: SquareFeedType
  author: string
  isAnonymous: boolean
  mood: SquareMood
  content: string
  photos: string[]
  likes: number
  /** 当前用户是否已点赞 */
  liked: boolean
  commentCount: number
  /** 相对时间文案（业务内容，接口直出） */
  createdAt: string
  topics: string[]
  isPinned?: boolean
  isHot?: boolean
  allowComment?: boolean
}

/** 活跃成员 */
export interface SquareMemberDTO {
  name: string
  isAnonymous?: boolean
}

/** 热门话题 */
export interface SquareTopicDTO {
  tag: string
  count: number
}

/** `GET /api/square/info` —— 广场列表页全部只读数据 */
export interface SquareInfoDTO {
  feedItems: SquareFeedDTO[]
  members: SquareMemberDTO[]
  topics: SquareTopicDTO[]
  onlineCount: number
  todayNewCount: number
}

/** `POST /api/square/feed/:id/like` 返回 */
export interface SquareLikeDTO {
  id: number
  liked: boolean
  likes: number
}

/** `POST /api/square/feed` 请求体 */
export interface SquareCreateDTO {
  mood: SquareMood
  content: string
  topics: string[]
  /** 图片 data URL */
  photos: string[]
  isAnonymous: boolean
  allowComment: boolean
}

/** 评论 */
export interface SquareCommentDTO {
  id: number
  feedId: number
  /** 回复目标评论 id；顶层评论为空 */
  parentId?: number
  author: string
  isAnonymous: boolean
  content: string
  likes: number
  liked: boolean
  /** 相对时间文案（业务内容，接口直出） */
  createdAt: string
}

/** `POST /api/square/feed/:id/comments` 请求体 */
export interface SquareCommentCreateDTO {
  content: string
  /** 回复目标评论 id；顶层评论不传 */
  parentId?: number
}

/** `POST /api/square/comments/:id/like` 返回 */
export interface SquareCommentLikeDTO {
  id: number
  liked: boolean
  likes: number
}
