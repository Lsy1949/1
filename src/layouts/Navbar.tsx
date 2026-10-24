import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Collapse, Drawer, Dropdown } from 'antd'
import type { CollapseProps, MenuProps } from 'antd'
import {
  CheckOutlined,
  DesktopOutlined,
  DownOutlined,
  LogoutOutlined,
  MenuOutlined,
  MoonOutlined,
  SettingOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useTheme, type ThemeMode } from '@/hooks/useTheme'
import { useLocale } from '@/hooks/useLocale'
import { useI18n } from '@/i18n'
import type { AppLocale } from '@/i18n'
import { useCommandPalette } from '@/features/command-palette'
import { useUserStore } from '@/stores/useUserStore'
import { logout } from '@/features/auth'
import { useLayoutMeta } from './useLayoutMeta'
import InitialAvatar from '@/components/InitialAvatar'
import { announce } from '@/components/LiveAnnouncer'
import './Navbar.css'
import logoUrl from '@/assets/logo.svg'

// 导航项：来自后端菜单 DTO（useMenu 已完成 path 校验 + feature 过滤 + 失败 fallback）
import type { MenuItemDTO } from '@/api'
import { useMenu } from '@/hooks/useMenu'

/** 旧命名路由 → React Router 路径（按 key 附加查询参数；默认跳节点 path） */
function handleNav(navigate: ReturnType<typeof useNavigate>, item: MenuItemDTO): void {
  // 处理时光胶囊跳转（活动中心父菜单与子项都进入胶囊广场）
  if (item.key === 'time-capsule' || item.key === 'activities') {
    navigate('/time-capsule')
    return
  }

  // 处理交流广场跳转
  if (item.key === 'square') {
    navigate('/square')
    return
  }

  // 处理文章资讯跳转
  if (item.key === 'articles' || item.key === 'article-list' || ['daily', 'featured', 'psychology', 'career', 'stories'].includes(item.key)) {
    if (item.key === 'article-list') {
      navigate('/articles/list')
    } else if (item.key === 'articles') {
      navigate('/articles')
    } else {
      navigate(`/articles?category=${item.key}`)
    }
    return
  }

  // 识别测评相关的 key，跳转到测评中心并打开量表介绍
  const assessmentKeys = ['phq9', 'gad7', 'pss', 'riasec', 'mbti', 'evaluation']
  if (assessmentKeys.includes(item.key)) {
    if (item.key === 'evaluation') {
      navigate('/assessment')
    } else {
      navigate(`/assessment?scale=${item.key}&view=intro`)
    }
    return
  }

  // AI 专栏跳转
  if (item.key === 'ai-consult') {
    navigate('/counseling/ai-chat')
    return
  }
  if (item.key === 'ai-companion') {
    navigate('/counseling/companion')
    return
  }

  // 心理咨询相关跳转
  const counselingKeys = ['counseling', 'booking', 'consultants', 'notice', 'faq']
  if (counselingKeys.includes(item.key)) {
    if (item.key === 'counseling') {
      navigate('/counseling')
    } else {
      navigate(`/counseling?tab=${item.key}`)
    }
    return
  }

  // 兜底：按节点 path 跳转（菜单 DTO 的 path 已通过前端路由表校验）
  navigate(item.path)
}

