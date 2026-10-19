// 02 心理档案区块 · MBTI/压力/睡眠/兴趣标签/个人简介
import { useEffect, useMemo, useRef, useState } from 'react'
import { App as AntApp, Button, Form, Input, Radio, Select } from 'antd'
import type { InputRef } from 'antd'
import { CloseOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import type { PsychFormData } from '../types'
import styles from './PsychSection.module.css'

const mbtiTypes = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP']

// Vue 版 defineModel → 受控 props（form + onFormChange）
export interface PsychSectionProps {
  form: PsychFormData
  onFormChange: (next: PsychFormData) => void
}

export function PsychSection({ form, onFormChange }: PsychSectionProps) {
  const { t } = useI18n()
  const { message } = AntApp.useApp() // 替代 ElMessage

  const [psychEditing, setPsychEditing] = useState(false)
  const [psychBackup, setPsychBackup] = useState<PsychFormData | null>(null)

  const stressLabel = useMemo(() => {
    if (form.stressLevel === 'low') return t('profile.card.psychological.stressLow')
    if (form.stressLevel === 'mid') return t('profile.card.psychological.stressMid')
    if (form.stressLevel === 'high') return t('profile.card.psychological.stressHigh')
    return '—'
  }, [form.stressLevel, t])

  const sleepLabel = useMemo(() => {
    if (form.sleepQuality === 'poor') return t('profile.card.psychological.sleepPoor')
    if (form.sleepQuality === 'fair') return t('profile.card.psychological.sleepFair')
    if (form.sleepQuality === 'good') return t('profile.card.psychological.sleepGood')
    return '—'
  }, [form.sleepQuality, t])

  const [tagInputVisible, setTagInputVisible] = useState(false)
  const [tagInputValue, setTagInputValue] = useState('')
  const tagInputRef = useRef<InputRef | null>(null)

  // 等价 Vue 的 nextTick(() => tagInputRef.value?.focus())
  useEffect(() => {
    if (tagInputVisible) tagInputRef.current?.focus()
  }, [tagInputVisible])

  function showTagInput() {
    setTagInputVisible(true)
  }

  function addTag() {
    const v = tagInputValue.trim()
    if (v && !form.interests.includes(v)) {
      onFormChange({ ...form, interests: [...form.interests, v] })
    }
    setTagInputValue('')
    setTagInputVisible(false)
  }

  function removeTag(i: number) {
    onFormChange({ ...form, interests: form.interests.filter((_, idx) => idx !== i) })
  }

  function togglePsychEdit() {
    if (!psychEditing) {
      setPsychBackup({ ...form, interests: [...form.interests] })
    }
    setPsychEditing(!psychEditing)
  }

  function cancelPsychEdit() {
    if (psychBackup) {
      onFormChange({ ...psychBackup, interests: [...psychBackup.interests] })
    }
    setPsychEditing(false)
  }

  function savePsych() {
    if (form.bio && form.bio.length > 200) {
      message.warning(t('counseling.validation.formIncomplete'))
      return
    }
    message.success(t('profile.card.psychological.saveSuccess'))
    setPsychEditing(false)
  }

  return (
    <section className={styles.magSection}>
      <div className={styles.secHead}>
        <span className={styles.secNum}>02</span>
        <div className={styles.secTitles}>
          <h2 className={styles.secTitle}>{t('profile.card.psychological.title')}</h2>
          <p className={styles.secDesc}>{t('profile.card.psychological.desc')}</p>
        </div>
        <button className={styles.secToggle} onClick={togglePsychEdit}>
          {psychEditing ? <EyeOutlined /> : <EditOutlined />}
          <span>{psychEditing ? t('common.view') : t('common.edit')}</span>
        </button>
      </div>

      {/* 查看模式 */}
      {!psychEditing && (
        <dl className={styles.fieldList}>
          <div className={styles.fieldRow}>
            <dt className={styles.fieldLabel}>{t('profile.card.psychological.mbti')}</dt>
            <dd className={`${styles.fieldValue} ${styles.strong}`}>{form.mbti || '—'}</dd>
          </div>
          <div className={styles.fieldRow}>
            <dt className={styles.fieldLabel}>{t('profile.card.psychological.stressLevel')}</dt>
            <dd className={styles.fieldValue}>{stressLabel}</dd>
          </div>
          <div className={styles.fieldRow}>
            <dt className={styles.fieldLabel}>{t('profile.card.psychological.sleepQuality')}</dt>
            <dd className={styles.fieldValue}>{sleepLabel}</dd>
          </div>
          <div className={`${styles.fieldRow} ${styles.fieldRowBlock}`}>
            <dt className={styles.fieldLabel}>{t('profile.card.psychological.interests')}</dt>
            <dd className={styles.fieldValue}>
              {!form.interests.length && <span>—</span>}
              {form.interests.map((tag, i) => (
                <span key={i} className={styles.tagChip}>{tag}</span>
              ))}
            </dd>
          </div>
          <div className={`${styles.fieldRow} ${styles.fieldRowBlock}`}>
            <dt className={styles.fieldLabel}>{t('profile.card.psychological.bio')}</dt>
            <dd className={`${styles.fieldValue} ${styles.prose}`}>{form.bio || '—'}</dd>
          </div>
        </dl>
      )}

      {/* 编辑模式 */}
      {psychEditing && (
        <Form layout="vertical" colon={false} className={styles.magForm}>
          <div className={`${styles.formGrid} ${styles.two}`}>
            <Form.Item label={t('profile.card.psychological.mbti')}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ width: '100%' }}
                value={form.mbti || undefined}
                placeholder={t('profile.card.psychological.mbtiPlaceholder')}
                onChange={(v) => onFormChange({ ...form, mbti: v ?? '' })}
                options={mbtiTypes.map((m) => ({ label: m, value: m }))}
              />
            </Form.Item>
            <Form.Item label={t('profile.card.psychological.stressLevel')}>
              <Radio.Group
                value={form.stressLevel}
                onChange={(e) => onFormChange({ ...form, stressLevel: e.target.value })}
              >
                <Radio.Button value="low">{t('profile.card.psychological.stressLow')}</Radio.Button>
                <Radio.Button value="mid">{t('profile.card.psychological.stressMid')}</Radio.Button>
                <Radio.Button value="high">{t('profile.card.psychological.stressHigh')}</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item label={t('profile.card.psychological.sleepQuality')}>
              <Radio.Group
                value={form.sleepQuality}
                onChange={(e) => onFormChange({ ...form, sleepQuality: e.target.value })}
              >
                <Radio.Button value="poor">{t('profile.card.psychological.sleepPoor')}</Radio.Button>
                <Radio.Button value="fair">{t('profile.card.psychological.sleepFair')}</Radio.Button>
                <Radio.Button value="good">{t('profile.card.psychological.sleepGood')}</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </div>
          <Form.Item label={t('profile.card.psychological.interests')}>
            <div className={styles.tagArea}>
              {form.interests.map((tag, i) => (
                <span key={i} className={`${styles.tagChip} ${styles.removable}`}>
                  {tag}
                  <CloseOutlined className={styles.tagClose} onClick={() => removeTag(i)} />
                </span>
              ))}
              {tagInputVisible ? (
                <Input
                  ref={tagInputRef}
                  size="small"
                  className={styles.tagInput}
                  value={tagInputValue}
                  placeholder={t('profile.card.psychological.interestPlaceholder')}
                  onChange={(e) => setTagInputValue(e.target.value)}
                  onPressEnter={addTag}
                  onBlur={addTag}
                />
              ) : (
                <button type="button" className={styles.tagAdd} onClick={showTagInput}>
                  <PlusOutlined />
                </button>
              )}
            </div>
          </Form.Item>
          <Form.Item label={t('profile.card.psychological.bio')}>
            <Input.TextArea
              value={form.bio}
              rows={4}
              maxLength={200}
              showCount
              className="custom-scroll"
              onChange={(e) => onFormChange({ ...form, bio: e.target.value })}
            />
          </Form.Item>
          <div className={styles.formActions}>
            <Button className={styles.ghostBtn} onClick={cancelPsychEdit}>{t('common.cancel')}</Button>
            <Button type="primary" className={styles.solidBtn} onClick={savePsych}>{t('profile.card.psychological.save')}</Button>
          </div>
        </Form>
      )}
    </section>
  )
}

export default PsychSection
