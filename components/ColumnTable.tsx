'use client'

import type { ColumnTypeMap, ColumnType } from '@/lib/types'

interface ColumnTableProps {
  headers: string[]
  previewRows: unknown[][]
  columnConfig: ColumnTypeMap
  onToggle: (colIndex: number) => void
  aiSuggested?: number[]
}

const typeLabel: Record<ColumnType, string> = { none: 'YOK', PERSON: 'KİŞİ', ORG: 'FİRMA' }
const typeBg: Record<ColumnType, string> = {
  none: 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700',
  PERSON: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
  ORG: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30',
}
const cellTint: Record<ColumnType, string> = {
  none: 'text-zinc-300',
  PERSON: 'bg-blue-500/10 text-blue-300',
  ORG: 'bg-orange-500/10 text-orange-300',
}

export default function ColumnTable({ headers, previewRows, columnConfig, onToggle, aiSuggested = [] }: ColumnTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-zinc-900 border-b border-zinc-800">
            {headers.map((header, idx) => {
              const colType = columnConfig[idx] ?? 'none'
              return (
                <th key={idx} className="px-3 py-2.5 text-left font-medium text-zinc-400 whitespace-nowrap">
                  <div className="flex flex-col gap-1.5">
                    <span className="truncate max-w-[120px] text-zinc-300" title={header}>{header || `Kolon ${idx + 1}`}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => onToggle(idx)} className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-colors ${typeBg[colType]}`}>
                        {typeLabel[colType]}
                      </button>
                      {aiSuggested.includes(idx) && (
                        <span className="px-1.5 py-0.5 rounded-md text-xs font-bold bg-purple-500/20 text-purple-400">AI</span>
                      )}
                    </div>
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {previewRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-zinc-800/30 transition-colors">
              {headers.map((_, cIdx) => {
                const colType = columnConfig[cIdx] ?? 'none'
                const cellVal = row[cIdx]
                const display = cellVal === null || cellVal === undefined ? '' : String(cellVal)
                return (
                  <td key={cIdx} className={`px-3 py-2 whitespace-nowrap max-w-[150px] truncate text-sm ${cellTint[colType]}`} title={display}>
                    {display}
                  </td>
                )
              })}
            </tr>
          ))}
          {previewRows.length === 0 && (
            <tr><td colSpan={headers.length} className="px-3 py-6 text-center text-zinc-600">Önizleme için veri yok</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
