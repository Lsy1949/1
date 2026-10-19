// 广场列表页 · 社区侧边栏：活跃同学 / 热门话题 / 社区公约
import { useMemo } from 'react'
import { App as AntApp } from 'antd'
import InitialAvatar from '@/components/InitialAvatar'
import { useI18n } from '@/i18n'
import { activeMembers, trendingTopics } from '../data'
import styles from './CommunitySidebar.module.css'

export interface CommunitySidebarProps {
  onlineCount: number
}

export function CommunitySidebar({ onlineCount }: CommunitySidebarProps) {
  const { t } = useI18n()
  const { message } = AntApp.useApp() // 替代 ElMessage

  // 原 Vue 版 tm('...guidelinesItems') 取数组；React 版 i18n 仅暴露字符串 t，
  // 改用「点路径 + 序号」逐项探测（t 命中缺失时回退返回 key 原文作为终止信号）
  const guidelines = useMemo(() => {
    const prefix = 'square.list.community.sidebar.guidelinesItems'
    const items: string[] = []
    for (let i = 0; ; i++) {
      const text = t(`${prefix}.${i}`)
      if (text === `${prefix}.${i}`) break
      items.push(text)
    }
    return items
  }, [t])

  const filterByTopic = (tag: string) => {
    message.info('#' + tag)
  }

  return (
    <aside className={styles.sidebarColumn}>
      {/* 活跃同学 */}
      <div className={styles.sidebarCard}>
        <div className={styles.sidebarHead}>
          <h4 className={styles.sidebarTitle}>{t('square.list.community.sidebar.activeMembers')}</h4>
          <span className={styles.onlineDot}>{onlineCount} {t('square.list.community.online')}</span>
        </div>
        <div className={styles.membersRow}>
          {activeMembers.map((member, i) => (
            <div
              key={i}
              className={styles.memberAvatar}
              style={{ zIndex: activeMembers.length - i, marginLeft: i === 0 ? '0' : '-10px' }}
            >
              <InitialAvatar name={member.name} size={36} isAnonymous={member.isAnonymous} />
            </div>
          ))}
          <span className={styles.membersMore}>+{onlineCount - activeMembers.length}</span>
        </div>
      </div>

      {/* 热门话题 */}
      <div className={styles.sidebarCard}>
        <div className={styles.sidebarHead}>
          <h4 className={styles.sidebarTitle}>{t('square.list.community.sidebar.trending')}</h4>
        </div>
        <div className={styles.topicCloud}>
          {trendingTopics.map((topic) => (
            <button key={topic.tag} className={styles.cloudTag} onClick={() => filterByTopic(topic.tag)}>
              <span className={styles.cloudHash}>#</span>{topic.tag}
              <span className={styles.cloudCount}>{topic.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 社区公约 */}
      <div className={`${styles.sidebarCard} ${styles.guidelinesCard}`}>
        <div className={styles.sidebarHead}>
          <h4 className={styles.sidebarTitle}>{t('square.list.community.sidebar.guidelines')}</h4>
        </div>
        <ol className={styles.guidelinesList}>
          {guidelines.map((rule, i) => (
            <li key={i} className={styles.guidelineItem}>
              <span className={styles.ruleNum}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.ruleText}>{rule}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  )
}

export default CommunitySidebar
