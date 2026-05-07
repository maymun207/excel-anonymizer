'use client'

interface SheetTabsProps {
  sheets: string[]
  active: string
  onChange: (sheet: string) => void
}

export default function SheetTabs({ sheets, active, onChange }: SheetTabsProps) {
  return (
    <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
      {sheets.map(sheet => (
        <button
          key={sheet}
          onClick={() => onChange(sheet)}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
            ${active === sheet
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          {sheet}
        </button>
      ))}
    </div>
  )
}
