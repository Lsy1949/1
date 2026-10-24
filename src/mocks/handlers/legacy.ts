import { http } from 'msw'
import { mocked, ok } from '../utils/response'

/**
 * 旧后端遗留模块 mock（admin / user / schedule / reservation / lab）。
 *
 * 定位：仅保证对应页面在 mock 下能打开、基础交互可用（无 ECONNREFUSED）。
 * - 契约 = 旧 Vue 后端形态（URL / query 传参），后端对接后预计废弃
 * - 不做租户差异化（功能页数据统一）；写操作改内存数组，刷新即重置
 * - 联调真实后端时本文件整体删除（handlers.ts 同步去掉一行）
 */
import type { UserInfo } from '@/api/modules/types'

// ---------- 内存数据（模块级单例；写操作直接变更，刷新页面重置） ----------
const now = () => new Date().toISOString().slice(0, 10)

const teachers: UserInfo[] = [
  { userId: 't001', name: '王老师', roleId: 'teacher', phone: '13800000001', email: 't001@psy.com', school: '心理学院' },
  { userId: 't002', name: '李老师', roleId: 'teacher', phone: '13800000002', email: 't002@psy.com', school: '心理学院' },
]
const admins: UserInfo[] = [{ userId: 'a001', name: '管理员', roleId: 'admin', phone: '13900000001', email: 'a001@psy.com' }]
const students: UserInfo[] = [
  { userId: '2024001', name: '张同学', roleId: 'student', phone: '13700000001', email: 's001@psy.com', school: '计算机学院', major: '软件工程', enrollYear: '2024' },
  { userId: '2024002', name: '刘同学', roleId: 'student', phone: '13700000002', email: 's002@psy.com', school: '外国语学院', major: '英语', enrollYear: '2024' },
]

/** 按角色聚合的"全部用户"视图（GET /users） */
const allUsers = (): UserInfo[] => [...teachers, ...students, ...admins]

const courses = [
  { courseName: '大学生心理健康', teacherName: '王老师', weekDay: 1, startTime: '08:00', endTime: '09:40', location: '教一 101', weeks: '1-16' },
  { courseName: '职业生涯规划', teacherName: '李老师', weekDay: 3, startTime: '10:00', endTime: '11:40', location: '教二 203', weeks: '1-16' },
  { courseName: '团体心理辅导', teacherName: '王老师', weekDay: 5, startTime: '14:00', endTime: '15:40', location: '实训楼 305', weeks: '3-12' },
]

const term = { termName: '2026-2027 第一学期', startDate: '2026-09-07', endDate: '2027-01-17', weekNumber: 7 }

const labs = [
  { roomId: 1, name: '心理测评机房（一）', totalSeats: 40, allowedRoles: ['student', 'teacher'], status: 'open', managerId: 't001', equipmentInfo: '测评终端 40 台' },
  { roomId: 2, name: '心理测评机房（二）', totalSeats: 30, allowedRoles: ['student'], status: 'open', managerId: 't002', equipmentInfo: '测评终端 30 台' },
  { roomId: 3, name: '团体辅导室', totalSeats: 12, allowedRoles: ['teacher'], status: 'closed', managerId: 't001', equipmentInfo: '环形桌 + 投影' },
]

/** 座位生成：前 2 个 occupied、其余 free（简化状态展示） */
const seatsOf = (roomId: number, total: number) =>
  Array.from({ length: total }, (_, i) => ({
    seatId: `${roomId}-${String(i + 1).padStart(2, '0')}`,
    roomId,
    status: i < 2 ? 'occupied' : 'free',
  }))

let reservations: Array<Record<string, unknown>> = [
  { reservationId: 'r-001', roomId: 1, userId: '2024001', reservationDate: now(), startTime: '10:00', endTime: '12:00', status: 'approved', seatIds: ['1-03'] },
  { reservationId: 'r-002', roomId: 2, userId: '2024002', reservationDate: now(), startTime: '14:00', endTime: '16:00', status: 'pending', seatIds: ['2-05'] },
]

