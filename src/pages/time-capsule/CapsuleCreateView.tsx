// 时光胶囊 · 新建页（头部 + 表单）
import { useNavigate } from 'react-router-dom'
import { CreateForm, CreateHeader } from '@/features/time-capsule'
import './CapsuleCreateView.css'

export function CapsuleCreateView() {
  const router = useNavigate()

  return (
    <div className="time-capsule-page">
      {/* 杂志编辑式标题区 */}
      <CreateHeader onBack={() => router('/time-capsule')} />

      {/* 表单 · 编辑式分区 */}
      <CreateForm />
    </div>
  )
}

export default CapsuleCreateView
