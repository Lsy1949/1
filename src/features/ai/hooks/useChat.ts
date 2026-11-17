import { useCallback, useEffect, useRef, useState } from 'react'
import { streamAiChat } from '@/api/ai'
import type { AiChatMessage, AiChatPersona } from '@/api/ai'

/** 会话中的一条消息（含流式生成中的状态） */
export interface AiChatEntry {
  id: number
  role: AiChatMessage['role']
  content: string
  /** 是否正在流式生成（气泡展示打字指示） */
  streaming: boolean
}

/**
 * AI 对话会话状态（流式 + 可中断）。
 * 会话不持久化（隐私优先），组件卸载即销毁。
 *
 * Vue 版响应式 reply 对象的原地突变 → React 以函数式 setState 按 id 局部更新；
 * isSending 经 ref 镜像供 async 闭包实时读取（等价 ref.isSending）。
 */
export function useChat(persona: AiChatPersona = 'assistant') {
  const [messages, setMessages] = useState<AiChatEntry[]>([])
  const [isSending, setIsSending] = useState(false)
  const isSendingRef = useRef(false)
  const nextIdRef = useRef(0)
  const controllerRef = useRef<AbortController | null>(null)

  /** 中断当前生成（保留已生成内容） */
  const abort = useCallback((): void => {
    controllerRef.current?.abort()
    controllerRef.current = null
  }, [])

  /**
   * 发起一轮请求：用 base 作为历史、可选是否补一条用户消息，
   * send 与 regenerate 共用同一套流式逻辑。
   */
  const request = useCallback(
    async (text: string, base: AiChatEntry[], appendUser: boolean): Promise<void> => {
      if (!text || isSendingRef.current) return

      const userId = ++nextIdRef.current
      const replyId = ++nextIdRef.current
      const replyEntry: AiChatEntry = { id: replyId, role: 'assistant', content: '', streaming: true }
      const userEntry: AiChatEntry = { id: userId, role: 'user', content: text, streaming: false }
      setMessages(appendUser ? [...base, userEntry, replyEntry] : [...base, replyEntry])

      isSendingRef.current = true
      setIsSending(true)
      const controller = new AbortController()
      controllerRef.current = controller

      // 历史不含空占位回复；appendUser 时补上刚追加的用户消息
      const history: AiChatMessage[] = [
        ...base.map(({ role, content: c }) => ({ role, content: c })),
        { role: 'user', content: text },
      ]

      const patchReply = (patch: Partial<AiChatEntry>) => {
        setMessages(prev => prev.map(m => (m.id === replyId ? { ...m, ...patch } : m)))
      }

      // 流式增量同步累积一份（异常降级时保留已生成内容，等价 Vue 版 reply.content）
      let accumulated = ''
      try {
        const full = await streamAiChat(history, {
          persona,
          signal: controller.signal,
          onDelta: chunk => {
            accumulated += chunk
            setMessages(prev =>
              prev.map(m => (m.id === replyId ? { ...m, content: m.content + chunk } : m))
            )
          },
        })
        patchReply({ content: full })
      } catch (error) {
        // 主动中断：保留已生成内容；其余异常给出降级提示
        if (controller.signal.aborted) return
        patchReply({ content: accumulated || '抱歉，我刚刚走神了，请再试一次。' })
        console.warn('[ai] 会话异常', error)
      } finally {
        patchReply({ streaming: false })
        isSendingRef.current = false
        setIsSending(false)
        controllerRef.current = null
      }
    },
    [persona]
  )

  /** 发送一条用户消息并接收流式回复（发送期间忽略新提交） */
  const send = useCallback(
    async (content: string): Promise<void> => {
      const text = content.trim()
      if (!text || isSendingRef.current) return
      await request(text, messages, true)
    },
    [messages, request]
  )

  /** 重新生成：丢弃最后一轮 AI 回复，用最后一条用户消息重发 */
  const regenerate = useCallback(async (): Promise<void> => {
    if (isSendingRef.current) return
    const index = messages.map(m => m.role).lastIndexOf('user')
    if (index < 0) return
    await request(messages[index].content, messages.slice(0, index), true)
  }, [messages, request])

  /** 清空会话（重新开始） */
  const reset = useCallback((): void => {
    abort()
    setMessages([])
  }, [abort])

  // onScopeDispose(abort) → 卸载时中断流式请求
  useEffect(() => abort, [abort])

  return { messages, isSending, send, abort, reset, regenerate }
}
