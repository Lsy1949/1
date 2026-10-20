import { get, patch, post } from '../request'
import type { BookingCreateDTO, BookingDTO, CounselingInfoDTO } from '../types'

/**
 * 心理咨询模块 API。
 *
 * 本批次：只读数据聚合 + 预约提交 / 列表 / 取消。
 */

/** 咨询中心只读数据（类型 / 专长 / 老师 / FAQ） */
export function fetchCounselingInfo(signal?: AbortSignal): Promise<CounselingInfoDTO> {
  return get<CounselingInfoDTO>('/api/counseling/info', { signal })
}

/** 我的预约列表（按创建时间倒序） */
export function fetchMyBookings(signal?: AbortSignal): Promise<BookingDTO[]> {
  return get<BookingDTO[]>('/api/counseling/bookings', { signal })
}

/** 提交预约 */
export function createBooking(input: BookingCreateDTO): Promise<BookingDTO> {
  return post<BookingDTO>('/api/counseling/bookings', input)
}

/** 取消预约（返回更新后的实体） */
export function cancelBooking(id: number): Promise<BookingDTO> {
  return patch<BookingDTO>(`/api/counseling/bookings/${id}/cancel`)
}
