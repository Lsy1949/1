/**
 * i18n 初始化与语言元信息（架构见 docs/i18n/01-architecture.md）。
 *
 * 三份 JSON 字典静态 import 打进主 bundle：同步、无闪烁、无语言包网络请求。
 * zh-CN.json 是全项目 Key 的事实来源，四/三语对齐由 locales/keyParityCheck.ts 编译期强制。
 *
 * 注意：不要添加 nonExplicitSupportedLngs: true —— 该配置会把 zh-CN 裁剪成基础码
 * 与 supportedLngs 比对导致语言解析链为空，全站 t() 返回 Key（见 docs/i18n/05-troubleshooting.md）。
 */
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/zh-tw'
import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import enUS from './locales/en-US.json'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'

export const SUPPORTED_LANGUAGES = ['zh-CN', 'zh-TW', 'en-US'] as const
export type AppLocale = (typeof SUPPORTED_LANGUAGES)[number]

/** 本地字典：静态 import 打进主 bundle，init 同步完成 */
export const resources = {
  'zh-CN': { translation: zhCN },
  'zh-TW': { translation: zhTW },
  'en-US': { translation: enUS },
} as const

/** 浏览器语言归一化到受支持语言：zh（繁体变体）-> zh-TW、zh -> zh-CN、en* -> en-US */
export function normalizeLanguage(lng: string | undefined): AppLocale {
  if (!lng) return 'zh-CN'
  const lower = lng.toLowerCase()
  if (lower.startsWith('zh')) {
    return /tw|hk|mo|hant/.test(lower) ? 'zh-TW' : 'zh-CN'
  }
  if (lower.startsWith('en')) return 'en-US'
  return 'zh-CN'
}

/** 语言 -> dayjs locale 映射（新增语言时补一行） */
const DAYJS_LOCALE_MAP: Readonly<Record<AppLocale, string>> = {
  'zh-CN': 'zh-cn',
  'zh-TW': 'zh-tw',
  'en-US': 'en',
}

void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LANGUAGES,
    load: 'currentOnly',
    fallbackLng: 'zh-CN', // 漏配时回退中文而不是显示 Key
    interpolation: { escapeValue: false }, // React 已做 XSS 转义，双重转义会显示 &amp; 之类文本
    returnNull: false, // t() 返回类型固定为 string
    react: { useSuspense: false }, // 同步资源，不依赖 Suspense，无翻译闪烁
    detection: {
      order: ['localStorage', 'navigator'], // 优先用户上次选择，其次浏览器语言
      lookupLocalStorage: 'locale', // 持久化键与 Vue 版保持一致
      caches: ['localStorage'], // 切换后自动持久化
    },
  })

// 语言联动：dayjs locale 与 document.title 随 languageChanged 同步（init 设定语言时同样触发一次）
i18next.on('languageChanged', (lng) => {
  dayjs.locale(DAYJS_LOCALE_MAP[normalizeLanguage(lng)])
  document.title = i18next.t('nav.documentTitle')
})

/** 切换语言：无需刷新页面（react-i18next 订阅组件自动重渲染，上方 listener 同步 dayjs/title） */
export function changeAppLanguage(lng: AppLocale): void {
  void i18next.changeLanguage(lng)
}
