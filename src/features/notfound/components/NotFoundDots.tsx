/**
 * 【business】NotFoundDots —— 404 翻页指示器（右侧固定圆点）
 */
export interface NotFoundDotsProps {
  count: number
  current: number
  dark: boolean
  onNavigate?: (index: number) => void
}

export function NotFoundDots({ count, current, dark, onNavigate }: NotFoundDotsProps) {
  return (
    <div className={`nf-dots${dark ? ' is-dark-slide' : ''}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          className={`nf-dot${current === i ? ' active' : ''}`}
          aria-label={`Slide ${i + 1}`}
          onClick={() => onNavigate?.(i)}
        />
      ))}
    </div>
  )
}

export default NotFoundDots
