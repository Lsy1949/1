/**
 * 404 页面 · 小游戏清单
 */
export interface GameMeta {
  id: string
  name: string
  en: string
}

export const games: GameMeta[] = [
  { id: 'maze', name: '迷途寻路', en: 'LABYRINTH' },
  { id: 'star', name: '星轨连珠', en: 'CONSTELLATION' },
  { id: 'breath', name: '心流共振', en: 'BREATHING' },
  { id: 'memory', name: '拾光记忆', en: 'MEMORY' }
]
