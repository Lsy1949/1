// 时光胶囊 · 详情主体（标题区 + 正文 + 收件信息 + 开启时间 + 操作按钮 + 图片预览）
// 纯展示组件：详情数据由页面下发，删除行为经 onDelete 上抛（页面负责 mutation）
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App as AntApp, Modal } from 'antd'
import { CloseOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import { useReveal } from '@/hooks/useReveal'
import { useI18n } from '@/i18n'
import CountdownRing from '@/components/CountdownRing'
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
  const { t } = useI18n()
  const { modal } = AntApp.useApp() // 替代 ElMessageBox

  const emotionEmoji = useMemo(() => {
    return EMOTION_EMOJI_MAP[capsule.emotion] || '🌟'
  }, [capsule.emotion])

  // v-reveal / v-reveal="{ delay: 100 }" → useReveal
  const titleAreaRef = useReveal<HTMLDivElement>()
  const contentRef = useReveal<HTMLDivElement>({ delay: 100 })
  const infoRef = useReveal<HTMLDivElement>()
  const dateRef = useReveal<HTMLDivElement>({ delay: 100 })

  // 图片预览
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')

  const previewImage = (index: number) => {
    if (capsule.images?.[index]) {
      setPreviewSrc(capsule.images[index])
      setPreviewVisible(true)
    }
  }

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
      {/* 胶囊详情 · 编辑式 */}
      <main className={styles.capsuleDetail}>
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

        {/* 内容区域 */}
        <div ref={contentRef} className={styles.detailContent}>
          {capsule.content && (
            <div className={`${styles.richContent} drop-cap`} dangerouslySetInnerHTML={{ __html: capsule.content }}></div>
          )}

          {capsule.images && capsule.images.length > 0 && (
            <div className={styles.detailImages}>
              {capsule.images.map((img, i) => (
                <div
                  key={i}
                  className={styles.detailImage}
                  style={{ backgroundImage: `url(${img})` }}
                  onClick={() => previewImage(i)}
                ></div>
              ))}
            </div>
          )}
        </div>

        {/* 收件信息 · 编辑式定义列表 */}
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
      </main>

      {/* 图片预览 */}
      <Modal
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        onOk={() => setPreviewVisible(false)}
        footer={null}
        closable
        width="auto"
        wrapClassName="image-preview-dialog"
        /* 原 .image-preview-dialog .ant-modal-content/header 结构覆写 token 化；
           关闭按钮颜色走 closeIcon 官方 prop */
        closeIcon={<CloseOutlined style={{ color: 'var(--text-muted)' }} />}
        styles={{
          container: { background: 'transparent', boxShadow: 'none', borderRadius: 16 },
          header: { display: 'none' },
        }}
      >
        {previewSrc && <img src={previewSrc} className={styles.previewImage} alt={t('capsule.detail.previewAlt')} />}
      </Modal>
    </>
  )
}

export default DetailBody
