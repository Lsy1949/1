/**
 * 心理咨询 domain DTO。
 *
 * 建模原则（同前序批次）：
 *  - 咨询类型只下发 `key / iconKey / duration`；显示名是 UI 文案，
 *    由前端拼 `counseling.types.{key}` 走 i18n。
 *  - 咨询师资料、FAQ 问答、专长标签属于业务内容，允许接口直出。
 *  - 咨询师主题色下发 `accentKey`（语义 key），具体颜色由前端 CSS Module 映射。
 */

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

/** 咨询类型 */
export interface ConsultationTypeDTO {
  key: ConsultationTypeKey
  /** 图标语义 key，前端映射到 antd 图标组件 */
  iconKey: CounselingIconKey
  /** 单次时长（分钟） */
  duration: number
}

/** 心理老师 */
export interface CounselorDTO {
  id: number
  name: string
  title: string
  gender: 'male' | 'female'
  rating: number
  sessions: number
  exp: number
  education: string
  /** 主题色语义 key */
  accentKey: CounselorAccentKey
  types: ConsultationTypeKey[]
  specialties: string[]
  intro: string
  background: string[]
  reviews: string[]
}

/** 常见问题 */
export interface FaqDTO {
  id: number
  cat: FaqCategory
  q: string
  a: string
}

/** `GET /api/counseling/info` —— 一次返回咨询中心全部只读数据 */
export interface CounselingInfoDTO {
  consultationTypes: ConsultationTypeDTO[]
  specialties: string[]
  counselors: CounselorDTO[]
  faqs: FaqDTO[]
}

/** `POST /api/counseling/bookings` 请求体 */
export interface BookingCreateDTO {
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

/** 预约实体（表单提交后的返回） */
export interface BookingDTO extends BookingCreateDTO {
  id: number
  counselorName: string
  status: BookingStatus
  createdAt: string
  /** 完成后的评价（未评价时不返回） */
  feedback?: BookingFeedbackDTO
}

/** 预约评价（已完成咨询后提交） */
export interface BookingFeedbackDTO {
  /** 1-5 星 */
  score: number
  comment?: string
  createdAt: string
}

/** `GET /api/counseling/favorites` / `POST /api/counseling/favorites` —— 收藏老师 ID 列表 */
export type FavoriteCounselorIdsDTO = number[]

/** `GET /api/counseling/summary` —— 「我的」概览统计 */
export interface CounselingSummaryDTO {
  /** 预约总数 */
  total: number
  /** 待进行（待确认 + 已确认） */
  upcoming: number
  /** 已完成 */
  completed: number
  /** 收藏老师数 */
  favorites: number
}

/** `GET /api/counseling/availability` —— 某老师某日已被占用的时段 */
export interface SlotAvailabilityDTO {
  counselorId: number
  /** yyyy-MM-dd */
  date: string
  /** 已被其他同学占用 / 学校不开放的时段（HH:mm） */
  takenSlots: string[]
}

/** `PATCH /api/counseling/bookings/:id/reschedule` 请求体 */
export interface BookingRescheduleDTO {
  /** yyyy-MM-dd */
  date: string
  slot: string
}

/** `POST /api/counseling/bookings/:id/feedback` 请求体 */
export interface BookingFeedbackInputDTO {
  score: number
  comment?: string
}
