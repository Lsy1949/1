/**
 * AI 对话组件共享类型。
 */

/** 对话人设：assistant = AI 客服（悬浮窗），counselor = AI 心理咨询师（子页），companion = AI 伴侣（子页） */
export type AiPersona = 'assistant' | 'counselor' | 'companion'

/** 对话容器形态：fab = 悬浮面板，page = 全页对话 */
export type AiChatVariant = 'fab' | 'page'
