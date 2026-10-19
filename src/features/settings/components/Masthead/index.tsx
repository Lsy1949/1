// 设置页报头 · 编辑式 masthead + 目录索引
import { useI18n } from '@/i18n'
import type { MastheadSection } from '../types'
import styles from './Masthead.module.css'

export interface MastheadProps {
  sections: MastheadSection[]
  activeSection: string
  onNavigate: (id: string) => void
}

export function Masthead({ sections, activeSection, onNavigate }: MastheadProps) {
  const { t } = useI18n()

  return (
    <header className={styles.masthead}>
      <div className={`${styles.mastheadCol} ${styles.mastheadMark}`}>
        <span className={styles.volMark}>№</span>
        <span className={styles.volText}>VOL. 2026</span>
        <span className={styles.volSub}>{t('settings.eyebrow')}</span>
      </div>
      <div className={`${styles.mastheadCol} ${styles.mastheadTitleBlock}`}>
        <p className={styles.mastheadEyebrow}>{t('settings.eyebrow')}</p>
        {/* Vue 版 v-html：i18n 文案内含 <em> 渐变强调 */}
        <h1 className={styles.mastheadTitle} dangerouslySetInnerHTML={{ __html: t('settings.title') }}></h1>
        <p className={styles.mastheadDeck}>{t('settings.desc')}</p>
      </div>
      <div className={`${styles.mastheadCol} ${styles.mastheadToc}`}>
        <p className={styles.tocLabel}>Index</p>
        <ol className={styles.tocList}>
          {sections.map((sec, i) => (
            <li key={sec.id}>
              <a
                href="javascript:void(0)"
                className={`${styles.tocLink}${activeSection === sec.id ? ` ${styles.active}` : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate(sec.id)
                }}
              >
                <span className={styles.tocNum}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.tocText}>{sec.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </header>
  )
}

export default Masthead
