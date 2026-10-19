// 05 危险操作区块 · 注销确认（登出与跳转由页面处理）
import { Button } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import styles from './DangerSection.module.css'

export interface DangerSectionProps {
  onConfirmDelete: () => void
}

export function DangerSection({ onConfirmDelete }: DangerSectionProps) {
  const { t } = useI18n()

  return (
    <section className={`${styles.magSection} ${styles.dangerSection}`}>
      <div className={styles.secHead}>
        <span className={`${styles.secNum} ${styles.danger}`}>!</span>
        <div className={styles.secTitles}>
          <h2 className={styles.secTitle}>{t('profile.card.danger.title')}</h2>
          <p className={styles.secDesc}>{t('profile.card.danger.desc')}</p>
        </div>
      </div>
      <div className={styles.dangerAction}>
        {/* 原 ElButton plain 危险按钮 → antd danger + plain 视觉覆写 */}
        <Button type="primary" danger className={styles.dangerBtn} onClick={onConfirmDelete}>
          <WarningOutlined />
          {t('profile.card.danger.deleteBtn')}
        </Button>
      </div>
    </section>
  )
}

export default DangerSection
