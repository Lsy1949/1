// 时光胶囊 · 详情页头部（返回 + 眉题 + 大标题）
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import styles from './DetailHeader.module.css'

export interface DetailHeaderProps {
  onBack: () => void
}

export function DetailHeader({ onBack }: DetailHeaderProps) {
  const { t } = useI18n()

  return (
    <header className={styles.pageHeader}>
      <div className={styles.headerBack} onClick={onBack}>
        <ArrowLeftOutlined />
        <span>{t('capsule.detail.back')}</span>
      </div>
      <span className={styles.headerEyebrow}>— Capsule Detail</span>
      <h1 className={styles.headerTitle} dangerouslySetInnerHTML={{ __html: t('capsule.detail.title') }}></h1>
    </header>
  )
}

export default DetailHeader
