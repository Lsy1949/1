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

/**
 * 登录请求参数（契约 §1.1）。
 * - username/password 必填（缺失后端 400；前端表单应提前拦截）
 * - tenantId：主域（psy.com）登录页由学校选择器提交；子域登录省略（由 X-Tenant-Id 头表达）
 * - phone/email/code/loginType 为旧多登录方式残留字段，契约未覆盖，待后端对齐后清理
 */
export interface LoginParams {
  roleId: RoleId
  loginType?: LoginType
  /** 账号：学号/工号/用户名 */
  userId?: string
  /** 密码 */
  password?: string
  /** 目标租户（主域选择器提交；子域省略） */
  tenantId?: string
  /** 手机登录 */
  phone?: string
  /** 邮箱登录 */
  email?: string
  /** 短信/邮箱验证码 */
  code?: string
  /** 所属学校（旧冗余字段，等同于 tenantId，待清理） */
  school?: string
}

/** 登录成功响应（cookie 会话：无 token，登录态由 /api/me 探测） */
export interface LoginResult {
  userInfo: UserInfo
  roleId: RoleId
  message?: string
}

/** 公开租户信息（主域登录页学校选择器数据源，契约 §2.3） */
export interface PublicTenant {
  tenantId: string
  /** 站点身份标识（校名/站名），后端直出，前端不做 i18n */
  name: string
  /** 校徽/站徽 URL；可空——选择器当前只消费 label，不渲染 img，空值不破图 */
  logo?: string
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
