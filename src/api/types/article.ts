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

/** 列表查询参数（mock 侧模拟真实后端的服务端过滤） */
export interface ArticleListQuery {
  /** 'all' 或具体分类；缺省等同 'all' */
  category?: ArticleCategoryKey | 'all'
  /** 标题/摘要模糊匹配 */
  keyword?: string
}
