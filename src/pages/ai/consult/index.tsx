/**
 * 【business】AiConsultView —— AI 咨询师（页面层）：counseling 模块子页，全页对话。
 * AI 回复为算法生成，仅供情绪陪伴与自我探索参考——页面需明确免责与专业求助引导。
 * - tm() 快捷提问数组 → t(key, { returnObjects: true }) 整段取数组
 * - RouterLink(name: counseling) → Link(to="/counseling")
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import ModuleCover from '@/components/ModuleCover'
import { ChatThread, useChat } from '@/features/ai'
import { useTranslation } from 'react-i18next'
import './index.css'

export function AiConsultView() {
  const { t } = useTranslation()
  const { messages, isSending, send, abort } = useChat('counselor')

  // 快捷提问数组来自 i18n（等价 Vue tm()：returnObjects 整段取数组）
  const quickPrompts = useMemo(
    () => t('counseling.aiChat.quickPrompts', { returnObjects: true }) as string[],
    [t]
  )

  return (
    <div className="ai-consult-page">
      <ModuleCover
        eyebrow={t('counseling.aiChat.eyebrow')}
        no="No.05"
        title={t('counseling.aiChat.title')}
        desc={t('counseling.aiChat.desc')}
      />

      <section className="consult-card">
        <ChatThread
          entries={messages}
          loading={isSending}
          variant="page"
          greeting={t('counseling.aiChat.greeting')}
          placeholder={t('counseling.aiChat.placeholder')}
          sendLabel={t('counseling.aiChat.send')}
          stopLabel={t('counseling.aiChat.stop')}
          quickPrompts={quickPrompts}
          disclaimer={t('counseling.aiChat.disclaimer')}
          onSend={send}
          onAbort={abort}
        />
      </section>

      <p className="consult-footnote">
        {t('counseling.aiChat.footnote')}
        <Link className="footnote-link" to="/counseling">
          {t('counseling.aiChat.bookLink')}
        </Link>
      </p>
    </div>
  )
}

export default AiConsultView
