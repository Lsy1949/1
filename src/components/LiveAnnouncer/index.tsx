// 全局读屏播报区（aria-live）：主题/语言等「无焦点变化的状态切换」需要主动播报
// 用法：任意组件调用 announce(t('a11y.themeSwitched', { theme }))，由 AppShell 根部常驻的 LiveAnnouncer 输出
import { useEffect, useRef, useState } from 'react'

type Listener = (message: string) => void

const listeners = new Set<Listener>()

/** 写入播报文案（先清空再下一帧写入，保证同一文案连续触发时也会重新播报） */
export function announce(message: string): void {
  listeners.forEach((fn) => fn(message))
}

export function LiveAnnouncer() {
  const [message, setMessage] = useState('')
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const listener: Listener = (next) => {
      setMessage('')
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setMessage(next), 60)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
      window.clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  )
}

export default LiveAnnouncer
