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

  const stats = useMemo(
    () => buildStats(Array.isArray(allItems) ? allItems : []),
    [allItems],
  )

  return {
    // 兜底：接口异常/返回非数组时退化为空列表，避免切换页签时因 map 崩溃整页报错
    capsules: Array.isArray(listQuery.data) ? listQuery.data : [],
    stats,
    isPending: listQuery.isPending,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
  }
}

/** 统计口径：与接口 status 过滤保持一致（待开启 = status:pending 全集，
 *  含审核中的条目，否则页签计数会与切换后实际条数不符） */
export function buildStats(items: CapsuleListItemDTO[]): CapsuleStats {
  return {
    total: items.length,
    pending: items.filter(item => item.status === 'pending').length,
    opened: items.filter(item => item.status === 'opened').length,
    auditing: items.filter(item => item.auditStatus === 0).length,
  }
}
