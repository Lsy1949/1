/**
 * 【business】NoticePanel —— 咨询须知面板 · 流程横幅 + 编辑式 bento 网格
 * - tm() 数组文案（items / prep.*Items / cancellation.items）→ RAW_MESSAGES + tmStringArray
 *   （React i18n 契约未暴露 tm()，按 locale 直查语言包原始数组）
 * - 图标映射：School→BankOutlined、RefreshLeft→UndoOutlined、CircleCheckFilled→CheckCircleFilled、
 *   InfoFilled→InfoCircleFilled、Warning→WarningOutlined、Reading→ReadOutlined
 */
import { useMemo } from 'react'
import {
  ArrowRightOutlined,
  BankOutlined,
  CheckCircleFilled,
  InfoCircleFilled,
  LockOutlined,
  ReadOutlined,
  UndoOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useI18n } from '@/i18n'
import type { AppLocale } from '@/i18n'
import zhCN from '@/i18n/zh-CN'
import zhTW from '@/i18n/zh-TW'
import enUS from '@/i18n/en-US'
import { useReveal } from '@/hooks/useReveal'
import styles from './NoticePanel.module.css'

// 语言包原始对象直查：数组文案按 locale 取原始值（等价 vue-i18n tm()）
const RAW_MESSAGES: Record<AppLocale, Record<string, unknown>> = {
  'zh-CN': zhCN as unknown as Record<string, unknown>,
  'zh-TW': zhTW as unknown as Record<string, unknown>,
  'en-US': enUS as unknown as Record<string, unknown>,
}

function tmStringArray(locale: AppLocale, path: string): string[] {
  const value = path.split('.').reduce<unknown>(
    (acc, key) => (acc as Record<string, unknown> | undefined)?.[key],
    RAW_MESSAGES[locale]
  )
  return Array.isArray(value) ? (value as string[]) : []
}

export function NoticePanel() {
  const { t, locale } = useI18n()

  const layoutRef = useReveal<HTMLDivElement>({ delay: 100 })

  const counselingProcess = useMemo(
    () => [
      { title: t('counseling.process.step1.title'), desc: t('counseling.process.step1.desc') },
      { title: t('counseling.process.step2.title'), desc: t('counseling.process.step2.desc') },
      { title: t('counseling.process.step3.title'), desc: t('counseling.process.step3.desc') },
      { title: t('counseling.process.step4.title'), desc: t('counseling.process.step4.desc') },
    ],
    [t]
  )

  const confidentialityItems = useMemo(
    () => tmStringArray(locale, 'counseling.confidentiality.items'),
    [locale]
  )

  const prepBeforeItems = useMemo(() => tmStringArray(locale, 'counseling.prep.beforeItems'), [locale])
  const prepDuringItems = useMemo(() => tmStringArray(locale, 'counseling.prep.duringItems'), [locale])
  const prepAfterItems = useMemo(() => tmStringArray(locale, 'counseling.prep.afterItems'), [locale])

  const cancellationItems = useMemo(
    () => tmStringArray(locale, 'counseling.cancellation.items'),
    [locale]
  )

  const serviceInfo = useMemo(
    () => [
      { label: t('counseling.service.info.target'), value: t('counseling.service.info.targetValue') },
      { label: t('counseling.service.info.nature'), value: t('counseling.service.info.natureValue') },
      { label: t('counseling.service.info.duration'), value: t('counseling.service.info.durationValue') },
      { label: t('counseling.service.info.frequency'), value: t('counseling.service.info.frequencyValue') },
      { label: t('counseling.service.info.format'), value: t('counseling.service.info.formatValue') },
      { label: t('counseling.service.info.cycle'), value: t('counseling.service.info.cycleValue') },
    ],
    [t]
  )

  return (
    <div ref={layoutRef} className={styles.noticeLayout}>
      {/* 流程图 · 全宽编辑式横幅 */}
      <section className={styles.noticeHero}>
        <div className={styles.heroEyebrow}>
          <span className={styles.heroNo}>No.00</span>
          <span className={styles.heroLine} />
          <span className={styles.heroLabel}>{t('counseling.process.heroLabel')}</span>
        </div>
        <div className={styles.processFlow}>
          {counselingProcess.map((p, i) => (
            <div key={i} className={styles.processStep}>
              <div className={styles.psNum}>{String(i + 1).padStart(2, '0')}</div>
              <div className={styles.psContent}>
                <div className={styles.psTitle}>{p.title}</div>
                <div className={styles.psDesc}>{p.desc}</div>
              </div>
              {i < counselingProcess.length - 1 && <ArrowRightOutlined className={styles.psArrow} />}
            </div>
          ))}
        </div>
      </section>

      {/* 编辑式 bento 网格 · 非对称节奏 */}
      <div className={styles.noticeGrid}>
        {/* 01 保密原则 */}
        <section className={`${styles.noticeSection} ${styles.ns01}`}>
          <div className={styles.nsStamp}>01</div>
          <h3 className={styles.sectionTitle}>
            <LockOutlined /> {t('counseling.section.confidentiality')}
          </h3>
          <ul className={styles.noticeList}>
            {confidentialityItems.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
          <div className={styles.noticeWarn}>
            <WarningOutlined />
            <span>{t('counseling.confidentiality.warning')}</span>
          </div>
        </section>

        {/* 02 咨询准备 · 横向三栏 */}
        <section className={`${styles.noticeSection} ${styles.ns02}`}>
          <div className={styles.nsStamp}>02</div>
          <h3 className={styles.sectionTitle}>
            <ReadOutlined /> {t('counseling.section.preparation')}
          </h3>
          <div className={styles.prepRow}>
            <div className={styles.prepBlock}>
              <h4>{t('counseling.prep.before')}</h4>
              <ul className={styles.noticeList}>
                {prepBeforeItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className={styles.prepBlock}>
              <h4>{t('counseling.prep.during')}</h4>
              <ul className={styles.noticeList}>
                {prepDuringItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className={styles.prepBlock}>
              <h4>{t('counseling.prep.after')}</h4>
              <ul className={styles.noticeList}>
                {prepAfterItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 03 服务说明 · 横向表格 */}
        <section className={`${styles.noticeSection} ${styles.ns03}`}>
          <div className={styles.nsStamp}>03</div>
          <h3 className={styles.sectionTitle}>
            <BankOutlined /> {t('counseling.section.service')}
          </h3>
          <div className={styles.serviceInfoBanner}>
            <CheckCircleFilled />
            <div>
              <div className={styles.sibTitle}>{t('counseling.service.freeTitle')}</div>
              <div className={styles.sibDesc}>{t('counseling.service.freeDesc')}</div>
            </div>
          </div>
          <div className={styles.serviceTable}>
            {serviceInfo.map((s, i) => (
              <div key={i} className={styles.serviceRow}>
                <div className={styles.srLabel}>{s.label}</div>
                <div className={styles.srValue}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className={`${styles.noticeWarn} ${styles.info}`}>
            <InfoCircleFilled />
            <span>{t('counseling.service.firstWarning')}</span>
          </div>
        </section>

        {/* 04 取消与改约 */}
        <section className={`${styles.noticeSection} ${styles.ns04}`}>
          <div className={styles.nsStamp}>04</div>
          <h3 className={styles.sectionTitle}>
            <UndoOutlined /> {t('counseling.section.cancellation')}
          </h3>
          <ul className={styles.noticeList}>
            {cancellationItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export default NoticePanel
