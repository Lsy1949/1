/**
 * 【base】AnimatedCounter —— 进入视口后触发数字滚动动画
 * - props：target 目标值 / duration 时长 / decimals 小数位 / prefix·suffix 前后缀
 * - 数字按 zh-CN 千分位格式展示（与现网行为一致）
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './AnimatedCounter.module.css'

interface AnimatedCounterProps {
  /** 目标值 */
  target?: number
  /** 动画时长（ms） */
  duration?: number
  /** 前缀 */
  prefix?: string
  /** 后缀 */
  suffix?: string
  /** 小数位 */
  decimals?: number
}

function formatNum(n: number, decimals: number): string {
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function AnimatedCounter({
  target = 0,
  duration = 1800,
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const elRef = useRef<HTMLSpanElement | null>(null)
  const startedRef = useRef(false)
  const rafRef = useRef(0)
  const [display, setDisplay] = useState(() => formatNum(0, decimals))

  const animate = useCallback(() => {
    const start = performance.now()
    const from = 0
    const to = target
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)

    const step = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const val = from + (to - from) * ease(t)
      setDisplay(formatNum(val, decimals))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        setDisplay(formatNum(to, decimals))
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }, [target, duration, decimals])

  useEffect(() => {
    const node = elRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true
            observer.unobserve(entry.target)
            animate()
          }
        })
      },
      { threshold: 0.4 }
    )
    observer.observe(node)

    return () => {
      cancelAnimationFrame(rafRef.current)
      observer.disconnect()
    }
  }, [animate])

  return (
    <span ref={elRef} className={styles.animatedCounter}>
      {prefix ? <span className={styles.counterPrefix}>{prefix}</span> : null}
      <span className={styles.counterNum}>{display}</span>
      {suffix ? <span className={styles.counterSuffix}>{suffix}</span> : null}
    </span>
  )
}

export default AnimatedCounter
