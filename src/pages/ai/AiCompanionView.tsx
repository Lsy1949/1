/**
 * 【business】AiCompanionView —— AI 伴侣（页面层）：counseling 模块子页，全页日常陪伴对话。
 * 与 AI 咨询师并存：伴侣偏日常倾听与轻松陪伴，咨询师偏专业心理支持。
 * AI 回复为算法生成，仅供情绪陪伴——页面需明确免责与专业求助引导。
 * - tm() 快捷提问数组 → RAW_MESSAGES + tmStringArray（React i18n 契约未暴露 tm()）
 * - RouterLink(name: counseling) → Link(to="/counseling")
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import ModuleCover from '@/components/ModuleCover'
import { ChatThread, useChat } from '@/features/ai'
import { useI18n } from '@/i18n'
import type { AppLocale } from '@/i18n'
import zhCN from '@/i18n/zh-CN'
import zhTW from '@/i18n/zh-TW'
import enUS from '@/i18n/en-US'
import './AiCompanionView.css'

// 语言包原始对象直查：数组文案（quickPrompts）按 locale 取原始值（等价 vue-i18n tm()）
const RAW_MESSAGES: Record<AppLocale, Record<string, unknown>> = {
  'zh-CN': zhCN as unknown as Record<string, unknown>,
  'zh-TW': zhTW as unknown as Record<string, unknown>,
  'en-US': enUS as unknown as Record<string, unknown>,
}

function tmStringArray(locale: AppLocale, path: string): string[] {
  const value = path.split('.').reduce<unknown>(
    (acc, key) => (acc as Record<string, unknown> | undefined)?.[key],
    RAW_MESSAGES[locale]
  )
  return Array.isArray(value) ? (value as string[]) : []
}

export function AiCompanionView() {
  const { t, locale } = useI18n()
  const { messages, isSending, send, abort } = useChat('companion')

  // 快捷提问数组来自 i18n（tm 取原始消息数组）
  const quickPrompts = useMemo(
    () => tmStringArray(locale, 'counseling.companion.quickPrompts'),
    [locale]
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
