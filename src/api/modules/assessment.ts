import { del, get, post } from '../request'
import type {
  AssessmentResultDTO,
  AssessmentScaleDTO,
  AssessmentScaleDetailDTO,
  AssessmentSubmitDTO,
} from '../types'

/**
 * 心理测评模块 API。
 *
 * 计分在服务端完成：前端只提交选项，接收最终结果。
 */

/** 量表目录 */
export function fetchScales(signal?: AbortSignal): Promise<AssessmentScaleDTO[]> {
  return get<AssessmentScaleDTO[]>('assessment/scales', { signal })
}

/** 量表详情与题目（不存在时 404） */
export function fetchScaleDetail(
  id: number | string,
  signal?: AbortSignal,
): Promise<AssessmentScaleDetailDTO> {
  return get<AssessmentScaleDetailDTO>(`assessment/scales/${id}`, { signal })
}

/** 提交答案，返回计分结果 */
export function submitResult(input: AssessmentSubmitDTO): Promise<AssessmentResultDTO> {
  return post<AssessmentResultDTO>('assessment/results', input)
}

/** 历史记录（倒序） */
export function fetchHistory(signal?: AbortSignal): Promise<AssessmentResultDTO[]> {
  return get<AssessmentResultDTO[]>('assessment/history', { signal })
}

/** 清空历史记录 */
export function clearHistory(): Promise<null> {
  return del<null>('assessment/history')
}
