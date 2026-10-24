import type { MenuItemDTO } from '@/api/types/menu'

/**
 * 内置 fallback 菜单：仅在 /api/menu 请求失败时使用（useMenu 兜底）。
 * 内容与 mocks/data/menu.ts 的 MENU_MOCK 保持等价——后端接口就绪前，
 * 两者任一改动需同步另一份。
 */
export const FALLBACK_MENU: MenuItemDTO[] = [
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
