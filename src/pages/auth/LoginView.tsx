/**
 * 生涯心旅 - 登录页面（品牌蓝渐变背景）
 * 页面层：装配品牌宣传区与登录表单，统一处理登录成功后的 remember 写入与跳转。
 * 命名路由 home → '/'；登出/登录的全局跳转由 App 层 emitter 订阅处理，
 * 这里仅保留源码内的显式跳转。
 */
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/stores/useUserStore'
import { Propaganda } from '@/features/auth'
import { LoginForm } from '@/features/auth'
import './LoginView.css'

export function LoginView() {
  const navigate = useNavigate()

  // 子表单已自行 message 提示：这里只负责记忆选项写入与跳转
  const onLoginSuccess = (payload?: { remember?: boolean }) => {
    if (payload?.remember !== undefined) {
      useUserStore().setRememberMe(payload.remember)
    }
    // 原 router.push({ name: 'home' }) → 路径 '/'
    navigate('/')
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
