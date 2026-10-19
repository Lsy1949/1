// 时光胶囊 · 新建表单（标题/开启时间/开启方式/邮件或手写信/开关/富文本内容/照片/心情 + 提交 + 成功弹窗）
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, MouseEvent as ReactMouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { App as AntApp, Button, DatePicker, Modal, Switch } from 'antd'
import { CheckCircleFilled, FormOutlined, MailOutlined, PlusOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import styles from './CreateForm.module.css'

// 简化富文本工具栏（@wangeditor 未在 React 项目依赖中，降级为 contentEditable + execCommand）
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

export function CreateForm() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { message } = AntApp.useApp() // 替代 ElMessage

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 01. 胶囊标题
  const [title, setTitle] = useState('')

  // 02. 开启时间
  const [openDate, setOpenDate] = useState(() => dayjs().add(1, 'day').format('YYYY-MM-DD'))
  const [pickerOpen, setPickerOpen] = useState(false)

  const openDateText = useMemo(() => openDate || t('capsule.create.placeholders.date'), [openDate, t])

  const disabledDate = (current: Dayjs): boolean => {
    const tomorrow = dayjs().startOf('day').add(1, 'day')
    const fiveYearsLater = dayjs().add(5, 'year')
    return current.valueOf() < tomorrow.valueOf() || current.valueOf() > fiveYearsLater.valueOf()
  }

  // 03. 开启方式
  const [openMethod, setOpenMethod] = useState('email')
  const methodList = useMemo(() => [
    { id: 'email', name: t('capsule.create.methods.email'), Icon: MailOutlined },
    { id: 'letter', name: t('capsule.create.methods.letter'), Icon: FormOutlined }
  ], [t])

  // 04. 邮件 / 手写信信息
  const [emailRecipient, setEmailRecipient] = useState('')
  const [letterName, setLetterName] = useState('')
  const [letterPhone, setLetterPhone] = useState('')
  const [letterAddress, setLetterAddress] = useState('')

  // 05/06. 开关
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [disableComment, setDisableComment] = useState(false)

  // 07. 胶囊内容（wangEditor 降级：contentEditable div，内容仍为 HTML 字符串）
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [richContent, setRichContent] = useState('')

  const contentLength = useMemo(() => richContent.replace(/<[^>]*>/g, '').length, [richContent])

  const execFormat = (e: ReactMouseEvent<HTMLButtonElement>, cmd: string) => {
    // 阻止工具栏按钮抢焦点，保证选区仍在编辑区内
    e.preventDefault()
    editorRef.current?.focus()
    document.execCommand(cmd)
    setRichContent(editorRef.current?.innerHTML ?? '')
  }

  // 08. 添加照片
  const [imagePaths, setImagePaths] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const chooseImage = () => {
    if (imagePaths.length >= 6) {
      message.warning(t('capsule.create.photo.maxWarning'))
      return
    }
    fileInputRef.current?.click()
  }

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target
    const files = Array.from(target.files || [])
    const remaining = 6 - imagePaths.length
    files.slice(0, remaining).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result
        if (typeof result === 'string') setImagePaths((prev) => [...prev, result])
      }
      reader.readAsDataURL(file)
    })
    target.value = ''
  }

  const deleteImage = (index: number) => {
    setImagePaths(imagePaths.filter((_, i) => i !== index))
  }

  // 09. 此刻心情
  const [emotion, setEmotion] = useState('hopeful')

  // 提交（校验逻辑逐字平移）
  const submitCapsule = () => {
    if (!title.trim()) {
      message.warning(t('capsule.create.validation.title'))
      return
    }
    if (!openDate) {
      message.warning(t('capsule.create.validation.date'))
      return
    }

    const hasContent = richContent.replace(/<[^>]*>/g, '').trim()
    if (!hasContent && imagePaths.length === 0) {
      message.warning(t('capsule.create.validation.content'))
      return
    }

    if (openMethod === 'email') {
      if (!emailRecipient.trim()) {
        message.warning(t('capsule.create.validation.email'))
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(emailRecipient)) {
        message.warning(t('capsule.create.validation.emailFormat'))
        return
      }
    } else if (openMethod === 'letter') {
      if (!letterName.trim()) {
        message.warning(t('capsule.create.validation.letterName'))
        return
      }
      if (!letterPhone.trim()) {
        message.warning(t('capsule.create.validation.letterPhone'))
        return
      }
      if (!letterAddress.trim()) {
        message.warning(t('capsule.create.validation.letterAddress'))
        return
      }
    }

    setIsSubmitting(true)
    submitTimer.current = setTimeout(() => {
      setIsSubmitting(false)
      setShowSuccess(true)
      localStorage.removeItem('capsule_draft')
    }, 2000)
  }

  // 草稿恢复（onMounted → useEffect）
  useEffect(() => {
    const draft = localStorage.getItem('capsule_draft')
    if (draft) {
      if (editorRef.current) editorRef.current.innerHTML = draft
      setRichContent(draft)
    }
  }, [])

  // 草稿自动保存（watch richContent + 定时器 → useEffect + cleanup，跳过首次挂载）
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (draftTimer.current) clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => {
      localStorage.setItem('capsule_draft', richContent)
    }, 1000)
    return () => {
      if (draftTimer.current) {
        clearTimeout(draftTimer.current)
        draftTimer.current = null
      }
    }
  }, [richContent])

  // 卸载清理提交定时器（onUnmounted → effect cleanup）
  useEffect(
    () => () => {
      if (submitTimer.current) {
        clearTimeout(submitTimer.current)
        submitTimer.current = null
      }
    },
    []
  )

  return (
    <main className={styles.formContainer}>
      {/* 01. 胶囊标题 */}
      <section className={styles.formSection}>
        <div className={styles.sectionTitle}><span className={styles.sectionNum}>01</span><span className={styles.requiredMark}>*</span>{t('capsule.create.sections.title')}</div>
        <div className={styles.titleRow}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.titleInput}
            placeholder={t('capsule.create.placeholders.title')}
            maxLength={30}
          />
          <span className={styles.titleCount}>{title.length}/30</span>
        </div>
      </section>

      {/* 02. 开启时间 */}
      <section className={styles.formSection}>
        <div className={styles.sectionTitle}><span className={styles.sectionNum}>02</span><span className={styles.requiredMark}>*</span>{t('capsule.create.sections.openDate')}</div>
        <div className={styles.datePickerRow} onClick={() => setPickerOpen(true)}>
          <span className={styles.dateText}>{openDateText}</span>
          <span className={styles.arrow}>→</span>
        </div>
        <DatePicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          value={openDate ? dayjs(openDate) : null}
          onChange={(d) => setOpenDate(d ? d.format('YYYY-MM-DD') : '')}
          placeholder={t('capsule.create.placeholders.date')}
          format="YYYY-MM-DD"
          disabledDate={disabledDate}
          className={styles.hiddenDatePicker}
        />
        <p className={styles.hint}>{t('capsule.create.hints.dateRange')}</p>
      </section>

      {/* 03. 开启方式 */}
      <section className={styles.formSection}>
        <div className={styles.sectionTitle}><span className={styles.sectionNum}>03</span><span className={styles.requiredMark}>*</span>{t('capsule.create.sections.method')}</div>
        <div className={styles.methodSelector}>
          {methodList.map(({ id, name, Icon }) => (
            <div
              key={id}
              className={`${styles.methodOption}${openMethod === id ? ` ${styles.active}` : ''}`}
              onClick={() => setOpenMethod(id)}
            >
              <div className={styles.methodIcon}>
                <Icon />
              </div>
              <div className={styles.methodText}>{name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 04. 邮件信息 */}
      {openMethod === 'email' && (
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}><span className={styles.sectionNum}>04</span><span className={styles.requiredMark}>*</span>{t('capsule.create.sections.emailInfo')}</div>
          <input
            value={emailRecipient}
            onChange={(e) => setEmailRecipient(e.target.value)}
            className={styles.infoInput}
            placeholder={t('capsule.create.placeholders.email')}
          />
        </section>
      )}

      {/* 04. 手写信信息 */}
      {openMethod === 'letter' && (
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}><span className={styles.sectionNum}>04</span><span className={styles.requiredMark}>*</span>{t('capsule.create.sections.letterInfo')}</div>
          <input value={letterName} onChange={(e) => setLetterName(e.target.value)} className={styles.infoInput} placeholder={t('capsule.create.placeholders.name')} />
          <input value={letterPhone} onChange={(e) => setLetterPhone(e.target.value)} className={styles.infoInput} placeholder={t('capsule.create.placeholders.phone')} style={{ marginTop: 12 }} />
          <textarea
            value={letterAddress}
            onChange={(e) => setLetterAddress(e.target.value)}
            className={`${styles.infoInput} ${styles.addressInput}`}
            placeholder={t('capsule.create.placeholders.address')}
            maxLength={50}
          ></textarea>
        </section>
      )}

      {/* 05. 匿名发送 */}
      <section className={styles.formSection}>
        <div className={styles.switchRow}>
          <span className={`${styles.sectionTitle} ${styles.noMargin}`}><span className={styles.sectionNum}>05</span>{t('capsule.create.sections.anonymous')}</span>
          <Switch checked={isAnonymous} onChange={setIsAnonymous} className={styles.capsuleSwitch} />
        </div>
        {isAnonymous && <p className={styles.tipText}>{t('capsule.create.tips.anonymous')}</p>}
      </section>

      {/* 06. 公开到广场 */}
      <section className={styles.formSection}>
        <div className={styles.switchRow}>
          <span className={`${styles.sectionTitle} ${styles.noMargin}`}><span className={styles.sectionNum}>06</span>{t('capsule.create.sections.public')}</span>
          <Switch checked={isPublic} onChange={setIsPublic} className={styles.capsuleSwitch} />
        </div>
        {isPublic && <p className={styles.tipText}>{t('capsule.create.tips.public')}</p>}
        {isPublic && (
          <div className={styles.commentSetting}>
            <div className={styles.switchRow}>
              <span className={`${styles.sectionTitle} ${styles.noMargin} ${styles.small}`}>{t('capsule.create.tips.disableComment')}</span>
              <Switch checked={disableComment} onChange={setDisableComment} className={styles.capsuleSwitch} />
            </div>
            <p className={styles.tipText}>{disableComment ? t('capsule.create.tips.commentOff') : t('capsule.create.tips.commentOn')}</p>
          </div>
        )}
      </section>

      {/* 07. 胶囊内容 */}
      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionNum}>07</span><span className={styles.requiredMark}>*</span>{t('capsule.create.sections.content')}
          <span className={styles.optionalHint}>{t('capsule.create.hints.contentOptional')}</span>
        </div>
        <div className={styles.contentWrapper}>
          <div className={styles.wangEditorWrap}>
            <div className={styles.wangToolbar}>
              {TOOLBAR_ITEMS.map((item) => (
                <button
                  key={item.cmd}
                  type="button"
                  className={styles.wangMenuBtn}
                  title={item.title}
                  onMouseDown={(e) => execFormat(e, item.cmd)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div
              ref={editorRef}
              className={styles.wangEditor}
              contentEditable
              suppressContentEditableWarning
              data-placeholder={t('capsule.create.placeholders.editor')}
              onInput={(e) => setRichContent((e.target as HTMLDivElement).innerHTML)}
            />
          </div>

          <span className={styles.contentCount}>{contentLength}/500</span>
        </div>
      </section>

      {/* 08. 添加照片 */}
      <section className={styles.formSection}>
        <div className={styles.sectionTitle}><span className={styles.sectionNum}>08</span>{t('capsule.create.sections.photo')}</div>
        {imagePaths.length > 0 ? (
          <div className={styles.imageGrid}>
            {imagePaths.map((img, i) => (
              <div key={i} className={styles.imageItem}>
                <img src={img} className={styles.uploadedImage} alt={t('capsule.create.photo.alt')} />
                <div className={styles.deleteBtn} onClick={() => deleteImage(i)}>×</div>
              </div>
            ))}
            {imagePaths.length < 6 && (
              <div className={`${styles.imageItem} ${styles.addImageBtn}`} onClick={chooseImage}>
                <div className={styles.addContent}>
                  <PlusOutlined className={styles.addIcon} />
                  <span className={styles.addText}>{t('capsule.create.photo.add')}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.imageUploader} onClick={chooseImage}>
            <PlusOutlined className={styles.uploadIcon} />
            <span className={styles.uploadText}>{t('capsule.create.photo.upload')}</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className={styles.hiddenFileInput}
          onChange={onFileChange}
        />
      </section>

      {/* 09. 此刻心情 */}
      <section className={styles.formSection}>
        <div className={styles.sectionTitle}><span className={styles.sectionNum}>09</span>{t('capsule.create.sections.mood')}</div>
        <div className={styles.emotionTags}>
          {EMOTION_LIST.map((e) => (
            <div
              key={e.id}
              className={`${styles.emotionTag}${emotion === e.id ? ` ${styles.active}` : ''}`}
              onClick={() => setEmotion(e.id)}
            >
              {e.emoji}
            </div>
          ))}
        </div>
      </section>

      {/* 提交按钮 */}
      <section className={styles.submitSection}>
        <button
          className={styles.submitBtn}
          disabled={isSubmitting}
          onClick={submitCapsule}
        >
          <span>{isSubmitting ? t('capsule.create.submitting') : t('capsule.create.submit')}</span>
          {!isSubmitting && <span className={styles.submitArrow}>→</span>}
        </button>
      </section>

      {/* 成功弹窗（ElDialog → antd Modal，center → 标题/底栏居中样式） */}
      <Modal
        open={showSuccess}
        title={t('capsule.create.success.title')}
        width={440}
        centered
        className={styles.successModal}
        onCancel={() => setShowSuccess(false)}
        onOk={() => setShowSuccess(false)}
        /* 原 .success-modal .ant-modal-content/header/footer 结构覆写 token 化 */
        styles={{
          content: { borderRadius: 16 },
          header: { borderBottom: '1px solid var(--mist-050)', textAlign: 'center' },
          footer: { textAlign: 'center' },
        }}
      >
        <div className={styles.successDialogContent}>
          <CheckCircleFilled className={styles.successBigIcon} />
          <h3>{t('capsule.create.success.body')}</h3>
          <p dangerouslySetInnerHTML={{ __html: t('capsule.create.success.desc', { date: openDateText }) }}></p>
          <Button type="primary" onClick={() => navigate('/time-capsule')}>{t('capsule.create.success.btn')}</Button>
        </div>
      </Modal>
    </main>
  )
}

export default CreateForm
