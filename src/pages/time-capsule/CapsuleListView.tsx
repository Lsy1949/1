// 时光胶囊 · 列表页（背景水印 + 头部 + 档案列表 + 浮动新建按钮）
// 页面层负责数据拉取 / 删除 mutation / 三态兜底，列表区为 Props 驱动的纯展示组件
import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App, Button, Result, Skeleton } from 'antd'
import { ListArchive, ListHeader } from '@/features/time-capsule'
import type { CapsuleFilterType, ListArchiveRef } from '@/features/time-capsule'
import { capsuleApi } from '@/api'
import { useI18n } from '@/i18n'
import { useCapsuleBoard } from './capsuleQuery'
import './CapsuleListView.css'

export function CapsuleListView() {
  const router = useNavigate()
  const { t } = useI18n()
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

      {/* 顶部编辑式标题区 */}
      <ListHeader />

      {isPending ? (
        /* 首次加载：统计条 + 档案列表骨架 */
        <div className="capsule-state">
          <Skeleton active title={{ width: '46%' }} paragraph={{ rows: 2 }} />
          <Skeleton active title={false} paragraph={{ rows: 6 }} />
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

      {/* 右下角新建按钮 */}
      <button
        className="fab-button"
        onClick={(e) => {
          e.stopPropagation()
          createCapsule()
        }}
      >
        <span className="fab-plus">+</span>
        <span className="fab-label">{t('capsule.list.fab')}</span>
      </button>
    </div>
  )
}

export default CapsuleListView
