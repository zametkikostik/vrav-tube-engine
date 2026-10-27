import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react'
import en from './en'
import ru from './ru'
import bg from './bg'

export type Locale = 'en' | 'ru' | 'bg'
type Dict = typeof en

const dictionaries: Record<Locale, Dict> = { en, ru, bg }

const STORAGE = 'vrav_locale'

function detectLocale(): Locale {
  const saved = localStorage.getItem(STORAGE) as Locale | null
  if (saved && dictionaries[saved]) return saved
  const nav = (navigator.language || 'en').toLowerCase()
  if (nav.startsWith('ru')) return 'ru'
  if (nav.startsWith('bg')) return 'bg'
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
    localStorage.setItem(STORAGE, l)
    document.documentElement.lang = l
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
