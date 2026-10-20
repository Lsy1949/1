// 测评域类型（业务层视图模型，结构对齐 API DTO）

export type AssessmentCategoryKey =
  | 'all'
  | 'mental'
  | 'career'
  | 'cognitive'
  | 'esports'
  | 'learning'
  | 'social'

export type AssessmentOptionType = 'frequency' | 'agreement' | 'mbti'

export interface ScaleInfo {
  key: string
  name: string
  desc: string
  duration: string
  count: number
  category: Exclude<AssessmentCategoryKey, 'all'>
  icon: string
  difficulty: string
  available: boolean
  tags: string[]
}

/** 单条测评记录 */
export interface AssessmentRecord {
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

export interface ScaleQuestion {
  id: number
  text: string
  type?: string
  dim?: string
}

export interface OptionItem {
  label: string
  value: number | string
}

export interface ScaleResult {
  level: string
  levelTag: string
  title: string
  insight: string
  suggestion: string
}

/** 量表详情（答题页） */
export interface ScaleDetail {
  key: string
  name: string
  category: Exclude<AssessmentCategoryKey, 'all'>
  description: string
  optionType: AssessmentOptionType
  options: OptionItem[]
  questions: ScaleQuestion[]
}

/** 单题答案 */
export interface AssessmentAnswerInput {
  questionId: number
  value: number | string
}

/** 提交测评（页面转交 API） */
export interface AssessmentSubmitInput {
  scaleKey: string
  answers: AssessmentAnswerInput[]
  duration: number
}
