/**
 * 引擎工厂：消费方永远只 import RichTextEditor，引擎在这里选择。
 * VITE_EDITOR_ENGINE=dom 可回退到零依赖实现（逃生通道）。
 */
import { DomEngine } from './dom'
import { QuillEngine } from './quill'
import type { RichTextEngine, RichTextEngineOptions } from './types'

const ENGINE = import.meta.env.VITE_EDITOR_ENGINE === 'dom' ? 'dom' : 'quill'

export function createEngine(options: RichTextEngineOptions): RichTextEngine {
  return ENGINE === 'dom' ? new DomEngine(options) : new QuillEngine(options)
}
