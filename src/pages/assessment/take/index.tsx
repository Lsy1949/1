/**
 * 沉浸式答题页（AssessmentTakeView）
 * - 题目来自 `GET /api/assessment/scales/:id`，选项由接口下发（含分值）
 * - 提交走 useMutation，计分在服务端完成
 * - 顶部进度使用 antd Progress；底部导航使用 antd Button
 */
import { useEffect, useState } from 'react'
import { App as AntApp, Button, Progress, Result, Skeleton } from 'antd'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  ExclamationCircleFilled,
  FieldTimeOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { QuestionCard } from '@/features/assessment'
import { useTranslation } from 'react-i18next'
import { useAssessmentScale, useSubmitAssessment } from '../assessmentQuery'
import './index.css'

/**
 * 本地草稿：按量表 key 存 sessionStorage。
 * 只是为了「误关闭/刷新不丢进度」，提交成功即清除；服务端仍是唯一事实来源。
 */
const DRAFT_PREFIX = 'assessment:draft:'

function readDraft(scaleKey: string): { answers?: Record<number, number | string>; index?: number } | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_PREFIX + scaleKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { answers?: Record<string, number | string>; index?: number }
    const answers: Record<number, number | string> = {}
    Object.entries(parsed.answers ?? {}).forEach(([key, value]) => {
      answers[Number(key)] = value
    })
    return { answers, index: parsed.index }
  } catch {
    return null
  }
}

function clearDraft(scaleKey: string): void {
  try {
    sessionStorage.removeItem(DRAFT_PREFIX + scaleKey)
  } catch {
    /* 隐私模式下不可用，忽略 */
  }
}

/**
 * Vue → React 映射：
 * - route.params.id → useParams().id
 * - onMounted/onUnmounted 计时器 → useEffect + cleanup
 * - ElMessageBox.confirm → AntApp.useApp().modal.confirm
 * - <transition name="q-slide" mode="out-in"> → key 重挂载 + CSS 入场动画
 */
