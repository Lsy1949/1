/**
 * 业务模块共享类型。
 *
 * 【假设 A1】OpenAPI 契约未提供，以下为按旧 src/api/*.js 行为反推的
 * 本地先行类型；后端契约就绪后由 openapi-typescript 生成类型替换。
 *
 * 【响应体假设 A2】后端返回体直接为业务数据（无统一 code/message 信封）；
 * 旧代码 auth.js 以 response.data 直接消费，佐证此假设。
 * 若后端确认存在信封，只需调整各 modules 的解包层，组件层不动。
 *
 * 【传参契约 Q3】历史接口 POST 一律用 query string（params）传业务数据，
 * 对应后端 @RequestParam。全部标注 TODO，后端确认后仅改本层。
 */

/** 用户角色（与后端 roleId 对齐） */
export type RoleId = 'student' | 'teacher' | 'admin'

/** 登录方式 */
export type LoginType = 'account' | 'phone' | 'email'

/** 登录请求参数（旧 loginApi 的 data，按 loginType 取舍字段） */
export interface LoginParams {
  roleId: RoleId
  loginType?: LoginType
  /** 账号登录：学号/工号 */
  userId?: string
  /** 账号登录：密码 */
  password?: string
  /** 手机登录 */
  phone?: string
  /** 邮箱登录 */
  email?: string
  /** 短信/邮箱验证码 */
  code?: string
  /** 所属学校（租户多校场景下的冗余标识，后端确认后可能移除） */
  school?: string
}

/** 登录成功响应 */
export interface LoginResult {
  token: string
  userInfo: UserInfo
  roleId: RoleId
  message?: string
}

/** 用户信息（后端字段未定，最小集 + 可选扩展位） */
export interface UserInfo {
  userId?: string
  name?: string
  roleId?: RoleId
  phone?: string
  email?: string
  school?: string
  avatar?: string
  [key: string]: unknown
}

/** 修改密码参数 */
export interface UpdatePasswordParams extends Record<string, unknown> {
  roleId: RoleId
  userId: string
  oldPassword?: string
  newPassword?: string
}

/** 发送邮箱验证码参数 */
export interface SendEmailCodeParams {
  email: string
  /** 验证码用途（登录/注册/重置密码），后端确认后调整 */
  scene?: string
}
