/**
 * 动效偏好工具（docs/design-language.md §3.3）。
 *
 * JS 侧平滑滚动必须经此降级：用户开启「减少动态效果」时，
 * behavior:'smooth' → 'auto'（CSS 动画由 main.css 的全局兜底块处理）。
 */

/** 用户是否偏好减少动效（matchMedia 每次实时读取，跟随系统设置变化） */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** 滚动行为：正常 'smooth'，偏好减少动效时 'auto'（瞬时跳转） */
export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth'
}
