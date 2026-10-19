/**
 * 【business】Propaganda —— 登录页左侧品牌展示区（重构版：大气、随意错落排版）
 * Vue 版 script 为空，纯展示组件，无 props / 状态。
 */
import styles from './Propaganda.module.css'

export function Propaganda() {
  return (
    <div className={styles.presentationBox}>
      {/* 主标题区 */}
      <div className={styles.heroTitle}>
        <h1>生涯心旅</h1>
        <p className={styles.heroSubtitle}>
          专为大学生打造的
          <br />
          职业规划与心理减压平台
        </p>
      </div>

      {/* 分隔线 */}
      <div className={styles.divider} />

      {/* 引言（左对齐，斜体，随意感） */}
      <blockquote className={styles.heroQuote}>
        <span className={styles.quoteMark}>「</span>
        在这里，每一步成长都被看见，
        <br />
        每一份焦虑都被温柔以待。
        <span className={`${styles.quoteMark} ${styles.quoteMarkEnd}`}>」</span>
      </blockquote>

      {/* 特性列表（错落缩进 + 编号横线风格） */}
      <ul className={styles.featureList}>
        <li className={`${styles.featureItem} ${styles.featureStep1}`}>
          <span className={styles.featureIndex}>01</span>
          <span className={styles.featureLine} />
          <div className={styles.featureContent}>
            <h3>职业规划指导</h3>
            <p>专业职业规划师提供个性化指导</p>
          </div>
        </li>
        <li className={`${styles.featureItem} ${styles.featureStep2}`}>
          <span className={styles.featureIndex}>02</span>
          <span className={styles.featureLine} />
          <div className={styles.featureContent}>
            <h3>心理压力缓解</h3>
            <p>专业心理支持帮助缓解职业焦虑</p>
          </div>
        </li>
        <li className={`${styles.featureItem} ${styles.featureStep3}`}>
          <span className={styles.featureIndex}>03</span>
          <span className={styles.featureLine} />
          <div className={styles.featureContent}>
            <h3>成长路径规划</h3>
            <p>科学的技能提升路径助你成长</p>
          </div>
        </li>
      </ul>
    </div>
  )
}

export default Propaganda
