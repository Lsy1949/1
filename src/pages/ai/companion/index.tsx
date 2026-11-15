/**
 * 【business】AiCompanionView —— AI 伴侣（页面层）：counseling 模块子页，全页日常陪伴对话。
 * 与 AI 咨询师并存：伴侣偏日常倾听与轻松陪伴，咨询师偏专业心理支持。
 * AI 回复为算法生成，仅供情绪陪伴——页面需明确免责与专业求助引导。
 *
 * 桌面优先：左对话 + 右侧说明栏（对话建议 / 危机热线 / 转真人预约）。
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChatThread, useChat } from '@/features/ai'
import { useTranslation } from 'react-i18next'
import '@/pages/ai/aiPage.css'

export function AiCompanionView() {
  const { t } = useTranslation()
  const { messages, isSending, send, abort } = useChat('companion')

  // 快捷提问数组来自 i18n（等价 Vue tm()：returnObjects 整段取数组）
  const quickPrompts = useMemo(
    () => t('counseling.companion.quickPrompts', { returnObjects: true }) as string[],
    [t]
  )
  const tips = useMemo(
    () => t('counseling.aiShared.tips', { returnObjects: true }) as string[],
    [t]
  )

  return (
    <div className="ai-page">
      <header className="ai-head">
        <div className="ai-head-main">
          <span className="ai-eyebrow">{t('counseling.companion.eyebrow')}</span>
          <h1
            className="ai-title"
            dangerouslySetInnerHTML={{ __html: t('counseling.companion.title') }}
          />
          <p className="ai-desc">{t('counseling.companion.desc')}</p>
        </div>
        <Link className="ai-back" to="/counseling">
          {t('counseling.aiShared.back')}
        </Link>
      </header>

      <div className="ai-shell">
        <section className="ai-chat-card">
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

        <aside className="ai-aside">
          <section className="ai-side-panel">
            <h3 className="ai-side-title">{t('counseling.aiShared.tipsTitle')}</h3>
            <ul className="ai-tips">
              {tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>

          <section className="ai-side-panel ai-crisis">
            <span className="ai-crisis-label">{t('counseling.aiShared.hotlineLabel')}</span>
            <a className="ai-hotline" href="tel:12356">
              {t('counseling.aiShared.hotline')}
            </a>
          </section>

          <section className="ai-side-panel ai-convert">
            <p className="ai-convert-text">{t('counseling.companion.footnote')}</p>
            <Link className="ai-convert-link" to="/counseling">
              {t('counseling.companion.bookLink')}
            </Link>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default AiCompanionView
