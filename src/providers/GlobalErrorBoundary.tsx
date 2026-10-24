import { type ErrorInfo, type ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

const isDev = import.meta.env.DEV

interface GlobalErrorBoundaryProps {
  children: ReactNode
  /** 上报钩子：外层拿不到路由/用户，只能带基础上下文 */
  onError?: (error: unknown, info: ErrorInfo, errorId: string) => void
  /** 可选的"清缓存"逻辑，由使用方定义清除范围，避免误删登录态 */
  onClearCache?: () => void
}

/**
 * 全站兜底：捕获 Provider / Router 初始化阶段或更深层的致命异常。
 * 设计原则：零依赖（不引 antd、不引 router、不用 CSS 变量），保证一定能渲染。
 */
export function GlobalErrorBoundary({
  children,
  onError,
  onClearCache,
}: GlobalErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(err, info) => {
        // errorId 从 fallback 里拿不到，这里重新生成一个用于上报即可（可接受）
        const id =
          globalThis.crypto?.randomUUID?.() ??
          `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
        onError?.(err, info, id)
      }}
      fallback={({ error, errorId }) => {
        const handleReload = () => window.location.reload()
        const handleClearAndReload = () => {
          if (!onClearCache) return
          const ok = window.confirm(
            '这会清除本站的部分本地数据（不会退出登录），并重新加载页面。继续吗？',
          )
          if (!ok) return
          try {
            onClearCache()
          } finally {
            window.location.reload()
          }
        }

        return (
          <div role="alert" style={S.container}>
            <div style={S.iconWrap} aria-hidden>
              !
            </div>
            <h1 style={S.title}>应用暂时无法使用</h1>
            <p style={S.subtitle}>
              页面加载出了点问题，刷新一下通常就能恢复。
            </p>

            <div style={S.actions}>
              <button type="button" onClick={handleReload} style={S.primaryBtn}>
                刷新页面
              </button>
              {onClearCache && (
                <button
                  type="button"
                  onClick={handleClearAndReload}
                  style={S.ghostBtn}
                >
                  仍无法恢复？清除缓存
                </button>
              )}
            </div>

            <p style={S.codeHint}>
              错误编号：<code style={S.code}>{errorId}</code>
            </p>

            {isDev && (
              <details style={S.devBox}>
                <summary style={S.devSummary}>错误详情（仅开发环境）</summary>
                <pre style={S.pre}>{error.message}</pre>
                {error.stack && <pre style={S.pre}>{error.stack}</pre>}
              </details>
            )}
          </div>
        )
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

const S = {
  container: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    textAlign: 'center',
    boxSizing: 'border-box',
    background: '#fff',
    color: '#1f2329',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#fff4e5',
    color: '#d97706',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
  },
  title: { fontSize: 20, margin: '8px 0 0' },
  subtitle: { color: '#646a73', margin: 0, maxWidth: 360, lineHeight: 1.6 },
  actions: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 },
  primaryBtn: {
    padding: '10px 28px',
    borderRadius: 8,
    border: 'none',
    background: '#1677ff',
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
  },
  ghostBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid transparent',
    background: 'transparent',
    color: '#8c8c8c',
    fontSize: 12,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  codeHint: { color: '#8c8c8c', fontSize: 12, margin: '16px 0 0' },
  code: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    background: '#f2f3f5',
    padding: '1px 6px',
    borderRadius: 4,
  },
  devBox: {
    marginTop: 16,
    maxWidth: 880,
    width: '100%',
    textAlign: 'left',
    padding: 16,
    borderRadius: 8,
    background: '#f7f8fa',
    border: '1px solid #e5e6eb',
    fontSize: 12,
    overflow: 'auto',
    boxSizing: 'border-box',
  },
  devSummary: { cursor: 'pointer', fontWeight: 600 },
  pre: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: '6px 0 0',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: 12,
    lineHeight: 1.5,
  },
} as const