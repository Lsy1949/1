/**
 * 【business】NotFoundNav —— 404 固定导航栏（品牌 logo + 链接）
 * 导航链接用 react-router <Link> 恢复链接语义；logo 由父级 onNavigate 处理
 */
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './NotFoundNav.css'

export interface NotFoundNavProps {
  /** 是否已翻过首页（导航栏下边框） */
  scrolled: boolean
  /** 当前是否为深色 slide */
  dark: boolean
  onNavigate?: (route: string) => void
}

export function NotFoundNav({ scrolled, dark, onNavigate }: NotFoundNavProps) {
  const { t } = useTranslation()

  // key 标注字面量：模板字符串 t(`notFound.nav.${key}`) 可推导出精确字典键
  const navLinks: ReadonlyArray<{ key: 'home' | 'career' | 'treehole' | 'about'; route: string }> = [
    { key: 'home', route: '/' },
    { key: 'career', route: '/assessment' },
    { key: 'treehole', route: '/square' },
    { key: 'about', route: '/' }
  ]

  return (
    <nav className={`nf-nav${scrolled ? ' scrolled' : ''}${dark ? ' is-dark-slide' : ''}`}>
      <div className="nf-nav-inner">
        <button type="button" className="nf-nav-logo btn-reset" onClick={() => onNavigate?.('/')}>
          {t('nav.brand')}
        </button>
        <div className="nf-nav-links">
          {navLinks.map((link) => (
            <Link key={link.key} className="nf-nav-link" to={link.route}>
              {t(`notFound.nav.${link.key}`)}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default NotFoundNav
