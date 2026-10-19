// 时光胶囊 · 详情页（头部 + 详情主体）
import { useNavigate } from 'react-router-dom'
import { DetailBody, DetailHeader } from '@/features/time-capsule'
import './CapsuleDetailView.css'

export function CapsuleDetailView() {
  const router = useNavigate()

  return (
    <div className="detail-page">
      {/* 杂志编辑式标题区 */}
      <DetailHeader onBack={() => router('/time-capsule')} />

      {/* 胶囊详情 */}
      <DetailBody />
    </div>
  )
}

export default CapsuleDetailView
