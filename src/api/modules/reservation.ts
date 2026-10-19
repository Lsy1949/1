import http from '../http'
import type { Reservation } from './lab'

/**
 * 预约管理模块（对照旧 api/reservation.js，管理侧）。
 * // TODO: 待后端确认 @RequestParam vs @RequestBody（Q3）
 */

/** 获取所有预约 */
export async function getAllReservations(): Promise<Reservation[]> {
  const res = await http.get<Reservation[]>('/reservations/all')
  return res.data
}

/** 更新预约状态 */
export async function updateReservationStatus(
  reservationId: string,
  status: string,
): Promise<void> {
  await http.put('/reservations/status', null, { params: { reservationId, status } })
}

/** 删除预约 */
export async function deleteReservation(reservationId: string): Promise<void> {
  await http.delete('/deleteReservation', { params: { reservationId } })
}
