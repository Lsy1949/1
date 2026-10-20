/**
 * 心理测评 domain DTO。
 *
 * 建模原则：
 *  - 目录与题目结构由接口下发；选项包含分值与文案（量表原文，属业务内容）。
 *  - 计分、等级判定与建议文本全部在服务端完成，前端只提交原始选项。
 *  - 历史记录由服务端持久化，前端不再读写 localStorage。
 */

export type AssessmentCategoryKey =
  | 'all'
  | 'mental'
  | 'career'
  | 'cognitive'
  | 'esports'
  | 'learning'
  | 'social'

export type AssessmentOptionType = 'frequency' | 'agreement' | 'mbti'

/** 目录项（广场卡片） */
export interface AssessmentScaleDTO {
  key: string
  name: string
  desc: string
  duration: string
  count: number
  category: Exclude<AssessmentCategoryKey, 'all'>
  /** 图标语义 key，前端 ScaleIcon 映射 */
  icon: string
  difficulty: string
  available: boolean
  tags: string[]
}

/** 选项（含分值） */
export interface AssessmentOptionDTO {
  label: string
  value: number | string
}

export interface AssessmentQuestionDTO {
  id: number
  text: string
  /** RIASEC 维度（R/I/A/S/E/C） */
  type?: string
  /** MBTI 维度（EI/SN/TF/JP） */
  dim?: string
}

/** 量表详情（答题页） */
export interface AssessmentScaleDetailDTO {
  key: string
  name: string
  category: Exclude<AssessmentCategoryKey, 'all'>
  description: string
  optionType: AssessmentOptionType
  options: AssessmentOptionDTO[]
  questions: AssessmentQuestionDTO[]
}

/** 单题答案 */
export interface AssessmentAnswerDTO {
  questionId: number
  value: number | string
}

/** 提交答案（计分由服务端完成） */
export interface AssessmentSubmitDTO {
  scaleKey: string
  answers: AssessmentAnswerDTO[]
  /** 用时（秒） */
  duration: number
}

/** 测评结果 = 一条历史记录 */
export interface AssessmentResultDTO {
  id: number
  scaleKey: string
  scaleName: string
  date: string
  score: number
  level: string
  levelTag: string
  title: string
  insight: string
  suggestion: string
  details: Record<string, number>
  duration: number
}
