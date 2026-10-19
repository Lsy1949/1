import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

import App from './App'
import { ErrorBoundary } from './providers/ErrorBoundary'
import { QueryProvider } from './providers/QueryProvider'
import { ThemeProvider, useTheme } from './providers/ThemeProvider'
import { TenantProvider, useTenantTokens } from './providers/TenantProvider'
import { I18nProvider } from './providers/I18nProvider'
import { PermissionProvider } from './providers/PermissionProvider'
import { bootstrapTenant } from './stores/useTenantStore'

// 全局样式链（等价 Vue 版 main.ts 引入序；element.css 为 --el-* 变量层，
// main.css 的链接色等仍有消费）
import './styles/tokens.css'
import './styles/brand.css'
import './styles/reveal.css'
import './styles/base.css'
import './styles/element.css'
import './styles/main.css'
import './styles/dark-mode.css'

dayjs.locale('zh-cn')

/** antd 主题桥：从租户/CSS 变量读 token，暗色时切 algorithm */
function AntdThemeBridge({ children }: React.PropsWithChildren) {
  const { isDark } = useTheme()
  const tokens = useTenantTokens()
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        cssVar: { key: 'psy' },
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          ...tokens,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        {/* AntApp 由 App.tsx 提供（位于 ConfigProvider 内层才能继承主题） */}
        <ThemeProvider>
          <AntdThemeBridge>
            <TenantProvider>
              <I18nProvider>
                <PermissionProvider>
                  <BrowserRouter>
                    <Suspense fallback={<div className="page-loading" />}>
                      <App />
                    </Suspense>
                  </BrowserRouter>
                </PermissionProvider>
              </I18nProvider>
            </TenantProvider>
          </AntdThemeBridge>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

// 非阻塞：首帧用保底配置渲染，配置就绪后全树热更新
void bootstrapTenant()