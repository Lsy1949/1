/**
 * 富文本 HTML 安全工具
 * - sanitizeHtml：DOMPurify（Apache-2.0 / MPL-2.0 双许可，商业免费）白名单净化，
 *   只保留编辑器可达的标签，属性一律丢弃
 * - toSafeHtml ：渲染侧统一入口，识别富文本 / 历史纯文本
 * - htmlToText ：去标签取纯文本（字数统计与「非空」校验）
 */
import DOMPurify from 'dompurify'

/** 与编辑器能力一一对应的标签白名单（Quill 的 formats 又锁了一层） */
const ALLOWED_TAGS = [
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'strike',
  'br',
  'p',
  'div',
  'ul',
  'ol',
  'li',
]

/**
 * 白名单净化：仅保留编辑器产出的安全标签，属性（style/class/on*）一律丢弃
 * 注：Quill 引擎输出 <s>，dom 引擎输出 <strike>，这里统一成 <s>
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  if (typeof window === 'undefined') return ''
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
  return clean.replace(/<(\/?)strike>/gi, '<$1s>')
}

/** 纯文本转 HTML：转义标签字符并把换行变 <br> */
export function plainTextToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

/**
 * 渲染侧统一入口：能识别富文本/纯文本两种历史数据
 * - 含标签 → 白名单净化
 * - 纯文本 → 转义 + 换行变 <br>（避免旧数据把 \n 挤成一段，也避免标签被当作 HTML 执行）
 */
export function toSafeHtml(value: string): string {
  if (!value) return ''
  return /<\/?[a-z][a-z0-9-]*(\s|>|\/)/i.test(value) ? sanitizeHtml(value) : plainTextToHtml(value)
}

/** 去标签纯文本（&nbsp; 视为空格，<br>/块级结束视为换行） */
export function htmlToText(html: string): string {
  if (!html) return ''
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
  const doc = new DOMParser().parseFromString(`<div>${withBreaks}</div>`, 'text/html')
  return (doc.body.textContent ?? '').replace(/\u00a0/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}
