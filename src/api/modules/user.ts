import http from '../http'
import type { RoleId, UserInfo, UpdatePasswordParams } from './types'

/**
 * 用户信息模块（对照旧 api/user.js 的非登录部分）。
 * 全部沿旧 URL 与 params 契约。
 * // TODO: 待后端确认 @RequestParam vs @RequestBody（Q3）
 */

/** 更新个人信息（学生/教师走 /user/update，管理员走 /admin/update） */
export async function updateProfile(data: UserInfo & { roleId: RoleId }): Promise<void> {
  const url = data.roleId === 'admin' ? '/admin/update' : '/user/update'
  await http.post(url, null, { params: data })
}

/** 修改密码（按角色分流） */
export async function updatePassword(data: UpdatePasswordParams): Promise<void> {
  const rolePath = ROLE[data.roleId]
  await http.post(`/${rolePath}/update_password`, null, { params: data })
}

const ROLE: Record<string, string> = {
  student: 'user',
  teacher: 'teacher',
  admin: 'admin',
}

/** 获取全部学生（管理端） */
export async function getAllStudents(): Promise<UserInfo[]> {
  const res = await http.get<UserInfo[]>('/usersInfo', { params: { roleId: 'student' } })
  return res.data
}

/** 新增学生 */
export async function addStudent(data: UserInfo): Promise<void> {
  await http.post('/user/add_student', null, { params: data })
}

/** 删除学生 */
export async function deleteStudent(userId: string): Promise<void> {
  await http.delete('/user/delete_student', { params: { userId } })
}
