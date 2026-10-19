// 测评域类型（business 层共用；数据本体见同目录 data.ts）—— 自 Vue 版原样迁移
export interface ScaleInfo {
  key: string
  name: string
  desc: string
  duration: string
  count: number
  category: string
  icon: string
  difficulty: string
  available: boolean
  tags: string[]
}

/** 单条测评记录 */
export interface AssessmentRecord {
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

export interface ScaleDefinition {
  name: string
  description: string
  optionType: 'frequency' | 'agreement' | 'mbti'
  questions: ScaleQuestion[]
  calc: (score: number, details: Record<string, number>) => ScaleResult
}
