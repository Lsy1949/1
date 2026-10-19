// 广场详情页 · 顶部返回栏
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import styles from './DetailTopBar.module.css'

export interface DetailTopBarProps {
  type: string
  id: number
  onBack: () => void
}

export function DetailTopBar({ type, id, onBack }: DetailTopBarProps) {
  const { t } = useI18n()

  return (
    <div className={styles.topBar}>
      <button className={styles.backBtn} onClick={onBack}>
        <ArrowLeftOutlined />
        <span>{t('square.detail.back')}</span>
      </button>
      <span className={styles.topMark}>
        {/* type 为数据驱动字面量（moment/capsule），module 类与协议类混拼 */}
        <span className={`${styles.typeMark} ${type}`}>{type === 'capsule' ? t('square.list.capsuleBadge') : t('square.list.momentBadge')}</span>
        <span className={styles.idMark}>No.{String(id).padStart(2, '0')}</span>
      </span>
    </div>
  )
}

export default DetailTopBar
