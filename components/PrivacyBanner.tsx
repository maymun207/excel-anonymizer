'use client'

import { useLanguage } from '@/hooks/useLanguage'

export default function PrivacyBanner() {
  const { locale, t } = useLanguage()

  return (
    <div className="relative overflow-hidden bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 mb-8 group transition-all duration-300 hover:border-blue-500/20">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
      
      <div className="flex flex-col md:flex-row items-start md:items-center gap-5 relative z-10">
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </div>
        
        <div className="flex-grow">
          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            {t.privacyTitle[locale]}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white uppercase tracking-wider">
              Local Only
            </span>
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
            {t.privacyDesc[locale]}
          </p>
        </div>

        <div className="flex-shrink-0 flex items-center gap-3">
          <div className="h-8 w-px bg-zinc-800 hidden md:block" />
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-500/70">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            Browser-Based Processing
          </div>
        </div>
      </div>
    </div>
  )
}
