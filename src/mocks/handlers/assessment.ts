import { http } from 'msw'
import { mocked, ok, fail } from '../utils/response'
import {
  clearHistory,
  findScaleDetail,
  listHistory,
  listScales,
  submitAssessment,
} from '../data/assessment'
import { API_CODE } from '@/api/types'
import type {
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

      const result = submitAssessment(body)
      return result ? ok<AssessmentResultDTO>(result) : fail(API_CODE.NOT_FOUND, '量表不存在')
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
