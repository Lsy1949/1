/**
 * 心理测评页面数据层：
 *  - 目录 / 详情 / 历史记录各自缓存；
 *  - 提交与清空成功后失效历史记录。
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { assessmentApi } from '@/api'
import type { AssessmentSubmitInput } from '@/features/assessment'
import { useTranslation } from 'react-i18next'

export function useAssessmentScales() {
  return useQuery({
    queryKey: ['assessment', 'scales'],
    queryFn: ({ signal }) => assessmentApi.fetchScales(signal),
  })
}

export function useAssessmentScale(id: string | undefined) {
  return useQuery({
    queryKey: ['assessment', 'scale', id],
    queryFn: ({ signal }) => assessmentApi.fetchScaleDetail(id!, signal),
    enabled: Boolean(id),
    retry: false,
  })
}

export function useAssessmentHistory() {
  return useQuery({
    queryKey: ['assessment', 'history'],
    queryFn: ({ signal }) => assessmentApi.fetchHistory(signal),
  })
}

/** 成长积分账户（余额 / 等级 / 近期流水） */
export function useAssessmentPoints() {
  return useQuery({
    queryKey: ['assessment', 'points'],
    queryFn: ({ signal }) => assessmentApi.fetchPoints(signal),
  })
}

/** 提交测评：计分在服务端，成功后刷新历史与积分 */
export function useSubmitAssessment() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssessmentSubmitInput) => assessmentApi.submitResult(input),
    onSuccess: (result) => {
      // 今日计分达上限时不加分，但历史照常记录，需要给出明确反馈
      if (result?.pointsCapped) {
        message.warning(t('assessment.points.capped'))
      } else {
        message.success(t('assessment.points.earned', { points: result?.pointsEarned ?? 0 }))
      }
      void queryClient.invalidateQueries({ queryKey: ['assessment', 'history'] })
      return queryClient.invalidateQueries({ queryKey: ['assessment', 'points'] })
    },
    onError: (error: Error) => message.error(error.message),
  })
}

/** 清空历史记录（不扣减已获得的成长积分） */
export function useClearAssessmentHistory() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => assessmentApi.clearHistory(),
    onSuccess: () => {
      message.success(t('assessment.history.cleared'))
      return queryClient.invalidateQueries({ queryKey: ['assessment', 'history'] })
    },
    onError: (error: Error) => message.error(error.message),
  })
}
