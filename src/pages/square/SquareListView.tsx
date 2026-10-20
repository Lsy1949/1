// 广场列表页：编辑式标题区 + 今日话题 + 双栏主体 + FAB
// 页面层负责数据拉取 / 点赞乐观更新 / 三态兜底，子组件均为 Props 驱动
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { App } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { CommunitySidebar, DailyPrompt, FeedList, ListHeader } from '@/features/square'
import type { FeedItem } from '@/features/square'
import { useI18n } from '@/i18n'
import { useSquareInfo, useToggleLike } from './squareQuery'
import './SquareListView.css'

export function SquareListView() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { message } = App.useApp()

  const { data, isPending, isError, refetch } = useSquareInfo()
  const toggleLike = useToggleLike()

  const feedItems = data?.feedItems ?? []
  const members = data?.members ?? []
  const topics = data?.topics ?? []
  const onlineCount = data?.onlineCount ?? 0
  const todayNewCount = data?.todayNewCount ?? 0

  // 互动总数 = 点赞 + 评论（与旧版口径一致）
  const interactions = useMemo(
    () => feedItems.reduce((sum, item) => sum + item.likes + item.commentCount, 0),
    [feedItems],
  )

  const openDetail = (id: number) => {
    navigate(`/square/${id}`)
  }

  const goCreate = () => {
    navigate('/square/create')
  }

  const handleShare = (item: FeedItem) => {
    message.success(
      t('square.list.share') + ' · ' + (item.isAnonymous ? t('square.list.anonymous') : item.author),
    )
  }

  const handleTopic = (tag: string) => {
    message.info('#' + tag)
  }

  return (
    <div className="square-page">
      {/* 编辑式标题区 */}
      <ListHeader
        onlineCount={onlineCount}
        todayNewCount={todayNewCount}
        interactions={interactions}
      />

      {/* 今日话题 */}
      <DailyPrompt onJoin={goCreate} />

      {/* 主体：双栏 */}
      <div className="community-body">
        <FeedList
          items={feedItems}
          isLoading={isPending}
          isError={isError}
          onRetry={() => void refetch()}
          onLike={toggleLike.mutate}
          onOpen={openDetail}
          onCreate={goCreate}
          onShare={handleShare}
          onTopic={handleTopic}
        />
        <CommunitySidebar
          members={members}
          topics={topics}
          onlineCount={onlineCount}
          isLoading={isPending}
          isError={isError}
          onRetry={() => void refetch()}
          onTopic={handleTopic}
        />
      </div>

      {/* FAB 发布按钮 */}
      <button className="fab-btn" aria-label={t('square.list.fab')} onClick={goCreate}>
        <PlusOutlined />
        <span className="fab-text">{t('square.list.fab')}</span>
      </button>
    </div>
  )
}

export default SquareListView
