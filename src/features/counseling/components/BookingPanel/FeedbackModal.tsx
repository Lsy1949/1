/**
 * FeedbackModal —— 咨询评价弹窗
 * 1-5 星 + 可选文字；仅「已完成且未评价」的预约可提交。
 */
import { useEffect, useState } from 'react'
import { Button, Input, Modal, Rate } from 'antd'
import { useTranslation } from 'react-i18next'
import type { BookingItem } from '../types'
import styles from './BookingPanel.module.css'

export interface FeedbackModalProps {
  open: boolean
  booking: BookingItem | null
  submitting?: boolean
  onClose: () => void
  onSubmit: (score: number, comment?: string) => void
}

export function FeedbackModal({
  open,
  booking,
  submitting = false,
  onClose,
  onSubmit,
}: FeedbackModalProps) {
  const { t } = useTranslation()
  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (!open) return
    setScore(5)
    setComment('')
  }, [open, booking?.id])

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t('counseling.feedbackModal.title')}
      width={480}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common.cancel')}
        </Button>,
        <Button
          key="ok"
          type="primary"
          loading={submitting}
          onClick={() => onSubmit(score, comment.trim() || undefined)}
        >
          {t('counseling.feedbackModal.submit')}
        </Button>,
      ]}
    >
      {booking && (
        <div className={styles.fbRoot}>
          <p className={styles.fbDesc}>
            {booking.counselorName} · {booking.date} {booking.slot}
          </p>
          <p className={styles.fbHint}>{t('counseling.feedbackModal.desc')}</p>

          <div className={styles.fbScore}>
            <span className={styles.fbLabel}>{t('counseling.feedbackModal.score')}</span>
            <Rate value={score} onChange={setScore} />
          </div>

          <div className={styles.fbComment}>
            <span className={styles.fbLabel}>{t('counseling.feedbackModal.comment')}</span>
            <Input.TextArea
              rows={4}
              maxLength={300}
              showCount
              value={comment}
              placeholder={t('counseling.feedbackModal.placeholder')}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
      )}
    </Modal>
  )
}

export default FeedbackModal
