/**
 * SlotPicker —— 咨询时段选择（预约第 3 步 / 改约弹窗共用）
 * 按时段分组（上午 / 下午 / 晚间），已约满或不可预约的位置灰显不可点。
 * 受控组件：value / onChange 由 antd Form.Item 或父级弹窗注入。
 */
import { useTranslation } from 'react-i18next'
import { CheckOutlined } from '@ant-design/icons'
import styles from './BookingPanel.module.css'

/** 可预约时段（与后端排班表对齐；DISABLED 为学校固定不开放的时段） */
const SLOT_GROUPS = [
  { key: 'morning', slots: ['09:00', '10:00', '11:00'] },
  { key: 'afternoon', slots: ['14:00', '15:00', '16:00'] },
  { key: 'evening', slots: ['19:00', '20:00'] },
] as const

const CLOSED_SLOTS = new Set(['11:00', '16:00'])

export interface SlotPickerProps {
  value?: string
  onChange?: (value: string) => void
  /** 已被占用 / 不可预约的时段（排班接口返回） */
  takenSlots?: string[]
  /** 占用时段加载中：整块降低对比并禁用交互 */
  loading?: boolean
}

export function SlotPicker({ value, onChange, takenSlots = [], loading = false }: SlotPickerProps) {
  const { t } = useTranslation()

  return (
    <div
      className={styles.slotGroups}
      data-loading={loading ? 'true' : undefined}
      aria-busy={loading}
    >
      {SLOT_GROUPS.map((group) => (
        <div
          key={group.key}
          className={styles.slotGroup}
          role="group"
          aria-label={t(`counseling.timeSlots.${group.key}`)}
        >
          <span className={styles.slotGroupLabel}>{t(`counseling.timeSlots.${group.key}`)}</span>
          <div className={styles.slotGrid}>
            {group.slots.map((time) => {
              const full = CLOSED_SLOTS.has(time) || takenSlots.includes(time)
              const active = value === time
              return (
                <button
                  key={time}
                  type="button"
                  disabled={full}
                  aria-pressed={active}
                  title={full ? t('counseling.slots.full') : time}
                  className={`${styles.slotCell}${active ? ` ${styles.isOn}` : ''}${full ? ` ${styles.isFull}` : ''}`}
                  onClick={() => onChange?.(time)}
                >
                  <span className={styles.slotTime}>{time}</span>
                  {full && <span className={styles.slotFull}>{t('counseling.slots.full')}</span>}
                  {active && !full && (
                    <span className={styles.slotCheck} aria-hidden="true">
                      <CheckOutlined />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default SlotPicker
