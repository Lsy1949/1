// 时光胶囊 · 新建表单（antd Form + Input/DatePicker/Segmented/Upload/Radio/Button）
// 布局：桌面双栏（左写作区 01-05 发丝线分区 / 右投递摘要 + 隐私 + 提交吸顶），窄屏单列
// 表单状态、校验、草稿均由 Form 统一管理；提交行为经 onSubmit 上抛（页面 useMutation）
import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import {
  Button,
  DatePicker,
  Form,
  Image,
  Input,
  Radio,
  Segmented,
  Switch,
  Upload,
} from 'antd'
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface'
import { FormOutlined, MailOutlined, PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import RichTextEditor from '@/components/RichTextEditor'
import { htmlToText } from '@/components/RichTextEditor/sanitize'
import type { CapsuleCreateInput } from '../types'
import styles from './CreateForm.module.css'

const EMOTION_LIST = [
  { id: 'happy', emoji: '😊' },
  { id: 'excited', emoji: '🤩' },
  { id: 'calm', emoji: '😌' },
  { id: 'sad', emoji: '😢' },
  { id: 'hopeful', emoji: '🌟' }
]

const DRAFT_KEY = 'capsule_draft'
const MAX_IMAGES = 6

interface CapsuleFormValues {
  title: string
  openDate: Dayjs
  openMethod: 'email' | 'letter'
  emailRecipient?: string
  letterName?: string
  letterPhone?: string
  letterAddress?: string
  isAnonymous: boolean
  isPublic: boolean
  disableComment: boolean
  content?: string
  images?: UploadFile[]
  emotion: string
}

/** 草稿只保存可序列化字段（Dayjs 转字符串；图片为 File 对象，不进入草稿） */
type CapsuleDraft = Omit<CapsuleFormValues, 'openDate' | 'images'> & {
  openDate: string | null
}

function createInitialValues(): CapsuleFormValues {
  return {
    title: '',
    openDate: dayjs().add(1, 'day'),
    openMethod: 'email',
    emailRecipient: '',
    letterName: '',
    letterPhone: '',
    letterAddress: '',
    isAnonymous: false,
    isPublic: false,
    disableComment: false,
    content: '',
    images: [],
    emotion: 'hopeful',
  }
}

function readDraft(): Partial<CapsuleDraft> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as Partial<CapsuleDraft>) : null
  } catch {
    return null
  }
}

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('读取图片失败'))
    reader.readAsDataURL(file)
  })
}

/** 富文本受控组件由公共层提供：@/components/RichTextEditor（Form.Item 直接注入 value / onChange） */

export interface CreateFormProps {
  onSubmit: (values: CapsuleCreateInput) => Promise<unknown>
  isSubmitting: boolean
}

