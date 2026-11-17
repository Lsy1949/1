import { http } from 'msw'
import { mocked, ok, fail } from '../utils/response'
import {
  clearHistory,
  findScaleDetail,
  listHistory,
  listScales,
  submitAssessment,
} from '../data/assessment'
import { awardAssessmentPoints, ensurePointsAccount, getAssessmentPoints } from '../data/points'
import { API_CODE } from '@/api/types'
import type {
  AssessmentPointsDTO,
  AssessmentResultDTO,
  AssessmentScaleDTO,
  AssessmentScaleDetailDTO,
  AssessmentSubmitDTO,
} from '@/api/types'

/**
 * 心理测评接口。
 *
 * 计分在 mock 内完成，前端只提交原始选项；
 * 历史记录持久化在 `mock:assessment-history`。
 */
export const assessmentHandlers = [
  http.get(
    '/api/assessment/scales',
    mocked(() => ok<AssessmentScaleDTO[]>(listScales())),
  ),

  http.get(
    '/api/assessment/scales/:id',
    mocked(({ params }) => {
      const detail = findScaleDetail(String(params.id))
      return detail
        ? ok<AssessmentScaleDetailDTO>(detail)
        : fail(API_CODE.NOT_FOUND, '量表不存在')
    }),
  ),

  http.post(
    '/api/assessment/results',
    mocked(async ({ request }) => {
      const body = (await request.json()) as AssessmentSubmitDTO
      if (!body?.scaleKey) return fail(API_CODE.BAD_REQUEST, '缺少量表标识')
      if (!Array.isArray(body.answers) || body.answers.length === 0) {
        return fail(API_CODE.BAD_REQUEST, '请先完成作答')
      }

      // 记账前先确保积分账户存在（旧数据按提交前的历史条数迁移，避免把本次重复计入）
      ensurePointsAccount(listHistory().length)

      const result = submitAssessment(body)
      if (!result) return fail(API_CODE.NOT_FOUND, '量表不存在')

      // 幂等 + 每日上限在账本内处理；返回本次实际获得分值用于结果提示
      const outcome = awardAssessmentPoints(result)
      return ok<AssessmentResultDTO>({
        ...result,
        pointsEarned: outcome.earned,
        pointsCapped: outcome.capped,
      })
    }),
  ),

  http.get(
    '/api/assessment/points',
    mocked(() => {
      const history = listHistory()
      const scales = listScales()
      const categoryOf = (scaleKey: string) => scales.find((item) => item.key === scaleKey)?.category
      return ok<AssessmentPointsDTO>(getAssessmentPoints(history, categoryOf))
    }),
  ),

  http.get(
    '/api/assessment/history',
    mocked(() => ok<AssessmentResultDTO[]>(listHistory())),
  ),

  http.delete(
    '/api/assessment/history',
    mocked(() => {
      clearHistory()
      return ok<null>(null, 'cleared')
    }),
  ),
]
