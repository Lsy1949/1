import { useEffect } from 'react'
import { useI18n, type AppLocale } from '@/i18n'

/**
 * 语言切换 —— 等价迁移自 Vue 版 composables/useLocale.ts。
 * 单一数据源沿用 useI18n + localStorage 'locale' + html[lang]，行为等价。
 */
export function useLocale(): { locale: AppLocale; setLocale: (locale: AppLocale) => void } {
  const { locale, setLocale } = useI18n()

  // 等价 Vue 版挂载/语言变化时同步 <html lang> 的副作用
  useEffect(() => {
    document.documentElement.setAttribute('lang', locale)
  }, [locale])

  return { locale, setLocale }
}
