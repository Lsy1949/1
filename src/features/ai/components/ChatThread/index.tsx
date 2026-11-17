/**
 * 【business】ChatThread —— AI 对话线程（纯展示）
 * - 消息列表 / 流式打字气泡 / 快捷提问 / 输入区；文案全部由父级注入（i18n 解耦）
 * - 行为经回调上抛：onSend(文本)、onAbort(中断)、onRegenerate(重答)；自动滚动到底部为纯 DOM 行为
 * - page 形态：无卡片画布 + 多行输入（Enter 发送 / Shift+Enter 换行）+ 复制 / 重新生成 + 回到最新
 * - fab 形态：保持悬浮面板的紧凑气泡与圆形发送键
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Input, Tooltip } from 'antd'
import {
  ArrowDownOutlined,
  CheckOutlined,
  CopyOutlined,
  CustomerServiceOutlined,
  ReloadOutlined,
  SendOutlined,
} from '@ant-design/icons'
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
  /** fab 空态的大标题（参考阿里云 AI 助理的问候语；缺省用 greeting） */
  heroTitle?: string
  disclaimer?: string
  /** 输入上限（仅 page 形态展示计数） */
  maxLength?: number
  /** 输入区辅助说明（如 Enter 发送 / Shift+Enter 换行） */
  inputHint?: string
  /** 以下文案缺省时不渲染对应操作（fab 形态即不传） */
  copyLabel?: string
  copiedLabel?: string
  regenerateLabel?: string
  scrollLatestLabel?: string
  onSend: (text: string) => void
  onAbort: () => void
  onRegenerate?: () => void
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
  heroTitle,
  disclaimer = '',
  maxLength,
  inputHint,
  copyLabel,
  copiedLabel,
  regenerateLabel,
  scrollLatestLabel,
  onSend,
  onAbort,
  onRegenerate,
}: ChatThreadProps) {
  const [draft, setDraft] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current)
    },
    []
  )

  function submit() {
    const text = draft.trim()
    if (!text || loading) return
    onSend(text)
    setDraft('')
  }

  const copyEntry = async (entry: AiChatEntry) => {
    try {
      await navigator.clipboard.writeText(entry.content)
      setCopiedId(entry.id)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopiedId(null), 1600)
    } catch {
      /* 剪贴板不可用时静默失败 */
    }
  }

  // ============ 自动滚动：新消息平滑滚动，流式增量即时贴底 ============
  const listRef = useRef<HTMLDivElement | null>(null)
  const [atBottom, setAtBottom] = useState(true)
  /** 与 atBottom 同步的 ref：流式回调里读最新值，不依赖闭包 */
  const atBottomRef = useRef(true)

  const scrollToBottom = useCallback((smooth: boolean) => {
    const el = listRef.current
    if (!el) return
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    } else {
      // 即时定位：流式逐字更新若用动画会不断被打断、产生抖动
      el.scrollTop = el.scrollHeight
    }
    atBottomRef.current = true
    setAtBottom(true)
  }, [])

  // 新消息：自己刚发出的消息无论此前是否上翻都回到最新，其余仅在底部时跟随
  const lastRole = entries.at(-1)?.role
  useEffect(() => {
    if (entries.length === 0) return
    if (atBottomRef.current || lastRole === 'user') scrollToBottom(false)
  }, [entries.length, lastRole, scrollToBottom])

  // watch(最后一帧 content.length + streaming) → 即时贴底
  // 末帧与 streaming=false 分两次渲染：content 不变但会插入 32px 的消息操作行，
  // 因此 streaming 也必须作为依赖，否则底部操作行会被容器裁掉
  const lastEntry = entries.at(-1)
  const lastContentLength = lastEntry?.content.length ?? 0
  const lastStreaming = lastEntry?.streaming ?? false
  useEffect(() => {
    if (entries.length === 0) return
    if (atBottomRef.current) scrollToBottom(false)
  }, [lastContentLength, lastStreaming, entries.length, scrollToBottom])

  // 首次挂载：仅有历史会话时贴底；空会话保持顶部，避免欢迎语与快捷提问被滚出可视区
  useEffect(() => {
    if (entries.length > 0) scrollToBottom(false)
    // 仅挂载时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToBottom])

  // 清空会话：内容变短后浏览器会把 scrollTop 钳到最大值，显式回顶让欢迎语完整可见
  useEffect(() => {
    if (entries.length > 0) return
    const el = listRef.current
    if (el) el.scrollTop = 0
    atBottomRef.current = true
    setAtBottom(true)
  }, [entries.length])

  // 用户上翻阅读时露出「回到最新」
  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 96
    atBottomRef.current = bottom
    setAtBottom(bottom)
  }

  const lastAssistantId = [...entries].reverse().find(entry => entry.role === 'assistant')?.id
  const isPage = variant === 'page'
  /** fab 空态：参考阿里云 AI 助理的「问候语 + 建议卡片」开场，不额外堆叠功能 */
  const isEmptyFab = !isPage && entries.length === 0

  return (
    <div className={`${styles.aiThread} ${isPage ? styles.isPage : styles.isFab}`}>
      <div ref={listRef} className={styles.threadMessages} onScroll={handleScroll}>
        {isEmptyFab && (
          <div className={styles.hero}>
            <span className={styles.heroMark}>
              <CustomerServiceOutlined />
            </span>
            <h2 className={styles.heroTitle}>{heroTitle || greeting}</h2>
            {quickPrompts.length > 0 && (
              <div className={styles.heroCards}>
                {quickPrompts.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    className={styles.heroCard}
                    onClick={() => onSend(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 欢迎消息（仅全页形态；悬浮面板用 hero 开场） */}
        {isPage && (
          <div className={`${styles.msg} ${styles.msgAi} ${styles.msgGreeting}`}>
            <div className={styles.aiAvatar}>
              <CustomerServiceOutlined />
            </div>
            <div className={styles.bubbleWrap}>
              <div className={styles.bubble}>{greeting}</div>
            </div>
          </div>
        )}

        {/* 会话消息 */}
        {entries.map(entry => (
          <div
            key={entry.id}
            className={`${styles.msg} ${entry.role === 'user' ? styles.msgUser : styles.msgAi}`}
          >
            {isPage && entry.role === 'assistant' && (
              <div className={styles.aiAvatar}>
                <CustomerServiceOutlined />
              </div>
            )}
            <div className={styles.bubbleWrap}>
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

              {/* 消息操作：复制 / 对最后一条回复重新生成（仅 page 形态） */}
              {isPage && entry.role === 'assistant' && !entry.streaming && (
                <div className={styles.msgActions}>
                  <Tooltip title={copiedId === entry.id ? copiedLabel : copyLabel}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      aria-label={copyLabel}
                      onClick={() => void copyEntry(entry)}
                    >
                      {copiedId === entry.id ? <CheckOutlined /> : <CopyOutlined />}
                    </button>
                  </Tooltip>
                  {entry.id === lastAssistantId && onRegenerate && (
                    <Tooltip title={regenerateLabel}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        aria-label={regenerateLabel}
                        disabled={loading}
                        onClick={onRegenerate}
                      >
                        <ReloadOutlined />
                      </button>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 快捷提问（仅全页形态；悬浮面板已收进 hero 卡片） */}
        {isPage && !entries.length && quickPrompts.length > 0 && (
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

      {!atBottom && (
        <button
          type="button"
          className={styles.jumpLatest}
          aria-label={scrollLatestLabel}
          title={scrollLatestLabel}
          onClick={() => scrollToBottom(false)}
        >
          <ArrowDownOutlined />
        </button>
      )}

      {/* 全页形态：声明在输入区上方；悬浮面板：声明在输入区下方（与阿里云 AI 助理一致） */}
      {isPage && disclaimer && <p className={styles.threadDisclaimer}>{disclaimer}</p>}

      <div className={styles.composer}>
        <Input.TextArea
          className={styles.composerField}
          variant="borderless"
          autoSize={{ minRows: isPage ? 1 : 2, maxRows: isPage ? 6 : 5 }}
          maxLength={maxLength}
          value={draft}
          disabled={loading}
          placeholder={placeholder}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            // 输入法组合中的回车不发送
            if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
            e.preventDefault()
            submit()
          }}
        />
        <div className={styles.composerBar}>
          <span className={styles.composerHint}>{inputHint}</span>
          {maxLength ? (
            <span className={styles.composerCount}>
              {draft.length}/{maxLength}
            </span>
          ) : null}
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

      {/* 悬浮面板：声明居中落在输入区下方（与阿里云 AI 助理一致） */}
      {!isPage && disclaimer && <p className={styles.threadDisclaimer}>{disclaimer}</p>}
    </div>
  )
}

export default ChatThread
