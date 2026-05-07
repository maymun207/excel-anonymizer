'use client'

interface SheetTabsProps {
  sheets: string[]
  active: string
  onChange: (sheet: string) => void
}

export default function SheetTabs({ sheets, active, onChange }: SheetTabsProps) {
  return (
    <div className="flex gap-1 border-b border-zinc-800 overflow-x-auto">
      {sheets.map(sheet => (
        <button
          key={sheet}
          onClick={() => onChange(sheet)}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-150
            ${active === sheet
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'}`}
        >
          {sheet}
        </button>
      ))}
    </div>
  )
}
