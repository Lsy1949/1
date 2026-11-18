// 06 · 注销账号：账号生命周期操作只出现在账号设置（个人中心不再重复）
import { Button } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { SectionHead } from '../SectionHead'
import styles from './DangerSection.module.css'

export interface DangerSectionProps {
  onConfirmDelete: () => void
}

export function DangerSection({ onConfirmDelete }: DangerSectionProps) {
  const { t } = useTranslation()

  return (
    <section id="sec-danger" className={`${styles.editorialSection} ${styles.dangerSection}`}>
      <SectionHead
        no="06"
        title={t('settings.card.danger.title')}
        desc={t('settings.card.danger.desc')}
      />
      <div className={styles.dangerAction}>
        <Button type="primary" danger className={styles.dangerBtn} onClick={onConfirmDelete}>
          <WarningOutlined />
          {t('settings.card.danger.deleteBtn')}
        </Button>
      </div>
    </section>
  )
}

export default DangerSection
