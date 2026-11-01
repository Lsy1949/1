/**
 * 【shared】PasswordStrength —— 密码强度条（注册 / 重置密码共用）
 * - 纯展示组件：强度评级由父级密码值实时计算，空值不渲染
 * - 级别配色全部走语义 token（CSS Modules），tsx 零色值
 */
import { useI18n } from '@/i18n'
import styles from './PasswordStrength.module.css'

/** 强度评级（1-4）：与表单校验规则同源的启发式评分 */
export function scorePassword(pw: string): number {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score += 1
  if (/[a-zA-Z]/.test(pw) && /\d/.test(pw)) score += 1
  if (/[^a-zA-Z0-9]/.test(pw) || (/[a-z]/.test(pw) && /[A-Z]/.test(pw))) score += 1
  if (pw.length >= 12) score += 1
  return Math.min(4, Math.max(1, score))
}

const LEVEL_KEYS = ['', 'weak', 'medium', 'strong', 'excellent'] as const

interface PasswordStrengthProps {
  value?: string
}

export function PasswordStrength({ value = '' }: PasswordStrengthProps) {
  const { t } = useI18n()
  const level = scorePassword(value)
  if (level === 0) return null

  return (
    <div className={styles.strength} aria-live="polite">
      <div className={`${styles.bar} ${styles[`level${level}`]}`}>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={i <= level ? styles.segFilled : styles.seg} />
        ))}
      </div>
      <span className={`${styles.label} ${styles[`labelLevel${level}`]}`}>
        {t(`login.strength.${LEVEL_KEYS[level]}`)}
      </span>
    </div>
  )
}

export default PasswordStrength