export default function AssessmentTakeView() {
  const { modal } = AntApp.useApp()
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const scaleKey = id ? String(id) : undefined
  const {
    data: scale,
    isPending,
    isError,
    error,
    refetch,
  } = useAssessmentScale(scaleKey)
  const submit = useSubmitAssessment()

  // --- 作答状态（纯 UI） ---
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number | string>>({})
  const [timeElapsed, setTimeElapsed] = useState(0)

  const questions = scale?.questions ?? []
  const currentQuestion = questions[currentIndex]
  const currentOptions = scale?.options ?? []
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined
  const categoryLabel = scale ? t(`assessment.categories.${scale.category}`) : ''
  const isLastQuestion = questions.length > 0 && currentIndex === questions.length - 1
  const progress = questions.length
    ? Math.round(((currentIndex + 1) / questions.length) * 100)
    : 0
  const allAnswered =
    questions.length > 0 && questions.every((q) => answers[q.id] !== undefined)
  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length
  // 未答题目下标：底部「去补答」一键跳到第一道空题
  const unansweredIndexes = questions
    .map((q, idx) => (answers[q.id] === undefined ? idx : -1))
    .filter((idx) => idx >= 0)
  // 阶段提示：首题引导 → 过半鼓励 → 收尾告知（给长量表一点节奏感）
  const stageHint = isLastQuestion
    ? t('assessment.take.hintLast')
    : currentIndex + 1 > questions.length / 2
      ? t('assessment.take.hintHalf')
      : t('assessment.take.hintStart')

  // 计时器（onMounted / onUnmounted）
  useEffect(() => {
    const timer = setInterval(() => setTimeElapsed((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // 切换量表的 URL 参数时重置作答；同一量表重进则恢复本地草稿
  useEffect(() => {
    setCurrentIndex(0)
    setAnswers({})
    setTimeElapsed(0)
    if (!scaleKey) return
    const draft = readDraft(scaleKey)
    if (!draft?.answers || Object.keys(draft.answers).length === 0) return
    setAnswers(draft.answers)
    if (typeof draft.index === 'number') setCurrentIndex(draft.index)
  }, [scaleKey])

  // 题目加载完成后收敛当前题号（草稿题号可能超出新题量）
  useEffect(() => {
    if (questions.length > 0 && currentIndex > questions.length - 1) {
      setCurrentIndex(questions.length - 1)
    }
  }, [questions.length, currentIndex])

  // 作答进度写入本地草稿（提交成功后清除）
  useEffect(() => {
    if (!scaleKey || Object.keys(answers).length === 0) return
    try {
      sessionStorage.setItem(
        DRAFT_PREFIX + scaleKey,
        JSON.stringify({ answers, index: currentIndex })
      )
    } catch {
      /* 忽略存储配额 / 隐私模式错误 */
    }
  }, [answers, currentIndex, scaleKey])

  // --- 方法 ---
  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  function handleSelect(qId: number, val: number | string) {
    setAnswers((prev) => ({ ...prev, [qId]: val }))
    // 非最后一题：稍作停留后自动进入下一题
    if (!isLastQuestion) {
      setTimeout(() => {
        setCurrentIndex((i) => i + 1)
      }, 300)
    }
  }

  function isAnswered(idx: number) {
    const q = questions[idx]
    return q ? answers[q.id] !== undefined : false
  }

  function prevQuestion() {
    setCurrentIndex((i) => (i > 0 ? i - 1 : i))
  }

  function nextQuestion() {
    setCurrentIndex((i) => (i < questions.length - 1 ? i + 1 : i))
  }

  function confirmExit() {
    modal.confirm({
      title: t('assessment.take.exitTitle'),
      content: t('assessment.take.exitConfirm'),
      okText: t('assessment.take.exitOk'),
      cancelText: t('assessment.take.exitCancel'),
      icon: <ExclamationCircleFilled />,
      onOk() {
        navigate('/assessment')
      },
    })
  }

  async function handleSubmit() {
    if (!scale || !scaleKey) return

    const payload = {
      scaleKey,
      answers: Object.entries(answers).map(([questionId, value]) => ({
        questionId: Number(questionId),
        value,
      })),
      duration: timeElapsed,
    }

    try {
      await submit.mutateAsync(payload)
      clearDraft(scaleKey)
      navigate(`/assessment?scale=${scaleKey}&view=result`)
    } catch {
      /* 接口错误由页面 mutation 统一提示 */
    }
  }

  // 键盘操作：A–E 选选项 / ← → 切题 / Enter 下一题或提交（桌面端效率关键）
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
      if (submit.isPending || !currentQuestion) return

      const letterIdx = ['a', 'b', 'c', 'd', 'e'].indexOf(e.key.toLowerCase())
      const numberIdx = ['1', '2', '3', '4', '5'].indexOf(e.key)
      const optIdx = letterIdx >= 0 ? letterIdx : numberIdx

      if (optIdx >= 0 && currentOptions[optIdx]) {
        e.preventDefault()
        handleSelect(currentQuestion.id, currentOptions[optIdx].value)
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevQuestion()
        return
      }
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        if (isLastQuestion) {
          if (allAnswered) void handleSubmit()
        } else if (currentAnswer !== undefined) {
          nextQuestion()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, currentOptions, currentAnswer, isLastQuestion, allAnswered, submit.isPending])

  // 加载 / 错误 / 404
  if (isPending) {
    return (
      <div className="immersive-assessment">
        <div className="take-state">
          <Skeleton active title={{ width: '42%' }} paragraph={{ rows: 2 }} />
          <Skeleton active title={false} paragraph={{ rows: 6 }} />
        </div>
      </div>
    )
  }

  if (isError) {
    const isNotFound = (error as { status?: number } | null)?.status === 404
    if (isNotFound) {
      return (
        <div className="immersive-assessment">
          <div className="take-state">
            <Result
              status="404"
              title={t('assessment.empty')}
              extra={
                <Button type="primary" onClick={() => navigate('/assessment')}>
                  {t('assessment.action.goAssess')}
                </Button>
              }
            />
          </div>
        </div>
      )
    }
    return (
      <div className="immersive-assessment">
        <div className="take-state">
          <Result
            status="error"
            title={t('common.loadFailed')}
            extra={
              <Button type="primary" onClick={() => void refetch()}>
                {t('common.retry')}
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  if (!scale) return null

  return (
    <div className="immersive-assessment">
      {/* 沉浸式顶栏 */}
      <header className="take-header">
        <div className="header-left">
          <Button type="text" className="exit-btn" onClick={confirmExit}>
            <CloseOutlined />
            <span>{t('assessment.take.exit')}</span>
          </Button>
          <div className="divider" />
          <div className="scale-meta">
            <span className="scale-name">{scale.name}</span>
            <span className="scale-progress-text">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
        </div>
        <div className="header-center">
          <Progress
            percent={progress}
            showInfo={false}
            size="small"
            className="top-progress"
          />
          <span className="top-progress-pct">{progress}%</span>
        </div>
        <div className="header-right">
          <div className="timer">
            <FieldTimeOutlined />
            <span>{formatTime(timeElapsed)}</span>
          </div>
        </div>
      </header>

      {/* 答题主体区：左索引轨 / 中题目卡 / 右作答提示（桌面三栏工作台） */}
      <main className="take-body">
        {/* 装饰性大号背景编号 */}
        <span className="bg-question-num">Q{String(currentIndex + 1).padStart(2, '0')}</span>

        {/* 左：题目索引轨（可点跳题，状态可见） */}
        <aside className="take-rail" aria-label={t('assessment.take.railTitle')}>
          <div className="rail-head">
            <span className="rail-title">{t('assessment.take.railTitle')}</span>
            <span className="rail-count">
              {String(answeredCount).padStart(2, '0')}/{String(questions.length).padStart(2, '0')}
            </span>
          </div>
          <ol className="rail-list">
            {questions.map((q, idx) => (
              <li key={q.id}>
                <button
                  type="button"
                  className={`rail-item${idx === currentIndex ? ' current' : ''}${isAnswered(idx) ? ' done' : ''}`}
                  aria-current={idx === currentIndex ? 'step' : undefined}
                  aria-label={t('assessment.take.railTitle') + ' ' + (idx + 1)}
                  onClick={() => setCurrentIndex(idx)}
                >
                  {String(idx + 1).padStart(2, '0')}
                </button>
              </li>
            ))}
          </ol>
          <div className="rail-legend">
            <span><i className="legend-dot done" />{t('assessment.take.railLegendDone')}</span>
            <span><i className="legend-dot" />{t('assessment.take.railLegendTodo')}</span>
          </div>
        </aside>

        {/* 中：串场提示 + 题目卡（key 重挂载触发入场动画） */}
        <section className="take-stage">
          <p className="stage-hint">{stageHint}</p>
          <div key={currentIndex} className="question-container">
            <QuestionCard
              index={currentIndex}
              total={questions.length}
              question={currentQuestion}
              options={currentOptions}
              answer={currentAnswer}
              categoryLabel={categoryLabel}
              onSelect={handleSelect}
            />
          </div>
        </section>

        {/* 右：作答提示与键盘说明（宽屏补充信息，窄屏隐藏） */}
        <aside className="take-aside">
          <div className="aside-block">
            <h4>{t('assessment.take.asideTips')}</h4>
            <ul>
              <li>{t('assessment.take.tipIntuition')}</li>
              <li>{t('assessment.take.tipHonest')}</li>
              <li>{t('assessment.take.tipPrivate')}</li>
            </ul>
          </div>
          <div className="aside-block">
            <h4>{t('assessment.take.asideKeyboard')}</h4>
            <ul className="key-list">
              <li>
                <span className="key-combo"><kbd>A</kbd><span className="key-sep">–</span><kbd>E</kbd></span>
                <span className="key-desc">{t('assessment.take.keySelect')}</span>
              </li>
              <li>
                <span className="key-combo"><kbd>←</kbd><kbd>→</kbd></span>
                <span className="key-desc">{t('assessment.take.keyNav')}</span>
              </li>
              <li>
                <span className="key-combo"><kbd>Enter</kbd></span>
                <span className="key-desc">{t('assessment.take.keyEnter')}</span>
              </li>
            </ul>
          </div>
        </aside>
      </main>

      {/* 沉浸式底栏 */}
      <footer className="take-footer">
        <div className="footer-inner">
          <Button
            className="nav-btn"
            disabled={currentIndex === 0}
            onClick={prevQuestion}
          >
            <ArrowLeftOutlined />
            <span>{t('assessment.take.prev')}</span>
          </Button>

          <div className="footer-center">
            <span className="footer-answered">
              {t('assessment.take.answered', { done: answeredCount, total: questions.length })}
            </span>
            <div className="step-dots">
              {questions.map((_, idx) => (
                <span
                  key={idx}
                  className={`dot${idx === currentIndex ? ' active' : ''}${isAnswered(idx) ? ' completed' : ''}`}
                />
              ))}
            </div>
            {answeredCount > 0 && unansweredIndexes.length > 0 && (
              <button
                type="button"
                className="footer-jump"
                onClick={() => setCurrentIndex(unansweredIndexes[0])}
              >
                {t('assessment.take.unanswered', { n: unansweredIndexes.length })}
              </button>
            )}
          </div>

          {!isLastQuestion ? (
            <Button
              type="primary"
              className="nav-btn-primary"
              disabled={currentAnswer === undefined}
              onClick={nextQuestion}
            >
              <span>{t('assessment.take.next')}</span>
              <ArrowRightOutlined />
            </Button>
          ) : (
            <Button
              type="primary"
              className="nav-btn-primary"
              disabled={!allAnswered}
              loading={submit.isPending}
              onClick={() => void handleSubmit()}
            >
              <span>{t('assessment.take.submit')}</span>
              {!submit.isPending && <CheckCircleOutlined />}
            </Button>
          )}
        </div>
      </footer>

      {/* 提交中遮罩 */}
      {submit.isPending && (
        <div className="submitting-overlay">
          <div className="loading-box">
            <div className="loading-spinner" />
            <p>{t('assessment.take.analyzing')}</p>
            <p className="loading-sub">
              {scale.name} · {t('assessment.take.pleaseWait')}
            </p>
            <div className="loading-rail">
              <span />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
