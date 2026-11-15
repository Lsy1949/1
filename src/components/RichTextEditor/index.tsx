/**
 * 【base】RichTextEditor —— 可复用的富文本输入（受控组件，可直接放进 antd Form.Item）
 *
 * 设计要点：
 * - 受控契约：value = HTML 字符串，onChange(html) 上抛；Form.Item 可直接包裹
 * - 引擎可插拔：内部通过 `engine/types.ts` 的 RichTextEngine 接口隔离引擎，
 *   当前默认 dom（contentEditable + execCommand），Quill 2 适配见 engine/quill.ts；
 *   换引擎只改 `createEngine`，消费方 API 完全不变
 * - 安全：粘贴内容经 sanitizeHtml 白名单净化；渲染侧请使用配套的 RichTextViewer
 * - 无障碍：工具栏为 role="toolbar"，每个按钮有 aria-label 与 Tooltip
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Button, Tooltip } from 'antd'
import {
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  RedoOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { I18nKey } from '@/i18n/dataHelper'
import { htmlToText } from './sanitize'
import { createEngine } from './engine'
import type { EditorCommand, RichTextEngine } from './engine/types'
import styles from './RichTextEditor.module.css'

const TOOLS: Array<{ cmd: EditorCommand; icon: ReactNode; labelKey: I18nKey }> = [
  { cmd: 'bold', icon: <BoldOutlined />, labelKey: 'common.editor.bold' },
  { cmd: 'italic', icon: <ItalicOutlined />, labelKey: 'common.editor.italic' },
  { cmd: 'underline', icon: <UnderlineOutlined />, labelKey: 'common.editor.underline' },
  { cmd: 'strikeThrough', icon: <StrikethroughOutlined />, labelKey: 'common.editor.strike' },
  { cmd: 'insertUnorderedList', icon: <UnorderedListOutlined />, labelKey: 'common.editor.unorderedList' },
  { cmd: 'insertOrderedList', icon: <OrderedListOutlined />, labelKey: 'common.editor.orderedList' },
  { cmd: 'undo', icon: <UndoOutlined />, labelKey: 'common.editor.undo' },
  { cmd: 'redo', icon: <RedoOutlined />, labelKey: 'common.editor.redo' },
]

export interface RichTextEditorProps {
  /** HTML 字符串（受控） */
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  /** 编辑区最小高度（px），默认 220 */
  minHeight?: number
  /** 字数上限（按纯文本计，仅用于展示提示；强校验交给调用方 rules） */
  maxLength?: number
  disabled?: boolean
  /**
   * 外观：boxed = 独立卡片（默认，适合弹窗 / 独立表单）；
   * plain = 去边框，仅底部发丝线（适合嵌入编辑式长页面）
   */
  variant?: 'boxed' | 'plain'
  /** 无障碍名称，缺省取 i18n「富文本编辑器」 */
  ariaLabel?: string
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder,
  minHeight = 220,
  maxLength,
  disabled = false,
  variant = 'boxed',
  ariaLabel,
}: RichTextEditorProps) {
  const { t } = useTranslation()
  const hostRef = useRef<HTMLDivElement | null>(null)
  const engineRef = useRef<RichTextEngine | null>(null)
  /** 当前选区激活的格式（工具栏激活态 / aria-pressed） */
  const [activeFormats, setActiveFormats] = useState<Partial<Record<EditorCommand, boolean>>>({})

  // 引擎只创建一次：回调与最新值走 ref，避免父组件重渲染导致重建引擎
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const valueRef = useRef(value)
  valueRef.current = value

  const label = ariaLabel ?? t('common.editor.ariaLabel')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const engine = createEngine({
      placeholder,
      minHeight,
      disabled,
      ariaLabel: label,
      onChange: (html) => onChangeRef.current?.(html),
      onFormatChange: setActiveFormats,
    })
    engine.mount(host)
    engine.setHtml(valueRef.current)
    engineRef.current = engine

    return () => {
      engine.destroy()
      engineRef.current = null
    }
    // 仅在影响编辑区结构与可编辑性的属性变化时重建
  }, [placeholder, minHeight, disabled, label])

  // 外部值变化（草稿恢复 / 表单重置）时回写；引擎内部会跳过输入法组合期
  useEffect(() => {
    engineRef.current?.setHtml(value)
  }, [value])

  const count = useMemo(() => htmlToText(value).replace(/\s/g, '').length, [value])

  return (
    <div
      className={[
        styles.root,
        variant === 'plain' ? styles.plain : '',
        disabled ? styles.isDisabled : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-disabled={disabled || undefined}
    >
      <div className={styles.toolbar} role="toolbar" aria-label={label}>
        {TOOLS.map((tool, index) => {
          const isActive = Boolean(activeFormats[tool.cmd])
          return (
            <Tooltip key={tool.cmd} title={t(tool.labelKey)}>
              <Button
                type="text"
                size="small"
                className={`${styles.toolBtn}${isActive ? ` ${styles.isActive}` : ''}`}
                aria-label={t(tool.labelKey)}
                aria-pressed={isActive}
                disabled={disabled}
                // 阻止按钮抢焦点，保证选区仍在编辑区内
                onMouseDown={(event) => {
                  event.preventDefault()
                  engineRef.current?.exec(tool.cmd)
                }}
                icon={tool.icon}
                data-split={index === 4 || index === 6 ? 'true' : undefined}
              />
            </Tooltip>
          )
        })}
      </div>

      <div className={styles.editorWrap}>
        {/* 引擎宿主：具体编辑元素由引擎创建（dom → contentEditable / quill → .ql-container） */}
        <div ref={hostRef} />
        {maxLength ? (
          <span className={styles.count}>
            {count}/{maxLength}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export default RichTextEditor
