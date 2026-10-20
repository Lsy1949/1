import { useEffect, useState } from 'react'

/**
 * 防抖值：value 停止变化 delay 毫秒后才返回新值。
 * 用于搜索框 → 接口查询，避免每敲一个字发一次请求。
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
