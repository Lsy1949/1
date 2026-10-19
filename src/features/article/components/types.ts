// 文章条目结构（与 @/api/mock/articles 的 ArticleItem 保持一致）。
// business 层禁止 import @/api（ESLint 分层边界），故以结构化类型复制；页面传入的 ArticleItem 天然兼容。
export interface ArticleItem {
  id: number
  title: string
  summary: string
  content: string
  category: string
  categoryLabel: string
  author: string
  authorTitle: string
  date: string
  views: number
  readTime: string
  image?: string
  featured: boolean
}
