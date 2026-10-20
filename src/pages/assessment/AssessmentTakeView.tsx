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
import { useI18n } from '@/i18n'
import { useAssessmentScale, useSubmitAssessment } from './assessmentQuery'
import './AssessmentTakeView.css'

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
  const { t } = useI18n()

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

  // 计时器（onMounted / onUnmounted）
  useEffect(() => {
    const timer = setInterval(() => setTimeElapsed((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // 切换量表的 URL 参数时重置作答
  useEffect(() => {
    setCurrentIndex(0)
    setAnswers({})
    setTimeElapsed(0)
  }, [scaleKey])

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

  function confirmExit() {
    modal.confirm({
      title: '确认退出',
      content: '测试尚未完成，退出将不会保存当前进度，确定退出吗？',
      okText: '确定退出',
      cancelText: '继续答题',
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
      navigate(`/assessment?scale=${scaleKey}&view=result`)
    } catch {
      /* 接口错误由页面 mutation 统一提示 */
    }
  }

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
            <span>退出</span>
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

      {/* 答题主体区 */}
      <main className="take-body">
        {/* 装饰性大号背景编号 */}
        <span className="bg-question-num">Q{String(currentIndex + 1).padStart(2, '0')}</span>
        {/* Vue <transition mode="out-in"> → key 重挂载触发入场动画 */}
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
            <span>上一题</span>
          </Button>

          <div className="step-dots">
            {questions.map((_, idx) => (
              <span
                key={idx}
                className={`dot${idx === currentIndex ? ' active' : ''}${isAnswered(idx) ? ' completed' : ''}`}
              />
            ))}
          </div>

          {!isLastQuestion ? (
            <Button
              type="primary"
              className="nav-btn-primary"
              disabled={currentAnswer === undefined}
              onClick={() => setCurrentIndex((i) => i + 1)}
            >
              <span>下一题</span>
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
              <span>提交报告</span>
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
            <p>正在分析您的回答，生成深度报告...</p>
            <p className="loading-sub">请稍候</p>
          </div>
        </div>
      )}
    </div>
  )
}
