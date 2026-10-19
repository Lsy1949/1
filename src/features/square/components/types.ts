// 广场列表页类型定义
export interface FeedItem {
  id: number
  type: string
  author: string
  isAnonymous: boolean
  mood: string
  content: string
  photos: string[]
  likes: number
  liked: boolean
  commentCount: number
  createdAt: string
  topics: string[]
  isPinned?: boolean
  isHot?: boolean
}

export interface MemberItem {
  name: string
  isAnonymous?: boolean
}

// 详情页
export interface PostItem {
  id: number
  type: string
  author: string
  isAnonymous: boolean
  mood: string
  content: string
  photos: string[]
  likes: number
  liked: boolean
  createdAt: string
}

export interface CommentItem {
  id: number
  author: string
  content: string
  time: string
  likes: number
  liked: boolean
  isAnonymous?: boolean
}
