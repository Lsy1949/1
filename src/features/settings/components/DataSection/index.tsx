// 05 · 数据管理：数据导出 / 缓存清理
import { useState } from 'react'
import { App as AntApp, Checkbox, DatePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import { ExclamationCircleFilled, FolderOpenOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import styles from './DataSection.module.css'

type RangeValue = [Dayjs | null, Dayjs | null] | null

interface ExportTypes {
  assessment: boolean
  counseling: boolean
  activity: boolean
  profile: boolean
}

interface CacheTypes {
  temp: boolean
  history: boolean
  assessment: boolean
  form: boolean
}

export function DataSection() {
  const { t } = useI18n()
  const { message, modal } = AntApp.useApp() // 替代 ElMessage / ElMessageBox

  // Vue 版 exportForm.dateRange: string[] → antd RangePicker 使用 Dayjs 区间
  const [dateRange, setDateRange] = useState<RangeValue>(null)

  const [exportTypes, setExportTypes] = useState<ExportTypes>({
    assessment: true,
    counseling: false,
    activity: false,
    profile: false
  })

  const [cacheTypes, setCacheTypes] = useState<CacheTypes>({
    temp: false,
    history: false,
    assessment: false,
    form: false
  })

  function exportData() {
    const hasType = Object.values(exportTypes).some(Boolean)
    if (!hasType) {
      message.warning(t('settings.card.data.selectAtLeastOne'))
      return
    }
    message.success(t('settings.card.data.exportSuccess'))
  }

  function clearCache() {
    const hasType = Object.values(cacheTypes).some(Boolean)
    if (!hasType) {
      message.warning(t('settings.card.data.selectAtLeastOne'))
      return
    }
    // ElMessageBox.confirm → App.useApp().modal.confirm
    modal.confirm({
      title: t('settings.card.data.clearConfirm'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      icon: <ExclamationCircleFilled />,
      onOk() {
        setCacheTypes({ temp: false, history: false, assessment: false, form: false })
        message.success(t('settings.card.data.clearSuccess'))
      }
    })
  }

  function renderExportCheckbox(key: keyof ExportTypes, labelKey: string) {
    return (
      <Checkbox
        key={key}
        checked={exportTypes[key]}
        onChange={(e) => setExportTypes((prev) => ({ ...prev, [key]: e.target.checked }))}
      >
        {t(labelKey)}
      </Checkbox>
    )
  }

  function renderCacheCheckbox(key: keyof CacheTypes, labelKey: string) {
    return (
      <Checkbox
        key={key}
        checked={cacheTypes[key]}
        onChange={(e) => setCacheTypes((prev) => ({ ...prev, [key]: e.target.checked }))}
      >
        {t(labelKey)}
      </Checkbox>
    )
  }

  return (
    <section id="sec-data" className={styles.editorialSection}>
      <div className={styles.sectionMarker}>
        <span className={styles.markerNum}>05</span>
        <span className={styles.markerRule}></span>
        <FolderOpenOutlined className={styles.markerIcon} />
        <span className={styles.markerLabel}>{t('settings.card.data.title')}</span>
      </div>
      <div className={styles.sectionHeadlineRow}>
        <h2 className={styles.sectionHeadline}>{t('settings.card.data.title')}</h2>
        <p className={styles.sectionDeck}>{t('settings.card.data.desc')}</p>
      </div>
      <div className={`${styles.editorialGrid} ${styles.twoCol}`}>
        {/* 导出 */}
        <div className={styles.editorialCol}>
          <h3 className={styles.colTitle}>{t('settings.card.data.exportBtn')}</h3>
          <p className={styles.colDeck}>{t('settings.card.data.exportDesc')}</p>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('settings.card.data.dateRange')}</label>
            {/* ElDatePicker daterange → antd RangePicker */}
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as RangeValue)}
              placeholder={[t('settings.card.data.startDate'), t('settings.card.data.endDate')]}
              separator="—"
              style={{ width: '100%' }}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('settings.card.data.dataTypes')}</label>
            <div className={styles.checkboxGrid}>
              {renderExportCheckbox('assessment', 'settings.card.data.typeAssessment')}
              {renderExportCheckbox('counseling', 'settings.card.data.typeCounseling')}
              {renderExportCheckbox('activity', 'settings.card.data.typeActivity')}
              {renderExportCheckbox('profile', 'settings.card.data.typeProfile')}
            </div>
          </div>
          <div className={styles.fieldActions}>
            <button className={styles.editorialBtn} onClick={exportData}>
              {t('settings.card.data.exportBtn')}
            </button>
          </div>
        </div>
        {/* 清理缓存 */}
        <div className={styles.editorialCol}>
          <h3 className={`${styles.colTitle} ${styles.colTitleDanger}`}>{t('settings.card.data.clearBtn')}</h3>
          <p className={styles.colDeck}>{t('settings.card.data.clearCacheDesc')}</p>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('settings.card.data.cacheTypes')}</label>
            <div className={styles.checkboxGrid}>
              {renderCacheCheckbox('temp', 'settings.card.data.cacheTemp')}
              {renderCacheCheckbox('history', 'settings.card.data.cacheHistory')}
              {renderCacheCheckbox('assessment', 'settings.card.data.cacheAssessment')}
              {renderCacheCheckbox('form', 'settings.card.data.cacheForm')}
            </div>
          </div>
          <div className={styles.fieldActions}>
            <button className={`${styles.editorialBtn} ${styles.editorialBtnDanger}`} onClick={clearCache}>
              {t('settings.card.data.clearBtn')}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DataSection
