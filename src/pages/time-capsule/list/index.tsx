// 时光胶囊 · 列表页（背景水印 + 头部主行动 + 档案列表）
// 页面层负责数据拉取 / 删除 mutation / 三态兜底，列表区为 Props 驱动的纯展示组件
import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App, Button, Result } from 'antd'
import { ListArchive, ListHeader } from '@/features/time-capsule'
import type { CapsuleFilterType, ListArchiveRef } from '@/features/time-capsule'
import { capsuleApi } from '@/api'
import { useTranslation } from 'react-i18next'
import { useCapsuleBoard } from '../capsuleQuery'
import './index.css'

export function CapsuleListView() {
  const router = useNavigate()
  const { t } = useTranslation()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [filterType, setFilterType] = useState<CapsuleFilterType>('all')
  const { capsules, stats, isPending, isError, refetch } = useCapsuleBoard(filterType)

  const archiveRef = useRef<ListArchiveRef | null>(null)

  // 点击页面空白处收起左滑删除面板
  const closeAll = useCallback(() => {
    archiveRef.current?.closeAll()
  }, [])

  const viewCapsule = (id: number) => {
    router(`/time-capsule/${id}`)
  }

  const createCapsule = () => {
    router('/time-capsule/create')
  }

  // 删除：不在本地维护胶囊数组，成功后统一失效 ['capsules'] 前缀（列表 + 统计）
  const deleteMutation = useMutation({
    mutationFn: (id: number) => capsuleApi.deleteCapsule(id),
    onSuccess: () => {
      message.success(t('capsule.list.deleteSuccess'))
      return queryClient.invalidateQueries({ queryKey: ['capsules'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  return (
    <div className="capsule-list-page" onClick={closeAll}>
      {/* 装饰性背景水印 */}
      <span className="watermark" aria-hidden="true">CAPSULE</span>

      {/* 顶部编辑式标题区（含主行动） */}
      <ListHeader onCreate={createCapsule} />

      {isPending ? (
        /* 首次加载：与档案列表同构的骨架（统计条 + 信封行），避免布局跳动 */
        <div className="capsule-state" aria-busy="true">
          <div className="capsule-skeleton-stats">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="capsule-skeleton-stat" />
            ))}
          </div>
          <div className="capsule-skeleton-list">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="capsule-skeleton-row">
                <span className="capsule-skeleton-serial" />
                <div className="capsule-skeleton-body">
                  <span className="capsule-skeleton-title" />
                  <span className="capsule-skeleton-meta" />
                </div>
                <span className="capsule-skeleton-tag" />
              </div>
            ))}
          </div>
        </div>
      ) : isError ? (
        /* 加载失败：提示 + 重试 */
        <div className="capsule-state">
          <Result
            status="error"
            title={t('common.loadFailed')}
            extra={
              <Button type="primary" onClick={() => void refetch()}>
                {t('common.retry')}
              </Button>
            }
          />
        </div>
      ) : (
        /* 统计 / 筛选 / 档案列表 / 空状态 */
        <ListArchive
          ref={archiveRef}
          capsules={capsules}
          stats={stats}
          filterType={filterType}
          onFilterChange={setFilterType}
          onOpen={viewCapsule}
          onCreate={createCapsule}
          onDelete={deleteMutation.mutate}
        />
      )}
    </div>
  )
}

export default CapsuleListView
