/**
 * 【base】CountdownRing —— 倒计时进度环
 * - props：days 剩余天数 / total 周期天数 / unit 中心文案（由调用方传入，base 不内置业务文案）
 * - 颜色经 props 注入，默认中性色，不感知品牌与业务
 */
import { useEffect, useMemo, useState } from 'react'
import styles from './CountdownRing.module.css'

interface CountdownRingProps {
  /** 剩余天数 */
  days?: number
  /** 周期天数 */
  total?: number
  /** 尺寸（px） */
  size?: number
  /** 描边宽度 */
  strokeWidth?: number
  /** 进度环颜色 */
  progressColor?: string
  /** 背景轨道颜色 */
  trackColor?: string
  /** 中心单位文案 */
  unit?: string
}

export function CountdownRing({
  days = 0,
  total = 365,
  size = 140,
  strokeWidth = 4,
  progressColor = 'var(--brand-primary)',
  trackColor = 'var(--bg-mute)',
  unit = '',
}: CountdownRingProps) {
  const radius = useMemo(() => (size - strokeWidth) / 2 - 2, [size, strokeWidth])
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius])

  // 挂载后下一帧落到目标偏移，配合 CSS transition 播放进度动画
  const [animatedOffset, setAnimatedOffset] = useState(0)

  useEffect(() => {
    const progress = Math.max(0, Math.min(1, 1 - days / total))
    const targetOffset = circumference * (1 - progress)
    const rafId = requestAnimationFrame(() => {
      setAnimatedOffset(targetOffset)
    })
    return () => cancelAnimationFrame(rafId)
  }, [days, total, circumference])

  return (
    <div className={styles.countdownRing} style={{ width: size + 'px', height: size + 'px' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.ringSvg}>
        {/* 背景轨道 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          // 走 style 而非 SVG 展示属性，以便 var() 生效（随明暗/色板切换）
          style={{ stroke: trackColor }}
          strokeWidth={strokeWidth}
        />
        {/* 进度环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          strokeLinecap="round"
          className={styles.ringProgress}
          style={{ stroke: progressColor, transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>
      <div className={styles.ringCenter}>
        <span className={styles.ringNum}>{days}</span>
        <span className={styles.ringUnit}>{unit}</span>
      </div>
    </div>
  )
}

export default CountdownRing
