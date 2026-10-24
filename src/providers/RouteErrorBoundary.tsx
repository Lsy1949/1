import { type ErrorInfo, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Collapse, Result, Space, Typography } from 'antd'
import { ErrorBoundary } from './ErrorBoundary'

const { Paragraph, Text } = Typography
const isDev = import.meta.env.DEV

interface RouteErrorBoundaryProps {
  children: ReactNode
  /** 可选：重试时清一下当前页面的 query 缓存，避免坏数据一直复用 */
  onReset?: () => void
  /** 上报钩子：内层可以带 pathname / search / errorId */
  onError?: (
    error: unknown,
    info: ErrorInfo,
    ctx: { errorId: string; pathname: string; search: string },
  ) => void
  /** 最多重试次数，默认 3 */
  maxRetries?: number
}

/**
 * 页面级兜底：只替换内容区，外层导航 / 侧边栏 / 顶部栏保留。
 * 依赖 antd 与 router，必须放在 ConfigProvider 和 BrowserRouter 内部。
 */
export function RouteErrorBoundary({
  children,
  onReset,
  onError,
  maxRetries = 3,
}: RouteErrorBoundaryProps) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <ErrorBoundary
      // 路由变化 → 自动清错误、重试次数归零
      resetKeys={[location.pathname]}
      maxRetries={maxRetries}
      onReset={onReset}
      onError={(err, info) => {
        // 底座的 onError 不含 errorId，这里用 pathname+time 兜一个可读上下文
        onError?.(err, info, {
          errorId: '', // 如需严格一致，见第四节末尾说明
          pathname: location.pathname,
          search: location.search,
        })
      }}
      fallback={({ error, errorId, retry, retries }) => {
        const canRetry = retries < maxRetries

        const handleCopy = async () => {
          const text = [
            `错误编号: ${errorId}`,
            `路由: ${location.pathname}${location.search}`,
            `信息: ${error.message}`,
          ].join('\n')
          try {
            await navigator.clipboard.writeText(text)
          } catch {
            /* 剪贴板不可用时静默失败 */
          }
        }

        return (
          <Result
            status="warning"
            title="这个页面出了点状况"
            subTitle="你的其他操作没有受到影响，可以再试一次，或去看看别的页面。"
            extra={
              <Space wrap>
                {canRetry ? (
                  <Button type="primary" onClick={retry}>
                    {retries === 0 ? '再试一次' : `再试一次（${retries}/${maxRetries}）`}
                  </Button>
                ) : (
                  <Button type="primary" onClick={() => window.location.reload()}>
                    刷新页面
                  </Button>
                )}
                <Button onClick={() => navigate('/')}>返回首页</Button>
                <Button type="link" onClick={handleCopy}>
                  复制错误编号
                </Button>
              </Space>
            }
          >
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              错误编号：<Text code>{errorId}</Text>
              {'　'}如需帮助，请把编号提供给客服。
            </Paragraph>

            {isDev && (
              <Collapse
                ghost
                style={{ marginTop: 8, textAlign: 'left' }}
                items={[
                  {
                    key: 'detail',
                    label: '错误详情',
                    children: (
                      <pre style={preStyle}>
                        {error.stack ?? error.message}
                      </pre>
                    ),
                  },
                ]}
              />
            )}
          </Result>
        )
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

const preStyle = {
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  margin: 0,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: 12,
  lineHeight: 1.6,
  maxHeight: 320,
  overflow: 'auto',
} as const