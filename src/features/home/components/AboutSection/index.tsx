/**
 * 【business】AboutSection —— 关于我们区块（双栏 + 数字统计）
 * - 纯展示组件：文案 i18n 驱动，数字滚动由 AnimatedCounter 承担
 * - 滚动显现样式由页面层 IntersectionObserver 统一触发（scroll-reveal 协议类）
 * - stat-item / about-image-bg 为无样式的结构标记类，保持字面量
 */
import { useI18n } from '@/i18n'
import AnimatedCounter from '@/components/AnimatedCounter'
import PageContainer from '@/components/PageContainer'
import imgNist from '@/assets/images/nist-bg.jpg'
import styles from './AboutSection.module.css'

export function AboutSection() {
  const { t } = useI18n()

  return (
    <section id="about" className={styles.aboutSection}>
      {/* PageContainer：复用全局 .container，宽度与水平 padding 由 token 流体化 */}
      <PageContainer>
        <div className={styles.aboutContent}>
          <div className={`${styles.aboutText} scroll-reveal`}>
            <div className={styles.sectionTag}>{t('home.about.badge')}</div>
            <h2>{t('home.about.title1')}<br />{t('home.about.title2')}</h2>
            <p>{t('home.about.p1')}</p>
            <p>{t('home.about.p2')}</p>
            <div className={styles.aboutStats}>
              <div className="stat-item">
                <div className={styles.statNumber}><AnimatedCounter target={10} suffix="k+" /></div>
                <div className={styles.statLabel}>{t('home.about.statUsers')}</div>
              </div>
              <div className="stat-item">
                <div className={styles.statNumber}><AnimatedCounter target={50} suffix="+" /></div>
                <div className={styles.statLabel}>{t('home.about.statExperts')}</div>
              </div>
              <div className="stat-item">
                <div className={styles.statNumber}><AnimatedCounter target={98} suffix="%" /></div>
                <div className={styles.statLabel}>{t('home.about.statSatisfaction')}</div>
              </div>
            </div>
          </div>
          <div className={`${styles.aboutImageWrapper} scroll-reveal`}>
            <div className="about-image-bg"></div>
            <div className={styles.aboutImage}>
              <img src={imgNist} alt={t('home.about.alt')} className={styles.aboutImgFull} loading="lazy" />
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  )
}

export default AboutSection
