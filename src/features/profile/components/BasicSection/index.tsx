// 01 基础资料区块 · 查看/编辑双模式
import { useMemo, useState } from 'react'
import { App as AntApp, Button, Form, Input, Select } from 'antd'
import { EditOutlined, EyeOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import type { ProfileFormData } from '../types'
import styles from './BasicSection.module.css'

// Vue 版 defineModel → 受控 props（form + onFormChange）
export interface BasicSectionProps {
  form: ProfileFormData
  onFormChange: (next: ProfileFormData) => void
  id?: string
}

export function BasicSection({ form, onFormChange, id }: BasicSectionProps) {
  const { t } = useI18n()
  const { message } = AntApp.useApp() // 替代 ElMessage

  const [profileEditing, setProfileEditing] = useState(false)
  const [profileBackup, setProfileBackup] = useState<ProfileFormData | null>(null)

  const genderLabel = useMemo(() => {
    if (form.gender === 'male') return t('profile.card.profile.genderMale')
    if (form.gender === 'female') return t('profile.card.profile.genderFemale')
    if (form.gender === 'other') return t('profile.card.profile.genderOther')
    return '—'
  }, [form.gender, t])

  function toggleProfileEdit() {
    if (!profileEditing) {
      setProfileBackup({ ...form })
    }
    setProfileEditing(!profileEditing)
  }

  function cancelProfileEdit() {
    if (profileBackup) onFormChange({ ...profileBackup })
    setProfileEditing(false)
  }

  function saveProfile() {
    if (!form.name.trim()) {
      message.warning(t('home.validation.nameRequired'))
      return
    }
    if (!form.studentId.trim()) {
      message.warning(t('counseling.validation.formIncomplete'))
      return
    }
    if (form.enrollYear && !/^\d{4}$/.test(form.enrollYear)) {
      message.warning(t('counseling.validation.formIncomplete'))
      return
    }
    message.success(t('profile.card.profile.saveSuccess'))
    setProfileEditing(false)
  }

  return (
    <section id={id} className={styles.magSection}>
      <div className={styles.secHead}>
        <span className={styles.secNum}>01</span>
        <div className={styles.secTitles}>
          <h2 className={styles.secTitle}>{t('profile.card.profile.title')}</h2>
          <p className={styles.secDesc}>{t('profile.card.profile.desc')}</p>
        </div>
        <button className={styles.secToggle} onClick={toggleProfileEdit}>
          {profileEditing ? <EyeOutlined /> : <EditOutlined />}
          <span>{profileEditing ? t('common.view') : t('common.edit')}</span>
        </button>
      </div>

      {/* 查看模式 */}
      {!profileEditing && (
        <dl className={styles.fieldList}>
          <div className={styles.fieldRow}>
            <dt className={styles.fieldLabel}>{t('profile.card.profile.name')}</dt>
            <dd className={styles.fieldValue}>{form.name || '—'}</dd>
          </div>
          <div className={styles.fieldRow}>
            <dt className={styles.fieldLabel}>{t('profile.card.profile.studentId')}</dt>
            <dd className={styles.fieldValue}>{form.studentId || '—'}</dd>
          </div>
          <div className={styles.fieldRow}>
            <dt className={styles.fieldLabel}>{t('profile.card.profile.gender')}</dt>
            <dd className={styles.fieldValue}>{genderLabel}</dd>
          </div>
          <div className={styles.fieldRow}>
            <dt className={styles.fieldLabel}>{t('profile.card.profile.school')}</dt>
            <dd className={styles.fieldValue}>{form.school || '—'}</dd>
          </div>
          <div className={styles.fieldRow}>
            <dt className={styles.fieldLabel}>{t('profile.card.profile.major')}</dt>
            <dd className={styles.fieldValue}>{form.major || '—'}</dd>
          </div>
          <div className={styles.fieldRow}>
            <dt className={styles.fieldLabel}>{t('profile.card.profile.enrollYear')}</dt>
            <dd className={styles.fieldValue}>{form.enrollYear || '—'}</dd>
          </div>
        </dl>
      )}

      {/* 编辑模式 */}
      {profileEditing && (
        <Form layout="vertical" colon={false} className={styles.magForm}>
          <div className={styles.formGrid}>
            <Form.Item label={`${t('profile.card.profile.name')} *`}>
              <Input
                value={form.name}
                maxLength={20}
                showCount
                onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              />
            </Form.Item>
            <Form.Item label={`${t('profile.card.profile.studentId')} *`}>
              <Input
                value={form.studentId}
                maxLength={20}
                onChange={(e) => onFormChange({ ...form, studentId: e.target.value })}
              />
            </Form.Item>
            <Form.Item label={t('profile.card.profile.gender')}>
              <Select
                allowClear
                style={{ width: '100%' }}
                value={form.gender || undefined}
                onChange={(v) => onFormChange({ ...form, gender: v ?? '' })}
                options={[
                  { label: t('profile.card.profile.genderMale'), value: 'male' },
                  { label: t('profile.card.profile.genderFemale'), value: 'female' },
                  { label: t('profile.card.profile.genderOther'), value: 'other' }
                ]}
              />
            </Form.Item>
            <Form.Item label={t('profile.card.profile.school')}>
              <Input
                value={form.school}
                maxLength={40}
                onChange={(e) => onFormChange({ ...form, school: e.target.value })}
              />
            </Form.Item>
            <Form.Item label={t('profile.card.profile.major')}>
              <Input
                value={form.major}
                maxLength={30}
                onChange={(e) => onFormChange({ ...form, major: e.target.value })}
              />
            </Form.Item>
            <Form.Item label={t('profile.card.profile.enrollYear')}>
              <Input
                value={form.enrollYear}
                placeholder="2024"
                maxLength={4}
                onChange={(e) => onFormChange({ ...form, enrollYear: e.target.value })}
              />
            </Form.Item>
          </div>
          <div className={styles.formActions}>
            <Button className={styles.ghostBtn} onClick={cancelProfileEdit}>{t('common.cancel')}</Button>
            <Button type="primary" className={styles.solidBtn} onClick={saveProfile}>{t('profile.card.profile.save')}</Button>
          </div>
        </Form>
      )}
    </section>
  )
}

export default BasicSection
