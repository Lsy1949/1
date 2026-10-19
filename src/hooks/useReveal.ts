import { useEffect, useRef } from 'react'

interface RevealOptions {
  delay?: number
  direction?: string
}

/**
 * v-reveal 指令 → React Hook。
 *
 * 原 Vue 版（directives/reveal.ts）通过自定义指令在 mounted 钩子内把元素
 * 交给共享 IntersectionObserver；React 没有指令机制，等价写法是返回一个
 * ref 挂到元素上，副作用收敛在 useEffect 中（卸载时自动 unobserve，
 * 对应原指令的 unmounted 钩子）。
 */
let observer: IntersectionObserver | null = null

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            const delay = Number(el.dataset.revealDelay) || 0
            setTimeout(() => el.classList.add('is-revealed'), delay)
            observer?.unobserve(el)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
    )
  }
  return observer
}

export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: RevealOptions) {
  const ref = useRef<T | null>(null)
  const delay = options?.delay
  const direction = options?.direction

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.classList.add('reveal')
    if (delay) el.dataset.revealDelay = String(delay)
    if (direction) el.classList.add('reveal-' + direction)

    const obs = getObserver()
    obs.observe(el)

    // Fallback: 如果 IntersectionObserver 未在 1.2s 内触发，强制显示（与 Vue 版一致）
    const fallback = setTimeout(() => {
      if (!el.classList.contains('is-revealed')) el.classList.add('is-revealed')
    }, 1200)

    return () => {
      obs.unobserve(el)
      clearTimeout(fallback)
    }
  }, [delay, direction])

  return ref
}
