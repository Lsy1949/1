// 时光胶囊 · 列表页头部（编辑式标题 + 主行动 + 邮戳印章）
import { ArrowRightOutlined } from '@ant-design/icons'
import { useReveal } from '@/hooks/useReveal'
import { useTranslation } from 'react-i18next'
import styles from './ListHeader.module.css'

// 邮戳日期（当日）
const now = new Date()
const postmarkDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`

/** 概览：总览数据由列表页注入，用于标题右侧的一句话状态 */
export interface ListHeaderProps {
  /** 新建胶囊（页面导航） */
  onCreate?: () => void
}

export function ListHeader({ onCreate }: ListHeaderProps) {
  const { t } = useTranslation()

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
        {onCreate && (
          <button type="button" className={styles.headerCta} onClick={onCreate}>
            {t('capsule.list.create')}
            <ArrowRightOutlined />
          </button>
        )}
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
