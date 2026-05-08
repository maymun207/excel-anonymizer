'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { type Locale, translations, type Translations } from '@/lib/i18n'

interface LanguageContextValue {
  locale: Locale
  toggle: () => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  toggle: () => {},
  t: translations,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en')

  const toggle = useCallback(() => {
    setLocale(prev => (prev === 'en' ? 'tr' : 'en'))
  }, [])

  return (
    <LanguageContext.Provider value={{ locale, toggle, t: translations }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
