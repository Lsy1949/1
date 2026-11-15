// 发布页 · 表单整体（桌面双栏：写作区 + 实时预览 / 发布设置 / 提交）
// 提交行为经 onSubmit 上抛（页面 useMutation → POST /api/square/feed）
import { useMemo, useState } from 'react'
import { Form, Image, Radio, Select, Switch, Upload, Button } from 'antd'
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface'
import { PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import InitialAvatar from '@/components/InitialAvatar'
import RichTextEditor from '@/components/RichTextEditor'
import RichTextViewer from '@/components/RichTextViewer'
import { htmlToText, sanitizeHtml } from '@/components/RichTextEditor/sanitize'
import { useUserStore } from '@/stores/useUserStore'
import type { SquareCreateInput, SquareMood } from '../types'
import { moodMap } from '../moods'
import styles from './CreateForm.module.css'

const MAX_CONTENT = 500
const MAX_PHOTOS = 6
const MAX_TOPICS = 3

interface SquareFormValues {
  mood: SquareMood
  content?: string
  topics?: string[]
  photos?: UploadFile[]
  isAnonymous: boolean
  allowComment: boolean
}

function createInitialValues(): SquareFormValues {
  return {
    mood: 'hopeful',
    content: '',
    topics: [],
    photos: [],
    isAnonymous: false,
    allowComment: true,
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

export interface CreateFormProps {
  onSubmit: (values: SquareCreateInput) => Promise<unknown>
  isSubmitting: boolean
}

export function CreateForm({ onSubmit, isSubmitting }: CreateFormProps) {
  const { t } = useTranslation()
  const userStore = useUserStore()

  const [form] = Form.useForm<SquareFormValues>()
  const [initialValues] = useState(createInitialValues)

  const contentValue = Form.useWatch('content', form) ?? ''
  const contentText = useMemo(() => htmlToText(contentValue).trim(), [contentValue])
  const photoList = Form.useWatch('photos', form) ?? []
  const moodValue = (Form.useWatch('mood', form) ?? 'hopeful') as SquareMood
  const topicsValue = Form.useWatch('topics', form) ?? []
  const anonymousValue = Form.useWatch('isAnonymous', form) ?? false

  const previewPhotos = useMemo(
    () =>
      photoList
        .map((file) => file.thumbUrl ?? file.url ?? '')
        .filter((src): src is string => Boolean(src)),
    [photoList],
  )

  // 图片预览：统一走 antd Image.PreviewGroup（左右切换 / 缩放 / 蒙层）
  // thumbUrl 由 antd UploadList 原地写入文件对象，父组件拿不到新引用 → 打开时现算 sources
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSources, setPreviewSources] = useState<string[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)

  const openPreview = (file: UploadFile) => {
    const entries = photoList
      .map((item) => ({ uid: item.uid, src: item.url ?? item.thumbUrl ?? '' }))
      .filter((item): item is { uid: string; src: string } => Boolean(item.src))
    if (entries.length === 0) return
    const index = entries.findIndex((item) => item.uid === file.uid)
    setPreviewSources(entries.map((item) => item.src))
    setPreviewIndex(index >= 0 ? index : 0)
    setPreviewOpen(true)
  }

  const authorName = anonymousValue
    ? t('square.list.anonymous')
    : userStore.profile?.name || t('square.create.aside.me')

  const emotionOptions = useMemo(
    () => [
      { value: 'happy', label: `😊 ${t('square.create.moods.happy')}` },
      { value: 'excited', label: `🤩 ${t('square.create.moods.excited')}` },
      { value: 'calm', label: `😌 ${t('square.create.moods.calm')}` },
      { value: 'sad', label: `😢 ${t('square.create.moods.sad')}` },
      { value: 'hopeful', label: `🌟 ${t('square.create.moods.hopeful')}` },
    ],
    [t],
  )

  const handleSubmit = async () => {
    let values: SquareFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    try {
      const photos = await Promise.all(
        (values.photos ?? []).map((file) =>
          file.originFileObj
            ? fileToDataUrl(file.originFileObj)
            : Promise.resolve(file.url ?? file.thumbUrl ?? ''),
        ),
      )

      const payload: SquareCreateInput = {
        mood: values.mood,
        content: sanitizeHtml(values.content ?? ''),
        topics: values.topics ?? [],
        photos: photos.filter(Boolean),
        isAnonymous: values.isAnonymous,
        allowComment: values.allowComment,
      }

      await onSubmit(payload)
    } catch {
      /* 接口错误由页面 mutation 统一提示 */
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={initialValues}
      scrollToFirstError
      className={styles.formContainer}
    >
      {/* ============ 左栏 · 写作区 ============ */}
      <div className={styles.mainCol}>
        {/* 01 此刻心情 */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>01</span>
            <h2 className={styles.sectionTitle}>{t('square.create.sections.mood')}</h2>
          </div>
          <Form.Item name="mood" className={styles.fieldItem}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              className={styles.emotionTags}
              options={emotionOptions}
            />
          </Form.Item>
        </section>

        {/* 02 心得内容 */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>02</span>
            <h2 className={styles.sectionTitle}>
              {t('square.create.sections.content')}
              <span className={styles.optionalHint}>{t('square.create.hints.contentOptional')}</span>
            </h2>
          </div>
          <Form.Item
            name="content"
            dependencies={['photos']}
            className={styles.fieldItem}
            rules={[
              {
                validator: (_, value?: string) => {
                  const text = htmlToText(String(value ?? '')).trim()
                  const photos = (form.getFieldValue('photos') as UploadFile[] | undefined) ?? []
                  return text || photos.length > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error(t('square.create.validation.content')))
                },
              },
            ]}
          >
            <RichTextEditor
              variant="plain"
              placeholder={t('square.create.placeholders.content')}
              maxLength={MAX_CONTENT}
            />
          </Form.Item>
        </section>

        {/* 03 话题标签 */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>03</span>
            <h2 className={styles.sectionTitle}>{t('square.create.sections.topic')}</h2>
          </div>
          <Form.Item name="topics" className={styles.fieldItem}>
            <Select
              mode="tags"
              maxCount={MAX_TOPICS}
              tokenSeparators={[' ', ',', '，', '#']}
              placeholder={t('square.create.topicPlaceholder')}
              className={styles.topicSelect}
              onChange={(value: string[]) => {
                // 去掉用户输入的前导 # 与空白，避免出现 ##标签
                const normalized = value
                  .map((tag) => tag.trim().replace(/^#+/, ''))
                  .filter(Boolean)
                form.setFieldValue('topics', normalized)
              }}
            />
          </Form.Item>
        </section>

        {/* 04 添加照片 */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>04</span>
            <h2 className={styles.sectionTitle}>{t('square.create.sections.photo')}</h2>
            <span className={styles.sectionMeta}>{photoList.length}/{MAX_PHOTOS}</span>
          </div>
          <Form.Item
            name="photos"
            valuePropName="fileList"
            getValueFromEvent={(event: UploadChangeParam) => event?.fileList}
            className={styles.fieldItem}
          >
            <Upload
              listType="picture-card"
              accept="image/*"
              multiple
              maxCount={MAX_PHOTOS}
              beforeUpload={() => false}
              onPreview={openPreview}
            >
              {photoList.length >= MAX_PHOTOS ? null : (
                <div className={styles.uploadTrigger}>
                  <PlusOutlined className={styles.uploadIcon} />
                  <span className={styles.uploadText}>{t('square.create.photo.add')}</span>
                </div>
              )}
            </Upload>
          </Form.Item>
        </section>
      </div>

      {/* ============ 右栏 · 预览 / 设置 / 提交 ============ */}
      <aside className={styles.rail}>
        <section className={styles.railBlock}>
          <div className={styles.railHead}>
            <h2 className={styles.railTitle}>{t('square.create.aside.preview')}</h2>
            <span className={styles.railTag}>{t('square.create.aside.live')}</span>
          </div>

          {/* 实时预览：与广场卡片同构的头部 + 正文 + 话题 + 图片 */}
          <article className={styles.previewCard}>
            <header className={styles.previewHead}>
              <InitialAvatar
                name={anonymousValue ? '?' : userStore.profile?.name || 'U'}
                size={36}
                isAnonymous={anonymousValue}
              />
              <div className={styles.previewIdentity}>
                <span className={styles.previewAuthor}>{authorName}</span>
                <span className={styles.previewTime}>{t('square.create.aside.now')}</span>
              </div>
              <span className={styles.previewMood}>{moodMap[moodValue]}</span>
            </header>

            {contentText ? (
              <RichTextViewer html={contentValue} className={styles.previewText} />
            ) : (
              <p className={styles.previewEmpty}>{t('square.create.aside.previewEmpty')}</p>
            )}

            {topicsValue.length > 0 && (
              <div className={styles.previewTopics}>
                {topicsValue.map((tag) => (
                  <span key={tag} className={styles.previewTopic}>#{tag}</span>
                ))}
              </div>
            )}

            {previewPhotos.length > 0 && (
              <div className={styles.previewPhotos}>
                {previewPhotos.slice(0, 3).map((src) => (
                  <img key={src} src={src} className={styles.previewPhoto} loading="lazy" alt="" />
                ))}
              </div>
            )}
          </article>
        </section>

        <section className={styles.railBlock}>
          <h2 className={styles.railTitle}>{t('square.create.aside.settings')}</h2>

          <div className={styles.settingRow}>
            <div className={styles.settingText}>
              <span className={styles.settingLabel}>{t('square.create.sections.anonymous')}</span>
              <span className={styles.settingHint}>{t('square.create.aside.anonymousHint')}</span>
            </div>
            <Form.Item name="isAnonymous" valuePropName="checked" noStyle>
              <Switch className={styles.squareSwitch} />
            </Form.Item>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingText}>
              <span className={styles.settingLabel}>{t('square.create.sections.comment')}</span>
              <span className={styles.settingHint}>{t('square.create.aside.commentHint')}</span>
            </div>
            <Form.Item name="allowComment" valuePropName="checked" noStyle>
              <Switch className={styles.squareSwitch} />
            </Form.Item>
          </div>
        </section>

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
            {isSubmitting ? t('square.create.submitting') : t('square.create.submit')}
          </Button>
          <p className={styles.submitHint}>{t('square.create.aside.submitHint')}</p>
        </section>
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
