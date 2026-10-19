/**
 * 【business】NotFoundGameStage —— 游戏舞台：头部（返回/标题）+ 四个游戏分发
 * - forwardRef 暴露 handleKey：Escape 退出，其余按键分发给迷宫/呼吸游戏
 * - 根元素带 stage-game-enter 入场动画（等价 Vue transition name="stage-game"）
 */
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { games } from './games'
import { GameMaze } from './GameMaze'
import type { GameMazeHandle } from './GameMaze'
import { GameStar } from './GameStar'
import { GameBreath } from './GameBreath'
import type { GameBreathHandle } from './GameBreath'
import { GameMemory } from './GameMemory'
import './NotFoundGameStage.css'

export interface NotFoundGameStageHandle {
  handleKey: (e: KeyboardEvent) => void
}

export interface NotFoundGameStageProps {
  /** 当前游戏 id */
  game: string
  onExit?: () => void
}

export const NotFoundGameStage = forwardRef<NotFoundGameStageHandle, NotFoundGameStageProps>(
  function NotFoundGameStage({ game, onExit }, ref) {
    const mazeRef = useRef<GameMazeHandle | null>(null)
    const breathRef = useRef<GameBreathHandle | null>(null)

    const currentGameName = useMemo(() => {
      const g = games.find((x) => x.id === game)
      return g ? `${g.name} · ${g.en}` : ''
    }, [game])

    // 游戏模式键盘分发：Esc 退出，其余交给具体游戏
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onExit?.()
        return
      }
      if (game === 'maze') {
        mazeRef.current?.handleKey(e)
      } else if (game === 'breath') {
        breathRef.current?.handleKey(e)
      }
    }

    // 等价 defineExpose({ handleKey })
    useImperativeHandle(ref, () => ({ handleKey }))

    return (
      <div className="nf-game-stage stage-game-enter">
        <div className="nf-game-header">
          <button type="button" className="nf-game-back" onClick={() => onExit?.()}>
            <span className="nf-game-back-arrow">←</span>
            <span>返回</span>
          </button>
          <span className="nf-game-title">{currentGameName}</span>
        </div>

        {/* 迷途寻路 · 迷宫 */}
        {game === 'maze' && <GameMaze ref={mazeRef} />}

        {/* 星轨连珠 · 连星座 */}
        {game === 'star' && <GameStar />}

        {/* 心流共振 · 呼吸 */}
        {game === 'breath' && <GameBreath ref={breathRef} />}

        {/* 拾光记忆 · 翻牌 */}
        {game === 'memory' && <GameMemory />}
      </div>
    )
  },
)

export default NotFoundGameStage
