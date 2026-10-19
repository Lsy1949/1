/**
 * 【business】GameMemory —— 拾光记忆 · 翻牌配对小游戏
 * - 翻牌 / 配对 / 回翻全部走不可变更新（map 生成新数组）
 * - memoryFlippedIdx / memoryLock 为非渲染态 → ref；两个定时器完整清理
 * - 通关 2200ms 后自动重开一局
 */
import { useEffect, useRef, useState } from 'react'
import './GameMemory.css'

interface MemoryCard {
  symbol: string
  flipped: boolean
  matched: boolean
}

const MEMORY_SYMBOLS = ['◯', '△', '□', '◇', '✦', '⬡']

export interface GameMemoryProps {
  /* 无 props */
}

export function GameMemory(_props: GameMemoryProps) {
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([])
  const [memoryMoves, setMemoryMoves] = useState(0)
  const [memoryMatches, setMemoryMatches] = useState(0)
  const [memoryClear, setMemoryClear] = useState(false)

  const memoryFlippedIdxRef = useRef(-1)
  const memoryLockRef = useRef(false)
  const memoryFlipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const memoryAutoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function initMemory() {
    setMemoryMoves(0)
    setMemoryMatches(0)
    setMemoryClear(false)
    memoryFlippedIdxRef.current = -1
    memoryLockRef.current = false
    const pairs = [...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS]
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
    }
    setMemoryCards(pairs.map((symbol) => ({
      symbol,
      flipped: false,
      matched: false
    })))
  }

  function flipCard(idx: number) {
    if (memoryLockRef.current) return
    const card = memoryCards[idx]
    if (card.flipped || card.matched) return

    let nextCards = memoryCards.map((c, i) => (i === idx ? { ...c, flipped: true } : c))

    if (memoryFlippedIdxRef.current === -1) {
      memoryFlippedIdxRef.current = idx
      setMemoryCards(nextCards)
      return
    }

    setMemoryMoves((m) => m + 1)
    const firstIdx = memoryFlippedIdxRef.current
    const firstCard = nextCards[firstIdx]
    const secondCard = nextCards[idx]

    if (firstCard.symbol === secondCard.symbol) {
      nextCards = nextCards.map((c, i) => (i === firstIdx || i === idx ? { ...c, matched: true } : c))
      memoryFlippedIdxRef.current = -1
      const matches = memoryMatches + 1
      setMemoryMatches(matches)
      setMemoryCards(nextCards)
      if (matches >= MEMORY_SYMBOLS.length) {
        setMemoryClear(true)
        memoryAutoTimerRef.current = setTimeout(() => {
          initMemory()
        }, 2200)
      }
    } else {
      memoryLockRef.current = true
      setMemoryCards(nextCards)
      memoryFlipTimerRef.current = setTimeout(() => {
        setMemoryCards((cards) =>
          cards.map((c, i) => (i === firstIdx || i === idx ? { ...c, flipped: false } : c))
        )
        memoryFlippedIdxRef.current = -1
        memoryLockRef.current = false
      }, 800)
    }
  }

  // 等价 onMounted(initMemory) + onBeforeUnmount(清两个定时器)
  useEffect(() => {
    initMemory()
    return () => {
      if (memoryFlipTimerRef.current) clearTimeout(memoryFlipTimerRef.current)
      if (memoryAutoTimerRef.current) clearTimeout(memoryAutoTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="nf-game-body nf-memory-body">
      <div className="nf-game-stats">
        <div className="nf-game-stat">
          <span className="nf-game-stat-label">MOVES</span>
          <span className="nf-game-stat-value">{memoryMoves}</span>
        </div>
        <div className="nf-game-stat">
          <span className="nf-game-stat-label">PAIRS</span>
          <span className="nf-game-stat-value">{memoryMatches}/6</span>
        </div>
      </div>
      <div className="nf-memory-grid">
        {memoryCards.map((card, i) => (
          <button
            key={i}
            className={`nf-memory-card${card.flipped ? ' flipped' : ''}${card.matched ? ' matched' : ''}`}
            onClick={() => flipCard(i)}
            type="button"
          >
            <span className="nf-memory-card-inner">
              <span className="nf-memory-back">?</span>
              <span className="nf-memory-face">{card.symbol}</span>
            </span>
          </button>
        ))}
      </div>
      {memoryClear && (
        <div className="nf-game-clear nf-memory-clear nf-fade-enter">
          <span className="nf-game-clear-text">圆满</span>
          <span className="nf-game-clear-hint">再玩一局</span>
        </div>
      )}
      <div className="nf-game-hint">
        <span className="nf-game-hint-text">翻开两张相同的符号 · 配对拾光</span>
      </div>
    </div>
  )
}

export default GameMemory
