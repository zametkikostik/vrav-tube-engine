import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react'
import en from './en'
import ru from './ru'
import bg from './bg'

export type Locale = 'en' | 'ru' | 'bg'

/** Allow all locales to share the same key structure with string values */
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>
}
export type Dict = DeepStringify<typeof en>

const dictionaries: Record<Locale, Dict> = {
  en: en as Dict,
  ru: ru as Dict,
  bg: bg as Dict,
}

const STORAGE = 'vrav_locale'

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE) as Locale | null
    if (saved && dictionaries[saved]) return saved
  } catch {
    /* SSR / private mode */
  }
  if (typeof navigator !== 'undefined') {
    const nav = (navigator.language || 'en').toLowerCase()
    if (nav.startsWith('ru')) return 'ru'
    if (nav.startsWith('bg')) return 'bg'
  }
  return 'en'
}

type I18nCtx = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: Dict
}

const Ctx = createContext<I18nCtx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale())

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(STORAGE, l)
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined') document.documentElement.lang = l
  }, [])

  const value = useMemo(
    () => ({ locale, setLocale, t: dictionaries[locale] }),
    [locale, setLocale]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n outside I18nProvider')
  return ctx
}

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  bg: 'Български',
}
