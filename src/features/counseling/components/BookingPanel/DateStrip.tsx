/**
 * DateStrip —— 未来 7 天日期周条（预约第 3 步）
 * 受 antd Form.Item 注入 value / onChange（dayjs 值），
 * 与后端排班规则一致：仅开放「明天 ~ 第 7 天」。
 * 视觉：共享发丝线的周表（非 7 张独立卡片），选中态用品牌色底 + 底部 2px 游标。
 */
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'
import styles from './BookingPanel.module.css'

const WEEK_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

export interface DateStripProps {
  value?: Dayjs
  onChange?: (value: Dayjs) => void
}

export function DateStrip({ value, onChange }: DateStripProps) {
  const { t, i18n } = useTranslation()
  const base = dayjs().startOf('day')
  const days = Array.from({ length: 7 }, (_, i) => base.add(i + 1, 'day'))

  // 月份按当前语言格式化：zh-CN/zh-TW →「11月」，en-US →「Nov」
  const monthFmt = new Intl.DateTimeFormat(i18n.language, { month: 'short' })

  return (
    <div className={styles.dateStrip} role="group" aria-label={t('counseling.step.time')}>
      {days.map((day) => {
        const active = value ? day.isSame(value, 'day') : false
        return (
          <button
            key={day.format('YYYY-MM-DD')}
            type="button"
            aria-pressed={active}
            aria-label={day.format('YYYY-MM-DD')}
            className={`${styles.dateCell}${active ? ` ${styles.isOn}` : ''}`}
            onClick={() => onChange?.(day)}
          >
            <span className={styles.dateWeek}>{t(`counseling.weekdays.${WEEK_KEYS[day.day()]}`)}</span>
            <span className={styles.dateDay}>{day.format('DD')}</span>
            <span className={styles.dateMonth}>{monthFmt.format(day.toDate())}</span>
          </button>
        )
      })}
    </div>
  )
}

export default DateStrip
