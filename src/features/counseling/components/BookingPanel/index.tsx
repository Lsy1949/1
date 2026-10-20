/**
 * 【business】BookingPanel —— 预约咨询面板 · 四步表单 + 预约摘要 + 我的预约
 * - 数据（consultationTypes / counselors / bookings）由页面注入；
 * - 表单状态与校验由 antd Form 托管；提交 / 取消均经回调上抛（页面 useMutation）；
 * - 组件内不读写 localStorage，预约列表完全由 React Query 提供。
 */
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { ComponentType, CSSProperties } from 'react'
import {
  App as AntApp,
  Button,
  Checkbox,
  DatePicker,
  Empty,
  Form,
  Input,
  Radio,
  Result,
  Select,
  Skeleton,
  Switch,
} from 'antd'
import {
  ApartmentOutlined,
  ArrowRightOutlined,
  ExclamationCircleFilled,
  HomeOutlined,
  MessageOutlined,
  ProfileOutlined,
  StarOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type {
  BookingCreateInput,
  BookingItem,
  BookingMode,
  ConsultationType,
  ConsultationTypeKey,
  CounselingIconKey,
  Counselor,
} from '../types'
import { useI18n } from '@/i18n'
import styles from './BookingPanel.module.css'

/** 图标语义 key → antd 图标（接口不下发组件） */
const TYPE_ICONS: Record<CounselingIconKey, ComponentType> = {
  user: UserOutlined,
  apartment: ApartmentOutlined,
  home: HomeOutlined,
  message: MessageOutlined,
}

/** 可预约时段（与后端排班表对齐；disabled 为已约满/不开放） */
const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '19:00', '20:00']
const DISABLED_SLOTS = new Set(['11:00', '16:00'])

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

