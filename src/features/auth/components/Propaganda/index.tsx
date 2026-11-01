/**
 * 【business】Propaganda —— 登录页左侧品牌展示区（重构版：大气、随意错落排版）
 * - 文案由租户配置下发（GET /api/tenant/config → propaganda）：
 *   主标题用 brand.name，副标题 / 引言 / 特性清单按租户直出；
 *   后端不可用或字段缺失时由 getDefaultConfig 的内置文案兜底，视觉不变。
 * - 动画走 Ant Motion（CSSMotion）：入场时间线统一在 ../../motion 规整
 *   （整体左滑 → 标题/分隔线/引言错落淡入 → 特性条目逐条 +100ms），
 *   模块 CSS 无 keyframes。
 */
import { Fragment } from 'react'
import CSSMotion from '@rc-component/motion'
import { useTenantStore } from '@/stores/useTenantStore'
import { loginMotions, propagandaFeatureMotion } from '../../motion'
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
    <CSSMotion visible motionAppear {...loginMotions.propaganda}>
      {({ style: boxStyle }) => (
        <div className={styles.presentationBox} style={boxStyle}>
          {/* 主标题区 */}
          <CSSMotion visible motionAppear {...loginMotions.propagandaHero}>
            {({ style: heroStyle }) => (
              <div className={styles.heroTitle} style={heroStyle}>
                <h1>{brandName}</h1>
                <p className={styles.heroSubtitle}>
                  <Multiline text={propaganda.subtitle} />
                </p>
              </div>
            )}
          </CSSMotion>

          {/* 分隔线 */}
          <CSSMotion visible motionAppear {...loginMotions.propagandaDivider}>
            {({ style }) => <div className={styles.divider} style={style} />}
          </CSSMotion>

          {/* 引言（左对齐，斜体，随意感） */}
          <CSSMotion visible motionAppear {...loginMotions.propagandaQuote}>
            {({ style: quoteStyle }) => (
              <blockquote className={styles.heroQuote} style={quoteStyle}>
                <span className={styles.quoteMark}>「</span>
                <Multiline text={propaganda.quote} />
                <span className={`${styles.quoteMark} ${styles.quoteMarkEnd}`}>」</span>
              </blockquote>
            )}
          </CSSMotion>

          {/* 特性列表（错落缩进 + 编号横线风格 + 逐条入场；空数组 = 租户明确不下发 → 整块隐藏） */}
          {propaganda.features.length > 0 && (
            <ul className={styles.featureList}>
              {propaganda.features.map((feature, i) => (
                <CSSMotion key={feature.title} visible motionAppear {...propagandaFeatureMotion(i)}>
                  {({ style }) => (
                    <li
                      className={`${styles.featureItem} ${styles[`featureStep${i + 1}`] ?? ''}`}
                      style={style}
                    >
                      <span className={styles.featureIndex}>{String(i + 1).padStart(2, '0')}</span>
                      <span className={styles.featureLine} />
                      <div className={styles.featureContent}>
                        <h3>{feature.title}</h3>
                        <p>{feature.description}</p>
                      </div>
                    </li>
                  )}
                </CSSMotion>
              ))}
            </ul>
          )}
        </div>
      )}
    </CSSMotion>
  )
}

export default Propaganda
