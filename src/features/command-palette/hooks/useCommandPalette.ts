import { useSyncExternalStore } from 'react'

/**
 * 命令面板全局开关（模块级单例：Navbar 触发 / CommandPalette 消费）。
 *
 * 等价 Vue 版的模块级 `const open = ref(false)`：Vue 依靠 ref 的响应式系统
 * 自动通知所有消费组件；React 没有 Vue 那样的模块级响应式 ref，这里用
 * 「模块级 boolean + 手写订阅者集合（Set<() => void>）」模拟同一语义，
 * 再经 useSyncExternalStore 接入 React 渲染管线。
 */

/** 模块级单例状态（对应 Vue 的 `const open = ref(false)`） */
let open = false

/** 订阅者集合（对应 Vue ref 的依赖收集与触发更新） */
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function setOpen(next: boolean): void {
  if (open === next) return
  open = next
  listeners.forEach((notify) => notify())
}

export function useCommandPalette(): { open: boolean; toggle: () => void; close: () => void } {
  const state = useSyncExternalStore(subscribe, () => open)

  const toggle = () => {
    setOpen(!open)
  }
  const close = () => {
    setOpen(false)
  }

  return { open: state, toggle, close }
}
