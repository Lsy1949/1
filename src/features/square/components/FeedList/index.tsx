// 广场列表页 · Feed 双栏左栏：筛选栏 + 动态列表 + 空状态
import { useEffect, useMemo, useState } from 'react'
import { App as AntApp } from 'antd'
import { MessageOutlined, ShareAltOutlined, StarOutlined } from '@ant-design/icons'
import InitialAvatar from '@/components/InitialAvatar'
import { useReveal } from '@/hooks/useReveal'
import { useI18n } from '@/i18n'
import { moodMap, feedItemsSeed } from '../data'
import type { FeedItem } from '../types'
import styles from './FeedList.module.css'

export interface FeedListProps {
  onOpen: (id: number) => void
  onCreate: () => void
  onStatsChange: (interactions: number) => void
}

/** 单张 Feed 卡片：v-reveal 指令 → 在子组件内调用 useReveal（Hooks 不能在循环/map 中调用） */
interface FeedCardProps {
  item: FeedItem
  index: number
  onOpen: (id: number) => void
  onLike: (item: FeedItem) => void
  onShare: (item: FeedItem) => void
  onTopic: (tag: string) => void
}

function FeedCard({ item, index, onOpen, onLike, onShare, onTopic }: FeedCardProps) {
  const { t } = useI18n()
  const revealRef = useReveal<HTMLElement>({ delay: index * 60 })

  return (
    <article
      ref={revealRef}
      className={`${styles.feedCard}${item.type === 'capsule' ? ` ${styles.isCapsule}` : ''}${item.isPinned ? ` ${styles.isPinned}` : ''}`}
      onClick={() => onOpen(item.id)}
    >
      {/* 置顶/热议标记 */}
      {(item.isPinned || item.isHot) && (
        <div className={styles.cardMark}>
          <span className={`${styles.markBadge}${item.isPinned ? ` ${styles.pinned}` : ''}${item.isHot ? ` ${styles.hot}` : ''}`}>
            {item.isPinned ? t('square.list.pinned') : t('square.list.hot')}
          </span>
        </div>
      )}

      {/* 卡片头部 */}
      <div className={styles.cardHead}>
        <InitialAvatar name={item.author} size={44} isAnonymous={item.isAnonymous} />
        <div className={styles.headMeta}>
          <span className={styles.headAuthor}>{item.isAnonymous ? t('square.list.anonymous') : item.author}</span>
          <span className={styles.headTime}>{item.createdAt}</span>
        </div>
        {/* item.type 为数据驱动字面量（moment/capsule），module 类与协议类混拼 */}
        <span className={`${styles.typeBadge} ${item.type}`}>
          {item.type === 'capsule' ? t('square.list.capsuleBadge') : t('square.list.momentBadge')}
        </span>
      </div>

      {/* 心情 + 内容 */}
      <div className={styles.cardBody}>
        {item.mood ? (
          <div className={styles.moodLine}>
            <span className={styles.moodEmoji}>{moodMap[item.mood]}</span>
          </div>
        ) : null}
        <p className={styles.cardContent}>{item.content}</p>
      </div>

      {/* 图片网格 */}
      {item.photos && item.photos.length > 0 && (
        <div className={`${styles.cardPhotoGrid} photo-count-${Math.min(item.photos.length, 4)}`}>
          {item.photos.slice(0, 4).map((photo, pi) => (
            <img key={pi} src={photo} className={styles.cardPhoto} loading="lazy" alt="" />
          ))}
          {item.photos.length > 4 && <span className={styles.photoMore}>+{item.photos.length - 4}</span>}
        </div>
      )}

      {/* 话题标签 */}
      {item.topics && item.topics.length > 0 && (
        <div className={styles.cardTopics}>
          {item.topics.map((topic) => (
            <span
              key={topic}
              className={styles.topicTag}
              onClick={(e) => {
                e.stopPropagation()
                onTopic(topic)
              }}
            >#{topic}</span>
          ))}
        </div>
      )}

      {/* 互动栏 */}
      <div className={styles.cardFoot}>
        <button
          className={`${styles.interactBtn}${item.liked ? ` ${styles.liked}` : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onLike(item)
          }}
        >
          <StarOutlined />
          <span>{item.likes}</span>
        </button>
        <button
          className={styles.interactBtn}
          onClick={(e) => {
            e.stopPropagation()
            onOpen(item.id)
          }}
        >
          <MessageOutlined />
          <span>{item.commentCount}</span>
        </button>
        <button
          className={styles.interactBtn}
          onClick={(e) => {
            e.stopPropagation()
            onShare(item)
          }}
        >
          <ShareAltOutlined />
          <span>{t('square.list.share')}</span>
        </button>
      </div>
    </article>
  )
}

export function FeedList({ onOpen, onCreate, onStatsChange }: FeedListProps) {
  const { t } = useI18n()
  const { message } = AntApp.useApp() // 替代 ElMessage

  const [activeFilter, setActiveFilter] = useState('all')

  // 浅拷贝种子数据，保证每次进入页面点赞等状态重置
  const [feedItems, setFeedItems] = useState<FeedItem[]>(() => feedItemsSeed.map((i) => ({ ...i })))

  const counts = useMemo(
    () => ({
      all: feedItems.length,
      moment: feedItems.filter((i) => i.type === 'moment').length,
      capsule: feedItems.filter((i) => i.type === 'capsule').length
    }),
    [feedItems]
  )

  const stats = useMemo(() => {
    const totalLikes = feedItems.reduce((sum, i) => sum + i.likes, 0)
    const totalComments = feedItems.reduce((sum, i) => sum + i.commentCount, 0)
    return {
      moments: counts.moment,
      capsules: counts.capsule,
      interactions: totalLikes + totalComments
    }
  }, [feedItems, counts])

  const filters = useMemo(
    () => [
      { key: 'all', label: t('square.list.filter.all'), count: counts.all },
      { key: 'moment', label: t('square.list.filter.moment'), count: counts.moment },
      { key: 'capsule', label: t('square.list.filter.capsule'), count: counts.capsule }
    ],
    [t, counts]
  )

  const filteredItems = useMemo(
    () => (activeFilter === 'all' ? feedItems : feedItems.filter((item) => item.type === activeFilter)),
    [feedItems, activeFilter]
  )

  // 原 watch(stats, immediate) → useEffect（挂载即触发一次，语义等价）
  useEffect(() => {
    onStatsChange(stats.interactions)
  }, [stats.interactions, onStatsChange])

  const toggleLike = (item: FeedItem) => {
    setFeedItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, liked: !i.liked, likes: i.likes + (i.liked ? 1 : -1) } : i
      )
    )
  }

  const handleShare = (item: FeedItem) => {
    message.success(t('square.list.share') + ' · ' + (item.isAnonymous ? t('square.list.anonymous') : item.author))
  }

  const filterByTopic = (tag: string) => {
    message.info('#' + tag)
  }

  return (
    <main className={styles.feedColumn}>
      {/* 筛选栏 */}
      <div className={styles.filterBar}>
        {filters.map((f) => (
          <button
            key={f.key}
            className={`${styles.filterTab}${activeFilter === f.key ? ` ${styles.active}` : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {/* tab-label 为无样式语义标记类（全仓 css 无定义），保留字面量 */}
            <span className="tab-label">{f.label}</span>
            <span className={styles.tabCount}>({f.count})</span>
          </button>
        ))}
      </div>

      {/* Feed 列表 */}
      {filteredItems.length > 0 ? (
        <div className={styles.feedList}>
          {filteredItems.map((item, i) => (
            <FeedCard
              key={item.id}
              item={item}
              index={i}
              onOpen={onOpen}
              onLike={toggleLike}
              onShare={handleShare}
              onTopic={filterByTopic}
            />
          ))}
        </div>
      ) : (
        /* 空状态 */
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>{t('square.list.empty.title')}</h3>
          <p className={styles.emptyHint}>{t('square.list.empty.hint')}</p>
          <button className={styles.emptyBtn} onClick={onCreate}>{t('square.list.empty.btn')}</button>
        </div>
      )}
    </main>
  )
}

export default FeedList
