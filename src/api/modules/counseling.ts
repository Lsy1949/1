import { get, patch, post } from '../request'
import type {
  BookingCreateDTO,
  BookingDTO,
  BookingFeedbackInputDTO,
  BookingRescheduleDTO,
  CounselingInfoDTO,
  CounselingSummaryDTO,
  FavoriteCounselorIdsDTO,
  SlotAvailabilityDTO,
} from '../types'

/**
 * 心理咨询模块 API。
 *
 * 只读数据聚合 + 预约提交 / 列表 / 取消 / 改约 / 评价 + 可约时段查询
 * + 收藏老师 + 「我的」概览统计。
 */

/** 咨询中心只读数据（类型 / 专长 / 老师 / FAQ） */
export function fetchCounselingInfo(signal?: AbortSignal): Promise<CounselingInfoDTO> {
  return get<CounselingInfoDTO>('counseling/info', { signal })
}

/** 我的预约列表（按创建时间倒序） */
export function fetchMyBookings(signal?: AbortSignal): Promise<BookingDTO[]> {
  return get<BookingDTO[]>('counseling/bookings', { signal })
}

/** 提交预约 */
export function createBooking(input: BookingCreateDTO): Promise<BookingDTO> {
  return post<BookingDTO>('counseling/bookings', input)
}

/** 取消预约（返回更新后的实体） */
export function cancelBooking(id: number): Promise<BookingDTO> {
  return patch<BookingDTO>(`counseling/bookings/${id}/cancel`)
}

/** 某老师某日已被占用的时段（含学校不开放时段） */
export function fetchSlotAvailability(
  counselorId: number,
  date: string,
  signal?: AbortSignal,
): Promise<SlotAvailabilityDTO> {
  return get<SlotAvailabilityDTO>('counseling/availability', {
    params: { counselorId, date },
    signal,
  })
}

/** 改约（仅待确认 / 已确认可改） */
export function rescheduleBooking(id: number, input: BookingRescheduleDTO): Promise<BookingDTO> {
  return patch<BookingDTO>(`counseling/bookings/${id}/reschedule`, input)
}

/** 提交咨询评价（仅已完成可评价） */
export function submitBookingFeedback(
  id: number,
  input: BookingFeedbackInputDTO,
): Promise<BookingDTO> {
  return post<BookingDTO>(`counseling/bookings/${id}/feedback`, input)
}

/** 收藏老师 ID 列表 */
export function fetchFavoriteCounselorIds(signal?: AbortSignal): Promise<FavoriteCounselorIdsDTO> {
  return get<FavoriteCounselorIdsDTO>('counseling/favorites', { signal })
}

/** 覆盖保存收藏列表（整份替换），返回落库后的列表 */
export function saveFavoriteCounselorIds(ids: number[]): Promise<FavoriteCounselorIdsDTO> {
  return post<FavoriteCounselorIdsDTO>('counseling/favorites', { counselorIds: ids })
}

/** 「我的」概览统计（预约总数 / 待进行 / 已完成 / 收藏老师） */
export function fetchCounselingSummary(signal?: AbortSignal): Promise<CounselingSummaryDTO> {
  return get<CounselingSummaryDTO>('counseling/summary', { signal })
}
