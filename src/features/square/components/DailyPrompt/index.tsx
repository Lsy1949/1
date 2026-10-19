// 广场列表页 · 今日话题卡
import { ArrowRightOutlined } from '@ant-design/icons'
import { useI18n } from '@/i18n'
import styles from './DailyPrompt.module.css'

export interface DailyPromptProps {
  onJoin: () => void
}

export function DailyPrompt({ onJoin }: DailyPromptProps) {
  const { t } = useI18n()

  return (
    <section className={styles.dailyPromptSection}>
      <div className={styles.dailyPromptCard}>
        <div className={styles.promptLeft}>
          <span className={styles.promptLabel}>{t('square.list.community.dailyPrompt.label')}</span>
          <p className={styles.promptQuestion}>{t('square.list.community.dailyPrompt.question')}</p>
          <button className={styles.promptJoin} onClick={onJoin}>
            <span>{t('square.list.community.dailyPrompt.join')}</span>
            <ArrowRightOutlined />
          </button>
        </div>
        <div className={styles.promptDeco}>“</div>
      </div>
    </section>
  )
}

export default DailyPrompt
