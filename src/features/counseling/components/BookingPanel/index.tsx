/**
 * 【business】BookingPanel —— 预约咨询面板 · 四步表单 + 预约摘要 + 我的预约
 * - 数据（consultationTypes / counselors / bookings）由页面注入；
 * - 表单状态与校验由 antd Form 托管；提交 / 取消均经回调上抛（页面 useMutation）；
 * - 组件内不读写 localStorage，预约列表完全由 React Query 提供。
 *
 * 桌面优先的交互改造（校验与提交契约保持不变）：
 *   · 心理老师：Select → 可搜索的老师卡片网格（一屏看清资历与擅长）
 *   · 日期：DatePicker → 未来 7 天周条（点击一步到位）
 *   · 时段：单行按钮 → 上午 / 下午 / 晚间分组，已约满置灰
 *   · 右侧摘要：随选择实时更新，并给出「已完成 n/4」进度
 */
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import type { Dayjs } from 'dayjs'
import {
  App as AntApp,
  Button,
  Checkbox,
  Form,
  Input,
  Radio,
  Skeleton,
  Switch,
} from 'antd'
import {
  ApartmentOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  ExclamationCircleFilled,
  HomeOutlined,
  MessageOutlined,
  ProfileOutlined,
  TeamOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import type {
  BookingCreateInput,
  BookingItem,
  BookingMode,
  ConsultationType,
  ConsultationTypeKey,
  CounselingIconKey,
  Counselor,
} from '../types'
import { useTranslation } from 'react-i18next'
import { useUserStore } from '@/stores/useUserStore'
import { maskContact } from '../format'
import { BookingDetailDrawer } from './BookingDetailDrawer'
import { CounselorPicker } from './CounselorPicker'
import { DateStrip } from './DateStrip'
import { FeedbackModal } from './FeedbackModal'
import { RescheduleModal } from './RescheduleModal'
import { SlotPicker } from './SlotPicker'
import styles from './BookingPanel.module.css'

/** 图标语义 key → antd 图标（接口不下发组件） */
const TYPE_ICONS: Record<CounselingIconKey, ComponentType> = {
  user: UserOutlined,
  apartment: ApartmentOutlined,
  home: HomeOutlined,
  message: MessageOutlined,
}

interface BookingFormValues {
  type: ConsultationTypeKey
  counselorId?: number
  date?: Dayjs
  slot: string
  mode: BookingMode
  name: string
  contact: string
  description?: string
  isFirst: boolean
  agree: boolean
}

function createInitialValues(name: string, contact: string): BookingFormValues {
  return {
    type: 'individual',
    counselorId: undefined,
    date: undefined,
    slot: '',
    mode: 'online',
    name,
    contact,
    description: '',
    isFirst: true,
    agree: false,
  }
}

export interface BookingPanelProps {
  consultationTypes: ConsultationType[]
  counselors: Counselor[]
  /** 我的预约（由页面 useQuery 注入） */
  bookings: BookingItem[]
  bookingsLoading?: boolean
  bookingsError?: boolean
  /** 预约列表重试 */
  onReloadBookings: () => void
  /** 取消预约（页面 useMutation → PATCH） */
  onCancelBooking: (id: number) => void
  /** 「咨询须知」链接点击（父级切换 tab） */
  onGoNotice: () => void
  /** 「全部预约」跳转（父级切换到「我的」页签） */
  onGoMine: () => void
  /** 「账号设置」跳转（预约人信息来自登录账号，不在此处编辑） */
  onEditAccount?: () => void
  /** 提交预约（页面 useMutation → POST） */
  onSubmit: (input: BookingCreateInput) => Promise<BookingItem>
  isSubmitting: boolean
  /** 查询某老师某日已被占用的时段（页面注入，react-query 负责缓存） */
  fetchTakenSlots: (counselorId: number, date: string) => Promise<string[]>
  /** 改约（页面 useMutation → PATCH） */
  onReschedule: (input: { id: number; date: string; slot: string }) => void
  /** 提交咨询评价（页面 useMutation → POST） */
  onSubmitFeedback: (input: { id: number; score: number; comment?: string }) => void
  /** 改约 / 评价请求进行中 */
  mutationPending?: boolean
}

/** 父级经 ref 调用的能力（等价 Vue defineExpose） */
export interface BookingPanelHandle {
  /** 跨面板预约：由列表/弹窗「预约」触发（页面切 tab 后调用） */
  prefill: (id: number) => void
}

const BookingPanel = forwardRef<BookingPanelHandle, BookingPanelProps>(
  function BookingPanel(
    {
      consultationTypes,
      counselors,
      bookings,
      bookingsLoading = false,
      bookingsError = false,
      onReloadBookings,
      onCancelBooking,
      onGoNotice,
      onGoMine,
      onEditAccount,
      onSubmit,
      isSubmitting,
      fetchTakenSlots,
      onReschedule,
      onSubmitFeedback,
      mutationPending = false,
    },
    ref,
  ) {
    const { t } = useTranslation()
    const { modal } = AntApp.useApp() // 替代 ElMessageBox

    // 预约人信息取自登录账号：姓名 + 绑定手机号 / 邮箱，用户无需重复填写
    const userStore = useUserStore()
    const accountName = userStore.profile?.name ?? ''
    const accountContact = userStore.profile?.phone || userStore.profile?.email || ''

    const [form] = Form.useForm<BookingFormValues>()
    const [initialValues] = useState(() => createInitialValues(accountName, accountContact))

    // 会话信息晚于首帧到达时补齐（不覆盖用户已手填的联系方式）
    useEffect(() => {
      if (!accountName) return
      form.setFieldsValue({
        name: accountName,
        contact: accountContact || form.getFieldValue('contact'),
      })
    }, [accountName, accountContact, form])

    const type = Form.useWatch('type', form) ?? 'individual'
    const counselorId = Form.useWatch('counselorId', form)
    const date = Form.useWatch('date', form)
    const slot = Form.useWatch('slot', form)
    const mode = Form.useWatch('mode', form) ?? 'online'
    const name = Form.useWatch('name', form)
    const contact = Form.useWatch('contact', form)
    const agree = Form.useWatch('agree', form)

    const topRef = useRef<HTMLDivElement | null>(null)

    // ============ 我的预约：侧栏只露出「下一次」，完整清单在「我的」页签 ============
    const [detailBooking, setDetailBooking] = useState<BookingItem | null>(null)
    const [rescheduleTarget, setRescheduleTarget] = useState<BookingItem | null>(null)
    const [feedbackTarget, setFeedbackTarget] = useState<BookingItem | null>(null)

    /** 下一次预约：待确认 / 已确认中最早的一条 */
    const upcoming = useMemo(
      () =>
        bookings
          .filter((b) => b.status === 'pending' || b.status === 'confirmed')
          .reduce<BookingItem | null>(
            (next, b) =>
              !next || `${b.date} ${b.slot}` < `${next.date} ${next.slot}` ? b : next,
            null
          ),
      [bookings]
    )

    // 可约时段：老师或日期变化时向页面要一次（页面用 react-query 缓存）
    const [takenSlots, setTakenSlots] = useState<string[]>([])
    const [slotsLoading, setSlotsLoading] = useState(false)
    useEffect(() => {
      if (!counselorId || !date) {
        setTakenSlots([])
        return
      }
      let cancelled = false
      setSlotsLoading(true)
      fetchTakenSlots(counselorId, date.format('YYYY-MM-DD'))
        .then((list) => {
          if (!cancelled) setTakenSlots(list)
        })
        .catch(() => {
          if (!cancelled) setTakenSlots([])
        })
        .finally(() => {
          if (!cancelled) setSlotsLoading(false)
        })
      return () => {
        cancelled = true
      }
    }, [counselorId, date, fetchTakenSlots])

    // 已选时段若被他人占用（偶发）则清空，避免提交后报错
    useEffect(() => {
      if (slot && takenSlots.includes(slot)) form.setFieldValue('slot', '')
    }, [slot, takenSlots, form])

    const statusMap = useMemo<Record<string, string>>(
      () => ({
        pending: t('counseling.bookingStatus.pending'),
        confirmed: t('counseling.bookingStatus.confirmed'),
        completed: t('counseling.bookingStatus.completed'),
        cancelled: t('counseling.bookingStatus.cancelled'),
      }),
      [t]
    )

    // 咨询类型 → Radio.Group 选项（名称走 i18n，图标按 iconKey 映射）
    const typeOptions = useMemo(
      () =>
        consultationTypes.map((item) => {
          const Icon = TYPE_ICONS[item.iconKey] ?? UserOutlined
          return {
            value: item.key,
            label: (
              <span className={styles.typeOptLabel}>
                <span className={styles.typeIcon}>
                  <Icon />
                </span>
                <span className={styles.typeText}>
                  <span className={styles.toName}>{t(`counseling.types.${item.key}`)}</span>
                  <span className={styles.toDur}>{item.duration}min</span>
                </span>
              </span>
            ),
          }
        }),
      [consultationTypes, t]
    )

    // 仅展示支持当前类型的老师
    const availableCounselors = useMemo(
      () => counselors.filter((c) => !type || c.types.includes(type)),
      [counselors, type]
    )

    const modeOptions = useMemo(
      () => [
        {
          value: 'online',
          label: (
            <span className={styles.modeOpt}>
              <VideoCameraOutlined />
              {t('counseling.btn.online')}
            </span>
          ),
        },
        {
          value: 'offline',
          label: (
            <span className={styles.modeOpt}>
              <TeamOutlined />
              {t('counseling.btn.offline')}
            </span>
          ),
        },
      ],
      [t]
    )

    // 切换类型后，若当前老师不支持该类型则清空选择
    function handleValuesChange(changed: Partial<BookingFormValues>) {
      if (!('type' in changed)) return
      const nextType = changed.type
      const currentId = form.getFieldValue('counselorId') as number | undefined
      if (!nextType || currentId == null) return
      const current = counselors.find((c) => c.id === currentId)
      if (!current || !current.types.includes(nextType)) {
        form.setFieldValue('counselorId', undefined)
      }
    }

    async function handleSubmit() {
      let values: BookingFormValues
      try {
        values = await form.validateFields()
      } catch (err) {
        const first = (err as { errorFields?: { name: (string | number)[] }[] }).errorFields?.[0]?.name
        if (first) form.scrollToField(first)
        return
      }

      const counselor = counselors.find((c) => c.id === values.counselorId)
      if (!counselor || !values.date) return

      try {
        // 成功后由页面 onSuccess 失效 ['counseling','bookings'] 刷新右侧列表
        await onSubmit({
          counselorId: counselor.id,
          date: values.date.format('YYYY-MM-DD'),
          slot: values.slot,
          type: values.type,
          mode: values.mode,
          name: values.name.trim(),
          contact: values.contact.trim(),
          description: values.description?.trim() || undefined,
          isFirst: values.isFirst,
        })

        form.resetFields()
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } catch {
        /* 接口错误由页面 mutation 统一提示 */
      }
    }

    function cancelBooking(id: number) {
      modal.confirm({
        title: t('counseling.message.cancelTitle'),
        content: t('counseling.message.cancelConfirm'),
        icon: <ExclamationCircleFilled />,
        onOk() {
          // 状态变更 + 成功提示 + 缓存失效由页面 useMutation 负责
          onCancelBooking(id)
        },
      })
    }

    // 跨面板预约：由列表/弹窗「预约」触发（页面切 tab 后由父级调用）
    useImperativeHandle(
      ref,
      () => ({
        prefill(id: number) {
          const counselor = counselors.find((c) => c.id === id)
          const nextType: ConsultationTypeKey =
            counselor && !counselor.types.includes('individual')
              ? (counselor.types[0] ?? 'individual')
              : 'individual'
          form.setFieldsValue({ type: nextType, counselorId: id })
        },
      }),
      [form, counselors]
    )

    const requiredText = t('counseling.form.required')
    const selectedCounselor = counselors.find((c) => c.id === counselorId)

    // 摘要进度：类型（有默认值）/ 老师 / 时间 / 信息
    const progress = [
      Boolean(type),
      Boolean(counselorId),
      Boolean(date) && Boolean(slot),
      Boolean(name?.trim()) && Boolean(contact?.trim()) && Boolean(agree),
    ]
    const doneCount = progress.filter(Boolean).length

    return (
      <div className={styles.bookingLayout} ref={topRef}>
        <div className={styles.bookingMain}>
          <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onValuesChange={handleValuesChange}
            className={styles.bookingForm}
          >
            {/* 01 咨询类型 */}
            <section className={`${styles.stepBlock} ${progress[0] ? styles.isDone : ''}`}>
              <div className={styles.stepMarker}>
                <span className={styles.stepNum}>01</span>
                <span className={styles.stepTick} aria-hidden="true">
                  <CheckOutlined />
                </span>
              </div>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>
                  {t('counseling.step.type')}
                  <em>*</em>
                </h3>
                <Form.Item
                  name="type"
                  rules={[{ required: true, message: t('counseling.validation.typeRequired') }]}
                >
                  <Radio.Group
                    optionType="button"
                    className={styles.typeOptions}
                    options={typeOptions}
                  />
                </Form.Item>
              </div>
            </section>

            {/* 02 心理老师 */}
            <section className={`${styles.stepBlock} ${progress[1] ? styles.isDone : ''}`}>
              <div className={styles.stepMarker}>
                <span className={styles.stepNum}>02</span>
                <span className={styles.stepTick} aria-hidden="true">
                  <CheckOutlined />
                </span>
              </div>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>
                  {t('counseling.step.counselor')}
                  <em>*</em>
                </h3>
                {type && (
                  <div className={styles.typeHint}>
                    {t('counseling.counselors.filteredHint', {
                      type: t(`counseling.types.${type}`),
                    })}
                  </div>
                )}
                <Form.Item
                  name="counselorId"
                  rules={[{ required: true, message: t('counseling.validation.counselorRequired') }]}
                >
                  <CounselorPicker counselors={availableCounselors} />
                </Form.Item>
              </div>
            </section>

            {/* 03 咨询时间 */}
            <section className={`${styles.stepBlock} ${progress[2] ? styles.isDone : ''}`}>
              <div className={styles.stepMarker}>
                <span className={styles.stepNum}>03</span>
                <span className={styles.stepTick} aria-hidden="true">
                  <CheckOutlined />
                </span>
              </div>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>
                  {t('counseling.step.time')}
                  <em>*</em>
                </h3>
                <Form.Item
                  name="date"
                  rules={[{ required: true, message: t('counseling.validation.dateRequired') }]}
                >
                  <DateStrip />
                </Form.Item>
                <Form.Item
                  name="slot"
                  rules={[{ required: true, message: t('counseling.validation.slotRequired') }]}
                >
                  <SlotPicker takenSlots={takenSlots} loading={slotsLoading} />
                </Form.Item>
                <Form.Item name="mode" className={styles.modeItem}>
                  <Radio.Group
                    optionType="button"
                    className={styles.modeRow}
                    options={modeOptions}
                  />
                </Form.Item>
              </div>
            </section>

            {/* 04 个人信息 */}
            <section className={`${styles.stepBlock} ${progress[3] ? styles.isDone : ''}`}>
              <div className={styles.stepMarker}>
                <span className={styles.stepNum}>04</span>
                <span className={styles.stepTick} aria-hidden="true">
                  <CheckOutlined />
                </span>
              </div>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>
                  {t('counseling.step.info')}
                  <em>*</em>
                </h3>

                {accountContact && (
                  <div className={styles.typeHint}>{t('counseling.form.accountHint')}</div>
                )}

                {/* 预约人：登录账号自动带出，无需手填 */}
                <div className={styles.accountRow}>
                  <span className={styles.accountAvatar} aria-hidden="true">
                    {(accountName || 'U').slice(0, 1)}
                  </span>
                  <div className={styles.accountText}>
                    <span className={styles.accountName}>{accountName || t('nav.user.guest')}</span>
                    <span className={styles.accountMeta}>
                      {accountContact
                        ? maskContact(accountContact)
                        : t('counseling.form.contactUnbound')}
                    </span>
                  </div>
                  {onEditAccount && (
                    <button type="button" className={styles.accountLink} onClick={onEditAccount}>
                      {t('counseling.form.editAccount')}
                    </button>
                  )}
                </div>

                {/* 隐藏字段保证提交契约不变；无绑定联系方式时才降级为手填 */}
                <Form.Item
                  name="name"
                  hidden
                  rules={[
                    { required: true, whitespace: true, message: t('counseling.validation.nameRequired') },
                  ]}
                >
                  <Input />
                </Form.Item>
                {accountContact ? (
                  <Form.Item
                    name="contact"
                    hidden
                    rules={[
                      { required: true, whitespace: true, message: t('counseling.validation.contactRequired') },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                ) : (
                  <Form.Item
                    name="contact"
                    label={t('counseling.form.contact')}
                    rules={[
                      { required: true, whitespace: true, message: t('counseling.validation.contactRequired') },
                    ]}
                  >
                    <Input placeholder={t('counseling.form.contactPlaceholder')} />
                  </Form.Item>
                )}
                <Form.Item name="description" label={t('counseling.form.description')}>
                  <Input.TextArea
                    rows={3}
                    placeholder={t('counseling.form.descPlaceholder')}
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
                <div className={styles.formInline}>
                  <span className={styles.formInlineLabel}>{t('counseling.form.experience')}</span>
                  <Form.Item name="isFirst" valuePropName="checked" noStyle>
                    <Switch
                      checkedChildren={t('counseling.form.first')}
                      unCheckedChildren={t('counseling.form.followup')}
                    />
                  </Form.Item>
                </div>
                <Form.Item
                  name="agree"
                  valuePropName="checked"
                  rules={[
                    {
                      validator: (_, value: boolean) =>
                        value
                          ? Promise.resolve()
                          : Promise.reject(new Error(t('counseling.validation.agreeRequired'))),
                    },
                  ]}
                >
                  <Checkbox>
                    {t('counseling.form.agreePrefix')}{' '}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onGoNotice()
                      }}
                    >
                      {t('counseling.form.noticeLink')}
                    </a>{' '}
                    {t('counseling.form.and')}{' '}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      {t('counseling.form.consentLink')}
                    </a>
                  </Checkbox>
                </Form.Item>
              </div>
            </section>

            <div className={styles.formFooter}>
              <span className={styles.formHint}>
                {requiredText.split('*')[0]}
                <em>*</em>
                {requiredText.split('*')[1]}
              </span>
              <Button
                type="primary"
                size="large"
                loading={isSubmitting}
                disabled={isSubmitting}
                onClick={() => void handleSubmit()}
              >
                {t('counseling.btn.confirmBooking')}
                {!isSubmitting && <ArrowRightOutlined />}
              </Button>
            </div>
          </Form>
        </div>

        {/* 右侧：预约摘要 + 下一次预约（完整清单在「我的」页签） */}
        <aside className={styles.bookingAside}>
          <div className={styles.summaryCard}>
            <div className={styles.scHead}>
              <h4>
                <ProfileOutlined /> {t('counseling.summary.title')}
              </h4>
              <span className={styles.freeTag}>{t('counseling.summary.freeTag')}</span>
            </div>

            {selectedCounselor ? (
              <div className={styles.scCounselor}>
                <span className={styles.scAvatar}>{selectedCounselor.name[0]}</span>
                <span className={styles.scCounselorText}>
                  <b>{selectedCounselor.name}</b>
                  <small>{selectedCounselor.title}</small>
                </span>
              </div>
            ) : (
              <div className={styles.scCounselorEmpty}>
                {t('counseling.summary.counselor')} · {t('counseling.summary.empty')}
              </div>
            )}

            <div className={styles.scRows}>
              <div className={styles.summaryRow}>
                <span>{t('counseling.summary.type')}</span>
                <b>{t(`counseling.types.${type}`)}</b>
              </div>
              <div className={styles.summaryRow}>
                <span>{t('counseling.summary.date')}</span>
                <b className={date ? '' : styles.unset}>
                  {date ? date.format('YYYY-MM-DD') : t('counseling.summary.empty')}
                </b>
              </div>
              <div className={styles.summaryRow}>
                <span>{t('counseling.summary.time')}</span>
                <b className={slot ? '' : styles.unset}>{slot || t('counseling.summary.empty')}</b>
              </div>
              <div className={styles.summaryRow}>
                <span>{t('counseling.summary.mode')}</span>
                <b>
                  {mode === 'online'
                    ? t('counseling.summary.onlineValue')
                    : t('counseling.summary.offlineValue')}
                </b>
              </div>
            </div>

            {/* 完成度：一眼看出还差哪一步 */}
            <div className={styles.scProgress}>
              <span className={styles.scTrack}>
                <span
                  className={styles.scTrackFill}
                  style={{ width: `${(doneCount / 4) * 100}%` }}
                />
              </span>
              <b>
                {doneCount}
                <i>/4</i>
              </b>
            </div>

            {/* 我的预约：侧栏只露出下一次，完整清单在「我的」页签 */}
            <div className={styles.slipBookings}>
              <div className={styles.slipHead}>
                <span className={styles.slipTitle}>{t('counseling.myBookings')}</span>
                {!bookingsLoading && !bookingsError && (
                  <span className={styles.slipCount}>{bookings.length}</span>
                )}
                <button type="button" className={styles.slipAll} onClick={onGoMine}>
                  {t('counseling.booking.viewAll')}
                  <ArrowRightOutlined />
                </button>
              </div>

              {bookingsLoading ? (
                <Skeleton active title={false} paragraph={{ rows: 1, width: '100%' }} />
              ) : bookingsError ? (
                <button type="button" className={styles.slipRetry} onClick={onReloadBookings}>
                  {t('common.loadFailed')} · {t('common.retry')}
                </button>
              ) : upcoming ? (
                <button
                  type="button"
                  className={styles.slipRow}
                  onClick={() => setDetailBooking(upcoming)}
                >
                  <span className={styles.slipWhen}>
                    {upcoming.date} · {upcoming.slot}
                  </span>
                  <span className={styles.slipName}>{upcoming.counselorName}</span>
                  <span className={styles.slipStatus} data-status={upcoming.status}>
                    {statusMap[upcoming.status]}
                  </span>
                </button>
              ) : (
                <p className={styles.slipEmpty}>{t('counseling.booking.empty')}</p>
              )}
            </div>
          </div>
        </aside>

        {/* 预约详情 / 改约 / 评价 */}
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
)

export { BookingPanel }
export default BookingPanel
