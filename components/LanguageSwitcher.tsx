'use client'

import { useLanguage } from '@/hooks/useLanguage'

export default function LanguageSwitcher() {
  const { locale, toggle } = useLanguage()
  
  return (
    <div className="flex justify-end mb-8">
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-200"
        title={locale === 'en' ? "Türkçe'ye geç" : 'Switch to English'}
      >
        <span className="text-sm leading-none">{locale === 'en' ? '🇬🇧' : '🇹🇷'}</span>
        {locale === 'en' ? 'TR' : 'EN'}
      </button>
    </div>
  )
}
