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
}
