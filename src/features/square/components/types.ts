// 广场列表页类型定义（业务层视图模型，结构对齐 API DTO）

export type SquareFeedType = 'moment' | 'capsule'
export type SquareMood = 'happy' | 'excited' | 'calm' | 'sad' | 'hopeful'

export interface FeedItem {
  id: number
  type: SquareFeedType
  author: string
  isAnonymous: boolean
  mood: SquareMood
  content: string
  photos: string[]
  likes: number
  liked: boolean
  commentCount: number
  createdAt: string
  topics: string[]
  isPinned?: boolean
  isHot?: boolean
  allowComment?: boolean
}

export interface MemberItem {
  name: string
  isAnonymous?: boolean
}

export interface TopicItem {
  tag: string
  count: number
}

/** 详情页（与列表情形一致） */
export type PostItem = FeedItem

export interface CommentItem {
  id: number
  feedId: number
  /** 回复目标评论 id；顶层评论为空 */
  parentId?: number
  author: string
  content: string
  createdAt: string
  likes: number
  liked: boolean
  isAnonymous?: boolean
}

/** 发布评论表单值（页面转交 API） */
export interface SquareCommentCreateInput {
  content: string
  parentId?: number
}

/** 发布动态表单提交值（页面转交 API） */
export interface SquareCreateInput {
  mood: SquareMood
  content: string
  topics: string[]
  photos: string[]
  isAnonymous: boolean
  allowComment: boolean
}
