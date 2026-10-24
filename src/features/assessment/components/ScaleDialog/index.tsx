import { useMemo } from 'react'
import { Button, Modal, Progress } from 'antd'
import {
  ArrowRightOutlined,
  BookOutlined,
  CloseOutlined,
  CompassOutlined,
  FieldTimeOutlined,
  InfoCircleFilled,
  SendOutlined,
  StarFilled,
} from '@ant-design/icons'
import { useI18n } from '@/i18n'
import type { AssessmentRecord, ScaleDetail, ScaleInfo } from '../types'
import styles from './ScaleDialog.module.css'

interface Props {
  /** v-model:visible → 受控 open（AntD 5 的 Modal 用 open 而非 visible） */
  open: boolean
  mode: 'intro' | 'result'
  /** 目录项（页面注入） */
  scaleInfo?: ScaleInfo
  /** 量表详情（介绍弹窗展示描述；缺失时仅显示目录信息） */
  scaleDetail?: ScaleDetail
  result: AssessmentRecord | null
  /** 原 update:visible → 单向 onClose 回调 */
  onClose: () => void
  onStart: () => void
  onDownload: () => void
  onShare: () => void
}

/** 测评弹窗：intro 介绍模式 / result 结果报告模式 */
export default function ScaleDialog({
  open,
  mode,
  scaleInfo,
  scaleDetail,
  result,
  onClose,
  onStart,
  onDownload,
  onShare,
}: Props) {
  const { t } = useI18n()

  // 介绍模式数据（详情优先，缺失时回退目录项）
  const currentScale = useMemo(() => scaleDetail ?? null, [scaleDetail])
  const currentScaleInfo = useMemo(() => scaleInfo ?? null, [scaleInfo])

  // 分数单位：MBTI 显示「类型」，其余显示「分」
  const scoreUnit = useMemo(
    () => (result?.scaleKey === 'mbti' ? '类型' : t('assessment.unit.score')),
    [result, t]
  )

  // MBTI 四维度条
  const mbtiScores = useMemo(() => {
    if (!result || result.scaleKey !== 'mbti') return []
    const d = result.details
    const pairs = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']]
    const names: Record<string, string> = { E: '外向', I: '内向', S: '实感', N: '直觉', T: '思考', F: '情感', J: '判断', P: '感知' }
    return pairs.map((p) => {
      const leftVal = d[p[0]]
      const rightVal = d[p[1]]
      const total = leftVal + rightVal || 1
      const isLeft = leftVal >= rightVal
      return {
        left: names[p[0]],
        right: names[p[1]],
        percent: (Math.max(leftVal, rightVal) / total) * 100,
        isLeft,
      }
    })
  }, [result])

  // RIASEC 六维度条
  const riasecScores = useMemo(() => {
    if (!result || result.scaleKey !== 'riasec') return []
    const d = result.details
    const names: Record<string, string> = { R: '现实', I: '研究', A: '艺术', S: '社会', E: '企业', C: '常规' }
    const colors: Record<string, string> = {
      R: 'var(--cat-red)',
      I: 'var(--cat-blue)',
      A: 'var(--cat-purple)',
      S: 'var(--cat-green)',
      E: 'var(--cat-gold)',
      C: 'var(--cat-gray)',
    }
    return Object.keys(names).map((k) => ({ key: k, name: names[k], score: d[k], color: colors[k] }))
  }, [result])

  function getLevelColor(tag: string) {
    const map: Record<string, string> = {
      success: 'var(--status-success)',
      info: 'var(--status-info)',
      warning: 'var(--status-warning)',
      danger: 'var(--status-danger)',
      primary: 'var(--brand-primary-bright)',
    }
    return map[tag] || 'var(--brand-primary)'
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      centered
      width={640}
      footer={null}
      title={null}
      closable
      closeIcon={<CloseOutlined />}
      className={styles.scaleDialog}
      // 原 :deep() 隐藏 header / body padding 0 → AntD 5 styles API；v6 content 改名 container
      styles={{ container: { padding: 0, borderRadius: 24, overflow: 'hidden' }, body: { padding: 0 } }}
    >
      {/* 介绍模式 */}
      {mode === 'intro' && currentScale && (
        <div className={styles.introContent}>
          <div className={styles.introHeader}>
            {/* cat- 为运行时动态分类类（协议类，保留字面量） */}
            <div className={`${styles.scaleTypeTag} cat-${currentScaleInfo?.category}`}>
              {currentScaleInfo ? t(`assessment.categories.${currentScaleInfo.category}`) : ''}
            </div>
            <h2>{currentScale.name}</h2>
            <p className={styles.scaleDesc}>{currentScale.description}</p>
          </div>

          <div className={styles.introDetails}>
            <div className={styles.detailItem}>
              <FieldTimeOutlined />
              <div className={styles.itemText}>
                <span className={styles.label}>{t('assessment.dialog.estimatedTime')}</span>
                <span className={styles.val}>{currentScaleInfo?.duration}</span>
              </div>
            </div>
            <div className={styles.detailItem}>
              <BookOutlined />
              <div className={styles.itemText}>
                <span className={styles.label}>{t('assessment.dialog.questionCount')}</span>
                <span className={styles.val}>{currentScaleInfo?.count} {t('assessment.unit.questions')}</span>
              </div>
            </div>
            <div className={styles.detailItem}>
              <StarFilled />
              <div className={styles.itemText}>
                <span className={styles.label}>{t('assessment.dialog.reliability')}</span>
                <span className={styles.val}>{t('assessment.dialog.reliabilityHigh')}</span>
              </div>
            </div>
          </div>

          <div className={styles.introTips}>
            <h4><InfoCircleFilled /> {t('assessment.dialog.notice')}</h4>
            <ul>
              <li>{t('assessment.dialog.tip1')}</li>
              <li>{t('assessment.dialog.tip2')}</li>
              <li>{t('assessment.dialog.tip3')}</li>
            </ul>
          </div>

          <div className={styles.introActions}>
            <button className={styles.startBtn} onClick={onStart}>
              <span>{t('assessment.dialog.start')}</span>
              <ArrowRightOutlined />
            </button>
          </div>
        </div>
      )}

      {/* 结果模式 */}
      {mode === 'result' && result && (
        <div className={styles.resultContent}>
          <div className={styles.resultSummaryCard}>
            <div className={styles.resLeft}>
              {/* 原 :type="result.levelTag"（非标准属性）→ data-type，CSS 同步改用属性选择器 */}
              <div className={styles.resBadge} data-type={result.levelTag}>{result.level}</div>
              <h2>{result.title}</h2>
              <p className={styles.resDate}>{t('assessment.dialog.completedOn', { date: result.date })}</p>
            </div>
            <div className="res-right">
              <div className={styles.resScoreCircle} style={{ borderColor: getLevelColor(result.levelTag) }}>
                <span className={styles.scoreVal}>{result.score}</span>
                <span className={styles.scoreUnit}>{scoreUnit}</span>
              </div>
            </div>
          </div>

          <div className="result-body">
            <div className={styles.insightGrid}>
              <div className={styles.insightCard}>
                <h3><CompassOutlined /> {t('assessment.dialog.deepAnalysis')}</h3>
                <p>{result.insight}</p>
              </div>
              <div className={`${styles.insightCard} ${styles.highlight}`}>
                <h3><SendOutlined /> {t('assessment.dialog.actionSuggestion')}</h3>
                <p>{result.suggestion}</p>
              </div>
            </div>

            {result.scaleKey === 'mbti' && (
              <div className={styles.mbtiDetails}>
                <h3>{t('assessment.dialog.mbtiDim')}</h3>
                <div className={styles.mbtiBars}>
                  {mbtiScores.map((dim) => (
                    <div key={dim.left} className={styles.mbtiBarItem}>
                      <span className={styles.dimL}>{dim.left}</span>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{ width: `${dim.percent}%`, left: dim.isLeft ? 0 : 'auto', right: dim.isLeft ? 'auto' : 0 }}
                        />
                      </div>
                      <span className={styles.dimR}>{dim.right}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.scaleKey === 'riasec' && (
              <div className={styles.riasecDetails}>
                <h3>{t('assessment.dialog.riasecDim')}</h3>
                <div className={styles.riasecBars}>
                  {riasecScores.map((dim) => (
                    <div key={dim.key} className={styles.rBarItem}>
                      <div className={styles.rInfo}>
                        <span className={styles.rName}>{dim.name} ({dim.key})</span>
                        <span className={styles.rVal}>{dim.score}</span>
                      </div>
                      {/* el-progress → antd Progress：color → strokeColor，show-text → showInfo */}
                      <Progress
                        percent={(dim.score / 15) * 100}
                        strokeColor={dim.color}
                        trailColor="var(--bg-mute)"
                        strokeWidth={10}
                        showInfo={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.resultFooter}>
            <Button onClick={onStart}>{t('assessment.dialog.retake')}</Button>
            <Button type="primary" onClick={onDownload}>{t('assessment.dialog.saveReport')}</Button>
            <Button onClick={onShare}>{t('assessment.dialog.share')}</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
