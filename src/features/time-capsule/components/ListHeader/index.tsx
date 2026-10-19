// 时光胶囊 · 列表页头部（编辑式标题 + 邮戳印章）
import { useReveal } from '@/hooks/useReveal'
import { useI18n } from '@/i18n'
import styles from './ListHeader.module.css'

// 邮戳日期（当日）
const now = new Date()
const postmarkDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`

export function ListHeader() {
  const { t } = useI18n()

  // v-reveal / v-reveal="60" / v-reveal="120" / v-reveal="80" → useReveal
  const eyebrowRef = useReveal<HTMLDivElement>()
  const titleRef = useReveal<HTMLHeadingElement>({ delay: 60 })
  const descRef = useReveal<HTMLParagraphElement>({ delay: 120 })
  const rightRef = useReveal<HTMLDivElement>({ delay: 80 })

  return (
    <header className={styles.pageHeader}>
      <div className={styles.headerLeft}>
        <div ref={eyebrowRef} className={styles.headerEyebrow}>
          <span className={styles.eyebrowLine}></span>
          <span className={styles.eyebrowText}>{t('capsule.list.eyebrow')}</span>
        </div>
        <h1 ref={titleRef} className={styles.headerTitle} dangerouslySetInnerHTML={{ __html: t('capsule.list.title') }}></h1>
        <p ref={descRef} className={styles.headerDesc}>
          {t('capsule.list.desc')}
        </p>
      </div>
      <div ref={rightRef} className={styles.headerRight}>
        {/* 邮戳印章 */}
        <div className={styles.postmark}>
          <div className={styles.pmDate}>{postmarkDate}</div>
          <div className={styles.pmBar}></div>
          <div className={styles.pmText}>CAPSULE<br />OFFICE</div>
        </div>
      </div>
    </header>
  )
}

export default ListHeader
