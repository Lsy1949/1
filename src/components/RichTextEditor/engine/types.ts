/**
 * 富文本引擎抽象（对外 API 与引擎实现之间的唯一契约）
 *
 * 目标：RichTextEditor 的 props 永远不变，引擎可插拔——
 * - dom  ：contentEditable + document.execCommand（零依赖，逃生通道）
 * - quill：Quill 2 适配（一期默认）
 * 将来接 Lexical 只需新增一个实现文件。
 */

/** 工具栏命令（与工具栏按钮一一对应） */
export type EditorCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikeThrough'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'undo'
  | 'redo'

export interface RichTextEngineOptions {
  placeholder?: string
  /** 编辑区最小高度（px） */
  minHeight?: number
  disabled?: boolean
  /** 无障碍名称 */
  ariaLabel?: string
  /** 内容变化唯一出口：引擎只上抛 HTML，由外层组件决定如何受控 */
  onChange?: (html: string) => void
  /** 选区格式变化（驱动工具栏 aria-pressed / 激活态；引擎不支持时可不上报） */
  onFormatChange?: (active: Partial<Record<EditorCommand, boolean>>) => void
}

export interface RichTextEngine {
  /** 在宿主容器内创建编辑区并绑定事件 */
  mount(host: HTMLElement): void
  /** 外部值回写（内部需判等，避免打断输入） */
  setHtml(html: string): void
  /** 取当前 HTML（统一产出语义标签：b/i/u/s/ul/ol/li/p） */
  getHtml(): string
  focus(): void
  /** 执行工具栏命令 */
  exec(command: EditorCommand): void
  /** 解绑事件并移除 DOM（StrictMode 双挂载必须能安全销毁） */
  destroy(): void
}
