// 时光胶囊 · 列表页（背景水印 + 头部 + 档案列表 + 浮动新建按钮）
import { useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListArchive, ListHeader } from '@/features/time-capsule'
import type { ListArchiveRef } from '@/features/time-capsule'
import { useI18n } from '@/i18n'
import './CapsuleListView.css'

export function CapsuleListView() {
  const router = useNavigate()
  const { t } = useI18n()

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

  return (
    <div className="capsule-list-page" onClick={closeAll}>
      {/* 装饰性背景水印 */}
      <span className="watermark" aria-hidden="true">CAPSULE</span>

      {/* 顶部编辑式标题区 */}
      <ListHeader />

      {/* 统计 / 筛选 / 档案列表 / 空状态 */}
      <ListArchive ref={archiveRef} onOpen={viewCapsule} onCreate={createCapsule} />

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
