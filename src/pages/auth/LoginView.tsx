/**
 * 生涯心旅 - 登录页面（品牌蓝渐变背景）
 * 页面层：装配品牌宣传区与登录表单，统一处理登录成功后的 remember 写入；
 * 跳转出口唯一：下方 useEffect（会话变 authenticated → 回跳 from 或首页），
 * 覆盖「刚登录成功」与「已登录手动访问 /login」两个场景，无双跳竞态。
 * 三态会话：loading 期间 isLoggedIn 为 false → effect 不触发，探测完成
 * （authenticated）才跳转——不再依赖持久化 profile，无"跳 / 又被纠正回登录页"的往返。
 */
import { useEffect, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Flex, Spin } from 'antd'
import { getUserStore, useUserStore } from '@/stores/useUserStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { APP_ROUTE_PATHS, isRouteReachable } from '@/config/routes'
import { LoginForm, Propaganda } from '@/features/auth'
import './LoginView.css'

/**
 * 校验 1：站内相对路径（防开放重定向）。
 *
 * 仅判断 startsWith('/') && !startsWith('//') 不够：WHATWG URL 解析器会把
 * 反斜杠当分隔符（/\evil.com → //evil.com）、并剥离 tab/换行，这些变体都能
 * 绕过字符串判断。这里用同源 base 做真实解析，再比对 origin 兜底，
 * 同时返回归一化后的 pathname / search / hash 供后续校验与跳转使用。
 */
function resolveInternalPath(from: string | null): { pathname: string; href: string } | null {
  if (!from || !from.startsWith('/')) return null
  try {
    const url = new URL(from, window.location.origin)
    if (url.origin !== window.location.origin) return null
    return { pathname: url.pathname, href: `${url.pathname}${url.search}${url.hash}` }
  } catch {
    return null
  }
}

export function LoginView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // 选择器订阅：只在这些字段变化时重渲染
  const isLoggedIn = useUserStore((s) => s.isLoggedIn)
  const loaded = useTenantStore((s) => s.loaded)
  const rawBackground = useTenantStore((s) => s.config.assets.loginBackground)

  // 布局断点全部交给 CSS 媒体查询（见 LoginView.css）：
  // ≥1200 左右分屏、<1200 单栏居中、<768 收紧内边距，避免 JS 断点与 CSS 断点不同源。

  // 登录背景图由后端按租户下发（GET /api/tenant/config → assets.loginBackground）；
  // 空串 / 非法值 → 不注入变量，回退 LoginView.css 的内置默认图 + 品牌蓝渐变。
  // 配置是异步热更新的（缓存 → 后台刷新），这里始终跟随 config 渲染。
  const loginBackground = typeof rawBackground === 'string' ? rawBackground.trim() : ''
  const bgStyle = loginBackground
    ? ({ '--login-bg-image': `url(${JSON.stringify(loginBackground)})` } as CSSProperties)
    : undefined

  const fromParam = searchParams.get('from')
  const resolved = resolveInternalPath(fromParam)

  // from 是否可达：在 selector 内完成匹配，只订阅布尔值。
  // 不能把 config.routes 数组本身作为选中值——后台刷新会重建 config（内容相同、
  // 数组引用不同），引用变化会让本组件重渲染、effect 重跑，可能在跳转前把
  // 已确定的 from 改写成 /。布尔值天然稳定，内容不变就不会触发。
  const canRestoreFrom = useTenantStore((s) => {
    if (!resolved) return false
    return (
      isRouteReachable(resolved.pathname, s.config.routes) ||
      // 本次用的是缓存配置，后台刷新可能还没回来（routes 可能偏窄）：
      // 退化为前端路由表校验，最坏由路由守卫渲染 403，而不是丢回首页
      (s.fromCache && isRouteReachable(resolved.pathname, APP_ROUTE_PATHS))
    )
  })
  const target = canRestoreFrom && resolved ? resolved.href : '/'
  // 已登录即隐藏表单：authenticated 后必然跳走（无论配置是否就绪），表单没有展示价值。
  // 不能写成 isLoggedIn && !loaded——loaded 翻转会先重渲染（此刻 isRestoring=false）
  // 再执行 effect，中间会漏画一帧登录表单。
  const hideForm = isLoggedIn

  // 唯一跳转出口：会话 authenticated（登录成功 / 启动探测命中）→ 回跳 from 或首页。
  // from 两道校验：站内相对路径（防开放重定向）+ 可达性（租户已开通）。
  // 跨站分支（主域选校）在 useAuth 内已 window.location.assign 整页跳走，不会到这里。
  useEffect(() => {
    if (!isLoggedIn) return
    // 配置未就绪前不决策：此时 routes 只是占位/旧缓存，直接判定会把 from 静默丢弃
    if (!loaded) return
    navigate(target, { replace: true })
  }, [isLoggedIn, loaded, target, navigate])

  // 子表单已自行 message 提示：这里只负责记忆选项写入（跳转归上方 effect）
  const onLoginSuccess = (payload?: { remember?: boolean }) => {
    if (payload?.remember !== undefined) {
      getUserStore().setRememberMe(payload.remember)
    }
  }

  return (
    <Flex align="center" className="login-container">
      {/* 背景层：租户背景图（--login-bg-image）+ 品牌蓝渐变兜底 + 光晕装饰 */}
      <div className={loginBackground ? 'bg-layer bg-layer--custom' : 'bg-layer'} style={bgStyle} aria-hidden="true" />
      <div className="bg-mask" aria-hidden="true" />

      {/* 左右分屏内容：≥1200 分屏，否则表单居中（宽度/间距/内边距全在 CSS） */}
      <Flex align="center" className="content-wrapper">
        {/* 左侧：品牌宣传区（≥1200px 显示） */}
        <Propaganda />
        {/* 右侧：登录表单区；已登录时用 loading 占位（宽度与卡片共用 CSS 变量） */}
        {hideForm ? (
          <Flex
            align="center"
            justify="center"
            style={{ width: '100%', maxWidth: 'var(--login-card-max-width, 420px)' }}
          >
            <Spin size="large" />
          </Flex>
        ) : (
          <LoginForm onLoginSuccess={onLoginSuccess} />
        )}
      </Flex>
    </Flex>
  )
}

export default LoginView
