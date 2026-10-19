/**
 * 【business】Marquee —— 跑马灯滚动信息条（纯展示，i18n 驱动）
 * 内容重复两遍以配合 -50% 位移实现无缝循环；
 * @keyframes marquee-scroll 随组件 module css 携带（模块自动局部化）。
 */
import { Fragment } from 'react'
import { useI18n } from '@/i18n'
import styles from './Marquee.module.css'

const MARQUEE_KEYS = ['users', 'experts', 'satisfaction', 'aiPsych', 'support', 'slogan'] as const

export function Marquee() {
  const { t } = useI18n()

  return (
    <div className={styles.marqueeBand} aria-hidden="true">
      <div className={styles.marqueeTrack}>
        {MARQUEE_KEYS.concat(MARQUEE_KEYS).map((key, index) => (
          <Fragment key={index}>
            <span className={styles.marqueeItem}>{t(`home.marquee.${key}`)}</span>
            <span className={styles.marqueeDot}>●</span>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

export default Marquee
