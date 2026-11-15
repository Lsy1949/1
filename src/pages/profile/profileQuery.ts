/**
 * 「我的」页面数据层：复用心理咨询的预约接口与缓存键，
 * 与咨询中心共享同一份缓存（任一页操作后两边都刷新）。
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { counselingApi } from '@/api'
import { useTranslation } from 'react-i18next'

/** 我的预约列表 */
export function useProfileBookings() {
  return useQuery({
    queryKey: ['counseling', 'bookings'],
    queryFn: ({ signal }) => counselingApi.fetchMyBookings(signal),
  })
}

/** 心理老师目录（收藏区块需要老师资料） */
export function useCounselorDirectory() {
  return useQuery({
    queryKey: ['counseling', 'info'],
    queryFn: ({ signal }) => counselingApi.fetchCounselingInfo(signal),
  })
}

/** 取消预约 */
export function useProfileCancelBooking() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => counselingApi.cancelBooking(id),
    onSuccess: () => {
      message.success(t('counseling.message.cancelled'))
      return queryClient.invalidateQueries({ queryKey: ['counseling'] })
    },
    onError: (error: Error) => message.error(error.message),
  })
}

/** 改约 */
export function useProfileRescheduleBooking() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: number; date: string; slot: string }) =>
      counselingApi.rescheduleBooking(input.id, { date: input.date, slot: input.slot }),
    onSuccess: () => {
      message.success(t('counseling.message.rescheduled'))
      return queryClient.invalidateQueries({ queryKey: ['counseling'] })
    },
    onError: (error: Error) => message.error(error.message),
  })
}

/** 咨询评价 */
export function useProfileFeedback() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: number; score: number; comment?: string }) =>
      counselingApi.submitBookingFeedback(input.id, {
        score: input.score,
        comment: input.comment,
      }),
    onSuccess: () => {
      message.success(t('counseling.message.feedbackThanks'))
      return queryClient.invalidateQueries({ queryKey: ['counseling', 'bookings'] })
    },
    onError: (error: Error) => message.error(error.message),
  })
}

/** 收藏的老师 id 列表 */
export function useProfileFavorites() {
  return useQuery({
    queryKey: ['counseling', 'favorites'],
    queryFn: ({ signal }) => counselingApi.fetchFavoriteCounselorIds(signal),
  })
}

/** 保存收藏（整份替换） */
export function useProfileSaveFavorites() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: number[]) => counselingApi.saveFavoriteCounselorIds(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['counseling'] }),
  })
}
