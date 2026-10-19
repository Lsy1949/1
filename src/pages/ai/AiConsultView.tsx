/**
 * 【business】AiConsultView —— AI 咨询师（页面层）：counseling 模块子页，全页对话。
 * AI 回复为算法生成，仅供情绪陪伴与自我探索参考——页面需明确免责与专业求助引导。
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
import './AiConsultView.css'

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

export function AiConsultView() {
  const { t, locale } = useI18n()
  const { messages, isSending, send, abort } = useChat('counselor')

  // 快捷提问数组来自 i18n（tm 取原始消息数组）
  const quickPrompts = useMemo(
    () => tmStringArray(locale, 'counseling.aiChat.quickPrompts'),
    [locale]
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
