// 文章条目结构（页面层把接口 DTO 映射为该视图模型）。
// business 层禁止 import @/api（ESLint 分层边界），故以结构化类型复制；
// 列表接口不返回正文，故 content 可选，仅详情页映射后一定有值。
export interface ArticleItem {
  id: number
  title: string
  summary: string
  content?: string
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
