/**
 * 【business】MinePanel —— 「我的」咨询工作台
 * 概览数字 + 我的预约（筛选 / 详情 / 改约 / 取消 / 评价） + 收藏的老师（去预约 / 取消收藏）。
 * 数据与动作全部由页面注入，弹层与预约面板共用同一套组件。
 */
import { useMemo, useState } from 'react'
import { App as AntApp, Button, Empty, Result, Skeleton } from 'antd'
import {
  ArrowRightOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  ExclamationCircleFilled,
  HeartFilled,
  HeartOutlined,
  StarFilled,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type {
  BookingItem,
  BookingStatus,
  Counselor,
  CounselingSummary,
  CounselorAccentKey,
} from '../types'
import { BookingDetailDrawer } from '../BookingPanel/BookingDetailDrawer'
import { RescheduleModal } from '../BookingPanel/RescheduleModal'
import { FeedbackModal } from '../BookingPanel/FeedbackModal'
import styles from './MinePanel.module.css'

/** 主题色 key → 语义色（收藏老师头像底色） */
const ACCENT_COLOR: Record<CounselorAccentKey, string> = {
  primary: 'var(--brand-primary)',
  green: 'var(--cat-green)',
  purple: 'var(--cat-purple)',
  gold: 'var(--cat-gold)',
  red: 'var(--cat-red)',
  cyan: 'var(--cat-cyan)',
  magenta: 'var(--cat-magenta)',
  geekblue: 'var(--cat-geekblue)',
}

type StatusFilter = 'all' | BookingStatus

const FILTER_KEYS: StatusFilter[] = ['all', 'pending', 'confirmed', 'completed', 'cancelled']

export interface MinePanelProps {
  bookings: BookingItem[]
  bookingsLoading?: boolean
  bookingsError?: boolean
  onReloadBookings: () => void
  counselors: Counselor[]
  /** 已收藏老师 ID（接口下发） */
  favoriteIds: number[]
  /** 收藏 / 取消收藏（页面调用接口 mutation） */
  onToggleFavorite: (id: number) => void
  /** 概览统计（接口下发；加载中显示「—」） */
  summary?: CounselingSummary
  summaryLoading?: boolean
  onCancelBooking: (id: number) => void
  onReschedule: (input: { id: number; date: string; slot: string }) => void
  onSubmitFeedback: (input: { id: number; score: number; comment?: string }) => void
  mutationPending?: boolean
  fetchTakenSlots: (counselorId: number, date: string) => Promise<string[]>
  /** 去预约（可带老师 id 预填） */
  onBook: (counselorId?: number) => void
  /** 去心理老师列表 */
  onBrowseCounselors: () => void
}

export function MinePanel({
  bookings,
  bookingsLoading = false,
  bookingsError = false,
  onReloadBookings,
  counselors,
  favoriteIds,
  onToggleFavorite,
  summary,
  summaryLoading = false,
  onCancelBooking,
  onReschedule,
  onSubmitFeedback,
  mutationPending = false,
  fetchTakenSlots,
  onBook,
  onBrowseCounselors,
}: MinePanelProps) {
  const { t } = useTranslation()
  const { modal } = AntApp.useApp()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [detailBooking, setDetailBooking] = useState<BookingItem | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingItem | null>(null)
  const [feedbackTarget, setFeedbackTarget] = useState<BookingItem | null>(null)

  const favoriteCounselors = useMemo(
    () => counselors.filter((c) => favoriteIds.includes(c.id)),
    [counselors, favoriteIds]
  )

  const filteredBookings = useMemo(
    () => (statusFilter === 'all' ? bookings : bookings.filter((b) => b.status === statusFilter)),
    [bookings, statusFilter]
  )

  const statusMap = useMemo<Record<BookingStatus, string>>(
    () => ({
      pending: t('counseling.bookingStatus.pending'),
      confirmed: t('counseling.bookingStatus.confirmed'),
      completed: t('counseling.bookingStatus.completed'),
      cancelled: t('counseling.bookingStatus.cancelled'),
    }),
    [t]
  )

  /** 概览：接口下发（加载中显示「—」），不做前端聚合 */
  const stats = useMemo(
    () => [
      {
        key: 'total',
        value: summaryLoading ? '—' : (summary?.total ?? 0),
        label: t('counseling.mine.stats.total'),
      },
      {
        key: 'upcoming',
        value: summaryLoading ? '—' : (summary?.upcoming ?? 0),
        label: t('counseling.mine.stats.upcoming'),
      },
      {
        key: 'completed',
        value: summaryLoading ? '—' : (summary?.completed ?? 0),
        label: t('counseling.mine.stats.completed'),
      },
      {
        key: 'favorites',
        value: summaryLoading ? '—' : (summary?.favorites ?? favoriteCounselors.length),
        label: t('counseling.mine.stats.favorites'),
      },
    ],
    [summary, summaryLoading, favoriteCounselors.length, t]
  )

  function cancelBooking(id: number) {
    modal.confirm({
      title: t('counseling.message.cancelTitle'),
      content: t('counseling.message.cancelConfirm'),
      icon: <ExclamationCircleFilled />,
      onOk() {
        onCancelBooking(id)
      },
    })
  }

  return (
    <div className={styles.mine}>
      {/* ===== 概览数字 ===== */}
      <dl className={styles.overview}>
        {stats.map((item, index) => (
          <div key={item.key} className={styles.stat}>
            <span className={styles.statIndex}>{String(index + 1).padStart(2, '0')}</span>
            <dt className={styles.statNum}>{item.value}</dt>
            <dd className={styles.statLabel}>{item.label}</dd>
          </div>
        ))}
      </dl>

      {/* ===== 我的预约 ===== */}
      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h3 className={styles.blockTitle}>{t('counseling.myBookings')}</h3>
          {!bookingsLoading && !bookingsError && (
            <span className={styles.blockCount}>{bookings.length}</span>
          )}
          <button type="button" className={styles.textBtn} onClick={() => onBook()}>
            {t('counseling.mine.newBooking')}
            <ArrowRightOutlined />
          </button>
        </div>
        <p className={styles.blockDesc}>{t('counseling.mine.bookingsDesc')}</p>

        {bookingsLoading ? (
          <div className={styles.state}>
            <Skeleton active title={{ width: '42%' }} paragraph={{ rows: 2 }} />
            <Skeleton active title={{ width: '42%' }} paragraph={{ rows: 2 }} />
          </div>
        ) : bookingsError ? (
          <div className={styles.state}>
            <Result
              status="error"
              title={t('common.loadFailed')}
              extra={
                <Button type="primary" onClick={onReloadBookings}>
                  {t('common.retry')}
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className={styles.filters}>
              {FILTER_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={statusFilter === key}
                  className={`${styles.filter}${statusFilter === key ? ` ${styles.filterOn}` : ''}`}
                  onClick={() => setStatusFilter(key)}
                >
                  {key === 'all'
                    ? t('counseling.booking.filterAll')
                    : t(`counseling.bookingStatus.${key}`)}
                </button>
              ))}
            </div>

            {filteredBookings.length > 0 ? (
              <ul className={styles.list}>
                {filteredBookings.map((b) => (
                  <li key={b.id} className={styles.row} data-status={b.status}>
                    <div className={styles.date}>
                      <b>{b.date}</b>
                      <span>
                        <ClockCircleOutlined /> {b.slot}
                      </span>
                    </div>
                    <div className={styles.main}>
                      <span className={styles.counselor}>{b.counselorName}</span>
                      <span className={styles.meta}>
                        <span>{t(`counseling.types.${b.type}`)}</span>
                        <i aria-hidden="true" />
                        <span>
                          {b.mode === 'online'
                            ? t('counseling.summary.onlineValue')
                            : t('counseling.summary.offlineValue')}
                        </span>
                        <i aria-hidden="true" />
                        <span>
                          {b.isFirst ? t('counseling.form.first') : t('counseling.form.followup')}
                        </span>
                      </span>
                    </div>
                    <span className={styles.status}>{statusMap[b.status]}</span>
                    <div className={styles.actions}>
                      <Button size="small" onClick={() => setDetailBooking(b)}>
                        {t('counseling.booking.detail')}
                      </Button>
                      {(b.status === 'pending' || b.status === 'confirmed') && (
                        <Button size="small" onClick={() => setRescheduleTarget(b)}>
                          {t('counseling.booking.reschedule')}
                        </Button>
                      )}
                      {b.status === 'pending' && (
                        <Button size="small" danger onClick={() => cancelBooking(b.id)}>
                          {t('counseling.booking.cancelBtn')}
                        </Button>
                      )}
                      {b.status === 'completed' && !b.feedback && (
                        <Button size="small" type="primary" onClick={() => setFeedbackTarget(b)}>
                          {t('counseling.booking.feedback')}
                        </Button>
                      )}
                      {b.feedback && (
                        <span className={styles.rated} title={b.feedback.comment || ''}>
                          <StarFilled /> {b.feedback.score}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : bookings.length === 0 ? (
              <div className={styles.empty}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('counseling.booking.emptyHint')}
                >
                  <Button type="primary" onClick={() => onBook()}>
                    {t('counseling.mine.newBooking')}
                  </Button>
                </Empty>
              </div>
            ) : (
              <div className={styles.empty}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('counseling.booking.emptyFiltered')}
                />
              </div>
            )}
          </>
        )}
      </section>

      {/* ===== 收藏的老师 ===== */}
      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h3 className={styles.blockTitle}>{t('counseling.mine.favoritesTitle')}</h3>
          <span className={styles.blockCount}>{favoriteCounselors.length}</span>
          <button type="button" className={styles.textBtn} onClick={onBrowseCounselors}>
            {t('counseling.mine.browse')}
            <CompassOutlined />
          </button>
        </div>
        <p className={styles.blockDesc}>{t('counseling.mine.favoritesDesc')}</p>

        {favoriteCounselors.length > 0 ? (
          <ul className={styles.favGrid}>
            {favoriteCounselors.map((c) => (
              <li key={c.id} className={styles.favRow}>
                <span className={styles.favAvatar} style={{ background: ACCENT_COLOR[c.accentKey] }}>
                  {c.name[0]}
                </span>
                <div className={styles.favText}>
                  <span className={styles.favName}>{c.name}</span>
                  <span className={styles.favMeta}>
                    <span>{c.title}</span>
                    <i aria-hidden="true" />
                    <span>
                      <StarFilled /> {c.rating}
                    </span>
                    <i aria-hidden="true" />
                    <span>
                      {c.sessions}
                      {t('counseling.counselors.sessionsUnit')}
                    </span>
                  </span>
                </div>
                <div className={styles.favActions}>
                  <Button size="small" type="primary" ghost onClick={() => onBook(c.id)}>
                    {t('counseling.mine.bookNow')}
                  </Button>
                  <button
                    type="button"
                    className={styles.favRemove}
                    aria-label={t('counseling.favorites.remove')}
                    title={t('counseling.favorites.remove')}
                    onClick={() => onToggleFavorite(c.id)}
                  >
                    <HeartFilled />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('counseling.mine.emptyFavorites')}
            >
              <Button onClick={onBrowseCounselors} icon={<HeartOutlined />}>
                {t('counseling.mine.browse')}
              </Button>
            </Empty>
          </div>
        )}
      </section>

      {/* 预约详情 / 改约 / 评价（与预约面板同一套弹层） */}
      <BookingDetailDrawer
        open={detailBooking !== null}
        booking={detailBooking}
        onClose={() => setDetailBooking(null)}
        onCancel={(id) => {
          cancelBooking(id)
          setDetailBooking(null)
        }}
        onReschedule={(b) => {
          setDetailBooking(null)
          setRescheduleTarget(b)
        }}
        onFeedback={(b) => {
          setDetailBooking(null)
          setFeedbackTarget(b)
        }}
      />

      <RescheduleModal
        open={rescheduleTarget !== null}
        booking={rescheduleTarget}
        submitting={mutationPending}
        onClose={() => setRescheduleTarget(null)}
        fetchTakenSlots={fetchTakenSlots}
        onConfirm={(newDate, newSlot) => {
          if (!rescheduleTarget) return
          onReschedule({ id: rescheduleTarget.id, date: newDate, slot: newSlot })
          setRescheduleTarget(null)
        }}
      />

      <FeedbackModal
        open={feedbackTarget !== null}
        booking={feedbackTarget}
        submitting={mutationPending}
        onClose={() => setFeedbackTarget(null)}
        onSubmit={(score, comment) => {
          if (!feedbackTarget) return
          onSubmitFeedback({ id: feedbackTarget.id, score, comment })
          setFeedbackTarget(null)
        }}
      />
    </div>
  )
}

export default MinePanel
