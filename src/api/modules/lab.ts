import http from '../http'
import type { RoleId } from './types'

/**
 * 机房与座位模块（对照旧 api/room.js）。
 * // TODO: 待后端确认 @RequestParam vs @RequestBody（Q3）
 */

/** 预约模式 */
export type BookingMode = 'single' | 'whole'

/** 机房信息 */
export interface ComputerLab {
  roomId?: number
  name?: string
  totalSeats?: number
  allowedRoles?: RoleId[]
  status?: string
  managerId?: string
  equipmentInfo?: string
  [key: string]: unknown
}

/** 座位信息 */
export interface Seat {
  seatId?: string
  roomId?: number
  status?: string
  [key: string]: unknown
}

/** 预约信息 */
export interface Reservation {
  reservationId?: string
  roomId?: number
  userId?: string
  reservationDate?: string
  startTime?: string
  endTime?: string
  status?: string
  seatIds?: string[]
  [key: string]: unknown
}

/** 创建机房预约参数 */
export interface CreateBookingParams {
  roomId: number
  reservationDate: string
  startTime: string
  endTime: string
  /** 座位 ID 列表，整机房预约时传空数组 */
  seatIds?: string[]
  mode: BookingMode
  userId?: string
}

export async function getComputerLabs(): Promise<ComputerLab[]> {
  const res = await http.get<ComputerLab[]>('/computer-labs')
  return res.data
}

export async function getComputerLabById(roomId: number): Promise<ComputerLab> {
  const res = await http.get<ComputerLab>(`/computer-labs/${roomId}`)
  return res.data
}

/** 创建机房（唯一走 request body 的旧接口，保持 data 传参） */
export async function createComputerLab(labData: ComputerLab): Promise<void> {
  await http.post('/computer-labs', labData)
}

export async function updateComputerLab(labData: ComputerLab): Promise<void> {
  await http.put(`/computer-labs/${labData.roomId}`, null, {
    params: {
      name: labData.name,
      totalSeats: labData.totalSeats,
      allowedRoles: labData.allowedRoles,
      status: labData.status,
      managerId: labData.managerId,
      equipmentInfo: labData.equipmentInfo,
    },
  })
}

export async function deleteComputerLab(labId: number): Promise<void> {
  await http.delete(`/computer-labs/${labId}`)
}

export async function getSeatsByRoomId(roomId: number): Promise<Seat[]> {
  const res = await http.get<Seat[]>('/seats', { params: { roomId } })
  return res.data
}

/** 按时间段查询座位状态 */
export async function getSeatsStatusByTime(params: {
  roomId: number
  date: string
  startTime: string
  endTime: string
}): Promise<Seat[]> {
  const res = await http.get<Seat[]>('/seats/status', { params })
  return res.data
}

/** 创建预约 */
export async function createBooking(params: CreateBookingParams): Promise<void> {
  await http.post('/reservations', null, { params })
}

/** 按用户查询预约 */
export async function getUserReservations(userId: string): Promise<Reservation[]> {
  const res = await http.get<Reservation[]>('/reservations/user', { params: { userId } })
  return res.data
}

/** 取消预约 */
export async function cancelReservation(params: {
  reservationId: string
  userId: string
}): Promise<void> {
  await http.delete('/reservations', { params })
}

/** 更新座位状态（单个或批量，批量以逗号拼接沿用旧契约） */
export async function updateSeatStatus(params: {
  roomId: number
  seatId?: string
  seatIds?: string[]
  status: string
}): Promise<void> {
  await http.put('/seats/status', null, {
    params: {
      roomId: params.roomId,
      seatId: params.seatId,
      seatIds: params.seatIds ? params.seatIds.join(',') : undefined,
      status: params.status,
    },
  })
}
