'use client'

import { useState } from 'react'
import AnonymizePanel from '@/components/AnonymizePanel'
import DeanonymizePanel from '@/components/DeanonymizePanel'
import { useAnonymizer, useDeanonymizer } from '@/hooks/useAnonymizer'

type ActiveTab = 'anon' | 'deanon'

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('anon')
  const anonymizer = useAnonymizer()
  const deanonymizer = useDeanonymizer()

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Privacy-First · Client-Side Processing
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Veri Maskeleme Aracı
          </h1>
          <p className="text-zinc-500 text-sm">
            Excel dosyalarındaki kişi ve firma adlarını güvenle maskele —
            veriler cihazınızdan çıkmaz
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 p-1 bg-zinc-900 border border-zinc-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('anon')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200
              ${
                activeTab === 'anon'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            🔒 Maskele
          </button>
          <button
            onClick={() => setActiveTab('deanon')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200
              ${
                activeTab === 'deanon'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            🔓 Geri Al
          </button>
        </div>

        {/* Panels */}
        {activeTab === 'anon' && <AnonymizePanel {...anonymizer} />}
        {activeTab === 'deanon' && <DeanonymizePanel {...deanonymizer} />}

        <p className="text-center text-xs text-zinc-700 mt-8">
          Tüm işlemler tarayıcınızda gerçekleşir · Dosyalarınız hiçbir
          sunucuya gönderilmez
        </p>
      </div>
    </div>
  )
}
