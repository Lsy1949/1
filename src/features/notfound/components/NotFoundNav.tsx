/**
 * 【business】NotFoundNav —— 404 固定导航栏（品牌 logo + 链接）
 * 链接点击交由父级统一 router.push（等价 emit('navigate', route)）
 */
import { useI18n } from '@/i18n'
import './NotFoundNav.css'

export interface NotFoundNavProps {
  /** 是否已翻过首页（导航栏下边框） */
  scrolled: boolean
  /** 当前是否为深色 slide */
  dark: boolean
  onNavigate?: (route: string) => void
}

export function NotFoundNav({ scrolled, dark, onNavigate }: NotFoundNavProps) {
  const { t } = useI18n()

  const navLinks = [
    { key: 'home', route: '/' },
    { key: 'career', route: '/assessment' },
    { key: 'treehole', route: '/square' },
    { key: 'about', route: '/' }
  ]

  return (
    <nav className={`nf-nav${scrolled ? ' scrolled' : ''}${dark ? ' is-dark-slide' : ''}`}>
      <div className="nf-nav-inner">
        <span className="nf-nav-logo" onClick={() => onNavigate?.('/')}>生涯心旅</span>
        <div className="nf-nav-links">
          {navLinks.map((link) => (
            <a
              key={link.key}
              className="nf-nav-link"
              onClick={() => onNavigate?.(link.route)}
            >
              {t('notFound.nav.' + link.key)}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default NotFoundNav
