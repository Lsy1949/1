// 广场发布页：杂志编辑式标题区 + 表单
import { useNavigate } from 'react-router-dom'
import { CreateForm, CreateHeader } from '@/features/square'
import './SquareCreateView.css'

export function SquareCreateView() {
  const navigate = useNavigate()

  const backToSquare = () => {
    navigate('/square')
  }

  return (
    <div className="square-create-page">
      {/* 杂志编辑式标题区 */}
      <CreateHeader onBack={backToSquare} />

      {/* 表单 · 卡片式分区 */}
      <CreateForm onPublished={backToSquare} />
    </div>
  )
}

export default SquareCreateView
