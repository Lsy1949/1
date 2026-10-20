// 发布页 · 表单整体（antd Form：心情 / 内容 / 话题 / 照片 / 开关）
// 提交行为经 onSubmit 上抛（页面 useMutation → POST /api/square/feed）
import { useMemo, useState } from 'react'
import {
  Form,
  Input,
  Radio,
  Select,
  Switch,
  Upload,
  Button,
} from 'antd'
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface'
import { PlusOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import type { SquareCreateInput, SquareMood } from '../types'
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
  const { t } = useI18n()

  const [form] = Form.useForm<SquareFormValues>()
  const [initialValues] = useState(createInitialValues)

  const contentValue = Form.useWatch('content', form) ?? ''
  const photoList = Form.useWatch('photos', form) ?? []
  const contentCount = contentValue.length

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
        content: (values.content ?? '').trim(),
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
      {/* 01. 此刻心情 */}
      <section className={styles.formCard}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionNum}>01</span>
          {t('square.create.sections.mood')}
        </div>
        <Form.Item name="mood" className={styles.moodItem}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            className={styles.emotionTags}
            options={emotionOptions}
          />
        </Form.Item>
      </section>

      {/* 02. 心得内容 */}
      <section className={styles.formCard}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionNum}>02</span>
          {t('square.create.sections.content')}
          <span className={styles.optionalHint}>{t('square.create.hints.contentOptional')}</span>
        </div>
        <div className={styles.contentWrapper}>
          <Form.Item
            name="content"
            dependencies={['photos']}
            className={styles.contentItem}
            rules={[
              {
                validator: (_, value?: string) => {
                  const text = String(value ?? '').trim()
                  const photos = (form.getFieldValue('photos') as UploadFile[] | undefined) ?? []
                  return text || photos.length > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error(t('square.create.validation.content')))
                },
              },
            ]}
          >
            <Input.TextArea
              rows={6}
              maxLength={MAX_CONTENT}
              placeholder={t('square.create.placeholders.content')}
              className={styles.contentTextarea}
            />
          </Form.Item>
          <span className={styles.contentCount}>{contentCount}/{MAX_CONTENT}</span>
        </div>
      </section>

      {/* 03. 话题标签 */}
      <section className={styles.formCard}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionNum}>03</span>
          {t('square.create.sections.topic')}
        </div>
        <Form.Item name="topics" className={styles.topicItem}>
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

      {/* 04. 添加照片 */}
      <section className={styles.formCard}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionNum}>04</span>
          {t('square.create.sections.photo')}
        </div>
        <Form.Item
          name="photos"
          valuePropName="fileList"
          getValueFromEvent={(event: UploadChangeParam) => event?.fileList}
          className={styles.uploadItem}
        >
          <Upload
            listType="picture-card"
            accept="image/*"
            multiple
            maxCount={MAX_PHOTOS}
            beforeUpload={() => false}
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

      {/* 05. 匿名发布 */}
      <section className={`${styles.formCard} ${styles.formCardRow}`}>
        <div className={`${styles.sectionTitle} ${styles.noMargin}`}>
          <span className={styles.sectionNum}>05</span>
          {t('square.create.sections.anonymous')}
        </div>
        <Form.Item name="isAnonymous" valuePropName="checked" noStyle>
          <Switch className={styles.squareSwitch} />
        </Form.Item>
      </section>

      {/* 06. 允许评论 */}
      <section className={`${styles.formCard} ${styles.formCardRow}`}>
        <div className={`${styles.sectionTitle} ${styles.noMargin}`}>
          <span className={styles.sectionNum}>06</span>
          {t('square.create.sections.comment')}
        </div>
        <Form.Item name="allowComment" valuePropName="checked" noStyle>
          <Switch className={styles.squareSwitch} />
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
          {isSubmitting ? t('square.create.submitting') : t('square.create.submit')}
        </Button>
      </section>
    </Form>
  )
}

export default CreateForm
