/**
 * 【business】BookingPanel —— 预约咨询面板 · 四步表单 + 预约摘要 + 我的预约
 * - Vue defineExpose(prefill) → forwardRef + useImperativeHandle（父级跨 tab 预填）
 * - ElMessage / ElMessageBox.confirm → AntApp.useApp().message / modal.confirm
 * - el-input / el-switch / el-checkbox / el-popover → Input / Switch / Checkbox / Popover
 */
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { App as AntApp, Button, Checkbox, Input, Popover, Switch } from 'antd'
import {
  ArrowRightOutlined,
  BankOutlined,
  ExclamationCircleFilled,
  MessageOutlined,
  ProfileOutlined,
  SearchOutlined,
  StarOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { consultationTypes, counselors, COUNSELING_STORAGE_KEY } from '../data'
import type { BookingItem } from '../types'
import { useI18n } from '@/i18n'
import styles from './BookingPanel.module.css'

export interface BookingPanelProps {
  /** 「咨询须知」链接点击（父级切换 tab） */
  onGoNotice: () => void
}

/** 父级经 ref 调用的能力（等价 Vue defineExpose） */
export interface BookingPanelHandle {
  /** 跨面板预约：由列表/弹窗「预约」触发（页面切 tab 后调用） */
  prefill: (id: number) => void
}

interface BookingForm {
  type: string
  topics: string[]
  specFilter: string
  counselorId: number | null
  dateIdx: number
  slot: string
  mode: string
  name: string
  contact: string
  description: string
  isFirst: boolean
  agree: boolean
}

interface BookingErrors {
  type: boolean
  counselorId: boolean
  dateIdx: boolean
  slot: boolean
  name: string
  contact: string
  agree: string
}

const INITIAL_ERRORS: BookingErrors = {
  type: false,
  counselorId: false,
  dateIdx: false,
  slot: false,
  name: '',
  contact: '',
  agree: '',
}

const BookingPanel = forwardRef<BookingPanelHandle, BookingPanelProps>(
  function BookingPanel({ onGoNotice }, ref) {
    const { t } = useI18n()
    const { message, modal } = AntApp.useApp() // 替代 ElMessage / ElMessageBox

    const secTypeRef = useRef<HTMLElement | null>(null)
    const secCounselorRef = useRef<HTMLElement | null>(null)
    const secTimeRef = useRef<HTMLElement | null>(null)
    const secInfoRef = useRef<HTMLElement | null>(null)

    const [errors, setErrors] = useState<BookingErrors>(INITIAL_ERRORS)

    const [booking, setBooking] = useState<BookingForm>({
      type: 'individual',
      topics: [],
      specFilter: '',
      counselorId: null,
      dateIdx: -1,
      slot: '',
      mode: 'online',
      name: '',
      contact: '',
      description: '',
      isFirst: true,
      agree: false,
    })

    const [counselorSearch, setCounselorSearch] = useState('')

    function selectCounselor(id: number) {
      setBooking(b => ({ ...b, counselorId: id }))
      setErrors(e => ({ ...e, counselorId: false }))
    }

    const filteredCounselors = useMemo(() => {
      const type = booking.type
      const kw = counselorSearch.trim().toLowerCase()
      const spec = booking.specFilter
      return counselors.filter(c => {
        const typeOk = !type || c.types.includes(type)
        const specOk = !spec || c.specialties.includes(spec)
        const kwOk =
          !kw ||
          c.name.toLowerCase().includes(kw) ||
          c.specialties.join('').toLowerCase().includes(kw) ||
          c.title.toLowerCase().includes(kw)
        return typeOk && specOk && kwOk
      })
    }, [booking.type, booking.specFilter, counselorSearch])

    // watch(booking.type)：所选老师不支持新类型时清空选择
    useEffect(() => {
      setBooking(b => {
        if (!b.counselorId) return b
        const c = counselors.find(x => x.id === b.counselorId)
        if (c && !c.types.includes(b.type)) return { ...b, counselorId: null }
        return b
      })
    }, [booking.type])

    const weekdays = useMemo(
      () => [
        t('counseling.weekdays.sun'), t('counseling.weekdays.mon'), t('counseling.weekdays.tue'),
        t('counseling.weekdays.wed'), t('counseling.weekdays.thu'), t('counseling.weekdays.fri'),
        t('counseling.weekdays.sat'),
      ],
      [t]
    )

    const nextDays = useMemo(() => {
      const days: Array<{ weekday: string; dateStr: string; full: string }> = []
      const wdays = weekdays
      const now = new Date()
      for (let i = 1; i <= 7; i++) {
        const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
        days.push({
          weekday: wdays[d.getDay()],
          dateStr: `${d.getMonth() + 1}/${d.getDate()}`,
          full: `${d.getMonth() + 1}月${d.getDate()}日 ${wdays[d.getDay()]}`,
        })
      }
      return days
    }, [weekdays])

    const timeSlots = useMemo(
      () => [
        { label: '09:00', value: '09:00', period: t('counseling.timeSlots.morning'), disabled: false },
        { label: '10:00', value: '10:00', period: t('counseling.timeSlots.morning'), disabled: false },
        { label: '11:00', value: '11:00', period: t('counseling.timeSlots.morning'), disabled: true },
        { label: '14:00', value: '14:00', period: t('counseling.timeSlots.afternoon'), disabled: false },
        { label: '15:00', value: '15:00', period: t('counseling.timeSlots.afternoon'), disabled: false },
        { label: '16:00', value: '16:00', period: t('counseling.timeSlots.afternoon'), disabled: true },
        { label: '19:00', value: '19:00', period: t('counseling.timeSlots.evening'), disabled: false },
        { label: '20:00', value: '20:00', period: t('counseling.timeSlots.evening'), disabled: false },
      ],
      [t]
    )

    function validateBooking(): boolean {
      const next: BookingErrors = { ...INITIAL_ERRORS }
      let valid = true
      let firstErrorRef: HTMLElement | null = null

      if (!booking.type) { next.type = true; valid = false; if (!firstErrorRef) firstErrorRef = secTypeRef.current }
      if (!booking.counselorId) { next.counselorId = true; valid = false; if (!firstErrorRef) firstErrorRef = secCounselorRef.current }
      if (booking.dateIdx < 0) { next.dateIdx = true; valid = false; if (!firstErrorRef) firstErrorRef = secTimeRef.current }
      if (!booking.slot) { next.slot = true; valid = false; if (!firstErrorRef) firstErrorRef = secTimeRef.current }
      if (!booking.name) { next.name = t('counseling.validation.nameRequired'); valid = false; if (!firstErrorRef) firstErrorRef = secInfoRef.current }
      if (!booking.contact) { next.contact = t('counseling.validation.contactRequired'); valid = false; if (!firstErrorRef) firstErrorRef = secInfoRef.current }
      if (!booking.agree) { next.agree = t('counseling.validation.agreeRequired'); valid = false; if (!firstErrorRef) firstErrorRef = secInfoRef.current }

      setErrors(next)

      if (!valid && firstErrorRef) {
        firstErrorRef.scrollIntoView({ behavior: 'smooth', block: 'center' })
        message.warning(t('counseling.validation.formIncomplete'))
      }
      return valid
    }

    function getTypeName(key: string): string {
      return consultationTypes.find(ct => ct.key === key)?.name || ''
    }
    function getCounselor(id: number | null): { name: string } {
      return counselors.find(c => c.id === id) || { name: '' }
    }

    // 我的预约
    const [myBookings, setMyBookings] = useState<BookingItem[]>([])
    const statusMap = useMemo<Record<string, string>>(
      () => ({
        pending: t('counseling.bookingStatus.pending'),
        confirmed: t('counseling.bookingStatus.confirmed'),
        completed: t('counseling.bookingStatus.completed'),
        cancelled: t('counseling.bookingStatus.cancelled'),
      }),
      [t]
    )

    function submitBooking() {
      if (!validateBooking()) return
      const c = counselors.find(x => x.id === booking.counselorId)
      if (!c) return
      const newBooking: BookingItem = {
        counselorName: c.name,
        counselorId: c.id,
        date: nextDays[booking.dateIdx].full,
        slot: booking.slot,
        typeName: getTypeName(booking.type),
        type: booking.type,
        mode: booking.mode,
        topics: [...booking.topics],
        description: booking.description,
        isFirst: booking.isFirst,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      const next = [newBooking, ...myBookings]
      setMyBookings(next)
      saveBookings(next)
      message.success(t('counseling.message.bookingSuccess'))
      // 重置
      setBooking(b => ({
        ...b,
        counselorId: null,
        dateIdx: -1,
        slot: '',
        name: '',
        contact: '',
        description: '',
        agree: false,
        topics: [],
      }))
      // 重置错误
      setErrors(INITIAL_ERRORS)
      // 滚动到顶部
      secTypeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    function cancelBooking(idx: number) {
      modal.confirm({
        title: t('counseling.message.cancelTitle'),
        content: t('counseling.message.cancelConfirm'),
        icon: <ExclamationCircleFilled />,
        onOk() {
          const next = myBookings.map((b, i) => (i === idx ? { ...b, status: 'cancelled' } : b))
          setMyBookings(next)
          saveBookings(next)
          message.success(t('counseling.message.cancelled'))
        },
      })
    }

    function saveBookings(list: BookingItem[]) {
      localStorage.setItem(COUNSELING_STORAGE_KEY, JSON.stringify(list))
    }

    // onMounted：读取本地预约
    useEffect(() => {
      const saved = localStorage.getItem(COUNSELING_STORAGE_KEY)
      if (saved) setMyBookings(JSON.parse(saved) as BookingItem[])
    }, [])

    // 跨面板预约：由列表/弹窗「预约」触发（页面切 tab 后由父级调用）
    useImperativeHandle(
      ref,
      () => ({
        prefill(id: number) {
          setBooking(b => ({ ...b, type: 'individual', counselorId: id }))
        },
      }),
      []
    )

    const requiredText = t('counseling.form.required')

    return (
      <div className={styles.bookingLayout}>
        <div className={styles.bookingMain}>
          <form className={styles.bookingForm} onSubmit={e => e.preventDefault()}>
            {/* 01 咨询类型 */}
            <section
              ref={secTypeRef}
              className={`${styles.stepBlock}${errors.type ? ` ${styles.error}` : ''}`}
            >
              <div className={styles.stepMarker}>
                <span className={styles.stepNum}>01</span>
              </div>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>
                  {t('counseling.step.type')}
                  <em>*</em>
                </h3>
                <div className={styles.typeOptions}>
                  {consultationTypes.map(ct => (
                    <button
                      key={ct.key}
                      type="button"
                      className={`${styles.typeOpt}${booking.type === ct.key ? ` ${styles.active}` : ''}`}
                      onClick={() => {
                        setBooking(b => ({ ...b, type: ct.key }))
                        setErrors(e => ({ ...e, type: false }))
                      }}
                    >
                      <span className={styles.toName}>{ct.name}</span>
                      <span className={styles.toDur}>{ct.duration}min</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* 02 心理老师 */}
            <section
              ref={secCounselorRef}
              className={`${styles.stepBlock}${errors.counselorId ? ` ${styles.error}` : ''}`}
            >
              <div className={styles.stepMarker}>
                <span className={styles.stepNum}>02</span>
              </div>
              <div className={styles.stepBody}>
                <div className={styles.stepTitleRow}>
                  <h3 className={styles.stepTitle}>
                    {t('counseling.step.counselor')}
                    <em>*</em>
                  </h3>
                  <div className={styles.counselorSearch}>
                    <SearchOutlined />
                    <input
                      value={counselorSearch}
                      placeholder={t('counseling.counselors.searchPlaceholder')}
                      onChange={e => setCounselorSearch(e.target.value)}
                    />
                    {filteredCounselors.length > 0 && (
                      <span className={styles.csCount}>
                        {filteredCounselors.length} {t('counseling.counselors.count')}
                      </span>
                    )}
                  </div>
                </div>

                {booking.type && (
                  <div className={styles.typeHint}>
                    {t('counseling.counselors.filteredHint', { type: getTypeName(booking.type) })}
                  </div>
                )}

                {filteredCounselors.length > 0 ? (
                  <div className={styles.counselorPickList}>
                    {filteredCounselors.map(c => (
                      <Popover
                        key={c.id}
                        placement="top"
                        trigger="hover"
                        mouseEnterDelay={0.2}
                        overlayClassName="counselor-popover"
                        overlayStyle={{ width: 280 }}
                        content={
                          <div className={styles.popDetail}>
                            <div className={styles.popHead}>
                              <div className={styles.popAvatar} style={{ background: c.color }}>
                                {c.name[0]}
                              </div>
                              <div>
                                <div className={styles.popName}>{c.name}</div>
                                <div className={styles.popTitle}>{c.title}</div>
                              </div>
                            </div>
                            <div className={styles.popStats}>
                              <span><StarOutlined /> {c.rating}</span>
                              <span><BankOutlined /> {c.exp}{t('counseling.counselors.yearsSuffix')}</span>
                              <span><MessageOutlined /> {c.sessions}{t('counseling.counselors.sessionsUnit')}</span>
                            </div>
                            <p className={styles.popIntro}>{c.intro}</p>
                          </div>
                        }
                      >
                        <div
                          className={`${styles.counselorPickCard}${booking.counselorId === c.id ? ` ${styles.active}` : ''}`}
                          onClick={() => selectCounselor(c.id)}
                        >
                          <span className={styles.cpName}>{c.name}</span>
                          <span className={styles.cpMeta}>{c.title}</span>
                          <span className={styles.cpRating}>★ {c.rating}</span>
                        </div>
                      </Popover>
                    ))}
                  </div>
                ) : (
                  <div className={styles.counselorEmpty}>
                    <span>{t('counseling.empty.noCounselor')}</span>
                  </div>
                )}
              </div>
            </section>

            {/* 03 咨询时间 */}
            <section
              ref={secTimeRef}
              className={`${styles.stepBlock}${errors.dateIdx || errors.slot ? ` ${styles.error}` : ''}`}
            >
              <div className={styles.stepMarker}>
                <span className={styles.stepNum}>03</span>
              </div>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>
                  {t('counseling.step.time')}
                  <em>*</em>
                </h3>
                <div className={styles.dateRow}>
                  {nextDays.map((d, i) => (
                    <div
                      key={i}
                      className={`${styles.dateOpt}${booking.dateIdx === i ? ` ${styles.active}` : ''}`}
                      onClick={() => {
                        setBooking(b => ({ ...b, dateIdx: i }))
                        setErrors(e => ({ ...e, dateIdx: false }))
                      }}
                    >
                      <span className={styles.doWeek}>{d.weekday}</span>
                      <span className={styles.doDate}>{d.dateStr}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.timeMode}>
                  <div className={styles.slotRow}>
                    {timeSlots.map(slot => (
                      <button
                        key={slot.value}
                        type="button"
                        className={`${styles.slotOpt}${booking.slot === slot.value ? ` ${styles.active}` : ''}${slot.disabled ? ` ${styles.disabled}` : ''}`}
                        disabled={slot.disabled}
                        onClick={() => {
                          if (slot.disabled) return
                          setBooking(b => ({ ...b, slot: slot.value }))
                          setErrors(e => ({ ...e, slot: false }))
                        }}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                  <div className={styles.modeRow}>
                    <button
                      type="button"
                      className={`${styles.modeOpt}${booking.mode === 'online' ? ` ${styles.active}` : ''}`}
                      onClick={() => setBooking(b => ({ ...b, mode: 'online' }))}
                    >
                      {t('counseling.btn.online')}
                    </button>
                    <button
                      type="button"
                      className={`${styles.modeOpt}${booking.mode === 'offline' ? ` ${styles.active}` : ''}`}
                      onClick={() => setBooking(b => ({ ...b, mode: 'offline' }))}
                    >
                      {t('counseling.btn.offline')}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 04 个人信息 */}
            <section ref={secInfoRef} className={styles.stepBlock}>
              <div className={styles.stepMarker}>
                <span className={styles.stepNum}>04</span>
              </div>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>
                  {t('counseling.step.info')}
                  <em>*</em>
                </h3>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <div className={styles.formLabel}>
                      {t('counseling.form.name')}
                      <em className={styles.formRequired}>*</em>
                    </div>
                    <Input
                      value={booking.name}
                      placeholder={t('counseling.form.namePlaceholder')}
                      onChange={e => {
                        setBooking(b => ({ ...b, name: e.target.value }))
                        setErrors(er => ({ ...er, name: '' }))
                      }}
                    />
                    {errors.name && (
                      <div className={styles.formError}>{t('counseling.validation.nameRequired')}</div>
                    )}
                  </div>
                  <div className={styles.formField}>
                    <div className={styles.formLabel}>
                      {t('counseling.form.contact')}
                      <em className={styles.formRequired}>*</em>
                    </div>
                    <Input
                      value={booking.contact}
                      placeholder={t('counseling.form.contactPlaceholder')}
                      onChange={e => {
                        setBooking(b => ({ ...b, contact: e.target.value }))
                        setErrors(er => ({ ...er, contact: '' }))
                      }}
                    />
                    {errors.contact && (
                      <div className={styles.formError}>{t('counseling.validation.contactRequired')}</div>
                    )}
                  </div>
                </div>
                <div className={styles.formField}>
                  <div className={styles.formLabel}>
                    {t('counseling.form.description')}{' '}
                    <span className={styles.optional}>{t('counseling.form.optional')}</span>
                  </div>
                  <Input.TextArea
                    value={booking.description}
                    rows={3}
                    placeholder={t('counseling.form.descPlaceholder')}
                    maxLength={500}
                    showCount
                    onChange={e => setBooking(b => ({ ...b, description: e.target.value }))}
                  />
                </div>
                <div className={styles.formInline}>
                  <span className={styles.formInlineLabel}>{t('counseling.form.experience')}</span>
                  <Switch
                    checked={booking.isFirst}
                    checkedChildren={t('counseling.form.first')}
                    unCheckedChildren={t('counseling.form.followup')}
                    onChange={v => setBooking(b => ({ ...b, isFirst: v }))}
                  />
                </div>
                <div className={styles.formField}>
                  <Checkbox
                    checked={booking.agree}
                    onChange={e => {
                      setBooking(b => ({ ...b, agree: e.target.checked }))
                      setErrors(er => ({ ...er, agree: '' }))
                    }}
                  >
                    {t('counseling.form.agreePrefix')}{' '}
                    <a
                      href="#"
                      onClick={e => {
                        e.preventDefault()
                        onGoNotice()
                      }}
                    >
                      {t('counseling.form.noticeLink')}
                    </a>{' '}
                    {t('counseling.form.and')} <a href="#">{t('counseling.form.consentLink')}</a>
                  </Checkbox>
                  {errors.agree && (
                    <div className={styles.formError}>{t('counseling.validation.agreeRequired')}</div>
                  )}
                </div>
              </div>
            </section>

            <div className={styles.formFooter}>
              <span className={styles.formHint}>
                {requiredText.split('*')[0]}
                <em>*</em>
                {requiredText.split('*')[1]}
              </span>
              <Button type="primary" size="large" onClick={submitBooking}>
                {t('counseling.btn.confirmBooking')}
                <ArrowRightOutlined />
              </Button>
            </div>
          </form>
        </div>

        {/* 右侧：预约摘要 + 我的预约 */}
        <aside className={styles.bookingAside}>
          <div
            className={styles.summaryCard}
            style={{ '--unset-text': t('counseling.summary.empty') } as CSSProperties}
          >
            <h4>
              <ProfileOutlined /> {t('counseling.summary.title')}
            </h4>
            <div className={styles.summaryRow}>
              <span>{t('counseling.summary.type')}</span>
              <b className={booking.type ? '' : styles.unset}>{getTypeName(booking.type)}</b>
            </div>
            <div className={styles.summaryRow}>
              <span>{t('counseling.summary.counselor')}</span>
              <b className={booking.counselorId ? '' : styles.unset}>
                {booking.counselorId ? getCounselor(booking.counselorId).name : ''}
              </b>
            </div>
            <div className={styles.summaryRow}>
              <span>{t('counseling.summary.date')}</span>
              <b className={booking.dateIdx >= 0 ? '' : styles.unset}>
                {booking.dateIdx >= 0 ? nextDays[booking.dateIdx].full : ''}
              </b>
            </div>
            <div className={styles.summaryRow}>
              <span>{t('counseling.summary.time')}</span>
              <b className={booking.slot ? '' : styles.unset}>{booking.slot || ''}</b>
            </div>
            <div className={styles.summaryRow}>
              <span>{t('counseling.summary.mode')}</span>
              <b>{booking.mode === 'online' ? t('counseling.summary.onlineValue') : t('counseling.summary.offlineValue')}</b>
            </div>
            <div className={styles.summaryDivider} />
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>{t('counseling.summary.serviceType')}</span>
              <b className={styles.freeTag}>{t('counseling.summary.freeTag')}</b>
            </div>
          </div>

          <div className={styles.myBookings}>
            <div className={styles.mbHeader}>
              <h4>
                <UnorderedListOutlined /> {t('counseling.myBookings')}
              </h4>
              <span className={styles.mbCount}>{myBookings.length}</span>
            </div>
            {myBookings.length > 0 ? (
              <div className={styles.mbList}>
                {myBookings.map((b, i) => (
                  <div key={i} className={`${styles.mbItem} status-${b.status}`}>
                    <div className={styles.mbTop}>
                      <span className={styles.mbCounselor}>{b.counselorName}</span>
                      <span className={`${styles.mbStatus} s-${b.status}`}>{statusMap[b.status]}</span>
                    </div>
                    <div className={styles.mbInfo}>
                      {b.date} {b.slot} · {b.typeName}
                    </div>
                    {b.status === 'pending' && (
                      <div className={styles.mbActions}>
                        <Button size="small" onClick={() => cancelBooking(i)}>
                          {t('counseling.booking.cancelBtn')}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.mbEmpty}>{t('counseling.booking.empty')}</div>
            )}
          </div>
        </aside>
      </div>
    )
  }
)

export { BookingPanel }
export default BookingPanel
