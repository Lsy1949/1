// 时光胶囊 · 新建页（头部 + 表单）；页面层负责提交 mutation 与成功后的跳转
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { capsuleApi } from '@/api'
import { CreateForm, CreateHeader } from '@/features/time-capsule'
import type { CapsuleCreateInput } from '@/features/time-capsule'
import { useI18n } from '@/i18n'
import './CapsuleCreateView.css'

export function CapsuleCreateView() {
  const router = useNavigate()
  const { t } = useI18n()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  // 提交状态由 mutation 托管，CreateForm 只消费 isPending
  const createMutation = useMutation({
    mutationFn: (input: CapsuleCreateInput) => capsuleApi.createCapsule(input),
    onSuccess: () => {
      message.success(t('capsule.create.success.body'))
      queryClient.invalidateQueries({ queryKey: ['capsules'] })
      router('/time-capsule')
    },
    onError: (error: Error) => message.error(error.message),
  })

  return (
    <div className="time-capsule-page">
      {/* 杂志编辑式标题区 */}
      <CreateHeader onBack={() => router('/time-capsule')} />

      {/* 表单 · 编辑式分区 */}
      <CreateForm
        onSubmit={(values) => createMutation.mutateAsync(values)}
        isSubmitting={createMutation.isPending}
      />
    </div>
  )
}

export default CapsuleCreateView
