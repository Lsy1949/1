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

  /** 发送一条用户消息并接收流式回复（发送期间忽略新提交） */
  const send = useCallback(
    async (content: string): Promise<void> => {
      const text = content.trim()
      if (!text || isSendingRef.current) return

      const userId = ++nextIdRef.current
      const replyId = ++nextIdRef.current
      setMessages(prev => [
        ...prev,
        { id: userId, role: 'user', content: text, streaming: false },
        { id: replyId, role: 'assistant', content: '', streaming: true },
      ])

      isSendingRef.current = true
      setIsSending(true)
      const controller = new AbortController()
      controllerRef.current = controller

      // 历史不含空占位回复（闭包 messages 为已提交状态，补上刚追加的用户消息）
      const history: AiChatMessage[] = [
        ...messages.map(({ role, content: c }) => ({ role, content: c })),
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
    [persona, messages]
  )

  /** 清空会话（重新开始） */
  const reset = useCallback((): void => {
    abort()
    setMessages([])
  }, [abort])

  // onScopeDispose(abort) → 卸载时中断流式请求
  useEffect(() => abort, [abort])

  return { messages, isSending, send, abort, reset }
}
