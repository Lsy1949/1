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
