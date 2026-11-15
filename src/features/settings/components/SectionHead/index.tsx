// 设置页区块头：编号 + 标题 + 说明（与个人中心区块头同源节奏，供 5 个设置区块复用）
import styles from './SectionHead.module.css'

export interface SectionHeadProps {
  /** 区块编号，与左侧索引导航一一对应 */
  no: string
  title: string
  desc: string
}

export function SectionHead({ no, title, desc }: SectionHeadProps) {
  return (
    <header className={styles.sectionHead}>
      <span className={styles.no} aria-hidden="true">
        {no}
      </span>
      <div className={styles.text}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.desc}>{desc}</p>
      </div>
    </header>
  )
}

export default SectionHead
