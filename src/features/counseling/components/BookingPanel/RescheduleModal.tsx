/**
 * RescheduleModal —— 改约弹窗
 * 复用日期周条与时段选择器；占用时段由页面注入的 fetchTakenSlots 拉取。
 */
import { useEffect, useState } from 'react'
import { Button, Modal } from 'antd'
import type { Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { BookingItem } from '../types'
import { DateStrip } from './DateStrip'
import { SlotPicker } from './SlotPicker'
import styles from './BookingPanel.module.css'

export interface RescheduleModalProps {
  open: boolean
  booking: BookingItem | null
  submitting?: boolean
  onClose: () => void
  onConfirm: (date: string, slot: string) => void
  /** 查询某老师某日已占用时段 */
  fetchTakenSlots: (counselorId: number, date: string) => Promise<string[]>
}

export function RescheduleModal({
  open,
  booking,
  submitting = false,
  onClose,
  onConfirm,
  fetchTakenSlots,
}: RescheduleModalProps) {
  const { t } = useTranslation()
  const [date, setDate] = useState<Dayjs | undefined>(undefined)
  const [slot, setSlot] = useState('')
  const [takenSlots, setTakenSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // 打开 / 切换预约时重置
  useEffect(() => {
    if (!open) return
    setDate(undefined)
    setSlot('')
    setTakenSlots([])
  }, [open, booking?.id])

  // 日期变化后拉取该老师当日的占用时段
  useEffect(() => {
    if (!open || !booking || !date) {
      setTakenSlots([])
      return
    }
    let cancelled = false
    setLoading(true)
    fetchTakenSlots(booking.counselorId, date.format('YYYY-MM-DD'))
      .then((list) => {
        if (!cancelled) setTakenSlots(list)
      })
      .catch(() => {
        if (!cancelled) setTakenSlots([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, booking, date, fetchTakenSlots])

  function handleConfirm() {
    if (!date || !slot) return
    onConfirm(date.format('YYYY-MM-DD'), slot)
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t('counseling.reschedule.title')}
      width={560}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common.cancel')}
        </Button>,
        <Button
          key="ok"
          type="primary"
          loading={submitting}
          disabled={!date || !slot || loading}
          onClick={handleConfirm}
        >
          {t('counseling.reschedule.confirm')}
        </Button>,
      ]}
    >
      {booking && (
        <div className={styles.rsRoot}>
          <p className={styles.rsCurrent}>
            {t('counseling.reschedule.desc', { date: booking.date, slot: booking.slot })}
          </p>

          <div className={styles.rsGroup}>
            <span className={styles.rsLabel}>{t('counseling.reschedule.dateLabel')}</span>
            <DateStrip value={date} onChange={setDate} />
          </div>

          <div className={styles.rsGroup}>
            <span className={styles.rsLabel}>{t('counseling.reschedule.slotLabel')}</span>
            <SlotPicker value={slot} onChange={setSlot} takenSlots={takenSlots} loading={loading} />
          </div>

          {!date || !slot ? (
            <p className={styles.rsHint}>{t('counseling.reschedule.missing')}</p>
          ) : null}
        </div>
      )}
    </Modal>
  )
}

export default RescheduleModal
