'use client'

import { useState } from 'react'
import AnonymizePanel from '@/components/AnonymizePanel'
import DeanonymizePanel from '@/components/DeanonymizePanel'
import PrivacyBanner from '@/components/PrivacyBanner'
import HowToGuide from '@/components/HowToGuide'
import AppFooter from '@/components/AppFooter'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useAnonymizer, useDeanonymizer } from '@/hooks/useAnonymizer'
import { useLanguage } from '@/hooks/useLanguage'

type ActiveTab = 'anon' | 'deanon'

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('anon')
  const anonymizer = useAnonymizer()
  const deanonymizer = useDeanonymizer()
  const { locale, t } = useLanguage()

  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-blue-500/30">
      {/* Decorative top gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Language toggle — top right */}
        <LanguageSwitcher />

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
            {t.badge[locale]}
          </div>
          <h1 className="text-5xl font-black text-white mb-4 tracking-tighter">
            {t.title[locale]}
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
            {t.subtitle[locale]}
          </p>
        </div>

        {/* New Sections: Privacy Banner & How-to Guide */}
        <PrivacyBanner />
        <HowToGuide />

        {/* Tab bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-1 p-1 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('anon')}
              className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300
                ${
                  activeTab === 'anon'
                    ? 'bg-zinc-800 text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              {t.tabAnonymize[locale]}
            </button>
            <button
              onClick={() => setActiveTab('deanon')}
              className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300
                ${
                  activeTab === 'deanon'
                    ? 'bg-zinc-800 text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              {t.tabRestore[locale]}
            </button>
          </div>
        </div>

        {/* Panels */}
        <main className="relative">
          {activeTab === 'anon' && <AnonymizePanel {...anonymizer} />}
          {activeTab === 'deanon' && <DeanonymizePanel {...deanonymizer} />}
        </main>

        <AppFooter />
      </div>
    </div>
  )
}
