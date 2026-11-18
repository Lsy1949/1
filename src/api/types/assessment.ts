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
  /** 本次获得的成长积分（0 = 当日计分已达上限/风控不计分） */
  pointsEarned?: number
  /** 本次是否因每日计分上限而未计分 */
  pointsCapped?: boolean
}

/** 积分流水来源规则（规则表见 docs/assessment-points.md） */
export type AssessmentPointsRule = 'assess.complete' | 'migrate.v1'

/** 一条积分流水 */
export interface AssessmentPointsEntryDTO {
  id: number
  rule: AssessmentPointsRule
  /** 变动值（正为获得，负为撤销/消耗） */
  delta: number
  /** 变动后余额 */
  balanceAfter: number
  createdAt: string
  /** 关联量表名（规则为完成测评时携带） */
  scaleName?: string
  /** 关联的测评结果 id（幂等键：同一结果只入账一次） */
  refResultId?: number
}

/** 勋章（只下发展示所需：标识 + 是否解锁） */
export interface AssessmentBadgeDTO {
  key: 'first' | 'multi' | 'mental' | 'career' | 'depth' | 'master'
  unlocked: boolean
}

/** 积分账户 + 个人成长档案 + 近期流水（全部由服务端计算，前端只渲染） */
export interface AssessmentPointsDTO {
  /** 当前余额 */
  balance: number
  /** 累计获得（等级按此计算，消耗不掉级） */
  totalEarned: number
  /** 等级 1–5 */
  level: number
  /** 当前等级内进度（0–100） */
  levelProgress: number
  /** 距下一级所需积分（满级为 0） */
  pointsToNext: number
  /** 本周获得（自然周） */
  weekEarned: number
  /** 本月获得（自然月） */
  monthEarned: number
  /** 今日已计分次数（用于展示上限） */
  todayCount: number
  /** 每日计分次数上限 */
  dailyLimit: number
  /** 已完成测评次数 */
  completed: number
  /** 已覆盖的量表分类数 */
  categoriesCovered: number
  /** 测评天数（服务端按自然日去重） */
  assessmentDays: number
  /** 加入日期（首次测评自然日；无记录时为服务端默认值） */
  joinDate: string
  /** 成长状态标识（前端仅做 i18n 文案映射） */
  growthStatusKey: 'new' | 'rising' | 'steady' | 'deep' | 'master'
  /** 勋章解锁状态 */
  badges: AssessmentBadgeDTO[]
  /** 已解锁勋章数 */
  unlockedBadges: number
  /** 本月已完成次数（月度目标用） */
  monthCompleted: number
  /** 月度目标次数 */
  monthlyTarget: number
  /** 月度目标完成百分比（已封顶 100） */
  monthlyPercent: number
  /** 最常探索的分类标识（前端仅做 i18n 映射；无记录时为 undefined） */
  favoriteCategoryKey?: string
  /** 近期流水（倒序） */
  ledger: AssessmentPointsEntryDTO[]
}
