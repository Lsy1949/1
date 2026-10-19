import { useEffect, useMemo, useState } from 'react'
import { App as AntApp } from 'antd'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  ExclamationCircleFilled,
  FieldTimeOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { QuestionCard } from '@/features/assessment'
import { ASSESSMENT_STORAGE_KEY, scaleOptions, scales } from '@/features/assessment'
import type { OptionItem, ScaleResult } from '@/features/assessment'
import './AssessmentTakeView.css'

interface ScaleMeta {
  key: string
  name: string
  color: string
  category: 'mental' | 'career'
}

// --- 量表分类元信息（与 Vue 版一致） ---
const mentalScales: ScaleMeta[] = [
  { key: 'phq9', name: '抑郁自评 PHQ-9', color: '#0052d9', category: 'mental' },
  { key: 'gad7', name: '焦虑自评 GAD-7', color: '#059669', category: 'mental' },
  { key: 'pss', name: '压力感知 PSS-10', color: '#d97706', category: 'mental' },
]

const careerScales: ScaleMeta[] = [
  { key: 'riasec', name: '职业兴趣 RIASEC', color: '#7c3aed', category: 'career' },
  { key: 'mbti', name: '性格倾向 MBTI', color: '#db2777', category: 'career' },
]

/**
 * 沉浸式答题页（AssessmentTakeView）
 * Vue → React 映射：
 * - route.params.id → useParams().id
 * - onMounted/onUnmounted 计时器 → useEffect + cleanup
 * - ElMessageBox.confirm → AntApp.useApp().modal.confirm
 * - <transition name="q-slide" mode="out-in"> → key 重挂载 + CSS 入场动画（React 无内置 Transition）
 */
export default function AssessmentTakeView() {
  const { message, modal } = AntApp.useApp()
  const { id } = useParams()
  const navigate = useNavigate()

  // --- 状态管理 ---
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number | string>>({})
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // --- 量表元信息（computed → useMemo / 直接派生） ---
  const currentScaleKey = String(id)
  const currentScale = scales[currentScaleKey]
  const currentScaleInfo = useMemo(
    () => [...mentalScales, ...careerScales].find((s) => s.key === currentScaleKey),
    [currentScaleKey]
  )
  const questions = currentScale?.questions ?? []
  const currentQuestion = currentScale?.questions[currentIndex]
  const currentOptions: OptionItem[] = currentScale ? scaleOptions[currentScale.optionType] : []
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined
  const categoryLabel = currentScaleInfo?.category === 'mental' ? '心理健康' : '生涯发展'
  const isLastQuestion = questions.length > 0 && currentIndex === questions.length - 1
  const progress = questions.length
    ? Math.round(((currentIndex + 1) / questions.length) * 100)
    : 0
  const allAnswered =
    questions.length > 0 && questions.every((q) => answers[q.id] !== undefined)

  // --- onMounted 量表校验 + 计时器（onUnmounted 清理）→ 单个 useEffect ---
  useEffect(() => {
    if (!scales[String(id)]) {
      message.error('量表不存在')
      navigate('/assessment')
      return
    }
    const timer = setInterval(() => setTimeElapsed((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [id, message, navigate])

  // --- 方法 ---
  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  function handleSelect(qId: number, val: number | string) {
    setAnswers((prev) => ({ ...prev, [qId]: val }))
    // 如果不是最后一题，自动跳到下一题（延迟一小会儿增加反馈感）
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

  // 退出确认：ElMessageBox.confirm → modal.confirm（来自 AntApp 上下文）
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

  function handleSubmit() {
    setSubmitting(true)
    setTimeout(() => {
      const scale = currentScale
      if (!scale) {
        setSubmitting(false)
        return
      }
      let total = 0
      const details: Record<string, number> = {}

      // 初始化 details
      if (currentScaleKey === 'riasec') {
        ;['R', 'I', 'A', 'S', 'E', 'C'].forEach((k) => (details[k] = 0))
      } else if (currentScaleKey === 'mbti') {
        ;['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'].forEach((k) => (details[k] = 0))
      }

      scale.questions.forEach((q) => {
        const val = answers[q.id]
        if (val === undefined) return
        if (currentScaleKey === 'mbti') {
          if (typeof val !== 'string') return
          const char = val.charAt(0)
          const weight = parseInt(val.charAt(1))
          const dim = q.dim ?? ''
          const typeChar = char === 'A' ? dim[0] : dim[1]
          details[typeChar] += weight
        } else {
          const numericVal = parseInt(String(val))
          total += numericVal
          if (q.type) details[q.type] += numericVal
        }
      })

      const res: ScaleResult = scale.calc(total, details)
      const record = {
        ...res,
        score: total,
        date: dayjs().format('YYYY-MM-DD HH:mm'),
        scaleKey: currentScaleKey,
        scaleName: scale.name,
        details,
        duration: timeElapsed,
      }

      // 保存到本地
      const history = JSON.parse(localStorage.getItem(ASSESSMENT_STORAGE_KEY) || '[]')
      history.unshift(record)
      localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(history.slice(0, 30)))

      setSubmitting(false)
      message.success('测评已完成！')
      // 命名路由 + query → 路径跳转
      navigate(`/assessment?scale=${currentScaleKey}&view=result`)
    }, 1500)
  }

  return (
    <div className="immersive-assessment">
      {/* 沉浸式顶栏 */}
      <header className="take-header">
        <div className="header-left">
          <button className="exit-btn" onClick={confirmExit}>
            <CloseOutlined />
            <span>退出</span>
          </button>
          <div className="divider" />
          <div className="scale-meta">
            <span className="scale-name">{currentScale?.name}</span>
            <span className="scale-progress-text">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
        </div>
        <div className="header-center">
          <div className="top-progress-track">
            <div className="top-progress-fill" style={{ width: `${progress}%` }} />
          </div>
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
          <button disabled={currentIndex === 0} className="nav-btn" onClick={prevQuestion}>
            <ArrowLeftOutlined />
            <span>上一题</span>
          </button>

          <div className="step-dots">
            {questions.map((_, idx) => (
              <span
                key={idx}
                className={`dot${idx === currentIndex ? ' active' : ''}${isAnswered(idx) ? ' completed' : ''}`}
              />
            ))}
          </div>

          {!isLastQuestion ? (
            <button
              disabled={currentAnswer === undefined}
              className="nav-btn-primary"
              onClick={() => setCurrentIndex((i) => i + 1)}
            >
              <span>下一题</span>
              <ArrowRightOutlined />
            </button>
          ) : (
            <button
              disabled={!allAnswered}
              className="nav-btn-primary"
              onClick={handleSubmit}
            >
              <span>提交报告</span>
              <CheckCircleOutlined />
            </button>
          )}
        </div>
      </footer>

      {/* 提交中遮罩（v-if + fade 过渡 → 条件渲染 + 入场动画） */}
      {submitting && (
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
