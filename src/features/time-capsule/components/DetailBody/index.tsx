// 时光胶囊 · 详情主体（标题区 + 正文 + 收件信息 + 开启时间 + 操作按钮 + 图片预览）
// 纯展示组件：详情数据由页面下发，删除行为经 onDelete 上抛（页面负责 mutation）
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { App as AntApp, Image, Space } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { useReveal } from '@/hooks/useReveal'
import { useTranslation } from 'react-i18next'
import CountdownRing from '@/components/CountdownRing'
import RichTextViewer from '@/components/RichTextViewer'
import type { CapsuleDetailItem } from '../types'
import styles from './DetailBody.module.css'

const EMOTION_EMOJI_MAP: Record<string, string> = {
  happy: '😊', excited: '🤩', calm: '😌', sad: '😢', hopeful: '🌟'
}

export interface DetailBodyProps {
  capsule: CapsuleDetailItem
  onDelete: () => void
}

export function DetailBody({ capsule, onDelete }: DetailBodyProps) {
  const router = useNavigate()
  const { t } = useTranslation()
  const { modal } = AntApp.useApp() // 替代 ElMessageBox

  const emotionEmoji = useMemo(() => {
    return EMOTION_EMOJI_MAP[capsule.emotion] || '🌟'
  }, [capsule.emotion])

  // v-reveal / v-reveal="{ delay: 100 }" → useReveal
  const titleAreaRef = useReveal<HTMLDivElement>()
  const contentRef = useReveal<HTMLDivElement>({ delay: 100 })
  const infoRef = useReveal<HTMLDivElement>()
  const dateRef = useReveal<HTMLDivElement>({ delay: 100 })

  // 图片预览由 antd Image 的 PreviewGroup 承载（左右切换 / 缩放 / 蒙层均由组件提供）

  const deleteCapsule = () => {
    modal.confirm({
      title: t('capsule.detail.deleteTitle'),
      content: t('capsule.detail.deleteConfirm'),
      okText: t('capsule.detail.deleteOk'),
      cancelText: t('capsule.detail.deleteCancelled'),
      icon: <ExclamationCircleFilled />,
      onOk: () => {
        // 数据变更、成功反馈与跳转由页面（useMutation）负责
        onDelete()
      },
    })
  }

  return (
    <>
      {/* 胶囊详情 · 桌面双栏：正文 + 吸底信息栏 */}
      <main className={styles.capsuleDetail}>
        <div className={styles.detailGrid}>
          <div className={styles.detailMain}>
            {/* 标题区 */}
            <div ref={titleAreaRef} className={styles.detailTitleArea}>
              <span className={styles.detailEmoji}>{emotionEmoji}</span>
              <h2 className={styles.detailTitle}>{capsule.title}</h2>
              <div className={styles.detailMeta}>
                <span className={styles.metaText}>{t('capsule.detail.created', { date: capsule.createDate })}</span>
                <span className={styles.metaSep}>·</span>
                {capsule.remainingDays > 0 ? (
                  <span className={`${styles.metaStatus} ${styles.pending}`}>
                    {t('capsule.detail.remaining', { days: capsule.remainingDays })}
                  </span>
                ) : (
                  <span className={`${styles.metaStatus} ${styles.opened}`}>{t('capsule.detail.opened')}</span>
                )}
              </div>
            </div>

            {/* 内容区域：正文与图片用 Space 统一纵向间距（正文仅一行时也不会与图片贴住） */}
            <div ref={contentRef} className={styles.detailContent}>
              <Space orientation="vertical" size={26} className={styles.detailContentStack}>
                {capsule.content && (
                  <RichTextViewer html={capsule.content} className={`${styles.richContent} drop-cap`} />
                )}

                {capsule.images && capsule.images.length > 0 && (
                  <Image.PreviewGroup preview={{ mask: { blur: true } }}>
                    <div className={styles.detailImages}>
                      {capsule.images.map((img, i) => (
                        <div key={i} className={styles.detailImage}>
                          <Image
                            src={img}
                            alt={t('capsule.detail.previewAlt')}
                            rootClassName={styles.detailImageRoot}
                            className={styles.detailImageImg}
                          />
                        </div>
                      ))}
                    </div>
                  </Image.PreviewGroup>
                )}
              </Space>
            </div>

            {/* 操作按钮 */}
            <div className={styles.detailActions}>
              <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => router('/time-capsule/create')}>
                <span>{t('capsule.detail.actions.rewrite')}</span>
                <span className={styles.btnArrow}>→</span>
              </button>
              <button className={`${styles.actionBtn} ${styles.ghost}`} onClick={deleteCapsule}>
                <span>{t('capsule.detail.actions.delete')}</span>
              </button>
            </div>
          </div>

          {/* 右侧：收件信息 + 开启时间（桌面吸顶，窄屏落回正文下方） */}
          <aside className={styles.detailAside}>
            <div ref={infoRef} className={styles.detailInfo}>
              <div className={styles.infoEyebrow}>— Recipient</div>
              <div className={styles.infoRows}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>{t('capsule.detail.info.method')}</span>
                  <span className={styles.infoValue}>{capsule.openMethod === 'email' ? t('capsule.detail.methodValue.email') : t('capsule.detail.methodValue.letter')}</span>
                </div>
                {capsule.emailRecipient && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>{t('capsule.detail.info.email')}</span>
                    <span className={styles.infoValue}>{capsule.emailRecipient}</span>
                  </div>
                )}
                {capsule.letterName && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>{t('capsule.detail.info.recipient')}</span>
                    <span className={styles.infoValue}>{capsule.letterName}</span>
                  </div>
                )}
                {capsule.letterPhone && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>{t('capsule.detail.info.phone')}</span>
                    <span className={styles.infoValue}>{capsule.letterPhone}</span>
                  </div>
                )}
                {capsule.letterAddress && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>{t('capsule.detail.info.address')}</span>
                    <span className={styles.infoValue}>{capsule.letterAddress}</span>
                  </div>
                )}
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>{t('capsule.detail.info.anonymous')}</span>
                  <span className={styles.infoValue}>{capsule.isAnonymous ? t('capsule.detail.anonymousValue.yes') : t('capsule.detail.anonymousValue.no')}</span>
                </div>
              </div>
            </div>

            {/* 开启时间 · 编辑式大字 + 倒计时环 */}
            <div ref={dateRef} className={styles.detailDate}>
              <div className={styles.infoEyebrow}>— Open Date</div>
              <div className={styles.dateFlex}>
                <div className={styles.dateTextCol}>
                  <div className={styles.dateDisplay}>{capsule.openDate}</div>
                  {capsule.remainingDays > 0 ? (
                    <div className={styles.dateCount}>{t('capsule.detail.countdown', { days: capsule.remainingDays })}</div>
                  ) : (
                    <div className={`${styles.dateCount} ${styles.openedText}`}>{t('capsule.detail.capsuleOpened')}</div>
                  )}
                </div>
                {capsule.remainingDays > 0 && (
                  <CountdownRing
                    days={capsule.remainingDays}
                    total={365}
                    size={120}
                    unit={t('capsule.detail.dayUnit')}
                  />
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  )
}

export default DetailBody
