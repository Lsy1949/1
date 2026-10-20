// 时光胶囊 · 统计栏 + 筛选导航 + 档案列表（左滑删除手势）+ 空状态
// 纯展示组件：数据由页面下发，删除行为经 onDelete 上抛（页面负责 mutation）
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { App as AntApp } from 'antd'
import { DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import { useReveal } from '@/hooks/useReveal'
import { useI18n } from '@/i18n'
import type { CapsuleFilterType, CapsuleItem, CapsuleStats } from '../types'
import styles from './ListArchive.module.css'

export interface ListArchiveProps {
  capsules: CapsuleItem[]
  stats: CapsuleStats
  filterType: CapsuleFilterType
  onFilterChange: (type: CapsuleFilterType) => void
  onOpen: (id: number) => void
  onCreate: () => void
  onDelete: (id: number) => void
}

export interface ListArchiveRef {
  closeAll: () => void
}

// 左滑删除相关常量
const DELETE_WIDTH = 92
const REVEAL_THRESHOLD = 40

type Translate = (key: string, params?: Record<string, unknown>) => string

function statusKey(item: CapsuleItem): string {
  if (item.auditStatus === 0) return 'auditing'
  if (item.auditStatus === 2) return 'rejected'
  if (item.status === 'pending') return 'pending'
  if (item.sendStatus === 'failed') return 'failed'
  return 'opened'
}

function statusLabel(item: CapsuleItem, t: Translate): string {
  if (item.auditStatus === 0) return t('capsule.list.status.auditing')
  if (item.auditStatus === 2) return t('capsule.list.status.rejected')
  if (item.status === 'pending') return t('capsule.list.status.pending')
  if (item.sendStatus === 'failed') return t('capsule.list.status.failed')
  return t('capsule.list.status.opened')
}

function methodLabel(m: string, t: Translate): string {
  return m === 'letter' ? t('capsule.list.method.letter') : t('capsule.list.method.email')
}

/** 单条档案（抽为内部子组件：v-reveal="idx * 50" 的 Hook 不能在 map 中调用） */
interface ArchiveEntryProps {
  item: CapsuleItem
  index: number
  offset: number
  noTransition: boolean
  onCardClick: (item: CapsuleItem) => void
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>, item: CapsuleItem) => void
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: () => void
  onDelete: (id: number) => void
}

function ArchiveEntry({
  item,
  index,
  offset,
  noTransition,
  onCardClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDelete,
}: ArchiveEntryProps) {
  const { t } = useI18n()
  const revealRef = useReveal<HTMLDivElement>({ delay: index * 50 })

  return (
    <div ref={revealRef} className={styles.archiveEntry}>
      {/* 大号背景编号 */}
      <span className={styles.entryBgNum} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>

      {/* 可滑动内容 */}
      <div
        className={`${styles.swipeTrack}${noTransition ? ` ${styles.noTransition}` : ''}`}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {/* 信封式卡片 */}
        <div
          className={`${styles.envelope} env-${statusKey(item)}`}
          onClick={() => onCardClick(item)}
          onPointerDown={(e) => onPointerDown(e, item)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* 信封顶部虚线 */}
          <div className={styles.envFlap}></div>

          {/* 左侧：编号 + 心情 */}
          <div className={styles.envLeft}>
            <span className={styles.envSerial}>{String(index + 1).padStart(2, '0')}</span>
            <span className={styles.envEmoji}>{item.emotionEmoji}</span>
          </div>

          {/* 中间：标题 + 元信息 */}
          <div className={styles.envCenter}>
            <h3 className={styles.envTitle}>{item.title}</h3>
            <div className={styles.envMeta}>
              <span className={styles.metaDate}>{item.openDate}</span>
              <span className={styles.metaDot}>·</span>
              {item.openMethod && <span className={styles.metaMethod}>{methodLabel(item.openMethod, t)}</span>}
              {item.status === 'pending' && item.remainingDays > 0 && (
                <>
                  <span className={styles.metaDot}>·</span>
                  <span className={styles.metaCountdown}>{t('capsule.list.countdown', { days: item.remainingDays })}</span>
                </>
              )}
            </div>
          </div>

          {/* 右侧：状态标签 */}
          <div className={styles.envRight}>
            <span className={`${styles.statusTag} tag-${statusKey(item)}`}>
              {statusLabel(item, t)}
            </span>
          </div>
        </div>
      </div>

      {/* 滑出删除面板（delete-panel 为字符串协议类：onPointerDown 中 closest('.delete-panel') 依赖字面量匹配） */}
      <div className="delete-panel" onClick={() => onDelete(item.id)}>
        <DeleteOutlined className={styles.deleteIcon} />
        <span className={styles.deleteText}>{t('capsule.list.delete')}</span>
      </div>
    </div>
  )
}

