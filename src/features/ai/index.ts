/**
 * ai feature 对外出口：外部一律 import from '@/features/ai'。
 * AiWorkspace 为 AI 咨询师 / AI 伴侣共用的桌面工作台；
 * AssistantFab 为自治悬浮组件（挂载即用）；ChatThread 为纯展示线程；
 * useChat 为对话请求态 hook（persona 参数区分咨询师/伴侣）。
 */
export { default as AssistantFab } from './components/AssistantFab'
export { default as ChatThread } from './components/ChatThread'
export { default as AiWorkspace } from './components/AiWorkspace'
export type { AiWorkspaceConfig } from './components/AiWorkspace'
export { useChat } from './hooks/useChat'
export type { AiChatEntry } from './hooks/useChat'
