/**
 * Quill 2 引擎适配（一期默认引擎）
 *
 * 封装原则：
 * - 只暴露 RichTextEngine 接口，消费方无感
 * - `formats` 白名单从引擎层锁死能力（加粗/斜体/下划线/删除线/列表），
 *   链接、图片、标题、颜色等根本无法产生，比事后净化更可靠
 * - 统一输出语义标签（getSemanticHTML → <strong>/<em>/<u>/<s>/<ol>/<ul>），
 *   正好落在 RichTextViewer 的白名单内
 * - 工具栏仍用外层 antd Button（无障碍 / 三语文案 / 视觉一致），这里只负责执行命令
 */
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { sanitizeHtml } from '../sanitize'
import styles from '../RichTextEditor.module.css'
import type { EditorCommand, RichTextEngine, RichTextEngineOptions } from './types'

/** 允许的格式白名单：与工具栏 8 个命令一一对应 */
const FORMATS = ['bold', 'italic', 'underline', 'strike', 'list']

/** 行内格式命令 → Quill 格式名 */
const INLINE_FORMATS: Partial<Record<EditorCommand, string>> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  strikeThrough: 'strike',
}

export class QuillEngine implements RichTextEngine {
  private readonly options: RichTextEngineOptions
  private quill: Quill | null = null
  private wrapper: HTMLDivElement | null = null
  /** 引擎自己上抛的最后一版 HTML：外部回写同值时跳过，避免光标跳动 */
  private lastEmitted = ''
  /** 内部回填期间屏蔽 text-change，避免「回填 → onChange → 再回填」循环 */
  private syncing = false

  constructor(options: RichTextEngineOptions) {
    this.options = options
  }

  mount(host: HTMLElement): void {
    const wrapper = document.createElement('div')
    wrapper.className = styles.quill
    host.appendChild(wrapper)

    const quill = new Quill(wrapper, {
      theme: 'snow',
      modules: { toolbar: false },
      formats: FORMATS,
      placeholder: this.options.placeholder ?? '',
      readOnly: Boolean(this.options.disabled),
    })

    // 无障碍：编辑区本身是 contenteditable，补 role / aria
    const root = quill.root
    root.setAttribute('role', 'textbox')
    root.setAttribute('aria-multiline', 'true')
    if (this.options.ariaLabel) root.setAttribute('aria-label', this.options.ariaLabel)
    root.style.minHeight = `${this.options.minHeight ?? 220}px`

    quill.on('text-change', this.handleTextChange)
    quill.on('selection-change', this.handleSelectionChange)
    this.quill = quill
    this.wrapper = wrapper
  }

  setHtml(html: string): void {
    const quill = this.quill
    if (!quill || this.syncing) return
    if (html === this.lastEmitted) return

    const safe = sanitizeHtml(html)
    if (safe === this.getHtml()) return

    this.syncing = true
    if (safe) {
      quill.clipboard.dangerouslyPasteHTML(safe, 'silent')
    } else {
      quill.setText('', 'silent')
    }
    this.syncing = false
    this.lastEmitted = html
  }

  getHtml(): string {
    return this.quill?.getSemanticHTML() ?? ''
  }

  focus(): void {
    this.ensureSelection()
  }

  exec(command: EditorCommand): void {
    const quill = this.quill
    if (!quill || this.options.disabled) return
    this.ensureSelection()

    if (command === 'undo') {
      quill.history.undo()
      this.reportFormats()
      return
    }
    if (command === 'redo') {
      quill.history.redo()
      this.reportFormats()
      return
    }

    if (command === 'insertUnorderedList') {
      this.toggleList('bullet')
      return
    }
    if (command === 'insertOrderedList') {
      this.toggleList('ordered')
      return
    }

    const format = INLINE_FORMATS[command]
    if (!format) return
    const active = Boolean(quill.getFormat()[format])
    quill.format(format, !active, 'user')
    this.reportFormats()
  }

  destroy(): void {
    this.quill?.off('text-change', this.handleTextChange)
    this.quill?.off('selection-change', this.handleSelectionChange)
    this.wrapper?.remove()
    this.quill = null
    this.wrapper = null
  }

  /** 无选区时（首次聚焦）把光标放到末尾，保证格式命令有落点 */
  private ensureSelection(): void {
    const quill = this.quill
    if (!quill) return
    quill.focus()
    if (!quill.getSelection()) {
      quill.setSelection(Math.max(0, quill.getLength() - 1), 0)
    }
  }

  /** 列表是行级格式：已激活则取消，否则设为指定类型 */
  private toggleList(kind: 'bullet' | 'ordered'): void {
    const quill = this.quill
    if (!quill) return
    const active = quill.getFormat().list === kind
    quill.format('list', active ? false : kind, 'user')
    this.reportFormats()
  }

  /** 把当前选区格式上报给外层（驱动工具栏激活态与 aria-pressed） */
  private reportFormats(): void {
    const callback = this.options.onFormatChange
    if (!callback) return
    const quill = this.quill
    if (!quill) {
      callback({})
      return
    }
    const formats = quill.getFormat()
    callback({
      bold: Boolean(formats.bold),
      italic: Boolean(formats.italic),
      underline: Boolean(formats.underline),
      strikeThrough: Boolean(formats.strike),
      insertUnorderedList: formats.list === 'bullet',
      insertOrderedList: formats.list === 'ordered',
    })
  }

  private readonly handleSelectionChange = (range: { index: number; length: number } | null): void => {
    if (!range) {
      this.options.onFormatChange?.({})
      return
    }
    this.reportFormats()
  }

  private readonly handleTextChange = (): void => {
    if (this.syncing) return
    const html = this.quill?.getSemanticHTML() ?? ''
    this.lastEmitted = html
    this.options.onChange?.(html)
  }
}
