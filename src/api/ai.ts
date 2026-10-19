import { streamMockAiReply } from './mock/ai'

/**
 * AI 对话模块：SSE 流式契约。
 *
 * 后端就绪前以本地心理支持话术引擎 mock 兜底（契约一致，逐字流式）；
 * 配置 VITE_AI_CHAT_URL 后自动切换真实接口，接口异常时回落 mock。
 */

/** AI 对话角色（系统人设由服务端按 persona 注入，前端不传 system） */
export interface AiChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** 对话人设：assistant = 平台客服，counselor = AI 心理咨询师 */
export type AiChatPersona = 'assistant' | 'counselor' | 'companion'

/** 流式对话选项 */
export interface AiChatStreamOptions {
  /** 人设（决定服务端系统提示与 mock 话术基调） */
  persona?: AiChatPersona
  /** 中断信号：关闭面板 / 开始新一轮提问时中断生成 */
  signal?: AbortSignal
  /** 流式增量回调：每收到一段增量文本触发一次 */
  onDelta?: (chunk: string) => void
}

/** AI 对话流式接口地址（未配置时走本地 mock） */
export const AI_CHAT_URL: string | undefined = import.meta.env.VITE_AI_CHAT_URL

/**
 * 流式 AI 对话：增量文本经 onDelta 逐段回调，resolve 值为完整回复。
 * 中断（signal 已中止）时抛出 AbortError，由调用方决定如何收尾。
 */
export async function streamAiChat(
  messages: readonly AiChatMessage[],
  options: AiChatStreamOptions = {}
): Promise<string> {
  if (!AI_CHAT_URL) return streamMockAiReply(messages, options)
  try {
    return await streamRemoteReply(AI_CHAT_URL, messages, options)
  } catch (error) {
    // 主动中断属预期行为，直接上抛；其余异常回落 mock 兜底
    if (options.signal?.aborted) throw error
    console.warn('[ai] 流式接口异常，回落本地兜底', error)
    return streamMockAiReply(messages, options)
  }
}

/** OpenAI 风格流式载荷（仅取所需字段） */
interface AiSsePayload {
  choices?: Array<{ delta?: { content?: string } }>
}

async function streamRemoteReply(
  url: string,
  messages: readonly AiChatMessage[],
  options: AiChatStreamOptions
): Promise<string> {
  // axios 不支持流式响应，AI 对话统一走 fetch + ReadableStream
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ stream: true, persona: options.persona ?? 'assistant', messages }),
    signal: options.signal
  })
  if (!res.ok || !res.body) throw new Error(`AI 接口响应异常（HTTP ${res.status}）`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    // SSE 以空行分帧，末帧可能不完整留待下轮
    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''
    for (const frame of frames) full += consumeSseFrame(frame, options.onDelta)
  }
  return full + consumeSseFrame(buffer, options.onDelta)
}

/** 解析单个 SSE 帧：兼容 OpenAI 风格 data: {...} 与纯文本 data: ...，返回增量文本 */
function consumeSseFrame(frame: string, onDelta?: (chunk: string) => void): string {
  let delta = ''
  for (const line of frame.split('\n')) {
    const data = line.replace(/^data:\s?/, '')
    if (data === line || !data || data === '[DONE]') continue
    try {
      const parsed = JSON.parse(data) as AiSsePayload
      delta += parsed.choices?.[0]?.delta?.content ?? ''
    } catch {
      delta += data // 纯文本流直接拼接
    }
  }
  if (delta) onDelta?.(delta)
  return delta
}
