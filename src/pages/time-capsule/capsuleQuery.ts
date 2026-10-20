/**
 * 时光胶囊列表页数据层：
 *  - 列表按 status 走服务端过滤；
 *  - 统计基数固定取全量（filter=all），与列表查询共用 queryKey 时自动去重。
 */
import { useMemo } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { capsuleApi } from '@/api'
import type { CapsuleListItemDTO } from '@/api'
import type { CapsuleFilterType, CapsuleStats } from '@/features/time-capsule'

export function useCapsuleBoard(filter: CapsuleFilterType) {
  const listQuery = useQuery({
    queryKey: ['capsules', 'list', filter],
    queryFn: ({ signal }) => capsuleApi.fetchCapsules({ status: filter }, signal),
    placeholderData: keepPreviousData,
  })

  // 统计口径需要全量数据；filter=all 时与上面的查询共享缓存
  const allQuery = useQuery({
    queryKey: ['capsules', 'list', 'all'],
    queryFn: ({ signal }) => capsuleApi.fetchCapsules({ status: 'all' }, signal),
  })

  const allItems = filter === 'all' ? listQuery.data : allQuery.data

  const stats = useMemo(() => buildStats(allItems ?? []), [allItems])

  return {
    capsules: listQuery.data ?? [],
    stats,
    isPending: listQuery.isPending,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
  }
}

/** 统计口径与原列表页保持一致 */
export function buildStats(items: CapsuleListItemDTO[]): CapsuleStats {
  return {
    total: items.length,
    pending: items.filter(item => item.status === 'pending' && item.auditStatus === 1).length,
    opened: items.filter(item => item.status === 'opened').length,
    auditing: items.filter(item => item.auditStatus === 0).length,
  }
}
