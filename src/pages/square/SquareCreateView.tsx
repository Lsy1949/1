// 广场发布页：杂志编辑式标题区 + 表单；页面层负责提交 mutation 与跳转
import { useNavigate } from 'react-router-dom'
import { CreateForm, CreateHeader } from '@/features/square'
import type { SquareCreateInput } from '@/features/square'
import { useCreateFeed } from './squareQuery'
import './SquareCreateView.css'

export function SquareCreateView() {
  const navigate = useNavigate()

  const createFeed = useCreateFeed()

  const backToSquare = () => {
    navigate('/square')
  }

  const handleSubmit = async (values: SquareCreateInput) => {
    await createFeed.mutateAsync(values)
    navigate('/square')
  }

  return (
    <div className="square-create-page">
      {/* 杂志编辑式标题区 */}
      <CreateHeader onBack={backToSquare} />

      {/* 表单 · 卡片式分区 */}
      <CreateForm onSubmit={handleSubmit} isSubmitting={createFeed.isPending} />
    </div>
  )
}

export default SquareCreateView
