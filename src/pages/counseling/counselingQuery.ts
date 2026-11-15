/**
 * 心理咨询中心页面数据层：
 *  - 只读资料（类型 / 专长 / 老师 / FAQ）与「我的预约」各自独立缓存；
 *  - 预约的提交与取消成功后，统一失效 ['counseling','bookings']。
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { counselingApi } from '@/api'
import type { BookingCreateInput } from '@/features/counseling'
import { useTranslation } from 'react-i18next'

export function useCounselingInfo() {
  return useQuery({
    queryKey: ['counseling', 'info'],
    queryFn: ({ signal }) => counselingApi.fetchCounselingInfo(signal),
  })
}

export function useMyBookings() {
  return useQuery({
    queryKey: ['counseling', 'bookings'],
    queryFn: ({ signal }) => counselingApi.fetchMyBookings(signal),
  })
}

/** 收藏老师 ID 列表（后端偏好表，前端不再自行本地存储） */
export function useFavoriteCounselorIds() {
  return useQuery({
    queryKey: ['counseling', 'favorites'],
    queryFn: ({ signal }) => counselingApi.fetchFavoriteCounselorIds(signal),
  })
}

/** 覆盖保存收藏列表：成功后失效咨询域缓存（收藏 + 概览统计） */
export function useSaveFavoriteCounselorIds() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: number[]) => counselingApi.saveFavoriteCounselorIds(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['counseling'] }),
  })
}

/** 「我的」概览统计（预约总数 / 待进行 / 已完成 / 收藏老师） */
export function useCounselingSummary() {
  return useQuery({
    queryKey: ['counseling', 'summary'],
    queryFn: ({ signal }) => counselingApi.fetchCounselingSummary(signal),
  })
}

/** 提交预约：成功后刷新预约列表 */
export function useCreateBooking() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: BookingCreateInput) => counselingApi.createBooking(input),
    onSuccess: () => {
      message.success(t('counseling.message.bookingSuccess'))
      // 同时刷新可约时段（新预约会占用该时段）
      return queryClient.invalidateQueries({ queryKey: ['counseling'] })
    },
    onError: (error: Error) => message.error(error.message),
  })
}

/** 取消预约：成功后刷新预约列表 */
export function useCancelBooking() {
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

/** 改约：成功后刷新预约列表与可约时段 */
export function useRescheduleBooking() {
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

/** 提交咨询评价：成功后刷新预约列表 */
export function useSubmitBookingFeedback() {
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
