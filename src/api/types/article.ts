/**
 * 文章 domain DTO。
 *
 * 建模原则（同 home）：
 *  - 只下发结构 + 业务内容；分类标签等 UI 文案由前端按 key 走 i18n
 *    （`article.categories.{category}`），接口不再重复下发 categoryLabel。
 *  - title / summary / content / author 属于业务内容（作者产出），允许接口直出。
 */

/** 文章分类 key（与语言包 `article.categories.{key}` 一一对应） */
export type ArticleCategoryKey = 'daily' | 'featured' | 'psychology' | 'career' | 'stories'

/** 文章列表项（不含正文，避免列表接口体积膨胀） */
export interface ArticleListItemDTO {
  id: number
  title: string
  summary: string
  category: ArticleCategoryKey
  author: string
  authorTitle: string
  date: string
  views: number
  readTime: string
  image?: string
  featured: boolean
}

/** 文章详情（在列表项基础上带富文本正文） */
export interface ArticleDetailDTO extends ArticleListItemDTO {
  content: string
}

/** 文章评论的楼中楼回复（平铺一层，指向关系由 replyTo 昵称表达） */
export interface ArticleCommentReplyDTO {
  id: number
  author: string
  content: string
  time: string
  /** 被回复人昵称；回复楼层内他人时存在 */
  replyTo?: string
}

/** 文章评论（楼层，含楼中楼回复列表） */
export interface ArticleCommentDTO {
  id: number
  author: string
  content: string
  time: string
  likes: number
  liked: boolean
  isAnonymous?: boolean
  replies: ArticleCommentReplyDTO[]
}

/** 发表评论 / 楼中楼回复的入参 */
export interface ArticleCommentCreateDTO {
  content: string
  /** 楼中楼回复时传目标楼层 id；顶层评论不传 */
  commentId?: number
  /** 被回复人昵称（显示用）；缺省时由后端取楼层作者 */
  replyTo?: string
}

/** 列表查询参数（mock 侧模拟真实后端的服务端过滤） */
export interface ArticleListQuery {
  /** 'all' 或具体分类；缺省等同 'all' */
  category?: ArticleCategoryKey | 'all'
  /** 标题/摘要模糊匹配 */
  keyword?: string
}
