/**
 * 【business】ChatThread —— AI 对话线程（纯展示）
 * - 消息列表 / 流式打字气泡 / 快捷提问 / 输入行；文案全部由父级注入（i18n 解耦）
 * - 行为经回调上抛：onSend(文本)、onAbort(中断)；自动滚动到底部为纯 DOM 行为
 * - Vue 版 nextTick 滚动 → useEffect（DOM 提交后执行，时序等价）
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { CustomerServiceOutlined, SendOutlined } from '@ant-design/icons'
import type { AiChatEntry } from '../../hooks/useChat'
import type { AiChatVariant } from '../types'
import styles from './ChatThread.module.css'

export interface ChatThreadProps {
  entries: AiChatEntry[]
  loading?: boolean
  /** 容器形态：fab = 悬浮面板，page = 全页对话 */
  variant?: AiChatVariant
  greeting: string
  placeholder: string
  sendLabel: string
  stopLabel: string
  quickPrompts?: string[]
  disclaimer?: string
  onSend: (text: string) => void
  onAbort: () => void
}

export function ChatThread({
  entries,
  loading = false,
  variant = 'fab',
  greeting,
  placeholder,
  sendLabel,
  stopLabel,
  quickPrompts = [],
  disclaimer = '',
  onSend,
  onAbort,
}: ChatThreadProps) {
  const [draft, setDraft] = useState('')

  function submit() {
    const text = draft.trim()
    if (!text || loading) return
    onSend(text)
    setDraft('')
  }

  // ============ 自动滚动：新消息平滑滚动，流式增量即时贴底 ============
  const listRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = useCallback((smooth: boolean) => {
    const el = listRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  // watch(entries.length) → 平滑滚动
  useEffect(() => {
    scrollToBottom(true)
  }, [entries.length, scrollToBottom])

  // watch(最后一帧 content.length，streaming 守卫) → 即时贴底
  const lastContentLength = entries.at(-1)?.content.length ?? 0
  useEffect(() => {
    if (entries.at(-1)?.streaming) scrollToBottom(false)
    // 仅内容长度变化触发，与 Vue watch 语义一致
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastContentLength, scrollToBottom])

  // onMounted → 即时贴底
  useEffect(() => {
    scrollToBottom(false)
  }, [scrollToBottom])

  return (
    <div className={`${styles.aiThread} ${variant === 'fab' ? styles.isFab : styles.isPage}`}>
      <div ref={listRef} className={styles.threadMessages}>
        {/* 欢迎消息 */}
        <div className={`${styles.msg} ${styles.msgAi}`}>
          <div className={styles.aiAvatar}>
            <CustomerServiceOutlined />
          </div>
          <div className={styles.bubble}>{greeting}</div>
        </div>

        {/* 会话消息 */}
        {entries.map(entry => (
          <div
            key={entry.id}
            className={`${styles.msg} ${entry.role === 'user' ? styles.msgUser : styles.msgAi}`}
          >
            {entry.role === 'assistant' && (
              <div className={styles.aiAvatar}>
                <CustomerServiceOutlined />
              </div>
            )}
            <div className={styles.bubble}>
              <span className="bubble-text">{entry.content}</span>
              {entry.streaming && entry.content && <span className={styles.streamCaret} />}
              {entry.streaming && !entry.content && (
                <span className={styles.typingDots}>
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </div>
          </div>
        ))}

        {/* 快捷提问（仅会话开始前展示） */}
        {!entries.length && quickPrompts.length > 0 && (
          <div className={styles.quickPrompts}>
            {quickPrompts.map(prompt => (
              <button
                key={prompt}
                type="button"
                className={styles.quickBtn}
                onClick={() => onSend(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      {disclaimer && <p className={styles.threadDisclaimer}>{disclaimer}</p>}

      <div className={styles.threadInput}>
        <input
          className={styles.threadInputField}
          type="text"
          placeholder={placeholder}
          disabled={loading}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
        />
        {loading ? (
          <button
            type="button"
            className={`${styles.sendBtn} ${styles.isStop}`}
            aria-label={stopLabel}
            title={stopLabel}
            onClick={onAbort}
          >
            <span className={styles.stopIcon} />
          </button>
        ) : (
          <button
            type="button"
            className={styles.sendBtn}
            disabled={!draft.trim()}
            aria-label={sendLabel}
            title={sendLabel}
            onClick={submit}
          >
            <SendOutlined />
          </button>
        )}
      </div>
    </div>
  )
}

export default ChatThread
