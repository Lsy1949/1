/**
 * 【base】RichTextViewer —— 富文本安全渲染（与 RichTextEditor 配套）
 * 统一走 toSafeHtml（富文本净化 / 纯文本转义 + 换行），替代各处裸用 dangerouslySetInnerHTML。
 */
import { useMemo } from 'react'
import { toSafeHtml } from '@/components/RichTextEditor/sanitize'

export interface RichTextViewerProps {
  /** 后端返回 / 编辑器产出的 HTML（兼容历史纯文本） */
  html: string
  className?: string
}

export function RichTextViewer({ html, className }: RichTextViewerProps) {
  const safeHtml = useMemo(() => toSafeHtml(html), [html])
  return <div className={className} dangerouslySetInnerHTML={{ __html: safeHtml }} />
}

export default RichTextViewer
