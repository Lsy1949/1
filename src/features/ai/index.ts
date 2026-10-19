/**
 * ai feature 对外出口：外部一律 import from '@/features/ai'。
 * AssistantFab 为自治悬浮组件（挂载即用）；ChatThread 为纯展示线程；
 * useChat 为对话请求态 hook（persona 参数区分咨询师/伴侣）。
 */
export { default as AssistantFab } from './components/AssistantFab'
export { default as ChatThread } from './components/ChatThread'
export { useChat } from './hooks/useChat'
export type { AiChatEntry } from './hooks/useChat'
