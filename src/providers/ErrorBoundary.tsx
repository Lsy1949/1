import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * 全局错误边界：捕获子树渲染期异常，避免整页白屏。
 * 提供重试入口（重置状态触发子树重挂载）。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 预留上报位：接真实后端后替换为埋点调用
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        }}
      >
        <h1 style={{ fontSize: 20, margin: 0 }}>页面出了点问题</h1>
        <p style={{ color: '#64748b', margin: 0 }}>{error.message}</p>
        <button
          type="button"
          onClick={this.handleRetry}
          style={{
            padding: '8px 24px',
            borderRadius: 8,
            border: '1px solid #0052d9',
            color: '#0052d9',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          重试
        </button>
      </div>
    )
  }
}

export default ErrorBoundary
