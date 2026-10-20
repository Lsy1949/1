import { http } from 'msw'
import { mocked, ok, fail } from '../utils/response'
import { COUNSELING_INFO, cancelBooking, createBooking, listBookings } from '../data/counseling'
import { API_CODE } from '@/api/types'
import type { BookingCreateDTO, BookingDTO, CounselingInfoDTO } from '@/api/types'

/**
 * 心理咨询接口。
 *
 * 只读数据 + 预约提交 / 列表 / 取消；预约状态持久化在 `mock:counseling-bookings`。
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

  http.post(
    '/api/counseling/bookings',
    mocked(async ({ request }) => {
      const body = (await request.json()) as BookingCreateDTO
      if (!body?.counselorId) return fail(API_CODE.BAD_REQUEST, '请选择心理老师')
      if (!body.date) return fail(API_CODE.BAD_REQUEST, '请选择咨询日期')
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
]