function createInitialValues(): BookingFormValues {
  return {
    type: 'individual',
    counselorId: undefined,
    date: undefined,
    slot: '',
    mode: 'online',
    name: '',
    contact: '',
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
  /** 提交预约（页面 useMutation → POST） */
  onSubmit: (input: BookingCreateInput) => Promise<BookingItem>
  isSubmitting: boolean
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
      onSubmit,
      isSubmitting,
    },
    ref,
  ) {
    const { t } = useI18n()
    const { modal } = AntApp.useApp() // 替代 ElMessageBox

    const [form] = Form.useForm<BookingFormValues>()
    const [initialValues] = useState(createInitialValues)

    const type = Form.useWatch('type', form) ?? 'individual'
    const counselorId = Form.useWatch('counselorId', form)
    const date = Form.useWatch('date', form)
    const slot = Form.useWatch('slot', form)
    const mode = Form.useWatch('mode', form) ?? 'online'

    const topRef = useRef<HTMLDivElement | null>(null)

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
                <Icon />
                <span className={styles.toName}>{t(`counseling.types.${item.key}`)}</span>
                <span className={styles.toDur}>{item.duration}min</span>
              </span>
            ),
          }
        }),
      [consultationTypes, t]
    )

    // 仅展示支持当前类型的老师
    const counselorOptions = useMemo(
      () =>
        counselors
          .filter((c) => !type || c.types.includes(type))
          .map((c) => ({ value: c.id, label: `${c.name} · ${c.title}` })),
      [counselors, type]
    )

    const slotOptions = useMemo(
      () => TIME_SLOTS.map((value) => ({ value, label: value, disabled: DISABLED_SLOTS.has(value) })),
      []
    )

    const modeOptions = useMemo(
      () => [
        { value: 'online', label: t('counseling.btn.online') },
        { value: 'offline', label: t('counseling.btn.offline') },
      ],
      [t]
    )

    const disabledDate = (current: Dayjs): boolean => {
      const tomorrow = dayjs().startOf('day').add(1, 'day')
      const lastDay = dayjs().startOf('day').add(7, 'day')
      return current.valueOf() < tomorrow.valueOf() || current.valueOf() > lastDay.valueOf()
    }

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
    const counselorName = counselors.find((c) => c.id === counselorId)?.name ?? ''

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
            <section className={styles.stepBlock}>
              <div className={styles.stepMarker}>
                <span className={styles.stepNum}>01</span>
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
            <section className={styles.stepBlock}>
              <div className={styles.stepMarker}>
                <span className={styles.stepNum}>02</span>
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
                  <Select
                    className={styles.counselorSelect}
                    showSearch
                    allowClear
                    placeholder={t('counseling.counselors.searchPlaceholder')}
                    options={counselorOptions}
                    filterOption={(input, option) => {
                      const counselor = counselors.find((c) => c.id === option?.value)
                      if (!counselor) return false
                      const keyword = input.toLowerCase()
                      return (
                        counselor.name.toLowerCase().includes(keyword) ||
                        counselor.title.toLowerCase().includes(keyword) ||
                        counselor.specialties.join(' ').toLowerCase().includes(keyword)
                      )
                    }}
                    notFoundContent={
                      <div className={styles.counselorEmpty}>
                        {t('counseling.empty.noCounselor')}
                      </div>
                    }
                    optionRender={(option) => {
                      const counselor = counselors.find((c) => c.id === option.value)
                      if (!counselor) return option.label
                      return (
                        <div className={styles.selectOption}>
                          <span className={styles.soName}>{counselor.name}</span>
                          <span className={styles.soMeta}>{counselor.title}</span>
                          <span className={styles.soRating}>
                            <StarOutlined /> {counselor.rating}
                          </span>
                        </div>
                      )
                    }}
                  />
                </Form.Item>
              </div>
            </section>

            {/* 03 咨询时间 */}
            <section className={styles.stepBlock}>
              <div className={styles.stepMarker}>
                <span className={styles.stepNum}>03</span>
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
                  <DatePicker
                    className={styles.datePicker}
                    format="YYYY-MM-DD"
                    placeholder={t('counseling.form.datePlaceholder')}
                    disabledDate={disabledDate}
                  />
                </Form.Item>
                <div className={styles.timeMode}>
                  <Form.Item
                    name="slot"
                    rules={[{ required: true, message: t('counseling.validation.slotRequired') }]}
                  >
                    <Radio.Group
                      optionType="button"
                      className={styles.slotRow}
                      options={slotOptions}
                    />
                  </Form.Item>
                  <Form.Item name="mode">
                    <Radio.Group
                      optionType="button"
                      className={styles.modeRow}
                      options={modeOptions}
                    />
                  </Form.Item>
                </div>
              </div>
            </section>

            {/* 04 个人信息 */}
            <section className={styles.stepBlock}>
              <div className={styles.stepMarker}>
                <span className={styles.stepNum}>04</span>
              </div>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>
                  {t('counseling.step.info')}
                  <em>*</em>
                </h3>
                <div className={styles.formGrid}>
                  <Form.Item
                    name="name"
                    label={t('counseling.form.name')}
                    rules={[{ required: true, whitespace: true, message: t('counseling.validation.nameRequired') }]}
                  >
                    <Input placeholder={t('counseling.form.namePlaceholder')} />
                  </Form.Item>
                  <Form.Item
                    name="contact"
                    label={t('counseling.form.contact')}
                    rules={[{ required: true, whitespace: true, message: t('counseling.validation.contactRequired') }]}
                  >
                    <Input placeholder={t('counseling.form.contactPlaceholder')} />
                  </Form.Item>
                </div>
                <Form.Item
                  name="description"
                  label={t('counseling.form.description')}
                >
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
              <b className={type ? '' : styles.unset}>
                {type ? t(`counseling.types.${type}`) : ''}
              </b>
            </div>
            <div className={styles.summaryRow}>
              <span>{t('counseling.summary.counselor')}</span>
              <b className={counselorName ? '' : styles.unset}>{counselorName}</b>
            </div>
            <div className={styles.summaryRow}>
              <span>{t('counseling.summary.date')}</span>
              <b className={date ? '' : styles.unset}>{date ? date.format('YYYY-MM-DD') : ''}</b>
            </div>
            <div className={styles.summaryRow}>
              <span>{t('counseling.summary.time')}</span>
              <b className={slot ? '' : styles.unset}>{slot || ''}</b>
            </div>
            <div className={styles.summaryRow}>
              <span>{t('counseling.summary.mode')}</span>
              <b>{mode === 'online' ? t('counseling.summary.onlineValue') : t('counseling.summary.offlineValue')}</b>
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
              {!bookingsLoading && !bookingsError && (
                <span className={styles.mbCount}>{bookings.length}</span>
              )}
            </div>
            {bookingsLoading ? (
              /* 加载中：与预约条目等高的骨架 */
              <div className={styles.mbSkeleton}>
                <Skeleton active title={{ width: '46%' }} paragraph={{ rows: 2 }} />
                <Skeleton active title={{ width: '46%' }} paragraph={{ rows: 2 }} />
              </div>
            ) : bookingsError ? (
              /* 加载失败：提示 + 重试 */
              <Result
                className={styles.mbError}
                status="error"
                title={t('common.loadFailed')}
                extra={
                  <Button size="small" onClick={onReloadBookings}>
                    {t('common.retry')}
                  </Button>
                }
              />
            ) : bookings.length > 0 ? (
              <div className={styles.mbList}>
                {bookings.map((b) => (
                  <div key={b.id} className={`${styles.mbItem} status-${b.status}`}>
                    <div className={styles.mbTop}>
                      <span className={styles.mbCounselor}>{b.counselorName}</span>
                      <span className={`${styles.mbStatus} s-${b.status}`}>{statusMap[b.status]}</span>
                    </div>
                    <div className={styles.mbInfo}>
                      {b.date} {b.slot} · {t(`counseling.types.${b.type}`)}
                    </div>
                    {b.status === 'pending' && (
                      <div className={styles.mbActions}>
                        <Button size="small" onClick={() => cancelBooking(b.id)}>
                          {t('counseling.booking.cancelBtn')}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* 空状态：引导去预约 */
              <div className={styles.mbEmpty}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('counseling.booking.emptyHint')}
                />
              </div>
            )}
          </div>
        </aside>
      </div>
    )
  }
)

export { BookingPanel }
export default BookingPanel
