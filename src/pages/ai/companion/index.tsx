/**
 * 【business】AiCompanionView —— AI 伴侣（页面层）：counseling 模块子页，全页日常陪伴对话。
 * 与 AI 咨询师并存：伴侣偏日常倾听与轻松陪伴，咨询师偏专业心理支持。
 * AI 回复为算法生成，仅供情绪陪伴——页面需明确免责与专业求助引导。
 *
 * 桌面优先：三栏工作台（人格 / 对话画布 / 陪伴工具），能力与文案由 AiWorkspace 承载。
 */
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AiWorkspace } from '@/features/ai'
import type { AiWorkspaceConfig } from '@/features/ai'

export function AiCompanionView() {
  const { t } = useTranslation()

  // 快捷提问数组来自 i18n（等价 Vue tm()：returnObjects 整段取数组）
  const quickPrompts = useMemo(
    () => t('counseling.companion.quickPrompts', { returnObjects: true }) as string[],
    [t]
  )

  const config: AiWorkspaceConfig = {
    persona: 'companion',
    eyebrow: t('counseling.companion.eyebrow'),
    title: t('counseling.companion.title'),
    desc: t('counseling.companion.desc'),
    greeting: t('counseling.companion.greeting'),
    placeholder: t('counseling.companion.placeholder'),
    send: t('counseling.companion.send'),
    stop: t('counseling.companion.stop'),
    disclaimer: t('counseling.companion.disclaimer'),
    footnote: t('counseling.companion.footnote'),
    bookLink: t('counseling.companion.bookLink'),
    quickPrompts,
  }

  return <AiWorkspace config={config} />
}

export default AiCompanionView
