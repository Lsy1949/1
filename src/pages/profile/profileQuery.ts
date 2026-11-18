/**
 * 个人中心数据层：只读取预约 / 收藏条数，用于快捷入口角标。
 * 预约与收藏的明细、改约、评价统一在咨询中心「我的」，这里不重复管理逻辑。
 */
import { useQuery } from '@tanstack/react-query'
import { counselingApi } from '@/api'

/** 我的预约列表（与咨询中心共享缓存键） */
export function useProfileBookings() {
  return useQuery({
    queryKey: ['counseling', 'bookings'],
    queryFn: ({ signal }) => counselingApi.fetchMyBookings(signal),
  })
}

/** 收藏的老师 id 列表（与咨询中心共享缓存键） */
export function useProfileFavorites() {
  return useQuery({
    queryKey: ['counseling', 'favorites'],
    queryFn: ({ signal }) => counselingApi.fetchFavoriteCounselorIds(signal),
  })
}
