// 04 我的预约区块 · 状态筛选 + 详情 / 改约 / 取消 / 评价（与咨询中心共用弹层）
import { useMemo, useState } from 'react'
import { Button, Empty, Result, Skeleton } from 'antd'
import { StarFilled } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import {
  BookingDetailDrawer,
  FeedbackModal,
  RescheduleModal,
} from '@/features/counseling'
import type { BookingItem } from '@/features/counseling'
import styles from './BookingsSection.module.css'

export interface BookingsSectionProps {
  id?: string
  bookings: BookingItem[]
  loading?: boolean
  error?: boolean
  onRetry: () => void
  /** 去咨询中心预约 */
  onGoBook: () => void
  /** 查询某老师某日已占用时段（改约弹窗用） */
  fetchTakenSlots: (counselorId: number, date: string) => Promise<string[]>
  onCancel: (id: number) => void
  onReschedule: (input: { id: number; date: string; slot: string }) => void
  onFeedback: (input: { id: number; score: number; comment?: string }) => void
  mutationPending?: boolean
}

export function BookingsSection({
  id,
  bookings,
  loading = false,
  error = false,
  onRetry,
  onGoBook,
  fetchTakenSlots,
  onCancel,
  onReschedule,
  onFeedback,
  mutationPending = false,
}: BookingsSectionProps) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<'all' | BookingItem['status']>('all')
  const [detail, setDetail] = useState<BookingItem | null>(null)
  const [reschedule, setReschedule] = useState<BookingItem | null>(null)
  const [feedback, setFeedback] = useState<BookingItem | null>(null)

  const list = useMemo(
    () => (filter === 'all' ? bookings : bookings.filter((item) => item.status === filter)),
    [bookings, filter]
  )

  return (
    <section id={id} className={styles.magSection}>
      <div className={styles.secHead}>
        <span className={styles.secNum}>04</span>
        <div className={styles.secTitles}>
          <h2 className={styles.secTitle}>{t('profile.card.bookings.title')}</h2>
          <p className={styles.secDesc}>{t('profile.card.bookings.desc')}</p>
        </div>
        <button type="button" className={styles.headAction} onClick={onGoBook}>
          {t('profile.card.bookings.goBook')}
        </button>
      </div>

      {loading ? (
        <div className={styles.skeleton}>
          {[0, 1].map((i) => (
            <Skeleton key={i} active title={{ width: '32%' }} paragraph={{ rows: 1 }} />
          ))}
        </div>
      ) : error ? (
        <Result
          status="error"
          title={t('common.loadFailed')}
          extra={
            <Button type="primary" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          }
        />
      ) : bookings.length === 0 ? (
        <div className={styles.empty}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('profile.card.bookings.empty')}
          >
            <Button type="primary" onClick={onGoBook}>
              {t('profile.card.bookings.goBook')}
            </Button>
          </Empty>
        </div>
      ) : (
        <>
          {/* 状态筛选 */}
          <div className={styles.filters}>
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                className={`${styles.filter}${filter === key ? ` ${styles.filterOn}` : ''}`}
                onClick={() => setFilter(key)}
              >
                {key === 'all'
                  ? t('counseling.booking.filterAll')
                  : t(`counseling.bookingStatus.${key}`)}
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <div className={styles.empty}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('profile.card.bookings.emptyFiltered')}
              />
            </div>
          ) : (
            <div className={styles.rows}>
              {list.map((b) => (
                <div key={b.id} className={styles.row} data-status={b.status}>
                  {/* 时间 */}
                  <div className={styles.when}>
                    <span className={styles.date}>{b.date}</span>
                    <span className={styles.slot}>{b.slot}</span>
                  </div>
                  {/* 对象 */}
                  <div className={styles.who}>
                    <span className={styles.name}>{b.counselorName}</span>
                    <span className={styles.meta}>
                      {t(`counseling.types.${b.type}`)} ·{' '}
                      {b.mode === 'online'
                        ? t('counseling.summary.onlineValue')
                        : t('counseling.summary.offlineValue')}
                    </span>
                  </div>
                  {/* 状态 */}
                  <span className={styles.status} data-status={b.status}>
                    {t(`counseling.bookingStatus.${b.status}`)}
                  </span>
                  {/* 操作 */}
                  <div className={styles.actions}>
                    <Button size="small" onClick={() => setDetail(b)}>
                      {t('counseling.booking.detail')}
                    </Button>
                    {(b.status === 'pending' || b.status === 'confirmed') && (
                      <Button size="small" onClick={() => setReschedule(b)}>
                        {t('counseling.booking.reschedule')}
                      </Button>
                    )}
                    {b.status === 'pending' && (
                      <Button size="small" danger onClick={() => onCancel(b.id)}>
                        {t('counseling.booking.cancelBtn')}
                      </Button>
                    )}
                    {b.status === 'completed' && !b.feedback && (
                      <Button size="small" type="primary" onClick={() => setFeedback(b)}>
                        {t('counseling.booking.feedback')}
                      </Button>
                    )}
                    {b.feedback && (
                      <span className={styles.rated} title={b.feedback.comment || ''}>
                        <StarFilled /> {b.feedback.score}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 共用弹层 */}
      <BookingDetailDrawer
        open={detail !== null}
        booking={detail}
        onClose={() => setDetail(null)}
        onCancel={(bookingId) => {
          onCancel(bookingId)
          setDetail(null)
        }}
        onReschedule={(b) => {
          setDetail(null)
          setReschedule(b)
        }}
        onFeedback={(b) => {
          setDetail(null)
          setFeedback(b)
        }}
      />
      <RescheduleModal
        open={reschedule !== null}
        booking={reschedule}
        submitting={mutationPending}
        onClose={() => setReschedule(null)}
        fetchTakenSlots={fetchTakenSlots}
        onConfirm={(date, slot) => {
          if (!reschedule) return
          onReschedule({ id: reschedule.id, date, slot })
          setReschedule(null)
        }}
      />
      <FeedbackModal
        open={feedback !== null}
        booking={feedback}
        submitting={mutationPending}
        onClose={() => setFeedback(null)}
        onSubmit={(score, comment) => {
          if (!feedback) return
          onFeedback({ id: feedback.id, score, comment })
          setFeedback(null)
        }}
      />
    </section>
  )
}

export default BookingsSection
