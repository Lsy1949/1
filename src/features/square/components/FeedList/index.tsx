// 广场列表页 · Feed 双栏左栏：筛选栏 + 动态列表 + 加载/错误/空状态
// 纯展示组件：数据与点赞/分享/话题行为均由页面注入
import { useMemo, useState } from 'react'
import { Button, Empty, Result, Skeleton } from 'antd'
import { MessageOutlined, ShareAltOutlined, StarOutlined } from '@ant-design/icons'
import InitialAvatar from '@/components/InitialAvatar'
import { useReveal } from '@/hooks/useReveal'
import { useI18n } from '@/i18n'
import type { FeedItem } from '../types'
import { moodMap } from '../moods'
import styles from './FeedList.module.css'

export interface FeedListProps {
  items: FeedItem[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onLike: (id: number) => void
  onOpen: (id: number) => void
  onCreate: () => void
  onShare: (item: FeedItem) => void
  onTopic: (tag: string) => void
}

/** 单张 Feed 卡片：v-reveal 指令 → 在子组件内调用 useReveal（Hooks 不能在循环/map 中调用） */
interface FeedCardProps {
  item: FeedItem
  index: number
  onOpen: (id: number) => void
  onLike: (id: number) => void
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
            onLike(item.id)
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

export function FeedList({
  items,
  isLoading,
  isError,
  onRetry,
  onLike,
  onOpen,
  onCreate,
  onShare,
  onTopic,
}: FeedListProps) {
  const { t } = useI18n()

  // 筛选页签是纯 UI 状态，数据本身由页面注入
  const [activeFilter, setActiveFilter] = useState('all')

  const counts = useMemo(
    () => ({
      all: items.length,
      moment: items.filter((i) => i.type === 'moment').length,
      capsule: items.filter((i) => i.type === 'capsule').length
    }),
    [items]
  )

  const filters = useMemo(
    () => [
      { key: 'all', label: t('square.list.filter.all'), count: counts.all },
      { key: 'moment', label: t('square.list.filter.moment'), count: counts.moment },
      { key: 'capsule', label: t('square.list.filter.capsule'), count: counts.capsule }
    ],
    [t, counts]
  )

  const filteredItems = useMemo(
    () => (activeFilter === 'all' ? items : items.filter((item) => item.type === activeFilter)),
    [items, activeFilter]
  )

  // 首次加载：与卡片结构对齐的骨架
  if (isLoading) {
    return (
      <main className={styles.feedColumn}>
        <div className={styles.feedSkeleton}>
          <Skeleton active title={{ width: '30%' }} paragraph={{ rows: 1 }} />
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.feedSkeletonCard}>
              <Skeleton active avatar title={{ width: '26%' }} paragraph={{ rows: 3 }} />
            </div>
          ))}
        </div>
      </main>
    )
  }

  // 加载失败：提示 + 重试
  if (isError) {
    return (
      <main className={styles.feedColumn}>
        <Result
          status="error"
          title={t('common.loadFailed')}
          extra={
            <Button type="primary" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          }
        />
      </main>
    )
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
              onLike={onLike}
              onShare={onShare}
              onTopic={onTopic}
            />
          ))}
        </div>
      ) : activeFilter !== 'all' ? (
        /* 筛选后无数据 */
        <div className={styles.emptyState}>
          <Empty description={t('square.list.emptyFiltered')} />
        </div>
      ) : (
        /* 全站空状态 */
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
