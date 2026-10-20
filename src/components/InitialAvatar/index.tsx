/**
 * 【base】InitialAvatar —— 姓名首字头像
 * - 按姓名哈希从固定调色板取色（品牌色 + 7 个 antd 官方分类色，见 --cat-*）
 * - isAnonymous 时展示灰色问号头像
 */
import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import styles from './InitialAvatar.module.css'

interface InitialAvatarProps {
  /** 姓名 */
  name?: string
  /** 尺寸（px） */
  size?: number
  /** 是否匿名（灰色问号头像） */
  isAnonymous?: boolean
}

const colors = [
  'var(--brand-primary)',
  'var(--cat-blue)',
  'var(--cat-green)',
  'var(--cat-gold)',
  'var(--cat-purple)',
  'var(--cat-magenta)',
  'var(--cat-cyan)',
  'var(--cat-red)',
]

export function InitialAvatar({
  name = '',
  size = 44,
  isAnonymous = false,
}: InitialAvatarProps) {
  const initial = useMemo(() => {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }, [name])

  const bgColor = useMemo(() => {
    if (isAnonymous) return 'var(--cat-gray)'
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }, [name, isAnonymous])

  const avatarStyle: CSSProperties = useMemo(
    () => ({
      width: size + 'px',
      height: size + 'px',
      background: bgColor,
      fontSize: Math.max(12, size * 0.42) + 'px',
    }),
    [size, bgColor]
  )

  return (
    <div
      className={`${styles.initialAvatar}${isAnonymous ? ` ${styles.isAnonymous}` : ''}`}
      style={avatarStyle}
    >
      {isAnonymous ? <span className={styles.anonIcon}>?</span> : <span>{initial}</span>}
    </div>
  )
}

export default InitialAvatar
