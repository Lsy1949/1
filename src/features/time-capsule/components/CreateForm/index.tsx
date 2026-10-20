// 时光胶囊 · 新建表单（antd Form + Input/DatePicker/Segmented/Upload/Radio/Button）
// 表单状态、校验、草稿均由 Form 统一管理；提交行为经 onSubmit 上抛（页面 useMutation）
import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Radio,
  Segmented,
  Switch,
  Upload,
} from 'antd'
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface'
import { FormOutlined, MailOutlined, PlusOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import type { CapsuleCreateInput } from '../types'
import styles from './CreateForm.module.css'

// 简化富文本工具栏（@wangeditor 未在 React 项目依赖中，保留 contentEditable + execCommand）
const TOOLBAR_ITEMS = [
  { cmd: 'bold', label: 'B', title: '加粗' },
  { cmd: 'italic', label: 'I', title: '斜体' },
  { cmd: 'underline', label: 'U', title: '下划线' },
  { cmd: 'strikeThrough', label: 'S', title: '删除线' },
  { cmd: 'insertUnorderedList', label: '•', title: '无序列表' },
  { cmd: 'insertOrderedList', label: '1.', title: '有序列表' },
]

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

/** 富文本受控组件：Form.Item 会注入 value / onChange */
interface RichEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
}

