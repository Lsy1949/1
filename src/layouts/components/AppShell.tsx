import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { EnvironmentOutlined, MailOutlined, PhoneOutlined, ShareAltOutlined } from '@ant-design/icons'
import Navbar from '../Navbar'
import { useLayoutMeta } from '../useLayoutMeta'
import { AppCommandPalette } from '@/features/command-palette'
import { LiveAnnouncer } from '@/components/LiveAnnouncer'
import './AppShell.css'

/**
 * 应用壳层（TS 版，替代旧 MainLayout）：
 * grain-overlay + 命令面板 + Navbar + 页面过渡 + Footer。
 * 路由 meta 经 useLayoutMeta 等价层：hideNavbar / transparentNavbar / hideFooter 控制显隐。
 * 路由出口由 children 传入（pc / mobile DefaultLayout 内放 <Outlet />）。
 */
export default function AppShell({ children }: { children?: ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { transparentNavbar, hideNavbar, hideFooter } = useLayoutMeta()

  function goCounseling() { navigate('/counseling') }
  function goAssessment() { navigate('/assessment') }
  function goArticles() { navigate('/articles') }
  function goCapsule() { navigate('/time-capsule') }

  return (
    <div className="main-layout">
      <div className="grain-overlay" aria-hidden="true" />
      {/* 读屏播报区（aria-live）：主题/语言等无焦点变化的状态切换由这里播报 */}
      <LiveAnnouncer />
      {/* 命令面板自行处理选中跳转（等价 Vue 版 @navigate → router.push） */}
      <AppCommandPalette />
      {!hideNavbar && <Navbar />}
      <main className={`main-content${transparentNavbar || hideNavbar ? ' no-padding' : ''}`}>
        <div key={pathname} className="page-fade">
          {children}
        </div>
      </main>
      {!hideFooter && (
        <footer className="main-footer">
          <div className="footer-content">
            <div className="footer-grid">
              {/* 品牌介绍 */}
              <div className="footer-brand">
                <h3 className="footer-logo">生涯心旅</h3>
                <p className="brand-desc">致力于为大学生提供专业的心理健康服务与活动中心指导，结合AI技术与专业咨询，用心呵护每一份成长。</p>
                <div className="social-links">
                  <a href="#" className="social-icon" aria-label="share"><ShareAltOutlined /></a>
                  <a href="#" className="social-icon" aria-label="email"><MailOutlined /></a>
                </div>
              </div>

              {/* 平台导航 */}
              <div className="footer-column">
                <h4>平台导航</h4>
                <ul className="footer-menu">
                  <li><a href="#home">首页</a></li>
                  <li><a href="#services">服务介绍</a></li>
                  <li><a href="#about">关于我们</a></li>
                  <li><a href="#news">最新动态</a></li>
                </ul>
              </div>

              {/* 服务项目 */}
              <div className="footer-column">
                <h4>服务项目</h4>
                <ul className="footer-menu">
                  <li><a onClick={goCounseling}>心理咨询</a></li>
                  <li><a onClick={goCapsule}>活动中心</a></li>
                  <li><a onClick={goAssessment}>心理测评</a></li>
                  <li><a onClick={goArticles}>文章资讯</a></li>
                </ul>
              </div>

              {/* 联系方式 */}
              <div className="footer-column">
                <h4>联系我们</h4>
                <ul className="contact-list">
                  <li>
                    <EnvironmentOutlined />
                    <span>北京市海淀区科技园路88号</span>
                  </li>
                  <li>
                    <PhoneOutlined />
                    <span>400-123-4567</span>
                  </li>
                  <li>
                    <MailOutlined />
                    <span>contact@shengyaxinlv.com</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-inner">
              <p>© 2026 生涯心旅. All Rights Reserved.</p>
              <div className="footer-links">
                <span>隐私政策</span>
                <span>服务条款</span>
                <span>帮助中心</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
