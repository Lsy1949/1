// 广场列表页 · 编辑式标题区 + 实时统计
import { useI18n } from '@/i18n'
import styles from './ListHeader.module.css'

export interface ListHeaderProps {
  onlineCount: number
  todayNewCount: number
  interactions: number
}

export function ListHeader({ onlineCount, todayNewCount, interactions }: ListHeaderProps) {
  const { t } = useI18n()

  return (
    <header className={styles.pageHeader}>
      <div className={styles.headerInner}>
        <div className={styles.headerLeft}>
          <span className={styles.headerEyebrow}>{t('square.list.eyebrow')}</span>
          {/* 原 v-html($t('square.list.title'))，title 含 <em> 标签、来自本地 i18n，内容可信 */}
          <h1 className={styles.headerTitle} dangerouslySetInnerHTML={{ __html: t('square.list.title') }}></h1>
          <p className={styles.headerDesc}>{t('square.list.desc')}</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.statBlock}>
            <span className={styles.statNum}>{onlineCount}</span>
            <span className={styles.statLabel}>{t('square.list.community.online')}</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statBlock}>
            <span className={styles.statNum}>{todayNewCount}</span>
            <span className={styles.statLabel}>{t('square.list.community.todayNew')}</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statBlock}>
            <span className={styles.statNum}>{interactions}</span>
            <span className={styles.statLabel}>{t('square.list.stats.interactions')}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default ListHeader
