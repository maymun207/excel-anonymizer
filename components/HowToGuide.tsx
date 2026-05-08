'use client'

import { useLanguage } from '@/hooks/useLanguage'

export default function HowToGuide() {
  const { locale, t } = useLanguage()

  const steps = [
    {
      title: t.step1Title[locale],
      desc: t.step1Desc[locale],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
      )
    },
    {
      title: t.step2Title[locale],
      desc: t.step2Desc[locale],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
        </svg>
      )
    },
    {
      title: t.step3Title[locale],
      desc: t.step3Desc[locale],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      )
    }
  ]

  return (
    <div className="mb-12">
      <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] text-center mb-6">
        {t.howToTitle[locale]}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 group hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 mb-3 group-hover:scale-110 group-hover:text-blue-400 transition-all duration-300">
              {step.icon}
            </div>
            <div className="font-bold text-white text-sm mb-1">{step.title}</div>
            <div className="text-zinc-500 text-xs leading-tight">{step.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
