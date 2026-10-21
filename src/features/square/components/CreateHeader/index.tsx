// 发布页 · 杂志编辑式标题区（含返回）
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import styles from './CreateHeader.module.css'

export interface CreateHeaderProps {
  onBack: () => void
}

export function CreateHeader({ onBack }: CreateHeaderProps) {
  const { t } = useI18n()

  return (
    <header className={styles.pageHeader}>
      <button type="button" className={`${styles.headerBack} btn-reset`} onClick={onBack}>
        <ArrowLeftOutlined />
        <span>{t('square.create.back')}</span>
      </button>
      <span className={styles.headerEyebrow}>{t('square.create.eyebrow')}</span>
      {/* 原 v-html($t('square.create.title'))，title 含 <em> 标签、来自本地 i18n，内容可信 */}
      <h1 className={styles.headerTitle} dangerouslySetInnerHTML={{ __html: t('square.create.title') }}></h1>
      <p className={styles.headerSubtitle}>{t('square.create.subtitle')}</p>
    </header>
  )
}

export default CreateHeader
