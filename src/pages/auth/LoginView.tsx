/**
 * 生涯心旅 - 登录页面（品牌蓝渐变背景）
 * 页面层：装配品牌宣传区与登录表单，统一处理登录成功后的 remember 写入；
 * 跳转出口唯一：下方 useEffect（会话变 authenticated → 回跳 from 或首页），
 * 覆盖「刚登录成功」与「已登录手动访问 /login」两个场景，无双跳竞态。
 * 三态会话：loading 期间 isLoggedIn 为 false → effect 不触发，探测完成
 * （authenticated）才跳转——不再依赖持久化 profile，无"跳 / 又被纠正回登录页"的往返。
 */
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUserStore } from '@/stores/useUserStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { isKnownRoutePath } from '@/config/routes'
import { Propaganda } from '@/features/auth'
import { LoginForm } from '@/features/auth'
import './LoginView.css'

/** 校验 1：站内相对路径（防开放重定向：//evil.com / http: 开头一律拒绝） */
function isValidInternalPath(from: string): boolean {
  return from.startsWith('/') && !from.startsWith('//') && !from.includes('http')
}

export function LoginView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isLoggedIn } = useUserStore()
  const { config } = useTenantStore()

  // 唯一跳转出口：会话 authenticated（登录成功 / 启动探测命中）→ 回跳 from 或首页。
  // from 两道校验：站内相对路径（防开放重定向）+ 可达性（已知路由 && 当前租户已开通）。
  // 跨站分支（主域选校）在 useAuth 内已 window.location.assign 整页跳走，不会到这里。
  useEffect(() => {
    if (!isLoggedIn) return
    const from = searchParams.get('from')
    let target = '/'
    if (from && isValidInternalPath(from)) {
      const pathname = from.split('?')[0].split('#')[0]
      if (isKnownRoutePath(pathname) && config.routes.includes(pathname)) {
        target = from
      }
    }
    navigate(target, { replace: true })
    // searchParams 只取 from 快照，不作为依赖（避免 from 变化重复跳）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, navigate, config.routes])

  // 子表单已自行 message 提示：这里只负责记忆选项写入（跳转归上方 effect）
  const onLoginSuccess = (payload?: { remember?: boolean }) => {
    if (payload?.remember !== undefined) {
      useUserStore().setRememberMe(payload.remember)
    }
  }

  return (
    <div className="login-container">
      {/* 品牌蓝渐变背景层 + 光晕装饰 */}
      <div className="bg-layer" aria-hidden="true" />
      <div className="bg-mask" aria-hidden="true" />

      {/* 左右分屏内容 */}
      <div className="content-wrapper">
        {/* 左侧：品牌宣传区（≥1200px 显示） */}
        <Propaganda />
        {/* 右侧：登录表单区 */}
        <LoginForm onLoginSuccess={onLoginSuccess} />
      </div>
    </div>
  )
}

export default LoginView
