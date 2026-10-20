import { del, get, post } from '../request'
import type {
  CapsuleCreateDTO,
  CapsuleDetailDTO,
  CapsuleListItemDTO,
  CapsuleListQuery,
} from '../types'

/**
 * 时光胶囊模块 API。
 *
 * 列表过滤（status / 开启时间区间）由后端完成；
 * 状态与开启方式文案在前端按 i18n 解析，接口不下发文案。
 */

/** 胶囊列表（status 缺省为 all） */
export function fetchCapsules(
  query: CapsuleListQuery = {},
  signal?: AbortSignal,
): Promise<CapsuleListItemDTO[]> {
  const params: Record<string, unknown> = { status: query.status ?? 'all' }
  if (query.openDateFrom) params.openDateFrom = query.openDateFrom
  if (query.openDateTo) params.openDateTo = query.openDateTo

  return get<CapsuleListItemDTO[]>('/api/capsules', { params, signal })
}

/** 胶囊详情（不存在时后端返回 404） */
export function fetchCapsuleDetail(
  id: number | string,
  signal?: AbortSignal,
): Promise<CapsuleDetailDTO> {
  return get<CapsuleDetailDTO>(`/api/capsules/${id}`, { signal })
}

/** 删除胶囊（成功返回 null） */
export function deleteCapsule(id: number | string): Promise<null> {
  return del<null>(`/api/capsules/${id}`)
}

/** 新建胶囊（返回创建成功的完整实体） */
export function createCapsule(input: CapsuleCreateDTO): Promise<CapsuleDetailDTO> {
  return post<CapsuleDetailDTO>('/api/capsules', input)
}
