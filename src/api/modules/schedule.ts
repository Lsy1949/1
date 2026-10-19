import http from '../http'

/**
 * 课表模块（对照旧 api/schedule.js）。
 */

/** 课程条目（后端字段未定，最小集） */
export interface Course {
  courseName?: string
  teacherName?: string
  weekDay?: number
  startTime?: string
  endTime?: string
  location?: string
  weeks?: string
  [key: string]: unknown
}

/** 学期信息 */
export interface TermInfo {
  termName?: string
  startDate?: string
  endDate?: string
  weekNumber?: number
  [key: string]: unknown
}

/** 获取课表（按角色） */
export async function getSchedule(roleId: 'student' | 'teacher', userId: string): Promise<Course[]> {
  const res = await http.get<Course[]>('/user/courses', { params: { roleId, userId } })
  return res.data
}

/** 获取当前学期信息 */
export async function getCurrentTerm(): Promise<TermInfo> {
  const res = await http.get<TermInfo>('/current_term')
  return res.data
}
