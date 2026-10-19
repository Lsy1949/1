import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import zhCN from './zh-CN'
import zhTW from './zh-TW'
import enUS from './en-US'

export type AppLocale = 'zh-CN' | 'zh-TW' | 'en-US'

// 持久化键与 Vue 版 locales/index.ts 保持一致
const STORAGE_KEY = 'locale'
const KNOWN_LOCALES: AppLocale[] = ['zh-CN', 'zh-TW', 'en-US']

type Messages = Record<string, unknown>

// 三个语言包：键名结构一一对应
const messagesMap: Record<AppLocale, Messages> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en-US': enUS
}

function getInitialLocale(): AppLocale {
  const stored = localStorage.getItem(STORAGE_KEY) as AppLocale | null
  return stored && KNOWN_LOCALES.includes(stored) ? stored : 'zh-CN'
}

// 点路径取值：t('assessment.tabs.scales')
function lookup(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (acc, key) => (acc as Record<string, unknown> | undefined)?.[key],
    obj
  )
}

// 行为与 vue-i18n 一致：当前语言缺键回退 zh-CN，再回退 key 本身；{name} 占位插值
function createT(locale: AppLocale) {
  return (key: string, params?: Record<string, unknown>): string => {
    let found: unknown = lookup(messagesMap[locale], key)
    if (found === undefined) found = lookup(messagesMap['zh-CN'], key)
    if (typeof found !== 'string') return key
    let text = found
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.split(`{${k}}`).join(String(v))
      }
    }
    return text
  }
}

interface I18nContextValue {
  t: (key: string, params?: Record<string, unknown>) => string
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
}

const I18nContext = createContext<I18nContextValue>({
  t: createT('zh-CN'),
  locale: 'zh-CN',
  setLocale: () => {}
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(getInitialLocale)

  const setLocale = useCallback((next: AppLocale) => {
    localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.setAttribute('lang', next)
    setLocaleState(next)
  }, [])

  // 等价 Vue 版挂载时同步 <html lang> 的副作用
  useEffect(() => {
    document.documentElement.setAttribute('lang', locale)
  }, [locale])

  const value = useMemo<I18nContextValue>(
    () => ({ t: createT(locale), locale, setLocale }),
    [locale, setLocale]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/**
 * 等价 vue-i18n 的 useI18n()，调用形态一致：const { t, locale, setLocale } = useI18n()
 */
export function useI18n() {
  return useContext(I18nContext)
}
