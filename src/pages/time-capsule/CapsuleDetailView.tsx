// 时光胶囊 · 详情页（页面层负责取数 / 删除 mutation / 三态兜底，DetailBody 为纯展示）
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App, Button, Result, Skeleton } from 'antd'
import { ApiError, capsuleApi } from '@/api'
import { DetailBody, DetailHeader } from '@/features/time-capsule'
import { useI18n } from '@/i18n'
import './CapsuleDetailView.css'

export function CapsuleDetailView() {
  const router = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { t } = useI18n()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  // 详情：404 视为「胶囊不存在」，其余失败展示重试；不重试 404
  const { data: capsule, isPending, isError, error, refetch } = useQuery({
    queryKey: ['capsules', 'detail', id],
    queryFn: ({ signal }) => capsuleApi.fetchCapsuleDetail(id!, signal),
    enabled: Boolean(id),
    retry: false,
  })

  const isNotFound = isError && error instanceof ApiError && error.status === 404

  useEffect(() => {
    if (isNotFound) router('/time-capsule', { replace: true })
  }, [isNotFound, router])

  // 删除：成功后失效列表缓存并回到列表页
  const deleteMutation = useMutation({
    mutationFn: () => capsuleApi.deleteCapsule(id!),
    onSuccess: () => {
      message.success(t('capsule.detail.deleteSuccess'))
      queryClient.invalidateQueries({ queryKey: ['capsules'] })
      router('/time-capsule', { replace: true })
    },
    onError: (err: Error) => message.error(err.message),
  })

  const goList = () => router('/time-capsule')

  if (!id || isNotFound) return null

  if (isPending) {
    return (
      <div className="detail-page">
        <DetailHeader onBack={goList} />
        <div className="detail-state">
          <Skeleton active title={{ width: '55%' }} paragraph={{ rows: 3 }} />
          <Skeleton active title={false} paragraph={{ rows: 6 }} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="detail-page">
        <DetailHeader onBack={goList} />
        <div className="detail-state">
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
      </div>
    )
  }

  if (!capsule) return null

  return (
    <div className="detail-page">
      {/* 杂志编辑式标题区 */}
      <DetailHeader onBack={goList} />

      {/* 胶囊详情（数据与删除行为均由页面注入） */}
      <DetailBody capsule={capsule} onDelete={() => deleteMutation.mutate()} />
    </div>
  )
}

export default CapsuleDetailView
