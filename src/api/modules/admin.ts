import http from '../http'
import type { UserInfo } from './types'

/**
 * 管理员模块（对照旧 api/admin.js）。
 * // TODO: 待后端确认 @RequestParam vs @RequestBody（Q3）
 */

/** 获取所有教师 */
export async function getAllTeachers(): Promise<UserInfo[]> {
  const res = await http.get<UserInfo[]>('/teachers')
  return res.data
}

/** 获取所有用户 */
export async function getAllUsers(): Promise<UserInfo[]> {
  const res = await http.get<UserInfo[]>('/users')
  return res.data
}

/** 获取所有管理员 */
export async function getAllAdmins(): Promise<UserInfo[]> {
  const res = await http.get<UserInfo[]>('/admins')
  return res.data
}

/** 创建用户（学生/教师/管理员） */
export async function createUser(data: UserInfo): Promise<void> {
  await http.post('/admin/create', null, { params: data })
}

/** 删除用户 */
export async function deleteUser(data: { roleId: string; userId: string }): Promise<void> {
  await http.delete('/admin/delete', { params: data })
}

/** 更新用户信息 */
export async function updateUser(data: UserInfo): Promise<void> {
  await http.post('/admin/update_user', null, { params: data })
}

/** 重置用户密码 */
export async function resetUserPassword(roleId: string, userId: string): Promise<void> {
  await http.post('/admin/reset_password', null, { params: { roleId, userId } })
}
