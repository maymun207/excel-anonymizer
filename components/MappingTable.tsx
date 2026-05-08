'use client'

import { useLanguage } from '@/hooks/useLanguage'

interface MappingTableProps {
  mapping: Record<string, string>
}

export default function MappingTable({ mapping }: MappingTableProps) {
  const { locale, t } = useLanguage()
  const entries = Object.entries(mapping)

  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-200">{t.mappingTitle[locale]}</span>
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
          {entries.length} {t.records[locale]}
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto bg-zinc-950">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-zinc-900">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 border-b border-zinc-800">
                {t.mappingOriginal[locale]}
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 border-b border-zinc-800">
                {t.mappingLabel[locale]}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {entries.map(([original, label]) => (
              <tr key={original} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-2 text-zinc-300 truncate max-w-[200px]" title={original}>{original}</td>
                <td className="px-4 py-2 font-mono text-blue-400 text-xs">{label}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-zinc-600">
                  {t.mappingEmpty[locale]}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
