/**
 * 心理测评页面数据层：
 *  - 目录 / 详情 / 历史记录各自缓存；
 *  - 提交与清空成功后失效历史记录。
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { assessmentApi } from '@/api'
import type { AssessmentSubmitInput } from '@/features/assessment'
import { useI18n } from '@/i18n'

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

/** 提交测评：计分在服务端，成功后刷新历史 */
export function useSubmitAssessment() {
  const { t } = useI18n()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssessmentSubmitInput) => assessmentApi.submitResult(input),
    onSuccess: () => {
      message.success(t('assessment.submitted'))
      return queryClient.invalidateQueries({ queryKey: ['assessment', 'history'] })
    },
    onError: (error: Error) => message.error(error.message),
  })
}

/** 清空历史记录 */
export function useClearAssessmentHistory() {
  const { t } = useI18n()
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
