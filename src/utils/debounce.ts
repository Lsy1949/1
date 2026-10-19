/**
 * 防抖函数（TS 版，替代旧 utils/debounce.js，行为等价）
 * @param func - 需要防抖的函数
 * @param wait - 延迟执行毫秒数
 * @param immediate - 是否立即执行（首个调用立即触发，等待期内不重复触发）
 */
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number,
  immediate = false,
): ((...args: Parameters<T>) => void) & { cancel(): void } {
  let timeout: ReturnType<typeof setTimeout> | null = null

  function debounced(this: unknown, ...args: Parameters<T>): void {
    if (timeout) clearTimeout(timeout)

    if (immediate) {
      // 如果已经执行过，不再执行
      const callNow = !timeout
      timeout = setTimeout(() => {
        timeout = null
      }, wait)
      if (callNow) func.apply(this, args)
    } else {
      timeout = setTimeout(() => {
        func.apply(this, args)
      }, wait)
    }
  }

  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout)
    timeout = null
  }

  return debounced
}
