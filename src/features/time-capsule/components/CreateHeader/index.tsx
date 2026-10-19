// 时光胶囊 · 新建页头部（返回 + 眉题 + 大标题）
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
      <div className={styles.headerBack} onClick={onBack}>
        <ArrowLeftOutlined />
        <span>{t('capsule.create.back')}</span>
      </div>
      <span className={styles.headerEyebrow}>{t('capsule.create.eyebrow')}</span>
      <h1 className={styles.headerTitle} dangerouslySetInnerHTML={{ __html: t('capsule.create.title') }}></h1>
      <p className={styles.headerSubtitle}>{t('capsule.create.subtitle')}</p>
    </header>
  )
}

export default CreateHeader