function RichEditor({ value = '', onChange, placeholder }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)

  // 仅当外部值与 DOM 不一致时回写（草稿恢复/重置），避免输入过程中重置光标
  useEffect(() => {
    const el = editorRef.current
    if (el && el.innerHTML !== value) el.innerHTML = value
  }, [value])

  const execFormat = (cmd: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd)
    onChange?.(editorRef.current?.innerHTML ?? '')
  }

  return (
    <div className={styles.wangEditorWrap}>
      <div className={styles.wangToolbar}>
        {TOOLBAR_ITEMS.map((item) => (
          <Button
            key={item.cmd}
            type="text"
            size="small"
            title={item.title}
            className={styles.wangMenuBtn}
            onMouseDown={(e) => {
              // 阻止工具栏按钮抢焦点，保证选区仍在编辑区内
              e.preventDefault()
              execFormat(item.cmd)
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div
        ref={editorRef}
        className={styles.wangEditor}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => onChange?.((e.target as HTMLDivElement).innerHTML)}
      />
    </div>
  )
}

export interface CreateFormProps {
  onSubmit: (values: CapsuleCreateInput) => Promise<unknown>
  isSubmitting: boolean
}

export function CreateForm({ onSubmit, isSubmitting }: CreateFormProps) {
  const { t } = useI18n()

  const [form] = Form.useForm<CapsuleFormValues>()
  const [initialValues] = useState(createInitialValues)

  const openMethod = Form.useWatch('openMethod', form) ?? 'email'
  const isAnonymous = Form.useWatch('isAnonymous', form) ?? false
  const isPublic = Form.useWatch('isPublic', form) ?? false
  const disableComment = Form.useWatch('disableComment', form) ?? false
  const contentValue = Form.useWatch('content', form) ?? ''
  const imageList = Form.useWatch('images', form) ?? []

  const contentLength = useMemo(
    () => contentValue.replace(/<[^>]*>/g, '').length,
    [contentValue],
  )

  // 图片预览
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')

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
      {/* 01. 胶囊标题 */}
      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionNum}>01</span>
          <span className={styles.requiredMark}>*</span>
          {t('capsule.create.sections.title')}
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

      {/* 02. 开启时间 */}
      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionNum}>02</span>
          <span className={styles.requiredMark}>*</span>
          {t('capsule.create.sections.openDate')}
        </div>
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
      </section>

      {/* 03. 开启方式 */}
      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionNum}>03</span>
          <span className={styles.requiredMark}>*</span>
          {t('capsule.create.sections.method')}
        </div>
        <Form.Item name="openMethod">
          <Segmented block options={methodOptions} className={styles.methodSelector} />
        </Form.Item>
      </section>

      {/* 04. 邮件信息 */}
      {openMethod === 'email' && (
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionNum}>04</span>
            <span className={styles.requiredMark}>*</span>
            {t('capsule.create.sections.emailInfo')}
          </div>
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
        </section>
      )}

      {/* 04. 手写信信息 */}
      {openMethod === 'letter' && (
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionNum}>04</span>
            <span className={styles.requiredMark}>*</span>
            {t('capsule.create.sections.letterInfo')}
          </div>
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
        </section>
      )}

      {/* 05. 匿名发送 */}
      <section className={styles.formSection}>
        <div className={styles.switchRow}>
          <span className={`${styles.sectionTitle} ${styles.noMargin}`}>
            <span className={styles.sectionNum}>05</span>
            {t('capsule.create.sections.anonymous')}
          </span>
          <Form.Item name="isAnonymous" valuePropName="checked" noStyle>
            <Switch className={styles.capsuleSwitch} />
          </Form.Item>
        </div>
        {isAnonymous && <p className={styles.tipText}>{t('capsule.create.tips.anonymous')}</p>}
      </section>

      {/* 06. 公开到广场 */}
      <section className={styles.formSection}>
        <div className={styles.switchRow}>
          <span className={`${styles.sectionTitle} ${styles.noMargin}`}>
            <span className={styles.sectionNum}>06</span>
            {t('capsule.create.sections.public')}
          </span>
          <Form.Item name="isPublic" valuePropName="checked" noStyle>
            <Switch className={styles.capsuleSwitch} />
          </Form.Item>
        </div>
        {isPublic && <p className={styles.tipText}>{t('capsule.create.tips.public')}</p>}
        {isPublic && (
          <div className={styles.commentSetting}>
            <div className={styles.switchRow}>
              <span className={`${styles.sectionTitle} ${styles.noMargin} ${styles.small}`}>
                {t('capsule.create.tips.disableComment')}
              </span>
              <Form.Item name="disableComment" valuePropName="checked" noStyle>
                <Switch className={styles.capsuleSwitch} />
              </Form.Item>
            </div>
            <p className={styles.tipText}>
              {disableComment ? t('capsule.create.tips.commentOff') : t('capsule.create.tips.commentOn')}
            </p>
          </div>
        )}
      </section>

      {/* 07. 胶囊内容 */}
      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionNum}>07</span>
          <span className={styles.requiredMark}>*</span>
          {t('capsule.create.sections.content')}
          <span className={styles.optionalHint}>{t('capsule.create.hints.contentOptional')}</span>
        </div>
        <div className={styles.contentWrapper}>
          <Form.Item
            name="content"
            dependencies={['images']}
            className={styles.contentItem}
            rules={[
              {
                validator: (_, value: string) => {
                  const text = String(value ?? '').replace(/<[^>]*>/g, '').trim()
                  const files = (form.getFieldValue('images') as UploadFile[] | undefined) ?? []
                  return text || files.length > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error(t('capsule.create.validation.content')))
                },
              },
            ]}
          >
            <RichEditor placeholder={t('capsule.create.placeholders.editor')} />
          </Form.Item>
          <span className={styles.contentCount}>{contentLength}/500</span>
        </div>
      </section>

      {/* 08. 添加照片 */}
      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionNum}>08</span>
          {t('capsule.create.sections.photo')}
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
            onPreview={(file) => {
              const src = file.url ?? file.thumbUrl ?? ''
              if (!src) return
              setPreviewSrc(src)
              setPreviewVisible(true)
            }}
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

      {/* 09. 此刻心情 */}
      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionNum}>09</span>
          {t('capsule.create.sections.mood')}
        </div>
        <Form.Item name="emotion">
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            className={styles.emotionTags}
            options={emotionOptions}
          />
        </Form.Item>
      </section>

      {/* 提交按钮 */}
      <section className={styles.submitSection}>
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
      </section>

      {/* 图片预览 */}
      <Modal
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width="auto"
        centered
        styles={{
          content: { background: 'transparent', boxShadow: 'none' },
        }}
      >
        {previewSrc && (
          <img src={previewSrc} className={styles.previewImage} alt={t('capsule.create.photo.alt')} />
        )}
      </Modal>
    </Form>
  )
}

export default CreateForm
