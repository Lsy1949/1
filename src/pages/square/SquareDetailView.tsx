// 广场详情页：返回栏 + 标题区 + 正文 + 评论区
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App as AntApp } from 'antd'
import { DetailBody, DetailComments, DetailHeader, DetailTopBar, mockPosts } from '@/features/square'
import type { PostItem } from '@/features/square'
import { useI18n } from '@/i18n'
import './SquareDetailView.css'

export function SquareDetailView() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t } = useI18n()
  const { message } = AntApp.useApp() // 替代 ElMessage

  const [post, setPost] = useState<PostItem | null>(null)

  const loadPost = useCallback(
    (postId: string | undefined) => {
      if (!postId) return
      const data = mockPosts[Number(postId)]
      if (!data) {
        // 原 router.replace({ name: 'square' }) → 命名路由映射为路径
        navigate('/square', { replace: true })
        return
      }
      setPost(data)
      window.scrollTo({ top: 0, behavior: 'instant' })
    },
    [navigate]
  )

  // 原 onMounted + watch(route.params.id) 合并为一个 effect：挂载时与 id 变化时都会执行
  useEffect(() => {
    loadPost(id)
  }, [id, loadPost])

  // 原 Vue 直接改 post.liked/likes → React 以不可变更新等价实现
  const toggleLike = () => {
    setPost((prev) =>
      prev ? { ...prev, liked: !prev.liked, likes: prev.likes + (prev.liked ? 1 : -1) } : prev
    )
  }

  const handleShare = () => {
    if (!post) return
    message.success(t('square.detail.share') + ' · ' + (post.isAnonymous ? t('square.detail.anonymous') : post.author))
  }

  if (!post) return null

  return (
    <div className="square-detail-page">
      {/* 顶部返回栏 */}
      <DetailTopBar id={post.id} type={post.type} onBack={() => navigate('/square')} />

      {/* 标题区 */}
      <DetailHeader post={post} />

      {/* 正文 + 互动栏 */}
      <DetailBody post={post} onLike={toggleLike} onShare={handleShare} />

      {/* 评论区（切文时按 key 重建以重置状态） */}
      <DetailComments key={post.id} />
    </div>
  )
}

export default SquareDetailView
