/**
 * 【business】GameStar —— 星轨连珠 · 连星座小游戏
 * - canvas 按序号点击星辰连线；星星坐标存 0-1 比例，resize 安全
 * - 关卡值用 ref 镜像：nextStarLevel 在 setTimeout 闭包内也需要最新值
 * - drawStars 显式接收 connected 参数（等价 Vue 中 starConnected.value++ 后立即绘制）
 * - resize 监听 effect 依赖 [starConnected] 重注册，保证闭包新鲜
 * - Vue 源无 <style> 块，舞台共用样式见 NotFoundGameStage.css
 */
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { readCssColor } from '@/utils/cssVar'

interface StarPoint {
  x: number
  y: number
  no: number
}

export interface GameStarProps {
  /* 无 props */
}

export function GameStar(_props: GameStarProps) {
  const starCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [starLevel, setStarLevel] = useState(1)
  const [starConnected, setStarConnected] = useState(0)
  const [starTotal, setStarTotal] = useState(0)
  const [starClear, setStarClear] = useState(false)

  const starCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const starCanvasSizeRef = useRef(480)
  const starPointsRef = useRef<StarPoint[]>([]) // {x, y, no} 坐标存为 0-1 比例，resize 安全
  const starClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 关卡值镜像：nextStarLevel 在 setTimeout 闭包内也需要最新值
  const starLevelRef = useRef(1)

  function initStarCanvas() {
    const canvas = starCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const size = Math.max(280, Math.min(rect.width || 480, rect.height || 480))
    starCanvasSizeRef.current = size
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = size + 'px'
    canvas.style.height = size + 'px'
    const ctx = canvas.getContext('2d')
    starCtxRef.current = ctx
    if (!ctx) return
    ctx.scale(dpr, dpr)
  }

  function generateStars(count: number) {
    setStarTotal(count)
    setStarConnected(0)
    const points: StarPoint[] = []
    const padding = 0.12
    const minDist = Math.max(0.08, 0.7 / Math.sqrt(count))
    let attempts = 0
    while (points.length < count && attempts < 500) {
      attempts++
      const x = padding + Math.random() * (1 - padding * 2)
      const y = padding + Math.random() * (1 - padding * 2)
      let ok = true
      for (const p of points) {
        if (Math.hypot(p.x - x, p.y - y) < minDist) { ok = false; break }
      }
      if (ok) points.push({ x, y, no: points.length + 1 })
    }
    starPointsRef.current = points
  }

  function drawStars(connected: number) {
    const ctx = starCtxRef.current
    if (!ctx) return
    const size = starCanvasSizeRef.current
    const starPoints = starPointsRef.current
    ctx.clearRect(0, 0, size, size)

    // 已连接的星轨连线（品牌色发光）
    if (connected > 1) {
      const accentLine = readCssColor('color-mix(in srgb, var(--brand-primary-bright) 75%, transparent)')
      const accentShadow = readCssColor('color-mix(in srgb, var(--brand-primary-bright) 85%, transparent)')
      ctx.strokeStyle = accentLine
      ctx.lineWidth = 1.4
      ctx.lineCap = 'round'
      ctx.shadowColor = accentShadow
      ctx.shadowBlur = 10
      ctx.beginPath()
      for (let i = 0; i < connected; i++) {
        const p = starPoints[i]
        const px = p.x * size
        const py = p.y * size
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // 星辰
    const accent = readCssColor('var(--brand-primary-bright)')
    const neutral = readCssColor('var(--text-inverse)')
    /* canvas 需实色，故经 readCssColor 解析主题变量（含 alpha 变体） */
    const accentMix = (pct: number): string =>
      readCssColor(`color-mix(in srgb, var(--brand-primary-bright) ${pct}%, transparent)`)
    const neutralMix = (pct: number): string =>
      readCssColor(`color-mix(in srgb, var(--text-inverse) ${pct}%, transparent)`)

    for (let i = 0; i < starPoints.length; i++) {
      const p = starPoints[i]
      const px = p.x * size
      const py = p.y * size
      const isLinked = i < connected
      const isNext = i === connected
      const r = isNext ? 6 : 4.5

      const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 4)
      if (isLinked) {
        glow.addColorStop(0, accentMix(95))
        glow.addColorStop(0.5, accentMix(30))
        glow.addColorStop(1, accentMix(0))
      } else if (isNext) {
        glow.addColorStop(0, neutralMix(95))
        glow.addColorStop(0.5, neutralMix(40))
        glow.addColorStop(1, neutralMix(0))
      } else {
        glow.addColorStop(0, neutralMix(50))
        glow.addColorStop(0.5, neutralMix(15))
        glow.addColorStop(1, neutralMix(0))
      }
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(px, py, r * 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = isLinked ? accent : isNext ? neutral : neutralMix(60)
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.fill()

      // 序号
      ctx.fillStyle = isLinked ? accentMix(90) : isNext ? neutral : neutralMix(50)
      ctx.font = '10px "Noto Sans SC", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(p.no), px, py - r - 10)
    }
  }

  function initStar() {
    setStarLevel(1)
    starLevelRef.current = 1
    setStarClear(false)
    initStarCanvas()
    generateStars(5)
    drawStars(0)
  }

  function handleStarClick(e: ReactMouseEvent<HTMLCanvasElement>) {
    if (starClear) return
    const canvas = starCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const xRatio = (e.clientX - rect.left) / rect.width
    const yRatio = (e.clientY - rect.top) / rect.height

    const starPoints = starPointsRef.current
    const nextIdx = starConnected
    if (nextIdx >= starPoints.length) return
    const next = starPoints[nextIdx]
    if (Math.hypot(next.x - xRatio, next.y - yRatio) < 0.08) {
      const connected = starConnected + 1
      setStarConnected(connected)
      drawStars(connected)
      if (connected >= starTotal) {
        setStarClear(true)
        starClearTimerRef.current = setTimeout(() => nextStarLevel(), 1500)
      }
    }
  }

  function nextStarLevel() {
    setStarClear(false)
    const next = starLevelRef.current + 1
    starLevelRef.current = next
    setStarLevel(next)
    initStarCanvas()
    generateStars(Math.min(15, 5 + (next - 1)))
    drawStars(0)
  }

  function handleResize() {
    initStarCanvas()
    drawStars(starConnected)
  }

  // 等价 onMounted(initStar) + onBeforeUnmount 清理通关定时器
  useEffect(() => {
    initStar()
    return () => {
      if (starClearTimerRef.current) clearTimeout(starClearTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // resize 时重绘：依赖 starConnected 重注册以保持闭包新鲜
  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starConnected])

  return (
    <div className="nf-game-body">
      <div className="nf-game-stats">
        <div className="nf-game-stat">
          <span className="nf-game-stat-label">LEVEL</span>
          <span className="nf-game-stat-value">{starLevel}</span>
        </div>
        <div className="nf-game-stat">
          <span className="nf-game-stat-label">LINKED</span>
          <span className="nf-game-stat-value">{starConnected}/{starTotal}</span>
        </div>
      </div>
      <div className="nf-game-canvas-wrap">
        <canvas ref={starCanvasRef} className="nf-game-canvas" onClick={handleStarClick} />
        {starClear && (
          <div className="nf-game-clear nf-fade-enter">
            <span className="nf-game-clear-text">连珠</span>
            <span className="nf-game-clear-hint">进入下一关</span>
          </div>
        )}
      </div>
      <div className="nf-game-hint">
        <span className="nf-game-hint-text">按序号依次点击星辰 · 连成星轨</span>
      </div>
    </div>
  )
}

export default GameStar
