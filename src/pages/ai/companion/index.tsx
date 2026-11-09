/**
 * 【business】AiCompanionView —— AI 伴侣（页面层）：counseling 模块子页，全页日常陪伴对话。
 * 与 AI 咨询师并存：伴侣偏日常倾听与轻松陪伴，咨询师偏专业心理支持。
 * AI 回复为算法生成，仅供情绪陪伴——页面需明确免责与专业求助引导。
 * - tm() 快捷提问数组 → t(key, { returnObjects: true }) 整段取数组
 * - RouterLink(name: counseling) → Link(to="/counseling")
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import ModuleCover from '@/components/ModuleCover'
import { ChatThread, useChat } from '@/features/ai'
import { useTranslation } from 'react-i18next'
import './index.css'

export function AiCompanionView() {
  const { t } = useTranslation()
  const { messages, isSending, send, abort } = useChat('companion')

  // 快捷提问数组来自 i18n（等价 Vue tm()：returnObjects 整段取数组）
  const quickPrompts = useMemo(
    () => t('counseling.companion.quickPrompts', { returnObjects: true }) as string[],
    [t]
  )

  return (
    <div className="ai-companion-page">
      <ModuleCover
        eyebrow={t('counseling.companion.eyebrow')}
        no="No.06"
        title={t('counseling.companion.title')}
        desc={t('counseling.companion.desc')}
      />

      <section className="companion-card">
        <ChatThread
          entries={messages}
          loading={isSending}
          variant="page"
          greeting={t('counseling.companion.greeting')}
          placeholder={t('counseling.companion.placeholder')}
          sendLabel={t('counseling.companion.send')}
          stopLabel={t('counseling.companion.stop')}
          quickPrompts={quickPrompts}
          disclaimer={t('counseling.companion.disclaimer')}
          onSend={send}
          onAbort={abort}
        />
      </section>

      <p className="companion-footnote">
        {t('counseling.companion.footnote')}
        <Link className="footnote-link" to="/counseling">
          {t('counseling.companion.bookLink')}
        </Link>
      </p>
    </div>
  )
}

export default AiCompanionView