// ---------- handlers ----------
export const legacyHandlers = [
  // ===== admin（管理端用户管理） =====
  http.get('/api/teachers', mocked(() => ok<UserInfo[]>(teachers))),
  http.get('/api/users', mocked(() => ok<UserInfo[]>(allUsers()))),
  http.get('/api/admins', mocked(() => ok<UserInfo[]>(admins))),
  http.post(
    '/api/admin/create',
    mocked(({ request }) => {
      const q = new URL(request.url).searchParams
      const roleId = (q.get('roleId') ?? 'student') as UserInfo['roleId']
      const item: UserInfo = { userId: q.get('userId') ?? '', name: q.get('name') ?? '', roleId, phone: q.get('phone') ?? '', email: q.get('email') ?? '' }
      if (roleId === 'teacher') teachers.push(item)
      else if (roleId === 'admin') admins.push(item)
      else students.push(item)
      return ok<null>(null, '创建成功')
    }),
  ),
  http.delete(
    '/api/admin/delete',
    mocked(({ request }) => {
      const q = new URL(request.url).searchParams
      const userId = q.get('userId') ?? ''
      removeUser(userId)
      return ok<null>(null, '删除成功')
    }),
  ),
  http.post('/api/admin/update_user', mocked(() => ok<null>(null, '更新成功'))),
  http.post('/api/admin/reset_password', mocked(() => ok<null>(null, '密码已重置'))),

  // ===== user（个人信息 / 学生管理） =====
  http.post('/api/admin/update', mocked(() => ok<null>(null, '更新成功'))),
  http.post('/api/user/update', mocked(() => ok<null>(null, '更新成功'))),
  http.post('/api/user/update_password', mocked(() => ok<null>(null, '密码已修改'))),
  http.post('/api/teacher/update_password', mocked(() => ok<null>(null, '密码已修改'))),
  http.post('/api/admin/update_password', mocked(() => ok<null>(null, '密码已修改'))),
  http.get(
    '/api/usersInfo',
    mocked(({ request }) => {
      const roleId = new URL(request.url).searchParams.get('roleId')
      const list = roleId === 'teacher' ? teachers : roleId === 'admin' ? admins : students
      return ok<UserInfo[]>(list)
    }),
  ),
  http.post(
    '/api/user/add_student',
    mocked(({ request }) => {
      const q = new URL(request.url).searchParams
      students.push({ userId: q.get('userId') ?? '', name: q.get('name') ?? '', roleId: 'student', school: q.get('school') ?? '', major: q.get('major') ?? '' })
      return ok<null>(null, '新增成功')
    }),
  ),
  http.delete(
    '/api/user/delete_student',
    mocked(({ request }) => {
      removeUser(new URL(request.url).searchParams.get('userId') ?? '')
      return ok<null>(null, '删除成功')
    }),
  ),

  // ===== schedule（课表） =====
  http.get('/api/user/courses', mocked(() => ok(courses))),
  http.get('/api/current_term', mocked(() => ok(term))),

  // ===== reservation（管理端预约审核） =====
  http.get('/api/reservations/all', mocked(() => ok(reservations))),
  http.put(
    '/api/reservations/status',
    mocked(({ request }) => {
      const q = new URL(request.url).searchParams
      const hit = reservations.find((r) => r.reservationId === q.get('reservationId'))
      if (hit) hit.status = q.get('status') ?? hit.status
      return ok<null>(null, '状态已更新')
    }),
  ),
  http.delete(
    '/api/deleteReservation',
    mocked(({ request }) => {
      const id = new URL(request.url).searchParams.get('reservationId') ?? ''
      reservations = reservations.filter((r) => r.reservationId !== id)
      return ok<null>(null, '删除成功')
    }),
  ),

  // ===== lab（机房 / 座位 / 预约） =====
  http.get('/api/computer-labs', mocked(() => ok(labs))),
  http.get(
    '/api/computer-labs/:roomId',
    mocked(({ params }) => {
      const roomId = Number(params.roomId)
      return ok(labs.find((l) => l.roomId === roomId) ?? null)
    }),
  ),
  http.post(
    '/api/computer-labs',
    mocked(async ({ request }) => {
      const body = (await request.json().catch(() => ({}))) as { roomId?: number }
      labs.push({ ...(body as object), roomId: body?.roomId ?? labs.length + 1 } as never)
      return ok<null>(null, '创建成功')
    }),
  ),
  http.put('/api/computer-labs/:roomId', mocked(() => ok<null>(null, '更新成功'))),
  http.delete(
    '/api/computer-labs/:labId',
    mocked(({ params }) => {
      const idx = labs.findIndex((l) => l.roomId === Number(params.labId))
      if (idx > -1) labs.splice(idx, 1)
      return ok<null>(null, '删除成功')
    }),
  ),
  http.get(
    '/api/seats',
    mocked(({ request }) => {
      const roomId = Number(new URL(request.url).searchParams.get('roomId'))
      const lab = labs.find((l) => l.roomId === roomId)
      return ok(seatsOf(roomId, lab?.totalSeats ?? 20))
    }),
  ),
  http.get('/api/seats/status', mocked(({ request }) => {
    const q = new URL(request.url).searchParams
    const roomId = Number(q.get('roomId'))
    const lab = labs.find((l) => l.roomId === roomId)
    return ok(seatsOf(roomId, lab?.totalSeats ?? 20))
  })),
  http.post(
    '/api/reservations',
    mocked(({ request }) => {
      const q = new URL(request.url).searchParams
      reservations.push({
        reservationId: `r-${Date.now()}`,
        roomId: Number(q.get('roomId')),
        userId: q.get('userId') ?? '',
        reservationDate: q.get('reservationDate') ?? now(),
        startTime: q.get('startTime') ?? '',
        endTime: q.get('endTime') ?? '',
        seatIds: (q.get('seatIds') ?? '').split(',').filter(Boolean),
        status: 'pending',
      })
      return ok<null>(null, '预约成功，等待审核')
    }),
  ),
  http.get(
    '/api/reservations/user',
    mocked(({ request }) => {
      const userId = new URL(request.url).searchParams.get('userId')
      return ok(reservations.filter((r) => r.userId === userId))
    }),
  ),
  http.delete(
    '/api/reservations',
    mocked(({ request }) => {
      const q = new URL(request.url).searchParams
      reservations = reservations.filter((r) => !(r.reservationId === q.get('reservationId') && r.userId === q.get('userId')))
      return ok<null>(null, '预约已取消')
    }),
  ),
  http.put('/api/seats/status', mocked(() => ok<null>(null, '座位状态已更新'))),
]

/** 按 userId 从三个列表中移除（admin.delete / user.delete_student 共用） */
function removeUser(userId: string): void {
  const idxT = teachers.findIndex((u) => u.userId === userId)
  if (idxT > -1) teachers.splice(idxT, 1)
  const idxS = students.findIndex((u) => u.userId === userId)
  if (idxS > -1) students.splice(idxS, 1)
  const idxA = admins.findIndex((u) => u.userId === userId)
  if (idxA > -1) admins.splice(idxA, 1)
}
