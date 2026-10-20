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

// 全局样式链（等价 Vue 版 main.ts 引入序）：
//   tokens.css    业务语义 token（--bg-* / --ink-* / --text-* 等）
//   palettes.css  L1 预置色板（:root fallback + [data-palette] 覆写）
//   reveal.css    通用入场动效
//   base.css      元素基线（reset 之上）
//   element.css   antd/element 变量桥（--el-* → antd token）
//   main.css      全局排版与工具类
//   dark-mode.css 暗色覆写（L2 / 换色重定义）
import './styles/tokens.css'
import './styles/palettes.css'
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
        /* 组件级 token 全局统一：嵌套 ConfigProvider 默认 inherit: true，
           会把这些键继承下去，页面只需覆写自己真正不同的键，避免各处重复 + 静默失效。
           · 底色走 --input-bg：页面/区块可在 CSS Modules 里覆写该变量做差异化
             （未设时回退 --bg-soft），因此 TS 侧不需要出现任何具体色值。
           · 不显式配 activeBg：antd 的 activeBg/hoverBg 默认派生自 colorBgContainer，
             显式再写一遍会在暗色下与底色等价而静默失效。 */
        components: {
          Input: {
            colorBgContainer: 'var(--input-bg, var(--bg-soft))',
            colorBorder: 'var(--border-strong)',
            hoverBorderColor: 'var(--brand-primary)',
            activeBorderColor: 'var(--brand-primary)',
            activeShadow: '0 0 0 3px color-mix(in srgb, var(--brand-primary) 10%, transparent)',
            paddingInline: 15,
            paddingBlock: 8,
            /* 全站统一过渡手感（0.3s），避免各页 0.2s/0.25s/0.3s 混杂 */
            motionDurationMid: '0.3s',
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}

/**
 * DEV 下启动 MSW（Mock Service Worker）。
 *
 * 开关规则：DEV 默认开启（联调真实后端时置 VITE_USE_MOCK=0 关闭）；
 * 非 DEV 仅当显式 VITE_USE_MOCK=1 才开启。
 *
 * worker 就绪后再渲染：避免首个请求（租户配置）在 worker 接管前发出去而落空。
 * 动态 import 保证 msw 与 mocks/data（含 Vite 资源导入）不进生产包。
 */
async function enableMocking(): Promise<void> {
  const flag = import.meta.env.VITE_USE_MOCK
  const enabled = import.meta.env.DEV ? flag !== '0' : flag === '1'
  if (!enabled) return

  const { worker } = await import('./mocks/browser')
  // 'bypass'：未命中的请求（vite HMR、静态资源等）静默放行，保持控制台干净；
  // 未 mock 的接口仍可在 Network 面板看到，便于补 handler。
  // 注意 msw v3 把该选项由 onUnhandledRequest 更名为 onUnhandledFrame。
  await worker.start({ onUnhandledFrame: 'bypass' })
}

enableMocking().then(() => {
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
})