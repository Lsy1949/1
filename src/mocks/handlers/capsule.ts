import { http } from 'msw'
import { mocked, ok, fail } from '../utils/response'
import { createCapsule, findCapsule, listCapsules, removeCapsule } from '../data/capsule'
import { API_CODE } from '@/api/types'
import type {
  CapsuleCreateDTO,
  CapsuleDetailDTO,
  CapsuleListItemDTO,
  CapsuleListQuery,
} from '@/api/types'

/**
 * 时光胶囊接口。
 *
 * 列表过滤（status / openDateFrom / openDateTo）在 mock 内完成；
 * DELETE 直接改写内存数组并持久化到 localStorage，刷新后状态一致。
 * 延迟与错误注入统一由 mocked() 提供（300ms / VITE_MOCK_ERROR）。
 */
export const capsuleHandlers = [
  http.get(
    '/api/capsules',
    mocked(({ request }) => {
      const url = new URL(request.url)
      const query: CapsuleListQuery = {
        status: (url.searchParams.get('status') ?? 'all') as CapsuleListQuery['status'],
        openDateFrom: url.searchParams.get('openDateFrom') || undefined,
        openDateTo: url.searchParams.get('openDateTo') || undefined,
      }
      return ok<CapsuleListItemDTO[]>(listCapsules(query))
    }),
  ),

  http.post(
    '/api/capsules',
    mocked(async ({ request }) => {
      const body = (await request.json()) as CapsuleCreateDTO
      if (!body?.title?.trim()) {
        return fail(API_CODE.BAD_REQUEST, '标题不能为空')
      }
      return ok<CapsuleDetailDTO>(createCapsule(body))
    }),
  ),

  http.get(
    '/api/capsules/:id',
    mocked(({ params }) => {
      const capsule = findCapsule(Number(params.id))
      return capsule
        ? ok<CapsuleDetailDTO>(capsule)
        : fail(API_CODE.NOT_FOUND, '胶囊不存在')
    }),
  ),

  http.delete(
    '/api/capsules/:id',
    mocked(({ params }) => {
      const removed = removeCapsule(Number(params.id))
      return removed
        ? ok<null>(null, 'deleted')
        : fail(API_CODE.NOT_FOUND, '胶囊不存在')
    }),
  ),
]
