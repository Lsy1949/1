import { useReveal } from '@/hooks/useReveal'
import './ModuleCover.css'

interface ModuleCoverProps {
  eyebrow: string
  no: string
  /** 支持 i18n 带 <em> 标签（对应 Vue 版 v-html） */
  title: string
  desc: string
}

/** 模块封面 · 编辑式（eyebrow + 编号 + 标题 + 描述） */
export function ModuleCover({ eyebrow, no, title, desc }: ModuleCoverProps) {
  const ref = useReveal<HTMLDivElement>()

  return (
    <div ref={ref} className="module-cover">
      <div className="cover-top">
        <span className="cover-eyebrow">{eyebrow}</span>
        <span className="cover-no">{no}</span>
      </div>
      {/* 原 v-html(title) 的 React 等价写法；title 由本地 i18n 常量提供，内容可信 */}
      <h2 className="cover-title" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="cover-desc">{desc}</p>
      <div className="cover-line" />
    </div>
  )
}

export default ModuleCover
