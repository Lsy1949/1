// 咨询模块共享类型
import type { ComponentType } from 'react'

export interface ConsultationType {
  key: string
  name: string
  desc: string
  duration: number
  icon: ComponentType
}

export interface Counselor {
  id: number
  name: string
  title: string
  gender: string
  rating: number
  sessions: number
  exp: number
  education: string
  color: string
  types: string[]
  specialties: string[]
  intro: string
  background: string[]
  reviews: string[]
}

export interface BookingItem {
  counselorName: string
  counselorId: number
  date: string
  slot: string
  typeName: string
  type: string
  mode: string
  topics: string[]
  description: string
  isFirst: boolean
  status: string
  createdAt: string
}

export interface FaqItem {
  cat: string
  q: string
  a: string
}
