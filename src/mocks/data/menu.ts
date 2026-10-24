import type { MenuItemDTO } from '@/api/types/menu'

/**
 * 菜单 Mock 数据：内容等价于 Navbar 原硬编码 menuData（Navbar.tsx 内的 fallback 常量同源），
 * feature 字段按 menuFeatureMap 映射补上。
 *
 * 注意：子项 path 为跳转目标；「分组标题」折算为 children 节点（i18nKey = titleKey，无独立 path 的节点
 * 以父 path 占位）。数组顺序即渲染顺序（后端可按租户重排）。
 */
export const MENU_MOCK: MenuItemDTO[] = [
  {
    key: 'evaluation',
    path: '/assessment',
    i18nKey: 'nav.menu.evaluation',
    feature: 'assessment',
    children: [
      { key: 'phq9', path: '/assessment', i18nKey: 'nav.item.phq9' },
      { key: 'gad7', path: '/assessment', i18nKey: 'nav.item.gad7' },
      { key: 'pss', path: '/assessment', i18nKey: 'nav.item.pss' },
      { key: 'riasec', path: '/assessment', i18nKey: 'nav.item.riasec' },
      { key: 'mbti', path: '/assessment', i18nKey: 'nav.item.mbti' },
    ],
  },
  {
    key: 'articles',
    path: '/articles',
    i18nKey: 'nav.menu.articles',
    feature: 'articles',
    children: [
      { key: 'daily', path: '/articles', i18nKey: 'nav.item.daily' },
      { key: 'featured', path: '/articles', i18nKey: 'nav.item.featured' },
      { key: 'article-list', path: '/articles/list', i18nKey: 'nav.item.articleList' },
      { key: 'psychology', path: '/articles', i18nKey: 'nav.item.psychology' },
      { key: 'career', path: '/articles', i18nKey: 'nav.item.career' },
      { key: 'stories', path: '/articles', i18nKey: 'nav.item.stories' },
    ],
  },
  {
    key: 'activities',
    path: '/time-capsule',
    i18nKey: 'nav.menu.activities',
    children: [
      { key: 'time-capsule', path: '/time-capsule', i18nKey: 'nav.item.timeCapsule', feature: 'timeCapsule' },
      { key: 'square', path: '/square', i18nKey: 'nav.item.square', feature: 'square' },
    ],
  },
  {
    key: 'counseling',
    path: '/counseling',
    i18nKey: 'nav.menu.counseling',
    feature: 'counseling',
    children: [
      { key: 'booking', path: '/counseling', i18nKey: 'nav.item.booking' },
      { key: 'ai-consult', path: '/counseling/ai-chat', i18nKey: 'nav.item.aiConsult' },
      { key: 'ai-companion', path: '/counseling/companion', i18nKey: 'nav.item.aiCompanion' },
      { key: 'consultants', path: '/counseling', i18nKey: 'nav.item.consultants' },
      { key: 'notice', path: '/counseling', i18nKey: 'nav.item.notice' },
      { key: 'faq', path: '/counseling', i18nKey: 'nav.item.faq' },
    ],
  },
]
