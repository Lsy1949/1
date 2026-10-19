/**
 * 【business】NotFoundHero —— 404 首屏杂志封面 + 小游戏选择器
 * activeGame 非空时整体淡出（stage-out），把舞台让给游戏
 */
import { useI18n } from '@/i18n'
import { games } from './games'
import './NotFoundHero.css'

export interface NotFoundHeroProps {
  /** 当前进入的游戏（用于舞台切换动画） */
  activeGame: string | null
  onEnter?: (id: string) => void
}

export function NotFoundHero({ activeGame, onEnter }: NotFoundHeroProps) {
  const { t } = useI18n()

  return (
    // 404 内容（可切换隐藏）
    <div className={`nf-hero-content${activeGame ? ' stage-out' : ''}`}>
      <div className="nf-hero-inner">
        <div className="nf-hero-number hero-anim">{t('notFound.hero.number')}</div>
        <div className="nf-hero-rule hero-anim" />
        <h1 className="nf-hero-title hero-anim">{t('notFound.hero.title')}</h1>
        <p className="nf-hero-quote hero-anim">{t('notFound.hero.quote')}</p>
      </div>
      {/* 小游戏选择器 */}
      <div className="nf-game-list hero-anim">
        {games.map((g, i) => (
          <button
            key={g.id}
            type="button"
            className="nf-game-entry"
            onClick={() => onEnter?.(g.id)}
          >
            <span className="nf-game-entry-no">{String(i + 1).padStart(2, '0')}</span>
            <span className="nf-game-entry-name">{g.name}</span>
            <span className="nf-game-entry-en">{g.en}</span>
            <span className="nf-game-entry-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default NotFoundHero
