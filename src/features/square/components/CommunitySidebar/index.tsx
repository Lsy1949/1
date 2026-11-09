// 广场列表页 · 社区侧边栏：活跃同学 / 热门话题 / 社区公约
// 纯展示组件：成员与话题由页面注入，加载/错误/空态在此渲染
import { Button, Empty, Result, Skeleton } from 'antd'
import type { TFunction } from 'i18next'
import InitialAvatar from '@/components/InitialAvatar'
import { useTranslation } from 'react-i18next'
import type { MemberItem, TopicItem } from '../types'
import styles from './CommunitySidebar.module.css'

export interface CommunitySidebarProps {
  members: MemberItem[]
  topics: TopicItem[]
  onlineCount: number
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onTopic: (tag: string) => void
}

export function CommunitySidebar({
  members,
  topics,
  onlineCount,
  isLoading,
  isError,
  onRetry,
  onTopic,
}: CommunitySidebarProps) {
  const { t } = useTranslation()

  return (
    <aside className={styles.sidebarColumn}>
      {/* 活跃同学 */}
      <div className={styles.sidebarCard}>
        <div className={styles.sidebarHead}>
          <h4 className={styles.sidebarTitle}>{t('square.list.community.sidebar.activeMembers')}</h4>
          {!isLoading && !isError && (
            <span className={styles.onlineDot}>{onlineCount} {t('square.list.community.online')}</span>
          )}
        </div>
        {isLoading ? (
          <Skeleton active avatar paragraph={{ rows: 1 }} title={false} />
        ) : isError ? (
          <SidebarError onRetry={onRetry} />
        ) : members.length > 0 ? (
          <div className={styles.membersRow}>
            {members.map((member, i) => (
              <div
                key={`${member.name}-${i}`}
                className={styles.memberAvatar}
                style={{ zIndex: members.length - i, marginLeft: i === 0 ? '0' : '-10px' }}
              >
                <InitialAvatar name={member.name} size={36} isAnonymous={member.isAnonymous} />
              </div>
            ))}
            <span className={styles.membersMore}>+{Math.max(0, onlineCount - members.length)}</span>
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('square.list.community.emptyMembers')} />
        )}
      </div>

      {/* 热门话题 */}
      <div className={styles.sidebarCard}>
        <div className={styles.sidebarHead}>
          <h4 className={styles.sidebarTitle}>{t('square.list.community.sidebar.trending')}</h4>
        </div>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 3 }} title={false} />
        ) : isError ? (
          <SidebarError onRetry={onRetry} />
        ) : topics.length > 0 ? (
          <div className={styles.topicCloud}>
            {topics.map((topic) => (
              <button key={topic.tag} className={styles.cloudTag} onClick={() => onTopic(topic.tag)}>
                <span className={styles.cloudHash}>#</span>{topic.tag}
                <span className={styles.cloudCount}>{topic.count}</span>
              </button>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('square.list.community.emptyTopics')} />
        )}
      </div>

      {/* 社区公约（静态文案，不依赖接口） */}
      <div className={`${styles.sidebarCard} ${styles.guidelinesCard}`}>
        <div className={styles.sidebarHead}>
          <h4 className={styles.sidebarTitle}>{t('square.list.community.sidebar.guidelines')}</h4>
        </div>
        <ol className={styles.guidelinesList}>
          {guidelines(t).map((rule, i) => (
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

/** 侧栏错误：紧凑 Result + 重试 */
function SidebarError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <Result
      className={styles.sidebarError}
      status="error"
      title={t('common.loadFailed')}
      extra={
        <Button size="small" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      }
    />
  )
}

/**
 * 社区公约文案：t(key, { returnObjects: true }) 整段取数组（等价 vue-i18n tm()）。
 */
function guidelines(t: TFunction): string[] {
  return t('square.list.community.sidebar.guidelinesItems', { returnObjects: true }) as string[]
}

export default CommunitySidebar