export default function Navbar() {
  const navigate = useNavigate()
  const userStore = useUserStore()
  // 菜单来自后端（useMenu 内含 path 校验 + feature 过滤 + 失败 fallback）
  const { items: menuItems } = useMenu()
  const { themeMode, setThemeMode } = useTheme()
  const { locale, setLocale } = useLocale()
  const { t } = useI18n()
  const { toggle: togglePalette } = useCommandPalette()
  const { transparentNavbar: isTransparentPage } = useLayoutMeta()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const shouldBeTransparent = isTransparentPage && !isScrolled

  // ref 镜像 scroll 状态：rAF 回调里读取的是最新值（等价 Vue ref 语义）
  const isScrolledRef = useRef(false)
  const scrollTickingRef = useRef(false)

  useEffect(() => {
    document.documentElement.style.setProperty('--navbar-h', '80px')

    const handleScroll = () => {
      if (scrollTickingRef.current) return
      scrollTickingRef.current = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        if (y > 30 && !isScrolledRef.current) {
          isScrolledRef.current = true
          setIsScrolled(true)
          document.documentElement.style.setProperty('--navbar-h', '64px')
        } else if (y < 10 && isScrolledRef.current) {
          isScrolledRef.current = false
          setIsScrolled(false)
          document.documentElement.style.setProperty('--navbar-h', '80px')
        }
        scrollTickingRef.current = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function goHome() {
    setShowMobileMenu(false)
    navigate('/')
  }

  function handleCommand(command: string) {
    if (command === 'logout') {
      // 新认证体系：清空 userStore + 广播 user:logout（入口订阅后跳登录页）
      logout()
    } else if (command === 'profile') {
      navigate('/profile')
    } else if (command === 'settings') {
      navigate('/settings')
    }
  }

  const onNavClick = (item: MenuItemDTO) => () => {
    setShowMobileMenu(false)
    handleNav(navigate, item)
  }

  // ---------- 主题 / 语言切换（切换后主动播报，读屏用户无焦点变化也能感知） ----------
  const localeLabelKeys: Record<AppLocale, string> = {
    'zh-CN': 'settings.card.preferences.zhCN',
    'zh-TW': 'settings.card.preferences.zhTW',
    'en-US': 'settings.card.preferences.enUS'
  }

  function changeTheme(next: ThemeMode | 'auto') {
    setThemeMode(next)
    announce(t('a11y.themeSwitched', { theme: t(`nav.theme.${next}`) }))
  }

  function changeLocale(next: AppLocale) {
    setLocale(next)
    announce(t('a11y.langSwitched', { lang: t(localeLabelKeys[next]) }))
  }

  // ---------- 主题 / 语言下拉（AntD menu items，等价 el-dropdown command） ----------
  const themeMenuItems: MenuProps['items'] = [
    {
      key: 'light',
      icon: <SunOutlined />,
      label: (
        <span className="dropdown-check-row">
          {t('nav.theme.light')}
          {themeMode === 'light' && <CheckOutlined className="check-icon" />}
        </span>
      ),
    },
    {
      key: 'dark',
      icon: <MoonOutlined />,
      label: (
        <span className="dropdown-check-row">
          {t('nav.theme.dark')}
          {themeMode === 'dark' && <CheckOutlined className="check-icon" />}
        </span>
      ),
    },
    {
      key: 'auto',
      icon: <DesktopOutlined />,
      label: (
        <span className="dropdown-check-row">
          {t('nav.theme.auto')}
          {themeMode === 'auto' && <CheckOutlined className="check-icon" />}
        </span>
      ),
    },
  ]

  const localeMenuItems: MenuProps['items'] = [
    {
      key: 'zh-CN',
      label: (
        <span className="dropdown-check-row">
          简体中文
          {locale === 'zh-CN' && <CheckOutlined className="check-icon" />}
        </span>
      ),
    },
    {
      key: 'zh-TW',
      label: (
        <span className="dropdown-check-row">
          繁體中文
          {locale === 'zh-TW' && <CheckOutlined className="check-icon" />}
        </span>
      ),
    },
    {
      key: 'en-US',
      label: (
        <span className="dropdown-check-row">
          English
          {locale === 'en-US' && <CheckOutlined className="check-icon" />}
        </span>
      ),
    },
  ]

  // ---------- 用户下拉（头部信息区以禁用菜单项承载，样式上还原为纯展示区） ----------
  const profileName = userStore.profile?.name || t('nav.user.guest')

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'header',
      disabled: true,
      label: (
        <div className="dropdown-header">
          <InitialAvatar name={userStore.profile?.name || 'U'} size={44} />
          <div className="dropdown-header-info">
            <span className="dropdown-header-name">{profileName}</span>
            <span className="dropdown-header-id">{userStore.profile?.id || '—'}</span>
          </div>
        </div>
      ),
    },
    { key: 'profile', icon: <UserOutlined />, label: t('nav.user.profile') },
    { key: 'settings', icon: <SettingOutlined />, label: t('nav.user.settings') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: t('nav.user.logout') },
  ]

  // ---------- 移动端抽屉折叠面板（等价 el-collapse accordion；菜单来自 useMenu，子项为 DTO 扁平列表） ----------
  const mobileMenuItems: CollapseProps['items'] = menuItems.map((menu) => ({
    key: menu.key,
    label: <span className="mobile-collapse-title">{t(menu.i18nKey)}</span>,
    children: (
      <>
        {/* 增加跳转到中心页面的入口 */}
        {menu.key === 'evaluation' && (
          <button type="button" className="mobile-center-link btn-reset" onClick={onNavClick(menu)}>
            <DesktopOutlined /> {t('nav.mobile.enterCenter')}
          </button>
        )}
        <div key={`${menu.key}-group`} className="mobile-group">
          {(menu.children ?? []).map((item) => (
            <button type="button" key={item.key} className="mobile-item btn-reset" onClick={onNavClick(item)}>
              <span className="mobile-item-dot" />
              {t(item.i18nKey)}
            </button>
          ))}
        </div>
      </>
    ),
  }))

  return (
    <>
      <header
        className={`nav-header${isScrolled ? ' is-scrolled' : ''}${shouldBeTransparent ? ' is-transparent' : ''}`}
      >
        <div className="nav-container">
          {/* Logo */}
          <div className="nav-left">
            <button type="button" className="nav-logo btn-reset" onClick={goHome}>
              <div className="logo-box">
                <img src={logoUrl} alt="Logo" className="logo-img" />
              </div>
              <span className="logo-text">{t('nav.brand')}</span>
            </button>
          </div>

          {/* Desktop Menu */}
          <nav className="nav-center desktop-only">
            {menuItems.map((menu) => (
              <div key={menu.key} className="menu-item-group">
                <div className="menu-item" onClick={onNavClick(menu)}>
                  {t(menu.i18nKey)}
                  <DownOutlined className="arrow-icon" />
                </div>
                {/* Mega Menu（子项为 DTO 扁平列表，单列渲染） */}
                <div className="mega-menu">
                  <div className="mega-menu-inner">
                    <div key={`${menu.key}-column`} className="mega-column">
                      <ul className="mega-list">
                        {(menu.children ?? []).map((item) => (
                          <li
                            key={item.key}
                            className="mega-item"
                            onClick={onNavClick(item)}
                          >
                            {t(item.i18nKey)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </nav>

          {/* Actions */}
          <div className="nav-right">
            <div className="action-items">
              {/* Command Palette Trigger */}
              <button
                className="cmd-trigger desktop-only"
                aria-label={t('nav.search')}
                onClick={togglePalette}
              >
                <svg className="cmd-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
                <span className="cmd-trigger-text">{t('nav.search')}</span>
              </button>

              {/* Theme Toggle Dropdown */}
              <Dropdown
                trigger={['click']}
                classNames={{ root: 'nav-dropdown-popper' }}
                menu={{
                  items: themeMenuItems,
                  selectable: true,
                  selectedKeys: [themeMode],
                  onClick: ({ key }) => changeTheme(key as ThemeMode | 'auto'),
                }}
              >
                <button className="icon-btn" aria-label={t('nav.mobile.appearance')}>
                  {themeMode === 'light' ? <SunOutlined /> : themeMode === 'dark' ? <MoonOutlined /> : <DesktopOutlined />}
                </button>
              </Dropdown>

              {/* Locale Toggle Dropdown */}
              <Dropdown
                trigger={['click']}
                classNames={{ root: 'nav-dropdown-popper' }}
                menu={{
                  items: localeMenuItems,
                  selectable: true,
                  selectedKeys: [locale],
                  onClick: ({ key }) => changeLocale(key as AppLocale),
                }}
              >
                <button className="lang-btn" aria-label={t('nav.mobile.language')}>
                  {locale === 'en-US' ? 'EN' : locale === 'zh-TW' ? '繁' : '简'}
                </button>
              </Dropdown>

              {userStore.isLoggedIn ? (
                <Dropdown
                  trigger={['click']}
                  classNames={{ root: 'user-dropdown-popper' }}
                  menu={{ items: userMenuItems, onClick: ({ key }) => handleCommand(key) }}
                >
                  {/* 键盘可达性（tabIndex/键盘开合）留阶段 3 统一处理 */}
                  <div className="user-profile" role="button" aria-label={t('nav.user.profile')}>
                    <InitialAvatar name={userStore.profile?.name || 'U'} size={32} />
                    <span className="username desktop-only">{profileName}</span>
                    <span className="caret"><DownOutlined /></span>
                  </div>
                </Dropdown>
              ) : (
                <Button
                  type="primary"
                  ghost
                  className="login-btn-desktop desktop-only"
                  onClick={() => navigate('/login')}
                >
                  {t('nav.user.login')}
                </Button>
              )}

              <button
                className="mobile-menu-btn mobile-only"
                aria-label={t('nav.mobile.menuTitle')}
                onClick={() => setShowMobileMenu(true)}
              >
                <MenuOutlined />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer（AntD Drawer 默认渲染到 body，等价 el-drawer append-to-body） */}
      <Drawer
        open={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        placement="right"
        title={t('nav.mobile.menuTitle')}
        className="mobile-drawer"
        /* 原 .mobile-drawer .ant-drawer-body 结构覆写 token 化为 styles prop；
           百分比宽度走 styles.wrapper（width prop 在 antd 6 已 deprecated） */
        styles={{
          wrapper: { width: '85%' },
          body: { padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <div className="mobile-nav">
          <div className="mobile-menu-content">
            <Collapse accordion items={mobileMenuItems} />
          </div>

          <div className="mobile-footer-actions">
            <div className="mobile-action-section">
              <p className="mobile-section-title">{t('nav.mobile.appearance')}</p>
              <div className="mobile-action-grid" role="group" aria-label={t('nav.mobile.appearance')}>
                <button
                  type="button"
                  className={`mobile-grid-item btn-reset${themeMode === 'light' ? ' active' : ''}`}
                  aria-pressed={themeMode === 'light'}
                  onClick={() => changeTheme('light')}
                >
                  <SunOutlined />
                  <span>{t('nav.theme.light')}</span>
                </button>
                <button
                  type="button"
                  className={`mobile-grid-item btn-reset${themeMode === 'dark' ? ' active' : ''}`}
                  aria-pressed={themeMode === 'dark'}
                  onClick={() => changeTheme('dark')}
                >
                  <MoonOutlined />
                  <span>{t('nav.theme.dark')}</span>
                </button>
                <button
                  type="button"
                  className={`mobile-grid-item btn-reset${themeMode === 'auto' ? ' active' : ''}`}
                  aria-pressed={themeMode === 'auto'}
                  onClick={() => changeTheme('auto')}
                >
                  <DesktopOutlined />
                  <span>{t('nav.theme.auto')}</span>
                </button>
              </div>
            </div>

            <div className="mobile-action-section">
              <p className="mobile-section-title">{t('nav.mobile.language')}</p>
              <div className="mobile-action-grid" role="group" aria-label={t('nav.mobile.language')}>
                <button
                  type="button"
                  className={`mobile-grid-item btn-reset${locale === 'zh-CN' ? ' active' : ''}`}
                  aria-pressed={locale === 'zh-CN'}
                  onClick={() => changeLocale('zh-CN')}
                >
                  <span>简体</span>
                </button>
                <button
                  type="button"
                  className={`mobile-grid-item btn-reset${locale === 'zh-TW' ? ' active' : ''}`}
                  aria-pressed={locale === 'zh-TW'}
                  onClick={() => changeLocale('zh-TW')}
                >
                  <span>繁體</span>
                </button>
                <button
                  type="button"
                  className={`mobile-grid-item btn-reset${locale === 'en-US' ? ' active' : ''}`}
                  aria-pressed={locale === 'en-US'}
                  onClick={() => changeLocale('en-US')}
                >
                  <span>EN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </>
  )
}
