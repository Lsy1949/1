import dayjs from 'dayjs'
import type {
  AssessmentPointsDTO,
  AssessmentPointsEntryDTO,
  AssessmentResultDTO,
} from '@/api/types'

/**
 * 成长积分账本（mock 服务端）
 *
 * 设计见 docs/assessment-points.md（v2 P0）：
 * - 余额 = 流水求和，不再用「历史条数 × 10」推导；
 * - 完成一次有效测评 +10，每日最多计 3 次、单日封顶 40 分；
 * - 幂等键 `result:{resultId}`，重复提交不重复计分；
 * - 清空历史不扣分（成就与记录解耦）；
 * - 旧数据首次访问时按历史条数补一笔迁移流水，用户数值无感。
 */

const ACCOUNT_KEY = 'mock:assessment-points-account'
const LEDGER_KEY = 'mock:assessment-points-ledger'

/** 基础分：完成一次有效测评 */
const BASE_POINTS = 10
/** 每日计分次数上限 */
const DAILY_COUNT_LIMIT = 3
/** 单日积分上限（兜底，防止规则叠加爆分） */
const DAILY_POINT_CAP = 40
/** 等级阈值：按「累计获得」计算，满级 5 */
const LEVEL_THRESHOLDS = [0, 80, 200, 360, 560]
/** 流水最多保留条数（超出淘汰最旧，避免本地存储无限增长） */
const LEDGER_LIMIT = 200

interface PointsAccount {
  balance: number
  totalEarned: number
  migratedAt?: string
}

function readAccount(): PointsAccount | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PointsAccount
    if (typeof parsed?.balance !== 'number' || typeof parsed?.totalEarned !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function persistAccount(account: PointsAccount): void {
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account))
  } catch {
    /* 存储不可用时退化为纯内存 */
  }
}

function readLedger(): AssessmentPointsEntryDTO[] {
  try {
    const raw = localStorage.getItem(LEDGER_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as AssessmentPointsEntryDTO[]) : []
  } catch {
    return []
  }
}

function persistLedger(list: AssessmentPointsEntryDTO[]): void {
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(list.slice(-LEDGER_LIMIT)))
  } catch {
    /* 忽略 */
  }
}

