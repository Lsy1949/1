// 咨询模块共享类型（业务层视图模型，结构对齐 API DTO，不直接依赖 @/api）

export type ConsultationTypeKey = 'individual' | 'couple' | 'family' | 'group'
export type CounselingIconKey = 'user' | 'apartment' | 'home' | 'message'
export type CounselorAccentKey =
  | 'primary'
  | 'green'
  | 'purple'
  | 'gold'
  | 'red'
  | 'cyan'
  | 'magenta'
  | 'geekblue'
export type FaqCategory = 'booking' | 'service' | 'effect' | 'privacy'
export type BookingMode = 'online' | 'offline'
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

/** 咨询类型（名称由 i18n 按 key 解析） */
export interface ConsultationType {
  key: ConsultationTypeKey
  /** 图标语义 key，由页面映射到 antd 图标组件 */
  iconKey: CounselingIconKey
  duration: number
}

/** 心理老师 */
export interface Counselor {
  id: number
  name: string
  title: string
  gender: 'male' | 'female'
  rating: number
  sessions: number
  exp: number
  education: string
  /** 主题色语义 key，由 CSS Module 映射为具体颜色 */
  accentKey: CounselorAccentKey
  types: ConsultationTypeKey[]
  specialties: string[]
  intro: string
  background: string[]
  reviews: string[]
}

/** 常见问题 */
export interface FaqItem {
  id: number
  cat: FaqCategory
  q: string
  a: string
}

/** 预约提交表单值（页面转交 API） */
export interface BookingCreateInput {
  counselorId: number
  /** yyyy-MM-dd */
  date: string
  slot: string
  type: ConsultationTypeKey
  mode: BookingMode
  name: string
  contact: string
  description?: string
  isFirst: boolean
}

/** 「我的预约」本地列表项（结构对齐接口返回实体） */
export interface BookingItem extends BookingCreateInput {
  id: number
  counselorName: string
  status: BookingStatus
  createdAt: string
  /** 完成咨询后的评价（未评价时缺省） */
  feedback?: BookingFeedback
}

/** 咨询评价 */
export interface BookingFeedback {
  /** 1-5 星 */
  score: number
  comment?: string
  createdAt: string
}

/** 「我的」概览统计（由接口下发，前端只负责展示） */
export interface CounselingSummary {
  total: number
  upcoming: number
  completed: number
  favorites: number
}