export const ListArchive = forwardRef<ListArchiveRef, ListArchiveProps>(
  function ListArchive(
    { capsules, stats, filterType, onFilterChange, onOpen, onCreate, onDelete },
    ref,
  ) {
    const { t } = useI18n()
    const { modal } = AntApp.useApp() // 替代 ElMessageBox

    const statsBarRef = useReveal<HTMLDivElement>({ delay: 140 })
    const filterNavRef = useReveal<HTMLElement>({ delay: 160 })

    // 左滑偏移：state 驱动渲染 + ref 镜像保证手势读写同步
    const [offsets, setOffsets] = useState<Record<number, number>>({})
    const offsetsRef = useRef<Record<number, number>>({})
    const updateOffset = (id: number, val: number) => {
      offsetsRef.current = { ...offsetsRef.current, [id]: val }
      setOffsets(offsetsRef.current)
    }

    // 拖拽过程数据放 ref（避免高频重渲染与闭包陈旧），仅活跃拖拽 id 进 state 驱动 no-transition 类
    const dragRef = useRef<{ id: number | null; startX: number; startY: number; startOffset: number; dragging: boolean; moved: boolean }>({
      id: null, startX: 0, startY: 0, startOffset: 0, dragging: false, moved: false,
    })
    const [activeDragId, setActiveDragId] = useState<number | null>(null)
    const wasDragged = useRef(false)

    const filterTabs: { type: CapsuleFilterType; label: string }[] = [
      { type: 'all', label: t('capsule.list.filter.all') },
      { type: 'pending', label: t('capsule.list.filter.pending') },
      { type: 'opened', label: t('capsule.list.filter.opened') },
    ]

    const totalCount = stats.total
    const pendingCount = stats.pending
    const openedCount = stats.opened
    const auditingCount = stats.auditing

    const getTabCount = (type: string) => {
      if (type === 'all') return stats.total
      if (type === 'pending') return stats.pending
      return stats.opened
    }

    // --- 左滑删除手势 ---
    const getOffset = (id: number) => offsetsRef.current[id] || 0

    const closeAll = () => {
      Object.keys(offsetsRef.current).forEach((k) => {
        const id = Number(k)
        if (offsetsRef.current[id] !== 0) updateOffset(id, 0)
      })
    }

    useImperativeHandle(ref, () => ({ closeAll }), [])

    const onCardClick = (item: CapsuleItem) => {
      if (wasDragged.current) {
        wasDragged.current = false
        return
      }
      if (getOffset(item.id) !== 0) {
        updateOffset(item.id, 0)
        return
      }
      onOpen(item.id)
    }

    const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>, item: CapsuleItem) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      if ((e.target as HTMLElement).closest('.delete-panel')) return
      wasDragged.current = false
      dragRef.current = {
        id: item.id,
        startX: e.clientX,
        startY: e.clientY,
        startOffset: offsetsRef.current[item.id] || 0,
        dragging: false,
        moved: false,
      }
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* 忽略 pointer capture 失败 */
      }
    }

    const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (drag.id === null) return
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (!drag.dragging) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        if (Math.abs(dy) > Math.abs(dx)) {
          drag.id = null
          return
        }
        drag.dragging = true
        drag.moved = true
        setActiveDragId(drag.id)
      }
      let next = drag.startOffset + dx
      if (next > 0) next = next * 0.3
      if (next < -DELETE_WIDTH) next = -DELETE_WIDTH + (next + DELETE_WIDTH) * 0.3
      updateOffset(drag.id, next)
    }

    const onPointerUp = () => {
      const drag = dragRef.current
      if (drag.id === null) return
      const id = drag.id
      const offset = offsetsRef.current[id] || 0
      const moved = drag.moved
      Object.keys(offsetsRef.current).forEach((k) => {
        const key = Number(k)
        if (key !== id && offsetsRef.current[key] !== 0) updateOffset(key, 0)
      })
      if (offset < -REVEAL_THRESHOLD) {
        updateOffset(id, -DELETE_WIDTH)
      } else {
        updateOffset(id, 0)
      }
      drag.id = null
      drag.dragging = false
      setActiveDragId(null)
      if (moved) wasDragged.current = true
    }

    const deleteCapsule = (id: number) => {
      modal.confirm({
        title: t('capsule.list.deleteTitle'),
        content: t('capsule.list.deleteConfirm'),
        okText: t('capsule.list.deleteOk'),
        cancelText: t('capsule.list.deleteCancelled'),
        icon: <ExclamationCircleFilled />,
        okButtonProps: { danger: true },
        onOk: () => {
          // 数据变更与反馈由页面（useMutation）负责，这里只上抛意图
          onDelete(id)
          updateOffset(id, 0)
        },
        onCancel: () => {
          updateOffset(id, 0)
        },
      })
    }

    return (
      <>
        {/* 统计数据栏 · 横向编辑式 */}
        <div ref={statsBarRef} className={styles.statsBar}>
          <div className={styles.statBlock}>
            <span className={styles.statValue}>{String(totalCount).padStart(2, '0')}</span>
            <span className={styles.statLabel}>{t('capsule.list.stats.total')}</span>
          </div>
          <span className={styles.statDivider}></span>
          <div className={styles.statBlock}>
            <span className={`${styles.statValue} ${styles.statPending}`}>{String(pendingCount).padStart(2, '0')}</span>
            <span className={styles.statLabel}>{t('capsule.list.stats.pending')}</span>
          </div>
          <span className={styles.statDivider}></span>
          <div className={styles.statBlock}>
            <span className={`${styles.statValue} ${styles.statOpened}`}>{String(openedCount).padStart(2, '0')}</span>
            <span className={styles.statLabel}>{t('capsule.list.stats.opened')}</span>
          </div>
          <span className={styles.statDivider}></span>
          <div className={styles.statBlock}>
            <span className={`${styles.statValue} ${styles.statAuditing}`}>{String(auditingCount).padStart(2, '0')}</span>
            <span className={styles.statLabel}>{t('capsule.list.stats.auditing')}</span>
          </div>
        </div>

        {/* 筛选导航 · 下划线式 */}
        <nav ref={filterNavRef} className={styles.filterNav}>
          {filterTabs.map((tab) => (
            <div
              key={tab.type}
              className={`${styles.navItem}${filterType === tab.type ? ` ${styles.active}` : ''}`}
              onClick={() => onFilterChange(tab.type)}
            >
              <span className={styles.navLabel}>{tab.label}</span>
              <span className={styles.navCount}>({getTabCount(tab.type)})</span>
            </div>
          ))}
        </nav>

        {/* 胶囊档案列表（页面已按 status 过滤，组件只负责渲染） */}
        {capsules.length > 0 ? (
          <main className={styles.capsuleArchive}>
            <div className={styles.archiveList}>
              {capsules.map((item, idx) => (
                <ArchiveEntry
                  key={item.id}
                  item={item}
                  index={idx}
                  offset={offsets[item.id] || 0}
                  noTransition={activeDragId === item.id}
                  onCardClick={onCardClick}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onDelete={deleteCapsule}
                />
              ))}
            </div>

            {/* 档案结尾标记 */}
            <div className={styles.archiveEnd}>
              <span className={styles.endLine}></span>
              <span className={styles.endText}>ARCHIVE END</span>
              <span className={styles.endLine}></span>
            </div>
          </main>
        ) : (
          /* 空状态 */
          <div className={styles.emptyArchive}>
            <div className={styles.emptyStamp}>
              <span className={styles.stampText}>EMPTY</span>
            </div>
            <h2 className={styles.emptyTitle} dangerouslySetInnerHTML={{ __html: t('capsule.list.empty.title') }}></h2>
            <p className={styles.emptyHint}>{t('capsule.list.empty.hint')}</p>
            <button className={styles.emptyBtn} onClick={onCreate}>
              <span>{t('capsule.list.empty.btn')}</span>
              <span className={styles.btnArrow}>→</span>
            </button>
          </div>
        )}
      </>
    )
  }
)

export default ListArchive
