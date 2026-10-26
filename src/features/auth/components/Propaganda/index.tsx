/**
 * 【business】Propaganda —— 登录页左侧品牌展示区（重构版：大气、随意错落排版）
 * 文案由租户配置下发（GET /api/tenant/config → propaganda）：
 * 主标题用 brand.name，副标题 / 引言 / 特性清单按租户直出；
 * 后端不可用或字段缺失时由 getDefaultConfig 的内置文案兜底，视觉不变。
 */
import { Fragment } from 'react'
import { useTenantStore } from '@/stores/useTenantStore'
import styles from './Propaganda.module.css'

/** '在这里...\n每一份...' → 两行 + <br />（行数由后端文案决定） */
function Multiline({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  )
}

export function Propaganda() {
  const brandName = useTenantStore((s) => s.config.brand.name)
  const propaganda = useTenantStore((s) => s.config.propaganda)

  return (
    <div className={styles.presentationBox}>
      {/* 主标题区 */}
      <div className={styles.heroTitle}>
        <h1>{brandName}</h1>
        <p className={styles.heroSubtitle}>
          <Multiline text={propaganda.subtitle} />
        </p>
      </div>

      {/* 分隔线 */}
      <div className={styles.divider} />

      {/* 引言（左对齐，斜体，随意感） */}
      <blockquote className={styles.heroQuote}>
        <span className={styles.quoteMark}>「</span>
        <Multiline text={propaganda.quote} />
        <span className={`${styles.quoteMark} ${styles.quoteMarkEnd}`}>」</span>
      </blockquote>

      {/* 特性列表（错落缩进 + 编号横线风格；空数组 = 租户明确不下发 → 整块隐藏） */}
      {propaganda.features.length > 0 && (
        <ul className={styles.featureList}>
          {propaganda.features.map((feature, i) => (
            <li key={feature.title} className={`${styles.featureItem} ${styles[`featureStep${i + 1}`] ?? ''}`}>
              <span className={styles.featureIndex}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.featureLine} />
              <div className={styles.featureContent}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Propaganda
