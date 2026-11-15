/**
 * BookingDetailDrawer —— 预约详情抽屉
 * 展示单条预约的完整信息、状态进度、咨询评价，并提供取消 / 改约 / 评价入口。
 * 纯展示：所有动作经回调上抛（页面 useMutation 负责）。
 */
import { Button, Drawer, Rate } from 'antd'
import {
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  EditOutlined,
  MessageOutlined,
  StarFilled,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { BookingItem } from '../types'
import { maskContact } from '../format'
import styles from './BookingPanel.module.css'

export interface BookingDetailDrawerProps {
  open: boolean
  booking: BookingItem | null
  onClose: () => void
  onCancel: (id: number) => void
  onReschedule: (booking: BookingItem) => void
  onFeedback: (booking: BookingItem) => void
}

export function BookingDetailDrawer({
  open,
  booking,
  onClose,
  onCancel,
  onReschedule,
  onFeedback,
}: BookingDetailDrawerProps) {
  const { t } = useTranslation()

  if (!booking) return null

  const canReschedule = booking.status === 'pending' || booking.status === 'confirmed'
  const canCancel = booking.status === 'pending'
  const canFeedback = booking.status === 'completed' && !booking.feedback

  /** 状态进度：提交 → 待确认 → 已确认 → 已完成；取消时收敛为两节点 */
  const steps =
    booking.status === 'cancelled'
      ? [
          { key: 'created', label: t('counseling.detailDrawer.stepCreated'), state: 'done' },
          { key: 'cancelled', label: t('counseling.detailDrawer.stepCancelled'), state: 'danger' },
        ]
      : (
          [
            { key: 'created', label: t('counseling.detailDrawer.stepCreated') },
            { key: 'pending', label: t('counseling.detailDrawer.stepPending') },
            { key: 'confirmed', label: t('counseling.detailDrawer.stepConfirmed') },
            { key: 'completed', label: t('counseling.detailDrawer.stepCompleted') },
          ] as const
        ).map((step, index) => {
          const currentIndex =
            booking.status === 'pending' ? 1 : booking.status === 'confirmed' ? 2 : 3
          const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo'
          return { ...step, state }
        })

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={440}
      title={t('counseling.detailDrawer.title')}
      className={styles.bdDrawer}
    >
      <div className={styles.bdRoot}>
        {/* 概览 */}
        <header className={styles.bdHead}>
          <div className={styles.bdHeadMain}>
            <span className={styles.bdCounselor}>{booking.counselorName}</span>
            <span className={styles.bdType}>{t(`counseling.types.${booking.type}`)}</span>
          </div>
          <span className={styles.bdStatus} data-status={booking.status}>
            {t(`counseling.bookingStatus.${booking.status}`)}
          </span>
        </header>

        {/* 状态进度 */}
        <ol className={styles.bdTimeline}>
          {steps.map((step) => (
            <li key={step.key} className={styles.bdStep} data-state={step.state}>
              <span className={styles.bdDot}>
                {step.state === 'done' && <CheckCircleFilled />}
                {step.state === 'current' && <ClockCircleOutlined />}
                {step.state === 'danger' && <CloseCircleFilled />}
              </span>
              <span className={styles.bdStepLabel}>{step.label}</span>
            </li>
          ))}
        </ol>

        {/* 预约信息 */}
        <section className={styles.bdSection}>
          <h4 className={styles.bdSectionTitle}>{t('counseling.detailDrawer.info')}</h4>
          <div className={styles.bdRow}>
            <span className={styles.bdLabel}>
              <CalendarOutlined /> {t('counseling.summary.date')}
            </span>
            <span className={styles.bdValue}>{booking.date}</span>
          </div>
          <div className={styles.bdRow}>
            <span className={styles.bdLabel}>
              <ClockCircleOutlined /> {t('counseling.summary.time')}
            </span>
            <span className={styles.bdValue}>{booking.slot}</span>
          </div>
          <div className={styles.bdRow}>
            <span className={styles.bdLabel}>
              <MessageOutlined /> {t('counseling.summary.mode')}
            </span>
            <span className={styles.bdValue}>
              {booking.mode === 'online'
                ? t('counseling.summary.onlineValue')
                : t('counseling.summary.offlineValue')}
            </span>
          </div>
          <div className={styles.bdRow}>
            <span className={styles.bdLabel}>{t('counseling.form.name')}</span>
            <span className={styles.bdValue}>{booking.name}</span>
          </div>
          <div className={styles.bdRow}>
            <span className={styles.bdLabel}>{t('counseling.form.contact')}</span>
            <span className={styles.bdValue}>{maskContact(booking.contact)}</span>
          </div>
          <div className={styles.bdRow}>
            <span className={styles.bdLabel}>{t('counseling.form.experience')}</span>
            <span className={styles.bdValue}>
              {booking.isFirst ? t('counseling.form.first') : t('counseling.form.followup')}
            </span>
          </div>
        </section>

        {booking.description && (
          <section className={styles.bdSection}>
            <h4 className={styles.bdSectionTitle}>{t('counseling.detailDrawer.notes')}</h4>
            <p className={styles.bdNotes}>{booking.description}</p>
          </section>
        )}

        {/* 咨询评价 */}
        <section className={styles.bdSection}>
          <h4 className={styles.bdSectionTitle}>{t('counseling.detailDrawer.feedbackTitle')}</h4>
          {booking.feedback ? (
            <div className={styles.bdFeedback}>
              <Rate disabled value={booking.feedback.score} className={styles.bdRate} />
              <p className={styles.bdFeedbackText}>
                {booking.feedback.comment || t('counseling.detailDrawer.noComment')}
              </p>
            </div>
          ) : (
            <p className={styles.bdFeedbackEmpty}>
              {booking.status === 'completed'
                ? t('counseling.detailDrawer.feedbackPrompt')
                : t('counseling.detailDrawer.noFeedback')}
            </p>
          )}
        </section>

        <p className={styles.bdTip}>
          <StarFilled /> {t('counseling.detailDrawer.tip')}
        </p>

        {/* 操作 */}
        <div className={styles.bdActions}>
          {canFeedback && (
            <Button type="primary" onClick={() => onFeedback(booking)}>
              {t('counseling.booking.feedback')}
            </Button>
          )}
          {canReschedule && (
            <Button icon={<EditOutlined />} onClick={() => onReschedule(booking)}>
              {t('counseling.booking.reschedule')}
            </Button>
          )}
          {canCancel && (
            <Button danger onClick={() => onCancel(booking.id)}>
              {t('counseling.booking.cancelBtn')}
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  )
}

export default BookingDetailDrawer
