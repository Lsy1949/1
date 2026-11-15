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
import { useTranslation } from 'react-i18next'
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
  /** 该量表最近一次结果（介绍弹窗展示「上次结果」入口） */
  lastRecord?: AssessmentRecord | null
  /** 原 update:visible → 单向 onClose 回调 */
  onClose: () => void
  onStart: () => void
  onDownload: () => void
  onShare: () => void
  onViewLast?: () => void
}

/** 测评弹窗：intro 介绍模式 / result 结果报告模式 */
export default function ScaleDialog({
  open,
  mode,
  scaleInfo,
  scaleDetail,
  result,
  lastRecord,
  onClose,
  onStart,
  onDownload,
  onShare,
  onViewLast,
}: Props) {
  const { t } = useTranslation()

  // 介绍模式数据（详情优先，缺失时回退目录项）
  const currentScale = useMemo(() => scaleDetail ?? null, [scaleDetail])
  const currentScaleInfo = useMemo(() => scaleInfo ?? null, [scaleInfo])
  const categoryLabel = currentScaleInfo
    ? t(`assessment.categories.${currentScaleInfo.category}`)
    : ''

  // 分数单位：MBTI 显示「类型」，其余显示「分」
  const scoreUnit = useMemo(
    () => (result?.scaleKey === 'mbti' ? t('assessment.unit.type') : t('assessment.unit.score')),
    [result, t]
  )

  // MBTI 四维度条
  const mbtiScores = useMemo(() => {
    if (!result || result.scaleKey !== 'mbti') return []
    const d = result.details
    // 字面量对组：p[0]/p[1] 为维度字面量，模板字符串可推导出精确字典键
    const pairs = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']] as const
    return pairs.map((p) => {
      const leftVal = d[p[0]]
      const rightVal = d[p[1]]
      const total = leftVal + rightVal || 1
      const isLeft = leftVal >= rightVal
      return {
        left: t(`assessment.mbti.${p[0]}`),
        right: t(`assessment.mbti.${p[1]}`),
        percent: (Math.max(leftVal, rightVal) / total) * 100,
        isLeft,
      }
    })
  }, [result, t])

  // RIASEC 六维度条
  const riasecScores = useMemo(() => {
    if (!result || result.scaleKey !== 'riasec') return []
    const d = result.details
    const keys = ['R', 'I', 'A', 'S', 'E', 'C'] as const
    const colors: Record<string, string> = {
      R: 'var(--cat-red)',
      I: 'var(--cat-blue)',
      A: 'var(--cat-purple)',
      S: 'var(--cat-green)',
      E: 'var(--cat-gold)',
      C: 'var(--cat-gray)',
    }
    return keys.map((k) => ({ key: k, name: t(`assessment.riasec.${k}`), score: d[k], color: colors[k] }))
  }, [result, t])

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
      /* 介绍模式内容更密（读数条 + 刻度尺），单独放宽；结果报告沿用 token 宽档 */
      width={mode === 'intro' ? 780 : 'var(--dialog-md)'}
      footer={null}
      title={null}
      closable
      closeIcon={<CloseOutlined />}
      className={styles.scaleDialog}
      // 原 :deep() 隐藏 header / body padding 0 → AntD 5 styles API；v6 content 改名 container
      styles={{ container: { padding: 0, borderRadius: 24, overflow: 'hidden' }, body: { padding: 0 } }}
    >
      {/* 介绍模式：量表说明书式排版（报头 → 读数条 → 维度 → 作答刻度 → 须知 → 启动） */}
      {mode === 'intro' && currentScale && (
        <div className={styles.introContent}>
          {/* 报头 */}
          <header className={styles.introMasthead}>
            <div className={styles.mastheadRow}>
              <span className={styles.mastheadEyebrow}>
                — Assessment · {categoryLabel}
              </span>
            </div>
            <h2 className={styles.scaleName}>{currentScale.name}</h2>
            <p className={styles.scaleDesc}>{currentScale.description}</p>
          </header>

          {/* 读数条：四项关键参数用细线分隔，不做成四张卡片 */}
          <dl className={styles.specBar}>
            <div className={styles.specItem}>
              <dt>
                <FieldTimeOutlined />
                {t('assessment.dialog.estimatedTime')}
              </dt>
              <dd>{currentScaleInfo?.duration ?? '—'}</dd>
            </div>
            <div className={styles.specItem}>
              <dt>
                <BookOutlined />
                {t('assessment.dialog.questionCount')}
              </dt>
              <dd>
                {currentScaleInfo?.count} {t('assessment.unit.questions')}
              </dd>
            </div>
            <div className={styles.specItem}>
              <dt>
                <StarFilled />
                {t('assessment.dialog.reliability')}
              </dt>
              <dd>{t('assessment.dialog.reliabilityHigh')}</dd>
            </div>
            <div className={styles.specItem}>
              <dt>
                <CompassOutlined />
                {t('assessment.dialog.difficulty')}
              </dt>
              <dd>{currentScaleInfo?.difficulty ?? '—'}</dd>
            </div>
          </dl>

          {/* 上次结果（紧跟读数条，做过的人第一眼就能看到） */}
          {lastRecord && (
            <div className={styles.lastResult}>
              <div className={styles.lastLeft}>
                <span className={styles.lastLabel}>{t('assessment.dialog.lastResult')}</span>
                <span className={styles.lastValue}>
                  {lastRecord.level} · {lastRecord.date}
                </span>
              </div>
              {onViewLast && (
                <button type="button" className={styles.lastLink} onClick={onViewLast}>
                  {t('assessment.dialog.viewLast')} →
                </button>
              )}
            </div>
          )}

          {/* 测评维度 */}
          {currentScaleInfo?.tags?.length ? (
            <section className={styles.introSection}>
              <h4 className={styles.sectionLabel}>{t('assessment.dialog.measure')}</h4>
              <div className={styles.measureChips}>
                {currentScaleInfo.tags.map((tag) => (
                  <span key={tag} className={styles.measureChip}>
                    {tag}
                  </span>
                ))}
                <span className={styles.measureChipMuted}>
                  {currentScaleInfo.count} {t('assessment.unit.questions')}
                </span>
              </div>
            </section>
          ) : null}

          {/* 作答刻度：把选项直接可视化，开始前就能知道会被怎么问 */}
          {currentScale.options?.length ? (
            <section className={styles.introSection}>
              <h4 className={styles.sectionLabel}>{t('assessment.dialog.ruler')}</h4>
              <ol className={styles.ruler}>
                {currentScale.options.map((opt, i) => (
                  <li key={String(opt.value)} className={styles.rulerStep}>
                    <span className={styles.rulerKey}>{String.fromCharCode(65 + i)}</span>
                    <span className={styles.rulerTick} />
                    <span className={styles.rulerLabel}>{opt.label}</span>
                  </li>
                ))}
              </ol>
              <p className={styles.rulerHint}>
                {currentScale.optionType === 'mbti'
                  ? t('assessment.dialog.rulerHintBipolar')
                  : t('assessment.dialog.rulerHint')}
              </p>
            </section>
          ) : null}

          {/* 须知：编号列表 */}
          <section className={styles.introTips}>
            <h4>
              <InfoCircleFilled /> {t('assessment.dialog.notice')}
            </h4>
            <ol>
              <li>{t('assessment.dialog.tip1')}</li>
              <li>{t('assessment.dialog.tip2')}</li>
              <li>{t('assessment.dialog.tip3')}</li>
            </ol>
          </section>

          {/* 启动 */}
          <footer className={styles.introActions}>
            <button className={styles.startBtn} onClick={onStart}>
              <span>{t('assessment.dialog.start')}</span>
              <ArrowRightOutlined />
            </button>
            <p className={styles.disclaimer}>{t('assessment.dialog.disclaimer')}</p>
            {lastRecord && <p className={styles.retakeHint}>{t('assessment.dialog.retakeHint')}</p>}
          </footer>
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

          <p className={styles.resultNote}>{t('assessment.dialog.disclaimer')}</p>

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
