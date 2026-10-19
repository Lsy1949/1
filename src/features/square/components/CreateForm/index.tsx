// 发布页 · 表单整体：心情/内容/话题/照片/开关 + 提交 + 成功弹窗
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { App as AntApp, Button, Modal, Switch } from 'antd'
import { CheckCircleFilled, PlusOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import styles from './CreateForm.module.css'

export interface CreateFormProps {
  onPublished?: () => void
}

const MAX_CONTENT = 500
const MAX_PHOTOS = 6
const MAX_TOPICS = 3

export function CreateForm({ onPublished }: CreateFormProps) {
  const { t } = useI18n()
  const { message } = AntApp.useApp() // 替代 ElMessage

  // 01 此刻心情
  const [emotion, setEmotion] = useState('hopeful')
  const emotionList = useMemo(
    () => [
      { id: 'happy', emoji: '😊', label: t('square.create.moods.happy') },
      { id: 'excited', emoji: '🤩', label: t('square.create.moods.excited') },
      { id: 'calm', emoji: '😌', label: t('square.create.moods.calm') },
      { id: 'sad', emoji: '😢', label: t('square.create.moods.sad') },
      { id: 'hopeful', emoji: '🌟', label: t('square.create.moods.hopeful') }
    ],
    [t]
  )

  // 02 心得内容
  const [content, setContent] = useState('')
  const contentCount = content.length

  // 03 话题标签
  const [topics, setTopics] = useState<string[]>([])
  const [topicInput, setTopicInput] = useState('')

  const addTopic = () => {
    const tag = topicInput.trim().replace(/^#/, '')
    if (!tag) return
    if (topics.length >= MAX_TOPICS) {
      message.warning(t('square.create.topicMaxTip'))
      return
    }
    if (topics.includes(tag)) {
      setTopicInput('')
      return
    }
    setTopics([...topics, tag])
    setTopicInput('')
  }

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index))
  }

  // 04 添加照片
  const [imagePaths, setImagePaths] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // 05 匿名发布 / 06 允许评论
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [allowComment, setAllowComment] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const chooseImage = () => {
    if (imagePaths.length >= MAX_PHOTOS) {
      message.warning(t('square.create.photo.maxWarning'))
      return
    }
    fileInputRef.current?.click()
  }

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target
    const files = Array.from(target.files || [])
    const remaining = MAX_PHOTOS - imagePaths.length
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

  const canSubmit = content.trim().length > 0 || imagePaths.length > 0

  const submitPost = () => {
    if (!canSubmit) {
      message.warning(t('square.create.validation.content'))
      return
    }
    setIsSubmitting(true)
    submitTimer.current = setTimeout(() => {
      setIsSubmitting(false)
      setShowSuccess(true)
    }, 1500)
  }

  const backToSquare = () => {
    setShowSuccess(false)
    onPublished?.()
  }

  // 组件卸载前清理定时器，避免内存泄漏（原 onBeforeUnmount → useEffect cleanup）
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
      {/* 01. 此刻心情 */}
      <section className={styles.formCard}>
        <div className={styles.sectionTitle}><span className={styles.sectionNum}>01</span>{t('square.create.sections.mood')}</div>
        <div className={styles.emotionTags}>
          {emotionList.map((e) => (
            <div
              key={e.id}
              className={`${styles.emotionTag}${emotion === e.id ? ` ${styles.active}` : ''}`}
              onClick={() => setEmotion(e.id)}
            >
              <span className={styles.emotionEmoji}>{e.emoji}</span>
              <span className={styles.emotionLabel}>{e.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 02. 心得内容 */}
      <section className={styles.formCard}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionNum}>02</span>{t('square.create.sections.content')}
          <span className={styles.optionalHint}>{t('square.create.hints.contentOptional')}</span>
        </div>
        <div className={styles.contentWrapper}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={styles.contentTextarea}
            placeholder={t('square.create.placeholders.content')}
            maxLength={MAX_CONTENT}
            rows={6}
          ></textarea>
          <span className={styles.contentCount}>{contentCount}/{MAX_CONTENT}</span>
        </div>
      </section>

      {/* 03. 话题标签 */}
      <section className={styles.formCard}>
        <div className={styles.sectionTitle}><span className={styles.sectionNum}>03</span>{t('square.create.sections.topic')}</div>
        <div className={styles.topicInputWrap}>
          <div className={styles.topicTags}>
            {topics.map((tag, i) => (
              <span key={i} className={styles.topicTag}>
                #{tag}
                <button className={styles.topicRemove} onClick={() => removeTopic(i)}>×</button>
              </span>
            ))}
          </div>
          {topics.length < MAX_TOPICS && (
            <input
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              className={styles.topicInput}
              placeholder={t('square.create.topicPlaceholder')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTopic()
                }
              }}
            />
          )}
        </div>
      </section>

      {/* 04. 添加照片 */}
      <section className={styles.formCard}>
        <div className={styles.sectionTitle}><span className={styles.sectionNum}>04</span>{t('square.create.sections.photo')}</div>
        {imagePaths.length > 0 ? (
          <div className={styles.imageGrid}>
            {imagePaths.map((img, i) => (
              <div key={i} className={styles.imageItem}>
                <img src={img} className={styles.uploadedImage} alt={t('square.create.photo.alt')} />
                <div className={styles.deleteBtn} onClick={() => deleteImage(i)}>×</div>
              </div>
            ))}
            {imagePaths.length < MAX_PHOTOS && (
              <div className={`${styles.imageItem} ${styles.addImageBtn}`} onClick={chooseImage}>
                <div className={styles.addContent}>
                  <PlusOutlined className={styles.addIcon} />
                  <span className={styles.addText}>{t('square.create.photo.add')}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.imageUploader} onClick={chooseImage}>
            <PlusOutlined className={styles.uploadIcon} />
            <span className={styles.uploadText}>{t('square.create.photo.upload')}</span>
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

      {/* 05. 匿名发布 */}
      <section className={`${styles.formCard} ${styles.formCardRow}`}>
        <div className={`${styles.sectionTitle} ${styles.noMargin}`}><span className={styles.sectionNum}>05</span>{t('square.create.sections.anonymous')}</div>
        {/* square-switch 原 antd 锚点覆写类 → module hash 类 + :global 选中态组合 */}
        <Switch checked={isAnonymous} onChange={setIsAnonymous} className={styles.squareSwitch} />
      </section>

      {/* 06. 允许评论 */}
      <section className={`${styles.formCard} ${styles.formCardRow}`}>
        <div className={`${styles.sectionTitle} ${styles.noMargin}`}><span className={styles.sectionNum}>06</span>{t('square.create.sections.comment')}</div>
        <Switch checked={allowComment} onChange={setAllowComment} className={styles.squareSwitch} />
      </section>

      {/* 提交按钮 */}
      <section className={styles.submitSection}>
        <button className={styles.submitBtn} disabled={!canSubmit || isSubmitting} onClick={submitPost}>
          <span>{isSubmitting ? t('square.create.submitting') : t('square.create.submit')}</span>
          {!isSubmitting && canSubmit && <span className={styles.submitArrow}>→</span>}
        </button>
      </section>

      {/* 成功弹窗（ElDialog → antd Modal；footer 与 Vue 版同为默认按钮，点确定/取消仅关闭不回跳） */}
      <Modal
        open={showSuccess}
        title={t('square.create.success.title')}
        width={440}
        centered
        className={styles.successModal}
        onCancel={() => setShowSuccess(false)}
        onOk={() => setShowSuccess(false)}
        /* 原 .success-modal .ant-modal-content/header 结构覆写 token 化 */
        styles={{
          content: { borderRadius: 16 },
          header: { borderBottom: '1px solid var(--mist-050)', paddingBottom: 16 },
        }}
      >
        <div className={styles.successDialogContent}>
          <CheckCircleFilled className={styles.successBigIcon} />
          <h3>{t('square.create.success.body')}</h3>
          <Button type="primary" onClick={backToSquare}>{t('square.create.success.btn')}</Button>
        </div>
      </Modal>
    </main>
  )
}

export default CreateForm
