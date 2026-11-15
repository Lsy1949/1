import { http } from 'msw'
import { mocked, ok, fail } from '../utils/response'
import {
  COUNSELING_INFO,
  cancelBooking,
  counselingSummary,
  createBooking,
  findSlotConflict,
  listBookings,
  listFavoriteCounselorIds,
  rescheduleBooking,
  saveFavoriteCounselorIds,
  slotAvailability,
  submitBookingFeedback,
} from '../data/counseling'
import { API_CODE } from '@/api/types'
import type {
  BookingCreateDTO,
  BookingDTO,
  BookingFeedbackInputDTO,
  BookingRescheduleDTO,
  CounselingInfoDTO,
  CounselingSummaryDTO,
  FavoriteCounselorIdsDTO,
  SlotAvailabilityDTO,
} from '@/api/types'

/** 改约 / 评价的错误码 → 用户可读文案 */
const MUTATION_ERROR_TEXT: Record<string, string> = {
  NOT_FOUND: '预约不存在',
  INVALID_STATUS: '当前预约状态不支持该操作',
  SLOT_CONFLICT: '该时段你已有其他预约，请更换时间',
  ALREADY_RATED: '该预约已评价过',
  INVALID_SCORE: '请选择 1-5 星评分',
}

/**
 * 心理咨询接口。
 *
 * 只读数据 + 预约提交 / 列表 / 取消 / 改约 / 评价 + 可约时段；
 * 预约与评价状态持久化在 `mock:counseling-bookings`。
 */
export const counselingHandlers = [
  http.get(
    '/api/counseling/info',
    mocked(() => ok<CounselingInfoDTO>(COUNSELING_INFO)),
  ),

  http.get(
    '/api/counseling/bookings',
    mocked(() => ok<BookingDTO[]>(listBookings())),
  ),

  http.get(
    '/api/counseling/favorites',
    mocked(() => ok<FavoriteCounselorIdsDTO>(listFavoriteCounselorIds())),
  ),

  http.post(
    '/api/counseling/favorites',
    mocked(async ({ request }) => {
      const body = (await request.json()) as { counselorIds?: number[] }
      if (!Array.isArray(body?.counselorIds)) {
        return fail(API_CODE.BAD_REQUEST, '收藏列表格式不正确')
      }
      return ok<FavoriteCounselorIdsDTO>(saveFavoriteCounselorIds(body.counselorIds))
    }),
  ),

  http.get(
    '/api/counseling/summary',
    mocked(() => ok<CounselingSummaryDTO>(counselingSummary())),
  ),

  http.get(
    '/api/counseling/availability',
    mocked(({ request }) => {
      const url = new URL(request.url)
      const counselorId = Number(url.searchParams.get('counselorId'))
      const date = url.searchParams.get('date') ?? ''
      if (!counselorId || !date) return fail(API_CODE.BAD_REQUEST, '缺少咨询老师或日期')
      return ok<SlotAvailabilityDTO>({
        counselorId,
        date,
        takenSlots: slotAvailability(counselorId, date),
      })
    }),
  ),

  http.post(
    '/api/counseling/bookings',
    mocked(async ({ request }) => {
      const body = (await request.json()) as BookingCreateDTO
      if (!body?.counselorId) return fail(API_CODE.BAD_REQUEST, '请选择心理老师')
      if (!body.date) return fail(API_CODE.BAD_REQUEST, '请选择咨询日期')
      if (findSlotConflict(body.date, body.slot)) {
        return fail(API_CODE.BAD_REQUEST, '该时段你已有预约，请选择其他时间')
      }
      return ok<BookingDTO>(createBooking(body))
    }),
  ),

  http.patch(
    '/api/counseling/bookings/:id/cancel',
    mocked(({ params }) => {
      const updated = cancelBooking(Number(params.id))
      return updated
        ? ok<BookingDTO>(updated)
        : fail(API_CODE.NOT_FOUND, '预约不存在')
    }),
  ),

  http.patch(
    '/api/counseling/bookings/:id/reschedule',
    mocked(async ({ params, request }) => {
      const body = (await request.json()) as BookingRescheduleDTO
      if (!body?.date || !body?.slot) return fail(API_CODE.BAD_REQUEST, '请选择新的咨询时间')
      const result = rescheduleBooking(Number(params.id), body)
      if ('error' in result) {
        return fail(API_CODE.BAD_REQUEST, MUTATION_ERROR_TEXT[result.error] ?? '改约失败')
      }
      return ok<BookingDTO>(result.data)
    }),
  ),

  http.post(
    '/api/counseling/bookings/:id/feedback',
    mocked(async ({ params, request }) => {
      const body = (await request.json()) as BookingFeedbackInputDTO
      const result = submitBookingFeedback(Number(params.id), body)
      if ('error' in result) {
        return fail(API_CODE.BAD_REQUEST, MUTATION_ERROR_TEXT[result.error] ?? '评价失败')
      }
      return ok<BookingDTO>(result.data)
    }),
  ),
]
