/**
 * 【business】GameBreath —— 心流共振 · 呼吸小游戏
 * - 相位循环用 raf 驱动（非渲染态：raf id / 相位起点 / 相位索引用 ref）
 * - 暴露 handleKey 供舞台层分发空格键（等价 defineExpose）
 */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import './GameBreath.css'

const BREATH = [
  { phase: 'inhale', duration: 4000, label: '吸 气' },
  { phase: 'hold', duration: 4000, label: '屏 息' },
  { phase: 'exhale', duration: 6000, label: '呼 气' }
]
const SYNC_WINDOW = 800 // 相位切换前后 400ms 内敲击算同步

export interface GameBreathHandle {
  handleKey: (e: KeyboardEvent) => void
}

export interface GameBreathProps {
  /* 无 props */
}

export const GameBreath = forwardRef<GameBreathHandle, GameBreathProps>(
  function GameBreath(_props, ref) {
    const [breathPhase, setBreathPhase] = useState('inhale')
    const [breathCycle, setBreathCycle] = useState(0)
    const [breathStreak, setBreathStreak] = useState(0)
    const [breathBestStreak, setBreathBestStreak] = useState(0)
    const [breathJustSynced, setBreathJustSynced] = useState(false)

    const breathRaf = useRef<number | null>(null)
    const breathPhaseStart = useRef(0)
    const breathPhaseIdx = useRef(0)
    const breathSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const breathPhaseLabel = BREATH.find((b) => b.phase === breathPhase)?.label ?? ''

    function startBreathLoop() {
      if (breathRaf.current !== null) cancelAnimationFrame(breathRaf.current)
      const step = (now: number) => {
        const elapsed = now - breathPhaseStart.current
        const current = BREATH[breathPhaseIdx.current]
        if (elapsed >= current.duration) {
          breathPhaseIdx.current = (breathPhaseIdx.current + 1) % BREATH.length
          setBreathPhase(BREATH[breathPhaseIdx.current].phase)
          breathPhaseStart.current = now
          if (breathPhaseIdx.current === 0) setBreathCycle((c) => c + 1)
        }
        breathRaf.current = requestAnimationFrame(step)
      }
      breathRaf.current = requestAnimationFrame(step)
    }

    function initBreath() {
      setBreathPhase('inhale')
      setBreathCycle(0)
      setBreathStreak(0)
      setBreathJustSynced(false)
      breathPhaseIdx.current = 0
      breathPhaseStart.current = performance.now()
      startBreathLoop()
    }

    function handleBreathTap() {
      if (breathRaf.current === null) return
      const now = performance.now()
      const elapsed = now - breathPhaseStart.current
      const current = BREATH[breathPhaseIdx.current]
      const remaining = current.duration - elapsed
      // 在相位切换前 400ms 或后 400ms 内敲击算同步
      const isNearStart = elapsed < SYNC_WINDOW / 2
      const isNearEnd = remaining < SYNC_WINDOW / 2
      if (isNearStart || isNearEnd) {
        const next = breathStreak + 1
        setBreathStreak(next)
        if (next > breathBestStreak) setBreathBestStreak(next)
        setBreathJustSynced(true)
        if (breathSyncTimer.current) clearTimeout(breathSyncTimer.current)
        breathSyncTimer.current = setTimeout(() => {
          setBreathJustSynced(false)
        }, 600)
      } else {
        setBreathStreak(0)
      }
    }

    function stopBreathing() {
      if (breathRaf.current !== null) {
        cancelAnimationFrame(breathRaf.current)
        breathRaf.current = null
      }
      if (breathSyncTimer.current) {
        clearTimeout(breathSyncTimer.current)
        breathSyncTimer.current = null
      }
      setBreathJustSynced(false)
    }

    // 空格键同步
    function handleKey(e: KeyboardEvent) {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        handleBreathTap()
      }
    }

    // 暴露给舞台层（等价 defineExpose({ handleKey })）
    useImperativeHandle(ref, () => ({ handleKey }))

    // 等价 onMounted(initBreath) + onBeforeUnmount(stopBreathing)
    useEffect(() => {
      initBreath()
      return stopBreathing
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
      <div className="nf-game-body">
        <div className="nf-game-stats">
          <div className="nf-game-stat">
            <span className="nf-game-stat-label">CYCLES</span>
            <span className="nf-game-stat-value">{breathCycle}</span>
          </div>
          <div className="nf-game-stat">
            <span className="nf-game-stat-label">STREAK</span>
            <span className="nf-game-stat-value">{breathStreak}</span>
          </div>
          {breathBestStreak > 0 && (
            <div className="nf-game-stat">
              <span className="nf-game-stat-label">BEST</span>
              <span className="nf-game-stat-value">{breathBestStreak}</span>
            </div>
          )}
        </div>
        <div className="nf-breath-wrap" onClick={handleBreathTap}>
          <div className={`nf-breath-circle breath-${breathPhase}`}>
            <span className="nf-breath-phase">{breathPhaseLabel}</span>
            <span className={`nf-breath-sync${breathJustSynced ? ' show' : ''}`}>SYNC</span>
          </div>
        </div>
        <div className="nf-game-hint">
          <span className="nf-game-key">SPACE</span>
          <span className="nf-game-hint-text">于相位切换瞬间敲击 · 同步心流</span>
        </div>
      </div>
    )
  },
)

export default GameBreath
