import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

import App from './App'
import { GlobalErrorBoundary } from './providers/GlobalErrorBoundary'
import { QueryProvider } from './providers/QueryProvider'
import { RouteErrorBoundary } from './providers/RouteErrorBoundary'
import { ThemeProvider, useTheme } from './providers/ThemeProvider'
import { TenantProvider, useTenantTokens } from './providers/TenantProvider'
import { I18nProvider } from './providers/I18nProvider'
import { PermissionProvider } from './providers/PermissionProvider'
import { bootstrapTenant } from './stores/useTenantStore'
import { getUserStore } from './stores/useUserStore'
import { enableMocking } from './mocks/enable'

// 全局样式链：层叠优先级由 tokens.css 顶部的 @layer 声明统一决定，
// import 顺序不再承担层叠职责（仅保留可读性）。
// element 变量桥（--el-*）已随 Element Plus 迁移清理删除。
import './styles/tokens.css' // L0 原子色阶 + @layer 层级声明
import './styles/semantic.css' // L2 业务语义变量（明/暗两套值）
import './styles/palettes.css' // L1 品牌色（seed + color-mix 派生）
import './styles/reveal.css' // 通用入场动效
import './styles/base.css' // 元素基线（reset 之上）
import './styles/main.css' // 全局排版与工具类
import './styles/dark-mode.css' // 仅暗色覆写

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
          /* 字体：租户配置优先（useTenantTokens.fontFamily，空 = 未配置），
             否则系统栈兜底 —— 与 body 的 var(--brand-font-family) 同源对齐 */
          fontFamily:
            tokens.fontFamily ||
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

// Mock 启用逻辑见 mocks/enable.ts（DEV 默认开，VITE_USE_MOCK 控制；为后续
// 整体移除 Mock 预留：届时只删该模块与此处调用）。
// ⚠️ 用 catch + finally 而非 then：worker 启动失败（脚本 404 / mocks 编译
// 错误 / 浏览器不支持 SW）时 then 回调不执行 → render 永不发生 → 纯白屏，
// 且 ErrorBoundary 接不住（组件树未挂载）。失败时降级直连真实后端
// （DEV 下 warn 一条便于排查，生产静默）。
enableMocking()
  .catch((err) => {
    if (import.meta.env.DEV) {
      console.warn('[MSW] 启动失败，将直接连真实后端：', err)
    }
  })
  .finally(() => {
  /* Provider 树嵌套原则（顺序即设计，改动前先读）：
   *  1. 嵌套序 = 依赖序，内层可消费外层，无环：
   *     数据(Query) → 主题(Theme) → antd 桥 → 租户(Tenant) → 文案(I18n)
   *     → 权限(Permission) → 路由(Router) → 页面(App)
   *  2. 错误兜底是两级漏斗：RouteErrorBoundary 先消化页面级错误
   *     （导航还在，可重试）；拦不住的才冒泡到 GlobalErrorBoundary（整页替换）
   *  3. Theme/Tenant 两个 Provider 是"壳"：状态在模块级单例里
   *     （index.html 内联脚本 / axios 拦截器等 React 之外也要读写），
   *     此处仅保证模块副作用必然执行 + 用嵌套表达依赖关系
   */
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      {/* 外层：零依赖兜底（不引 antd/router/CSS 变量，样式内联），
          只处理"应用本身坏了"——Provider 初始化崩溃等绝症 */}
      <GlobalErrorBoundary
        onError={(err, info, errorId) => {
          console.error('[Global]', errorId, err, info.componentStack)
        }}
      >
        {/* React Query：服务端状态（缓存/重试/失效）。纯数据基建，
            不依赖任何业务 Provider，故位置最靠外 */}
        <QueryProvider>
          {/* 主题单例的壳：真实状态在 hooks/useTheme（不走 Context）。
              放 AntdThemeBridge 外层，供其读取 isDark */}
          <ThemeProvider>
            {/* antd 翻译官：locale / 明暗 algorithm / 租户 token（见上方定义） */}
            <AntdThemeBridge>
              {/* 租户单例的壳：配置由渲染后的 bootstrapTenant() 非阻塞填充，
                  首帧先用保底配置渲染 */}
              <TenantProvider>
                {/* i18n 在权限层之外：登录页 / 无权限页同样需要文案 */}
                <I18nProvider>
                  {/* 权限在路由之外：路由守卫依赖权限数据 */}
                  <PermissionProvider>
                    {/* 路由：只包页面部分，导航/布局由 App 内部自理 */}
                    <BrowserRouter>
                      {/* 内层：页面级兜底，导航还在 */}
                      <RouteErrorBoundary
                        onError={(err, info, ctx) => {
                          console.error('[Route]', ctx, err, info.componentStack)
                        }}
                        onReset={() => {
                          // 可选：清掉当前页面的 query 缓存
                          // queryClient.invalidateQueries()
                        }}
                      >
                        {/* 懒加载页面的加载占位；贴最内层，切页时导航不受影响 */}
                        <Suspense fallback={<div className="page-loading" />}>
                          <App />
                        </Suspense>
                      </RouteErrorBoundary>
                    </BrowserRouter>
                  </PermissionProvider>
                </I18nProvider>
              </TenantProvider>
            </AntdThemeBridge>
          </ThemeProvider>
        </QueryProvider>
      </GlobalErrorBoundary>
    </React.StrictMode>,
  )

  // 非阻塞：首帧用保底配置渲染，配置就绪后全树热更新。
  // 同 enableMocking 的裸 Promise 收口：bootstrap 内部已全链路兜底（不抛），
  // 此处 catch 只防"兜底自身出错"的极端情况（如 mergeTenantConfig 同步抛）。
  // 失败时首帧保底配置仍在，症状是租户色/字体不对而非白屏——比白屏更
  // 隐蔽，故 warn 无条件输出（不限 DEV），给排查留线索。
  void bootstrapTenant().catch((err) => {
    console.warn('[Tenant] 配置引导失败，已用保底配置渲染：', err)
  })

  // 登录态恢复（三态会话，契约 §1.3）：
  // 启动 session='loading'（受保护路由显示 loading 不跳转），本调用探测后端
  // /api/me —— 200 → authenticated；401/5xx/网络错 → anonymous。
  // profile 不持久化，登录态唯一权威是后端会话，无"陈旧已登录"闪烁。
  // restoreFromMe 内部已全 catch，不阻塞首屏。
  // 与 bootstrapTenant 并行安全：两者写不同 store（租户配置 / 用户会话），无交叉依赖。
  void getUserStore().restoreFromMe()
})