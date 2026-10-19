// 广场列表页：编辑式标题区 + 今日话题 + 双栏主体 + FAB
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusOutlined } from '@ant-design/icons'
import { CommunitySidebar, DailyPrompt, FeedList, ListHeader } from '@/features/square'
import { useI18n } from '@/i18n'
import './SquareListView.css'

export function SquareListView() {
  const navigate = useNavigate()
  const { t } = useI18n()

  const [onlineCount] = useState(23)
  const [todayNewCount] = useState(5)
  const [interactions, setInteractions] = useState(0)

  const openDetail = (id: number) => {
    navigate(`/square/${id}`)
  }

  const goCreate = () => {
    navigate('/square/create')
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
          onOpen={openDetail}
          onCreate={goCreate}
          onStatsChange={setInteractions}
        />
        <CommunitySidebar onlineCount={onlineCount} />
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
