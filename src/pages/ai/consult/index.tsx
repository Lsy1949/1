/**
 * 【business】AiConsultView —— AI 咨询师（页面层）：counseling 模块子页，全页对话。
 * AI 回复为算法生成，仅供情绪陪伴与自我探索参考——页面需明确免责与专业求助引导。
 *
 * 桌面优先：三栏工作台（人格 / 对话画布 / 陪伴工具），能力与文案由 AiWorkspace 承载。
 */
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AiWorkspace } from '@/features/ai'
import type { AiWorkspaceConfig } from '@/features/ai'

export function AiConsultView() {
  const { t } = useTranslation()

  // 快捷提问数组来自 i18n（等价 Vue tm()：returnObjects 整段取数组）
  const quickPrompts = useMemo(
    () => t('counseling.aiChat.quickPrompts', { returnObjects: true }) as string[],
    [t]
  )

  const config: AiWorkspaceConfig = {
    persona: 'counselor',
    eyebrow: t('counseling.aiChat.eyebrow'),
    title: t('counseling.aiChat.title'),
    desc: t('counseling.aiChat.desc'),
    greeting: t('counseling.aiChat.greeting'),
    placeholder: t('counseling.aiChat.placeholder'),
    send: t('counseling.aiChat.send'),
    stop: t('counseling.aiChat.stop'),
    disclaimer: t('counseling.aiChat.disclaimer'),
    footnote: t('counseling.aiChat.footnote'),
    bookLink: t('counseling.aiChat.bookLink'),
    quickPrompts,
  }

  return <AiWorkspace config={config} />
}

export default AiConsultView