export function CreateForm({ onSubmit, isSubmitting }: CreateFormProps) {
  const { t } = useTranslation()

  const [form] = Form.useForm<CapsuleFormValues>()
  const [initialValues] = useState(createInitialValues)

  const openMethod = Form.useWatch('openMethod', form) ?? 'email'
  const isAnonymous = Form.useWatch('isAnonymous', form) ?? false
  const isPublic = Form.useWatch('isPublic', form) ?? false
  const disableComment = Form.useWatch('disableComment', form) ?? false
  const imageList = Form.useWatch('images', form) ?? []

  // 右栏摘要只读所需的展示值（不参与校验与提交）
  const openDate = Form.useWatch('openDate', form) as Dayjs | undefined
  const emailRecipient = Form.useWatch('emailRecipient', form)
  const letterName = Form.useWatch('letterName', form)

  // 距开启日期还有多少天（无效日期返回 null，展示 —）
  const daysLeft = useMemo(() => {
    if (!openDate || !dayjs(openDate).isValid()) return null
    return dayjs(openDate).startOf('day').diff(dayjs().startOf('day'), 'day')
  }, [openDate])

  const recipientText = (openMethod === 'email' ? emailRecipient : letterName)?.trim()

  // 图片预览（统一走 antd Image.PreviewGroup，支持左右切换 / 缩放 / 蒙层）
  // 注意：antd 的 thumbUrl 是在 UploadList 内部「原地」写入文件对象的（只触发列表局部重渲染），
  // 父组件不会拿到新引用，因此 sources 必须在打开预览时现算，不能放在 useMemo 里缓存。
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSources, setPreviewSources] = useState<string[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)

  const openPreview = (file: UploadFile) => {
    const entries = imageList
      .map((item) => ({ uid: item.uid, src: item.url ?? item.thumbUrl ?? '' }))
      .filter((item): item is { uid: string; src: string } => Boolean(item.src))
    if (entries.length === 0) return
    const index = entries.findIndex((item) => item.uid === file.uid)
    setPreviewSources(entries.map((item) => item.src))
    setPreviewIndex(index >= 0 ? index : 0)
    setPreviewOpen(true)
  }

  const disabledDate = (current: Dayjs): boolean => {
    const tomorrow = dayjs().startOf('day').add(1, 'day')
    const fiveYearsLater = dayjs().add(5, 'year')
    return current.valueOf() < tomorrow.valueOf() || current.valueOf() > fiveYearsLater.valueOf()
  }

  const methodOptions = useMemo(() => [
    {
      value: 'email',
      label: (
        <span className={styles.methodLabel}>
          <MailOutlined /> {t('capsule.create.methods.email')}
        </span>
      ),
    },
    {
      value: 'letter',
      label: (
        <span className={styles.methodLabel}>
          <FormOutlined /> {t('capsule.create.methods.letter')}
        </span>
      ),
    },
  ], [t])

  const emotionOptions = useMemo(
    () => EMOTION_LIST.map((item) => ({ label: item.emoji, value: item.id })),
    [],
  )

  // 草稿恢复（挂载时一次）
  useEffect(() => {
    const saved = readDraft()
    if (!saved) return
    form.setFieldsValue({
      ...saved,
      openDate: saved.openDate ? dayjs(saved.openDate) : initialValues.openDate,
    })
  }, [form, initialValues])

  // 草稿自动保存：onValuesChange 触发，1s 防抖
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scheduleDraft = (all: CapsuleFormValues) => {
    if (draftTimer.current) clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => {
      try {
        const draft: CapsuleDraft = {
          title: all.title ?? '',
          openDate: all.openDate ? all.openDate.format('YYYY-MM-DD') : null,
          openMethod: all.openMethod ?? 'email',
          emailRecipient: all.emailRecipient,
          letterName: all.letterName,
          letterPhone: all.letterPhone,
          letterAddress: all.letterAddress,
          isAnonymous: Boolean(all.isAnonymous),
          isPublic: Boolean(all.isPublic),
          disableComment: Boolean(all.disableComment),
          content: all.content ?? '',
          emotion: all.emotion ?? 'hopeful',
        }
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      } catch {
        /* localStorage 不可用时忽略 */
      }
    }, 1000)
  }

  useEffect(
    () => () => {
      if (draftTimer.current) clearTimeout(draftTimer.current)
    },
    []
  )

  const handleSubmit = async () => {
    let values: CapsuleFormValues
    try {
      // antd 原生校验：任一条 rules 不通过都会 reject，阻断后续提交
      values = await form.validateFields()
    } catch {
      return
    }

    try {
      const images = await Promise.all(
        (values.images ?? []).map((file) =>
          file.originFileObj
            ? fileToDataUrl(file.originFileObj)
            : Promise.resolve(file.url ?? file.thumbUrl ?? ''),
        ),
      )

      const isEmail = values.openMethod === 'email'
      const payload: CapsuleCreateInput = {
        title: values.title.trim(),
        openDate: values.openDate.format('YYYY-MM-DD'),
        openMethod: values.openMethod,
        content: values.content ?? '',
        images: images.filter(Boolean),
        emotion: values.emotion,
        isAnonymous: values.isAnonymous,
        isPublic: values.isPublic,
        disableComment: values.isPublic ? values.disableComment : false,
        emailRecipient: isEmail ? values.emailRecipient?.trim() : undefined,
        letterName: isEmail ? undefined : values.letterName?.trim(),
        letterPhone: isEmail ? undefined : values.letterPhone?.trim(),
        letterAddress: isEmail ? undefined : values.letterAddress?.trim(),
      }

      await onSubmit(payload)
      // 成功后才清理草稿；失败保留，便于用户修改后重试
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* 接口错误由页面 mutation 统一提示，这里只保证不跳转、不清理草稿 */
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={initialValues}
      onValuesChange={(_changed, all) => scheduleDraft(all)}
      scrollToFirstError
      className={styles.formContainer}
    >
      {/* ============ 左栏：写作区 ============ */}
      <div className={styles.mainCol}>
        {/* 01. 胶囊标题 */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>01</span>
            <h2 className={styles.sectionTitle}>
              {t('capsule.create.sections.title')}
              <span className={styles.requiredMark}>*</span>
            </h2>
          </div>
          <Form.Item
            name="title"
            className={styles.titleItem}
            rules={[
              { required: true, whitespace: true, message: t('capsule.create.validation.title') },
              { max: 30, message: t('capsule.create.validation.title') },
            ]}
          >
            <Input
              variant="borderless"
              className={styles.titleInput}
              placeholder={t('capsule.create.placeholders.title')}
              maxLength={30}
              showCount
            />
          </Form.Item>
        </section>

        {/* 02. 胶囊内容 */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>02</span>
            <h2 className={styles.sectionTitle}>
              {t('capsule.create.sections.content')}
              <span className={styles.requiredMark}>*</span>
              <span className={styles.optionalHint}>{t('capsule.create.hints.contentOptional')}</span>
            </h2>
          </div>
          <div className={styles.contentWrapper}>
            <Form.Item
              name="content"
              dependencies={['images']}
              className={styles.contentItem}
              rules={[
                {
                  validator: (_, value: string) => {
                    const text = htmlToText(String(value ?? ''))
                    const files = (form.getFieldValue('images') as UploadFile[] | undefined) ?? []
                    return text || files.length > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error(t('capsule.create.validation.content')))
                  },
                },
              ]}
            >
              <RichTextEditor
                variant="plain"
                placeholder={t('capsule.create.placeholders.editor')}
                maxLength={500}
              />
            </Form.Item>
          </div>
        </section>

        {/* 03. 添加照片 */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>03</span>
            <h2 className={styles.sectionTitle}>{t('capsule.create.sections.photo')}</h2>
            <span className={styles.sectionMeta}>
              {imageList.length}/{MAX_IMAGES}
            </span>
          </div>
          <Form.Item
            name="images"
            valuePropName="fileList"
            getValueFromEvent={(event: UploadChangeParam) => event?.fileList}
            className={styles.uploadItem}
          >
            <Upload
              listType="picture-card"
              accept="image/*"
              multiple
              maxCount={MAX_IMAGES}
              beforeUpload={() => false}
              onPreview={openPreview}
            >
              {imageList.length >= MAX_IMAGES ? null : (
                <div className={styles.uploadTrigger}>
                  <PlusOutlined className={styles.uploadIcon} />
                  <span className={styles.uploadText}>{t('capsule.create.photo.add')}</span>
                </div>
              )}
            </Upload>
          </Form.Item>
        </section>

        {/* 04. 此刻心情 */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>04</span>
            <h2 className={styles.sectionTitle}>{t('capsule.create.sections.mood')}</h2>
          </div>
          <Form.Item name="emotion" className={styles.fieldItem}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              className={styles.emotionTags}
              options={emotionOptions}
            />
          </Form.Item>
        </section>

        {/* 05. 投递设置：开启时间 / 开启方式 / 收件信息 */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>05</span>
            <h2 className={styles.sectionTitle}>{t('capsule.create.sections.delivery')}</h2>
          </div>
          <div className={styles.deliveryGrid}>
            <div className={styles.deliveryCell}>
              <p className={styles.fieldLabel}>
                {t('capsule.create.sections.openDate')}
                <span className={styles.requiredMark}>*</span>
              </p>
              <Form.Item
                name="openDate"
                rules={[{ required: true, message: t('capsule.create.validation.date') }]}
              >
                <DatePicker
                  variant="borderless"
                  format="YYYY-MM-DD"
                  className={styles.datePicker}
                  placeholder={t('capsule.create.placeholders.date')}
                  disabledDate={disabledDate}
                  suffixIcon={<span className={styles.arrow}>→</span>}
                />
              </Form.Item>
              <p className={styles.hint}>{t('capsule.create.hints.dateRange')}</p>
            </div>

            <div className={styles.deliveryCell}>
              <p className={styles.fieldLabel}>
                {t('capsule.create.sections.method')}
                <span className={styles.requiredMark}>*</span>
              </p>
              <Form.Item name="openMethod">
                <Segmented block options={methodOptions} className={styles.methodSelector} />
              </Form.Item>
            </div>

            {/* 收件信息：整行 */}
            <div className={styles.deliveryWide}>
              {openMethod === 'email' && (
                <>
                  <p className={styles.fieldLabel}>
                    {t('capsule.create.sections.emailInfo')}
                    <span className={styles.requiredMark}>*</span>
                  </p>
                  <Form.Item
                    name="emailRecipient"
                    className={styles.infoItem}
                    rules={[
                      { required: true, whitespace: true, message: t('capsule.create.validation.email') },
                      { type: 'email', message: t('capsule.create.validation.emailFormat') },
                    ]}
                  >
                    <Input
                      variant="borderless"
                      className={styles.infoInput}
                      placeholder={t('capsule.create.placeholders.email')}
                    />
                  </Form.Item>
                </>
              )}

              {openMethod === 'letter' && (
                <>
                  <p className={styles.fieldLabel}>
                    {t('capsule.create.sections.letterInfo')}
                    <span className={styles.requiredMark}>*</span>
                  </p>
                  <Form.Item
                    name="letterName"
                    className={styles.infoItem}
                    rules={[{ required: true, whitespace: true, message: t('capsule.create.validation.letterName') }]}
                  >
                    <Input
                      variant="borderless"
                      className={styles.infoInput}
                      placeholder={t('capsule.create.placeholders.name')}
                    />
                  </Form.Item>
                  <Form.Item
                    name="letterPhone"
                    className={styles.infoItem}
                    rules={[{ required: true, whitespace: true, message: t('capsule.create.validation.letterPhone') }]}
                  >
                    <Input
                      variant="borderless"
                      className={styles.infoInput}
                      placeholder={t('capsule.create.placeholders.phone')}
                    />
                  </Form.Item>
                  <Form.Item
                    name="letterAddress"
                    className={styles.infoItem}
                    rules={[{ required: true, whitespace: true, message: t('capsule.create.validation.letterAddress') }]}
                  >
                    <Input.TextArea
                      variant="borderless"
                      className={`${styles.infoInput} ${styles.addressInput}`}
                      placeholder={t('capsule.create.placeholders.address')}
                      maxLength={50}
                      autoSize={{ minRows: 2, maxRows: 3 }}
                    />
                  </Form.Item>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ============ 右栏：投递摘要 / 隐私 / 提交（吸顶） ============ */}
      <aside className={styles.rail}>
        <div className={styles.railBlock}>
          <div className={styles.railHead}>
            <h3 className={styles.railTitle}>{t('capsule.create.aside.summary')}</h3>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.countdown}>
              <b>{daysLeft ?? '—'}</b>
              <span>{t('capsule.create.aside.daysLeft')}</span>
            </div>
            <dl className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <dt>{t('capsule.create.aside.openDate')}</dt>
                <dd>{openDate && dayjs(openDate).isValid() ? openDate.format('YYYY-MM-DD') : '—'}</dd>
              </div>
              <div className={styles.summaryRow}>
                <dt>{t('capsule.create.aside.method')}</dt>
                <dd>
                  {openMethod === 'email'
                    ? t('capsule.create.methods.email')
                    : t('capsule.create.methods.letter')}
                </dd>
              </div>
              <div className={styles.summaryRow}>
                <dt>{t('capsule.create.aside.recipient')}</dt>
                <dd>{recipientText || t('capsule.create.aside.unspecified')}</dd>
              </div>
              <div className={styles.summaryRow}>
                <dt>{t('capsule.create.aside.visibility')}</dt>
                <dd>
                  {isPublic
                    ? t('capsule.create.aside.publicOn')
                    : t('capsule.create.aside.publicOff')}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className={styles.railBlock}>
          <div className={styles.railHead}>
            <h3 className={styles.railTitle}>{t('capsule.create.aside.privacy')}</h3>
          </div>

          {/* 匿名发送 */}
          <div className={styles.settingRow}>
            <div className={styles.settingText}>
              <span className={styles.settingLabel}>{t('capsule.create.sections.anonymous')}</span>
              {isAnonymous && (
                <span className={styles.settingHint}>{t('capsule.create.tips.anonymous')}</span>
              )}
            </div>
            <Form.Item name="isAnonymous" valuePropName="checked" noStyle>
              <Switch className={styles.capsuleSwitch} />
            </Form.Item>
          </div>

          {/* 公开到广场 */}
          <div className={styles.settingRow}>
            <div className={styles.settingText}>
              <span className={styles.settingLabel}>{t('capsule.create.sections.public')}</span>
              {isPublic && (
                <span className={styles.settingHint}>{t('capsule.create.tips.public')}</span>
              )}
            </div>
            <Form.Item name="isPublic" valuePropName="checked" noStyle>
              <Switch className={styles.capsuleSwitch} />
            </Form.Item>
          </div>

          {isPublic && (
            <div className={styles.commentSetting}>
              <div className={styles.settingRow}>
                <div className={styles.settingText}>
                  <span className={styles.settingLabel}>{t('capsule.create.tips.disableComment')}</span>
                  <span className={styles.settingHint}>
                    {disableComment ? t('capsule.create.tips.commentOff') : t('capsule.create.tips.commentOn')}
                  </span>
                </div>
                <Form.Item name="disableComment" valuePropName="checked" noStyle>
                  <Switch className={styles.capsuleSwitch} />
                </Form.Item>
              </div>
            </div>
          )}
        </div>

        <div className={styles.submitSection}>
          <Button
            type="primary"
            size="large"
            block
            loading={isSubmitting}
            disabled={isSubmitting}
            className={styles.submitBtn}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? t('capsule.create.submitting') : t('capsule.create.submit')}
          </Button>
          <p className={styles.submitHint}>{t('capsule.create.aside.submitHint')}</p>
        </div>
      </aside>

      {/* 图片预览：antd Image.PreviewGroup（左右切换 / 缩放 / 蒙层 / Esc 关闭） */}
      {previewSources.length > 0 && (
        <Image.PreviewGroup
          items={previewSources}
          preview={{
            open: previewOpen,
            current: previewIndex,
            onOpenChange: (visible) => setPreviewOpen(visible),
          }}
        />
      )}
    </Form>
  )
}

export default CreateForm