function nextId(list: AssessmentPointsEntryDTO[]): number {
  return list.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

/** 本周一 00:00（不引入 isoWeek 插件，手动换算） */
function startOfWeek(): dayjs.Dayjs {
  const now = dayjs()
  const offset = (now.day() + 6) % 7
  return now.subtract(offset, 'day').startOf('day')
}

/**
 * 确保账户存在。
 * 首次访问（含旧版本升级）按存量历史补一笔迁移流水，保证余额与旧口径（条数 × 10）一致。
 */
export function ensurePointsAccount(legacyCount: number): PointsAccount {
  const existing = readAccount()
  if (existing) return existing

  const migrated = Math.max(0, legacyCount) * BASE_POINTS
  const account: PointsAccount = {
    balance: migrated,
    totalEarned: migrated,
    migratedAt: dayjs().format('YYYY-MM-DD HH:mm'),
  }
  persistAccount(account)

  if (migrated > 0) {
    const ledger = readLedger()
    persistLedger([
      ...ledger,
      {
        id: nextId(ledger),
        rule: 'migrate.v1',
        delta: migrated,
        balanceAfter: migrated,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
      },
    ])
  }
  return account
}

export interface AwardOutcome {
  earned: number
  balance: number
  capped: boolean
}

/**
 * 完成一次测评后记账（幂等 + 每日上限）。
 * 返回本次实际获得分值，供结果提示使用。
 */
export function awardAssessmentPoints(result: AssessmentResultDTO): AwardOutcome {
  const account = ensurePointsAccount(0)
  const ledger = readLedger()

  // 幂等：同一测评结果只入账一次（网络重试/重复提交不重复加分）
  if (ledger.some((item) => item.rule === 'assess.complete' && item.refResultId === result.id)) {
    return { earned: 0, balance: account.balance, capped: false }
  }

  const today = dayjs().format('YYYY-MM-DD')
  const todayEntries = ledger.filter(
    (item) => item.rule === 'assess.complete' && item.createdAt.slice(0, 10) === today
  )
  const todayPoints = todayEntries.reduce((sum, item) => sum + item.delta, 0)

  // 三重上限：每日次数、单日积分封顶
  if (todayEntries.length >= DAILY_COUNT_LIMIT || todayPoints + BASE_POINTS > DAILY_POINT_CAP) {
    return { earned: 0, balance: account.balance, capped: true }
  }

  const nextBalance = account.balance + BASE_POINTS
  const entry: AssessmentPointsEntryDTO = {
    id: nextId(ledger),
    rule: 'assess.complete',
    delta: BASE_POINTS,
    balanceAfter: nextBalance,
    createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
    scaleName: result.scaleName,
    refResultId: result.id,
  }
  persistLedger([...ledger, entry])
  persistAccount({
    ...account,
    balance: nextBalance,
    totalEarned: account.totalEarned + BASE_POINTS,
  })

  return { earned: BASE_POINTS, balance: nextBalance, capped: false }
}

/**
 * 账户快照 + 成长档案 + 近期流水（供 `GET /api/assessment/points`）
 *
 * 「前端只做渲染」：等级、进度、勋章解锁、成长状态、月度目标全部在这里算完，
 * 前端只按 key 取 i18n 文案与进度条宽度。
 */
export function getAssessmentPoints(
  history: AssessmentResultDTO[],
  categoryOf: (scaleKey: string) => string | undefined,
): AssessmentPointsDTO {
  const account = ensurePointsAccount(history.length)
  const ledger = readLedger()
  const weekStart = startOfWeek()
  const monthStart = dayjs().startOf('month')
  const today = dayjs().format('YYYY-MM-DD')

  const positive = ledger.filter((item) => item.delta > 0)
  const weekEarned = positive
    .filter((item) => !dayjs(item.createdAt).isBefore(weekStart))
    .reduce((sum, item) => sum + item.delta, 0)
  const monthEarned = positive
    .filter((item) => !dayjs(item.createdAt).isBefore(monthStart))
    .reduce((sum, item) => sum + item.delta, 0)

  // 等级按「累计获得」而非余额：将来开放消耗也不会掉级
  let level = 1
  LEVEL_THRESHOLDS.forEach((threshold, index) => {
    if (account.totalEarned >= threshold) level = index + 1
  })
  const isMax = level >= LEVEL_THRESHOLDS.length
  const levelStart = LEVEL_THRESHOLDS[level - 1]
  const levelEnd = isMax ? levelStart : LEVEL_THRESHOLDS[level]
  const levelProgress = isMax
    ? 100
    : Math.min(100, Math.round(((account.totalEarned - levelStart) / (levelEnd - levelStart)) * 100))
  const pointsToNext = isMax ? 0 : Math.max(0, levelEnd - account.totalEarned)

  const todayCount = ledger.filter(
    (item) => item.rule === 'assess.complete' && item.createdAt.slice(0, 10) === today
  ).length

  // ---- 成长档案：全部由服务端按历史推导 ----
  const completed = history.length
  const dayKeys = new Set(history.map((item) => dayjs(item.date).format('YYYY-MM-DD')))
  const sortedDates = [...history].sort((a, b) => a.date.localeCompare(b.date))
  const joinDate = sortedDates[0] ? dayjs(sortedDates[0].date).format('YYYY-MM-DD') : '2024-09-01'

  const growthStatusKey =
    completed === 0 ? 'new' : completed < 3 ? 'rising' : completed < 6 ? 'steady' : completed < 10 ? 'deep' : 'master'

  const categories = new Set(
    history.map((item) => categoryOf(item.scaleKey)).filter((cat): cat is string => Boolean(cat))
  )
  const badges = [
    { key: 'first' as const, unlocked: completed >= 1 },
    { key: 'multi' as const, unlocked: categories.size >= 2 },
    { key: 'mental' as const, unlocked: categories.has('mental') },
    { key: 'career' as const, unlocked: categories.has('career') },
    { key: 'depth' as const, unlocked: completed >= 3 },
    { key: 'master' as const, unlocked: completed >= 5 },
  ]

  // 月度目标：每月 4 次，按自然月统计，百分比封顶 100
  const monthCompleted = history.filter((item) => !dayjs(item.date).isBefore(monthStart)).length
  const monthlyTarget = 4

  // 最常探索分类（次数最多的分类；并列时取先达到者）
  const categoryCount: Record<string, number> = {}
  history.forEach((item) => {
    const cat = categoryOf(item.scaleKey)
    if (cat) categoryCount[cat] = (categoryCount[cat] ?? 0) + 1
  })
  const favoriteCategoryKey = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0]

  return {
    balance: account.balance,
    totalEarned: account.totalEarned,
    level,
    levelProgress,
    pointsToNext,
    weekEarned,
    monthEarned,
    todayCount,
    dailyLimit: DAILY_COUNT_LIMIT,
    completed,
    categoriesCovered: categories.size,
    assessmentDays: dayKeys.size,
    joinDate,
    growthStatusKey,
    badges,
    unlockedBadges: badges.filter((badge) => badge.unlocked).length,
    monthCompleted,
    monthlyTarget,
    monthlyPercent: Math.min(100, Math.round((monthCompleted / monthlyTarget) * 100)),
    favoriteCategoryKey,
    ledger: [...ledger].sort((a, b) => b.id - a.id).slice(0, 20),
  }
}
