import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 倒计时 hook（验证码重发 / 成功页自动跳转共用）。
 * countdown 归零自动停表；组件卸载清理定时器。
 */
export function useCountdown() {
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(
    (seconds: number) => {
      clear()
      setCountdown(seconds)
      timerRef.current = setInterval(() => {
        setCountdown((n) => {
          if (n <= 1) {
            clear()
            return 0
          }
          return n - 1
        })
      }, 1000)
    },
    [clear],
  )

  useEffect(() => clear, [clear])

  return { countdown, start }
}
