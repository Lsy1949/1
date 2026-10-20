/**
 * 心理咨询中心页面数据层：
 *  - 只读资料（类型 / 专长 / 老师 / FAQ）与「我的预约」各自独立缓存；
 *  - 预约的提交与取消成功后，统一失效 ['counseling','bookings']。
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { counselingApi } from '@/api'
import type { BookingCreateInput } from '@/features/counseling'
import { useI18n } from '@/i18n'

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

/** 提交预约：成功后刷新预约列表 */
export function useCreateBooking() {
  const { t } = useI18n()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: BookingCreateInput) => counselingApi.createBooking(input),
    onSuccess: () => {
      message.success(t('counseling.message.bookingSuccess'))
      return queryClient.invalidateQueries({ queryKey: ['counseling', 'bookings'] })
    },
    onError: (error: Error) => message.error(error.message),
  })
}

/** 取消预约：成功后刷新预约列表 */
export function useCancelBooking() {
  const { t } = useI18n()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => counselingApi.cancelBooking(id),
    onSuccess: () => {
      message.success(t('counseling.message.cancelled'))
      return queryClient.invalidateQueries({ queryKey: ['counseling', 'bookings'] })
    },
    onError: (error: Error) => message.error(error.message),
  })
}
