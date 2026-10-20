// 心情 → emoji 的 UI 映射（接口只下发 mood key，不下发 emoji）
import type { SquareMood } from './types'

export const moodMap: Record<SquareMood, string> = {
  happy: '😊',
  excited: '🤩',
  calm: '😌',
  sad: '😢',
  hopeful: '🌟',
}
