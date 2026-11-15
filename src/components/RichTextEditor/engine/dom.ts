/**
 * dom 引擎：contentEditable + document.execCommand
 *
 * 特点：零依赖、行为与原实现完全一致，作为 Quill 的逃生通道保留
 * （QRT_TEXT_ENGINE=dom 即可切回）。
 */
import { sanitizeHtml } from '../sanitize'
import styles from '../RichTextEditor.module.css'
import type { EditorCommand, RichTextEngine, RichTextEngineOptions } from './types'

export class DomEngine implements RichTextEngine {
  private readonly options: RichTextEngineOptions
  private el: HTMLDivElement | null = null
  private composing = false

  constructor(options: RichTextEngineOptions) {
    this.options = options
  }

  mount(host: HTMLElement): void {
    const el = document.createElement('div')
    el.className = styles.editor
    el.setAttribute('role', 'textbox')
    el.setAttribute('aria-multiline', 'true')
    if (this.options.ariaLabel) el.setAttribute('aria-label', this.options.ariaLabel)
    if (this.options.placeholder) el.dataset.placeholder = this.options.placeholder
    el.setAttribute('tabindex', '0')
    el.setAttribute('contenteditable', this.options.disabled ? 'false' : 'true')
    el.style.minHeight = `${this.options.minHeight ?? 220}px`
    el.addEventListener('input', this.handleInput)
    el.addEventListener('paste', this.handlePaste)
    el.addEventListener('compositionstart', this.handleCompositionStart)
    el.addEventListener('compositionend', this.handleCompositionEnd)
    host.appendChild(el)
    this.el = el
  }

  setHtml(html: string): void {
    const el = this.el
    if (!el || this.composing) return
    if (el.innerHTML !== html) el.innerHTML = html
  }

  getHtml(): string {
    return this.el?.innerHTML ?? ''
  }

  focus(): void {
    this.el?.focus()
  }

  exec(command: EditorCommand): void {
    if (this.options.disabled) return
    this.el?.focus()
    // 产出语义标签（<b>/<i>/<u>/<s>）而不是内联 style，便于净化与持久化
    document.execCommand('styleWithCSS', false, 'false')
    document.execCommand(command)
    this.emit()
  }

  destroy(): void {
    const el = this.el
    if (!el) return
    el.removeEventListener('input', this.handleInput)
    el.removeEventListener('paste', this.handlePaste)
    el.removeEventListener('compositionstart', this.handleCompositionStart)
    el.removeEventListener('compositionend', this.handleCompositionEnd)
    el.remove()
    this.el = null
  }

  private emit(): void {
    this.options.onChange?.(this.el?.innerHTML ?? '')
  }

  private readonly handleInput = (): void => {
    this.emit()
  }

  private readonly handleCompositionStart = (): void => {
    this.composing = true
  }

  private readonly handleCompositionEnd = (): void => {
    this.composing = false
    this.emit()
  }

  /** 粘贴：阻止默认 HTML 注入，统一走白名单净化后再插入 */
  private readonly handlePaste = (event: ClipboardEvent): void => {
    if (this.options.disabled) return
    event.preventDefault()
    const rawHtml = event.clipboardData?.getData('text/html') ?? ''
    const rawText = event.clipboardData?.getData('text/plain') ?? ''
    const safe = rawHtml ? sanitizeHtml(rawHtml) : sanitizeHtml(rawText.replace(/\n/g, '<br>'))
    document.execCommand('insertHTML', false, safe)
    this.emit()
  }
}
