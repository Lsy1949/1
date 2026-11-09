import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { changeAppLanguage, normalizeLanguage, type AppLocale } from '@/i18n'

/**
 * 语言切换入口（UI 层统一走这里）：底层为 react-i18next 的 languageChanged
 * 订阅 + i18next detection.caches 自动持久化 localStorage 'locale' + html[lang] 同步。
 */
export function useLocale(): { locale: AppLocale; setLocale: (locale: AppLocale) => void } {
  const { i18n } = useTranslation()
  const locale = normalizeLanguage(i18n.language)

  // 挂载/语言变化时同步 <html lang>
  useEffect(() => {
    document.documentElement.setAttribute('lang', locale)
  }, [locale])

  return { locale, setLocale: changeAppLanguage }
}
