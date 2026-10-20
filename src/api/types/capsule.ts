/**
 * 时光胶囊 domain DTO。
 *
 * 建模原则（同 article/home）：
 *  - 接口只下发结构 + 业务内容；状态文案由前端按 i18n 解析
 *    （`capsule.list.status.*` / `capsule.list.method.*`）。
 *  - 列表接口不含正文与收件信息，详情接口在列表字段基础上扩展。
 */

export type CapsuleStatus = 'pending' | 'opened'
export type CapsuleSendStatus = 'success' | 'failed'
export type CapsuleAuditStatus = 0 | 1 | 2
export type CapsuleOpenMethod = 'email' | 'letter'

/** 列表项（信封列表/统计条所需字段） */
export interface CapsuleListItemDTO {
  id: number
  title: string
  openDate: string
  status: CapsuleStatus
  sendStatus: CapsuleSendStatus
  auditStatus: CapsuleAuditStatus
  remainingDays: number
  emotionEmoji: string
  openMethod: CapsuleOpenMethod
}

/** 详情项：列表字段 + 正文 / 图片 / 收件信息 */
export interface CapsuleDetailDTO extends CapsuleListItemDTO {
  createDate: string
  content: string
  images: string[]
  emailRecipient?: string
  letterName?: string
  letterPhone?: string
  letterAddress?: string
  isAnonymous: boolean
  emotion: string
  /** 是否公开到广场（新建时选择，详情页暂不展示） */
  isPublic?: boolean
  /** 公开后是否关闭评论 */
  disableComment?: boolean
}

/** 新建胶囊请求体 */
export interface CapsuleCreateDTO {
  title: string
  /** yyyy-MM-dd */
  openDate: string
  openMethod: CapsuleOpenMethod
  /** 富文本 HTML */
  content: string
  /** 图片 data URL 列表 */
  images: string[]
  emotion: string
  isAnonymous: boolean
  isPublic: boolean
  disableComment: boolean
  emailRecipient?: string
  letterName?: string
  letterPhone?: string
  letterAddress?: string
}

/** 列表查询参数（mock 侧模拟真实后端的服务端过滤） */
export interface CapsuleListQuery {
  /** 'all' 或具体状态；缺省等同 'all' */
  status?: 'all' | CapsuleStatus
  /** 开启时间下界（yyyy-MM-dd，含） */
  openDateFrom?: string
  /** 开启时间上界（yyyy-MM-dd，含） */
  openDateTo?: string
}
