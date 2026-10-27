import type { ReactNode } from 'react'
import styles from './index.module.css'

/**
 * 【base】PageContainer —— 页面级内容容器（Phase 0 响应式基建）
 *
 * 宽度体系唯一来源：全局 .container 类（main.css，max-width: var(--container-max)）
 * + tokens.css「流体尺寸层 L0.5」。本组件：
 *  - 不定义任何 max-width 字面量（窄栏也只是切换到 --container-narrow token）
 *  - 无 JS 断点逻辑（不用 useBreakpoint / matchMedia），全靠 CSS clamp 流体适配
 *  - 不新增依赖（项目无 classnames，用模板字符串拼接）
 */
interface PageContainerProps {
  children: ReactNode
  /** 窄栏模式：文章详情等长文阅读页，宽度切换为 --container-narrow */
  narrow?: boolean
  /** 业务侧透传类名（拼在容器类之后） */
  className?: string
}

export function PageContainer({ children, narrow = false, className }: PageContainerProps) {
  // container：全局容器类（宽度唯一来源）；styles.wrap：流体水平 padding；
  // narrow：窄栏变体；className：业务透传
  const cls = ['container', styles.wrap, narrow ? styles.narrow : '', className]
    .filter(Boolean)
    .join(' ')
  return <div className={cls}>{children}</div>
}

export default PageContainer
