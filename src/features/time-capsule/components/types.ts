/**
 * 时光胶囊模块 · 类型定义
 */

/** 胶囊列表项 */
export interface CapsuleItem {
  id: number
  title: string
  openDate: string
  status: string
  sendStatus: string
  auditStatus: number
  remainingDays: number
  emotionEmoji: string
  openMethod: string
}

/** 胶囊详情项 */
export interface CapsuleDetailItem {
  id: number
  title: string
  createDate: string
  content: string
  images: string[]
  openMethod: string
  emailRecipient?: string
  letterName?: string
  letterPhone?: string
  letterAddress?: string
  isAnonymous: boolean
  openDate: string
  remainingDays: number
  emotion: string
}

/** 列表统计（由页面按接口全量数据计算后下发） */
export interface CapsuleStats {
  total: number
  pending: number
  opened: number
  auditing: number
}

/** 列表筛选页签（与接口 status 参数一一对应） */
export type CapsuleFilterType = 'all' | 'pending' | 'opened'

/** 新建胶囊表单提交值（页面转交 API；业务层不直接依赖 @/api） */
export interface CapsuleCreateInput {
  title: string
  /** yyyy-MM-dd */
  openDate: string
  openMethod: 'email' | 'letter'
  content: string
  images: string[]
  emotion: string
  isAnonymous: boolean
  isPublic: boolean
  disableComment: boolean
  emailRecipient?: string
  letterName?: string
  letterPhone?: string
  letterAddress?: string
}
