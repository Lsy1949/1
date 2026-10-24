import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  /** 保护的子树页面 */
  children: ReactNode
  /** 任一值变化时自动重置错误态（传路由 pathname、业务主键等） */
  resetKeys?: readonly unknown[]
  /** 允许的最大重试次数，超过后引导刷新页面 */
  maxRetries?: number
  /** 复位时通知业务方（清 query 缓存等） */
  onReset?: () => void
  /** 自定义上报，内部已 try/catch，失败不影响降级 UI */
  onError?: (error: unknown, info: ErrorInfo, errorId: string) => void
  /** 自定义降级 UI */
  fallback?: (args: {
    error: Error
    errorId: string
    retry: () => void
    retries: number
  }) => ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
  /** 本次错误的唯一编号，用于展示给用户 + 上报对齐 */
  errorId: string
  /** 用户已经重试次数 */
  retries: number
  /** 变化时强制重挂载子树，清空其内部 state */
  resetKey: number
}

/** 归一化：非 Error 的抛出值也要能拿到可读信息 */
function normalizeError(raw: unknown): Error {
  if (raw instanceof Error) return raw
  if (typeof raw === 'string') return new Error(raw)
  try {
    return new Error(JSON.stringify(raw))
  } catch {
    return new Error('Unknown error')
  }
}

function shallowEqual(a?: readonly unknown[], b?: readonly unknown[]): boolean {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  return a.every((v, i) => Object.is(v, b[i]))
}

/**
 * 同一个 Error 对象 → 永远同一个 id。
 * 用 WeakMap 而不是每次都 randomUUID，是因为 getDerivedStateFromError 可能被
 * React 调用多次，若每次新 id，页面展示的 id 和上报的 id 会对不上。
 * WeakMap 在错误对象被 GC 后自动释放，不泄漏内存。
 * 注意：normalizeError 对非 Error 的原始值会新建 Error，这种情况 id 无法跨次复用，
 * 可接受（非 Error 抛出本身就不常见）。
 */
const errorIds = new WeakMap<object, string>()

function getErrorId(error: Error): string {
  let id = errorIds.get(error)
  if (!id) {
    id =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    errorIds.set(error, id)
  }
  return id
}

const isDev = import.meta.env.DEV // CRA/webpack 改用 process.env.NODE_ENV !== 'production'

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, errorId: '', retries: 0, resetKey: 0 }

  static getDerivedStateFromError(raw: unknown): Partial<ErrorBoundaryState> {
    const error = normalizeError(raw)
    return { error, errorId: getErrorId(error) }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // resetKeys 变化时自动复位，避免"路由已切、错误页还在"
    if (this.state.error && !shallowEqual(prevProps.resetKeys, this.props.resetKeys)) {
      this.reset(0)
    }
  }

  componentDidCatch(raw: unknown, info: ErrorInfo): void {
    try {
      // getDerivedStateFromError 先于本方法执行，此时 state.errorId 已就绪
      this.props.onError?.(raw, info, this.state.errorId)
    } catch (reportingError) {
      // 上报链路异常不能影响降级 UI
      if (isDev) console.warn('[ErrorBoundary] 上报失败', reportingError)
    }
    if (isDev) {
      console.error('[ErrorBoundary]', raw, info.componentStack)
    }
  }

  private reset = (nextRetries: number) => {
    this.props.onReset?.()
    this.setState((s) => ({
      error: null,
      errorId: '',
      retries: nextRetries,
      resetKey: s.resetKey + 1,
    }))
  }

  private handleRetry = () => {
    this.reset(this.state.retries + 1)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    const { error, errorId, retries, resetKey } = this.state
    const { children, fallback, maxRetries = 3 } = this.props

    // key 变化 → React 卸载并重建子树，内部 state 被彻底清空
    if (!error) return <Fragment key={resetKey}>{children}</Fragment>

    if (fallback) return fallback({ error, errorId, retry: this.handleRetry, retries })

    const canRetry = retries < maxRetries

    return (
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
          boxSizing: 'border-box',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        }}
      >
        <h1 style={{ fontSize: 20, margin: 0 }}>页面出了点问题</h1>
        <p style={{ color: 'var(--text-secondary, #666)', margin: 0 }}>
          {isDev ? error.message : '请稍后重试，或刷新页面'}
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          {canRetry ? (
            <button type="button" onClick={this.handleRetry} style={buttonStyle}>
              重试{retries > 0 ? `（${retries}/${maxRetries}）` : ''}
            </button>
          ) : (
            <button type="button" onClick={this.handleReload} style={buttonStyle}>
              刷新页面
            </button>
          )}
        </div>

        {errorId && (
          <p style={{ color: 'var(--text-secondary, #999)', fontSize: 12, margin: 0 }}>
            错误编号：{errorId}
          </p>
        )}
      </div>
    )
  }
}

const buttonStyle = {
  padding: '8px 24px',
  borderRadius: 8,
  border: '1px solid var(--brand-primary, #1677ff)',
  color: 'var(--brand-primary, #1677ff)',
  background: 'transparent',
  cursor: 'pointer',
} as const

export default ErrorBoundary