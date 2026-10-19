/**
 * 【base】ReadProgress —— 页面顶部阅读进度条
 * - 监听 window scroll/resize 自算进度（passive scroll）
 * - 进度条视觉样式在全局 main.css（.read-progress），组件自身零样式——
 *   .read-progress 是刻意的全局样式钩子（main.css / dark-mode.css 主题层引用），不做 module 化
 */
import { useEffect, useState } from 'react'

export function ReadProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return <div className="read-progress" style={{ width: progress + '%' }}></div>
}

export default ReadProgress
