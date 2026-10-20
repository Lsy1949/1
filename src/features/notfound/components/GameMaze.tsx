/**
 * 【business】GameMaze —— 迷途寻路 · 迷宫小游戏
 * - 迷宫运行时状态为非响应式（等价 Vue 的普通 let）：全部收敛进 ref，
 *   仅关卡/步数/通关态走 useState
 * - 方向键 / WASD 移动；暴露 handleKey 供舞台层分发（等价 defineExpose）
 * - Vue 源无 <style> 块，舞台共用样式见 NotFoundGameStage.css
 */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { readCssColor } from '@/utils/cssVar'

interface MazeCell {
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean }
  visited: boolean
}

interface CellPos {
  x: number
  y: number
}

export interface GameMazeHandle {
  handleKey: (e: KeyboardEvent) => void
}

export interface GameMazeProps {
  /* 无 props */
}

export const GameMaze = forwardRef<GameMazeHandle, GameMazeProps>(
  function GameMaze(_props, ref) {
    const gameCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const [gameLevel, setGameLevel] = useState(1)
    const [gameSteps, setGameSteps] = useState(0)
    const [gameBestSteps, setGameBestSteps] = useState(0)
    const [gameClear, setGameClear] = useState(false)

    // 迷宫运行时状态（非响应式，避免性能问题）—— 等价 Vue 的普通 let
    const mazeColsRef = useRef(7)
    const mazeRowsRef = useRef(7)
    const mazeCellsRef = useRef<MazeCell[][]>([])
    const playerCellRef = useRef<CellPos>({ x: 0, y: 0 })
    const playerRenderRef = useRef<CellPos>({ x: 0, y: 0 })
    const exitCellRef = useRef<CellPos>({ x: 0, y: 0 })
    const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null)
    const canvasSizeRef = useRef(480)
    const cellSizeRef = useRef(0)
    const mazeOffsetRef = useRef(0)
    const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const moveAnimRafRef = useRef<number | null>(null)
    // 关卡值镜像：nextLevel 在 setTimeout 闭包内也需要最新值
    const gameLevelRef = useRef(1)

    function initMazeCanvas() {
      const canvas = gameCanvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const canvasSize = Math.max(280, Math.min(rect.width || 480, rect.height || 480))
      canvasSizeRef.current = canvasSize
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvasSize * dpr
      canvas.height = canvasSize * dpr
      canvas.style.width = canvasSize + 'px'
      canvas.style.height = canvasSize + 'px'
      const ctx = canvas.getContext('2d')
      canvasCtxRef.current = ctx
      if (!ctx) return
      ctx.scale(dpr, dpr)
      const padding = 14
      cellSizeRef.current = (canvasSize - padding * 2) / Math.max(mazeColsRef.current, mazeRowsRef.current)
      mazeOffsetRef.current = (canvasSize - cellSizeRef.current * mazeColsRef.current) / 2
    }

    // 递归回溯 DFS 生成迷宫
    function generateMaze(cols: number, rows: number) {
      const cells: MazeCell[][] = []
      for (let y = 0; y < rows; y++) {
        const row: MazeCell[] = []
        for (let x = 0; x < cols; x++) {
          row.push({
            walls: { top: true, right: true, bottom: true, left: true },
            visited: false
          })
        }
        cells.push(row)
      }

      const stack: CellPos[] = []
      cells[0][0].visited = true
      stack.push({ x: 0, y: 0 })

      while (stack.length > 0) {
        const current = stack[stack.length - 1]
        const neighbors = getUnvisitedNeighbors(current.x, current.y, cols, rows, cells)
        if (neighbors.length === 0) {
          stack.pop()
        } else {
          const next = neighbors[Math.floor(Math.random() * neighbors.length)]
          removeWall(current, next, cells)
          cells[next.y][next.x].visited = true
          stack.push(next)
        }
      }
      mazeCellsRef.current = cells
    }

    function getUnvisitedNeighbors(x: number, y: number, cols: number, rows: number, cells: MazeCell[][]) {
      const result: CellPos[] = []
      if (y > 0 && !cells[y - 1][x].visited) result.push({ x, y: y - 1 })
      if (x < cols - 1 && !cells[y][x + 1].visited) result.push({ x: x + 1, y })
      if (y < rows - 1 && !cells[y + 1][x].visited) result.push({ x, y: y + 1 })
      if (x > 0 && !cells[y][x - 1].visited) result.push({ x: x - 1, y })
      return result
    }

    function removeWall(a: CellPos, b: CellPos, cells: MazeCell[][]) {
      if (a.x === b.x) {
        if (a.y < b.y) {
          cells[a.y][a.x].walls.bottom = false
          cells[b.y][b.x].walls.top = false
        } else {
          cells[a.y][a.x].walls.top = false
          cells[b.y][b.x].walls.bottom = false
        }
      } else {
        if (a.x < b.x) {
          cells[a.y][a.x].walls.right = false
          cells[b.y][b.x].walls.left = false
        } else {
          cells[a.y][a.x].walls.left = false
          cells[b.y][b.x].walls.right = false
        }
      }
    }

    function drawMaze() {
      const ctx = canvasCtxRef.current
      if (!ctx) return
      const canvasSize = canvasSizeRef.current
      const cellSize = cellSizeRef.current
      const mazeOffset = mazeOffsetRef.current
      const mazeCols = mazeColsRef.current
      const mazeRows = mazeRowsRef.current
      const mazeCells = mazeCellsRef.current
      const exitCell = exitCellRef.current
      const playerRender = playerRenderRef.current
      ctx.clearRect(0, 0, canvasSize, canvasSize)

      // 墙线（反色半透明细线，杂志风）
      ctx.strokeStyle = readCssColor('color-mix(in srgb, var(--text-inverse) 72%, transparent)')
      ctx.lineWidth = 1.2
      ctx.lineCap = 'round'

      for (let y = 0; y < mazeRows; y++) {
        for (let x = 0; x < mazeCols; x++) {
          const cell = mazeCells[y][x]
          const px = mazeOffset + x * cellSize
          const py = mazeOffset + y * cellSize
          if (cell.walls.top) {
            ctx.beginPath()
            ctx.moveTo(px, py)
            ctx.lineTo(px + cellSize, py)
            ctx.stroke()
          }
          if (cell.walls.right) {
            ctx.beginPath()
            ctx.moveTo(px + cellSize, py)
            ctx.lineTo(px + cellSize, py + cellSize)
            ctx.stroke()
          }
          if (cell.walls.bottom) {
            ctx.beginPath()
            ctx.moveTo(px, py + cellSize)
            ctx.lineTo(px + cellSize, py + cellSize)
            ctx.stroke()
          }
          if (cell.walls.left) {
            ctx.beginPath()
            ctx.moveTo(px, py)
            ctx.lineTo(px, py + cellSize)
            ctx.stroke()
          }
        }
      }

      // 出口 / 玩家：canvas 需实色，故经 readCssColor 解析主题变量
      const accent = readCssColor('var(--brand-primary-bright)')
      const neutral = readCssColor('var(--text-inverse)')
      const accentStop = (pct: number): string =>
        readCssColor(`color-mix(in srgb, var(--brand-primary-bright) ${pct}%, transparent)`)

      // 出口（品牌色发光圆点）
      const exitPx = mazeOffset + exitCell.x * cellSize + cellSize / 2
      const exitPy = mazeOffset + exitCell.y * cellSize + cellSize / 2
      const exitR = Math.max(4, cellSize * 0.26)
      const exitGlow = ctx.createRadialGradient(exitPx, exitPy, 0, exitPx, exitPy, exitR * 2.8)
      exitGlow.addColorStop(0, accentStop(95))
      exitGlow.addColorStop(0.5, accentStop(35))
      exitGlow.addColorStop(1, accentStop(0))
      ctx.fillStyle = exitGlow
      ctx.beginPath()
      ctx.arc(exitPx, exitPy, exitR * 2.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = accent
      ctx.beginPath()
      ctx.arc(exitPx, exitPy, exitR, 0, Math.PI * 2)
      ctx.fill()

      // 玩家（反色发光圆点）
      const playerPx = mazeOffset + playerRender.x * cellSize + cellSize / 2
      const playerPy = mazeOffset + playerRender.y * cellSize + cellSize / 2
      const playerR = Math.max(3, cellSize * 0.2)
      const playerGlow = ctx.createRadialGradient(playerPx, playerPy, 0, playerPx, playerPy, playerR * 2.8)
      playerGlow.addColorStop(0, neutral)
      playerGlow.addColorStop(0.5, readCssColor('color-mix(in srgb, var(--text-inverse) 30%, transparent)'))
      playerGlow.addColorStop(1, readCssColor('color-mix(in srgb, var(--text-inverse) 0%, transparent)'))
      ctx.fillStyle = playerGlow
      ctx.beginPath()
      ctx.arc(playerPx, playerPy, playerR * 2.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = neutral
      ctx.beginPath()
      ctx.arc(playerPx, playerPy, playerR, 0, Math.PI * 2)
      ctx.fill()
    }

    function initMaze() {
      setGameLevel(1)
      gameLevelRef.current = 1
      setGameSteps(0)
      setGameBestSteps(0)
      mazeColsRef.current = 7
      mazeRowsRef.current = 7
      initMazeCanvas()
      generateMaze(mazeColsRef.current, mazeRowsRef.current)
      playerCellRef.current = { x: 0, y: 0 }
      playerRenderRef.current = { x: 0, y: 0 }
      exitCellRef.current = { x: mazeColsRef.current - 1, y: mazeRowsRef.current - 1 }
      setGameClear(false)
      drawMaze()
    }

    // 方向键 / WASD 移动玩家
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        movePlayer(0, -1)
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault()
        movePlayer(0, 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        movePlayer(-1, 0)
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        movePlayer(1, 0)
      }
    }

    function movePlayer(dx: number, dy: number) {
      if (gameClear) return
      const mazeCells = mazeCellsRef.current
      const playerCell = playerCellRef.current
      const cell = mazeCells[playerCell.y][playerCell.x]
      if (dx === 1 && cell.walls.right) return
      if (dx === -1 && cell.walls.left) return
      if (dy === 1 && cell.walls.bottom) return
      if (dy === -1 && cell.walls.top) return

      const newX = playerCell.x + dx
      const newY = playerCell.y + dy
      if (newX < 0 || newX >= mazeColsRef.current || newY < 0 || newY >= mazeRowsRef.current) return

      playerCellRef.current = { x: newX, y: newY }
      setGameSteps((s) => s + 1)

      animatePlayerMove()

      const exitCell = exitCellRef.current
      if (playerCellRef.current.x === exitCell.x && playerCellRef.current.y === exitCell.y) {
        handleClear()
      }
    }

    function animatePlayerMove() {
      if (moveAnimRafRef.current !== null) cancelAnimationFrame(moveAnimRafRef.current)
      const startX = playerRenderRef.current.x
      const startY = playerRenderRef.current.y
      const targetX = playerCellRef.current.x
      const targetY = playerCellRef.current.y
      const duration = 130
      const startTime = performance.now()
      function step(now: number) {
        const t = Math.min(1, (now - startTime) / duration)
        const ease = 1 - Math.pow(1 - t, 3)
        playerRenderRef.current.x = startX + (targetX - startX) * ease
        playerRenderRef.current.y = startY + (targetY - startY) * ease
        drawMaze()
        if (t < 1) {
          moveAnimRafRef.current = requestAnimationFrame(step)
        } else {
          moveAnimRafRef.current = null
        }
      }
      moveAnimRafRef.current = requestAnimationFrame(step)
    }

    function handleClear() {
      setGameClear(true)
      setGameBestSteps((best) => (best === 0 || gameSteps < best ? gameSteps : best))
      clearTimerRef.current = setTimeout(() => {
        nextLevel()
      }, 1500)
    }

    function nextLevel() {
      setGameClear(false)
      const next = gameLevelRef.current + 1
      gameLevelRef.current = next
      setGameLevel(next)
      mazeColsRef.current = Math.min(30, 7 + (next - 1))
      mazeRowsRef.current = mazeColsRef.current
      initMazeCanvas()
      generateMaze(mazeColsRef.current, mazeRowsRef.current)
      playerCellRef.current = { x: 0, y: 0 }
      playerRenderRef.current = { x: 0, y: 0 }
      exitCellRef.current = { x: mazeColsRef.current - 1, y: mazeRowsRef.current - 1 }
      setGameSteps(0)
      drawMaze()
    }

    function handleResize() {
      initMazeCanvas()
      drawMaze()
    }

    // 暴露给舞台层（等价 defineExpose({ handleKey })）
    useImperativeHandle(ref, () => ({ handleKey }))

    // 等价 onMounted + onBeforeUnmount
    useEffect(() => {
      initMaze()
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
        if (moveAnimRafRef.current !== null) cancelAnimationFrame(moveAnimRafRef.current)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
      <div className="nf-game-body">
        <div className="nf-game-stats">
          <div className="nf-game-stat">
            <span className="nf-game-stat-label">LEVEL</span>
            <span className="nf-game-stat-value">{gameLevel}</span>
          </div>
          <div className="nf-game-stat">
            <span className="nf-game-stat-label">STEPS</span>
            <span className="nf-game-stat-value">{gameSteps}</span>
          </div>
          {gameBestSteps > 0 && (
            <div className="nf-game-stat">
              <span className="nf-game-stat-label">BEST</span>
              <span className="nf-game-stat-value">{gameBestSteps}</span>
            </div>
          )}
        </div>
        <div className="nf-game-canvas-wrap">
          <canvas ref={gameCanvasRef} className="nf-game-canvas" />
          {gameClear && (
            <div className="nf-game-clear nf-fade-enter">
              <span className="nf-game-clear-text">通关</span>
              <span className="nf-game-clear-hint">进入下一关</span>
            </div>
          )}
        </div>
        <div className="nf-game-hint">
          <span className="nf-game-key">↑</span>
          <span className="nf-game-key">↓</span>
          <span className="nf-game-key">←</span>
          <span className="nf-game-key">→</span>
          <span className="nf-game-hint-text">方向键移动 · 寻找蓝色出口</span>
        </div>
      </div>
    )
  },
)

export default GameMaze
