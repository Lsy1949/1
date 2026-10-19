// 个人中心共享类型
export interface ProfileFormData {
  name: string
  studentId: string
  school: string
  enrollYear: string
  gender: string
  major: string
}

export interface PsychFormData {
  mbti: string
  interests: string[]
  bio: string
  stressLevel: string
  sleepQuality: string
}

export interface GrowthItem {
  type: string
  kind: string
  text: string
  date: string
}
