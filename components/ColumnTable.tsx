'use client'

import type { ColumnTypeMap, ColumnType } from '@/lib/types'

interface ColumnTableProps {
  headers: string[]
  previewRows: unknown[][]
  columnConfig: ColumnTypeMap
  onToggle: (colIndex: number) => void
  aiSuggested?: number[]
}

const typeLabel: Record<ColumnType, string> = {
  none: 'YOK',
  PERSON: 'KİŞİ',
  ORG: 'FİRMA',
}

const typeBg: Record<ColumnType, string> = {
  none: 'bg-gray-100 text-gray-600',
  PERSON: 'bg-blue-100 text-blue-700',
  ORG: 'bg-orange-100 text-orange-700',
}

const cellTint: Record<ColumnType, string> = {
  none: '',
  PERSON: 'bg-blue-50 text-blue-800',
  ORG: 'bg-orange-50 text-orange-800',
}

export default function ColumnTable({
  headers,
  previewRows,
  columnConfig,
  onToggle,
  aiSuggested = [],
}: ColumnTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            {headers.map((header, idx) => {
              const colType = columnConfig[idx] ?? 'none'
              return (
                <th key={idx} className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap border-b border-gray-200">
                  <div className="flex flex-col gap-1">
                    <span className="truncate max-w-[120px]" title={header}>{header || `Kolon ${idx + 1}`}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggle(idx)}
                        className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${typeBg[colType]}`}
                      >
                        {typeLabel[colType]}
                      </button>
                      {aiSuggested.includes(idx) && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700">AI</span>
                      )}
                    </div>
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {previewRows.map((row, rIdx) => (
            <tr key={rIdx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
              {headers.map((_, cIdx) => {
                const colType = columnConfig[cIdx] ?? 'none'
                const cellVal = row[cIdx]
                const display = cellVal === null || cellVal === undefined ? '' : String(cellVal)
                return (
                  <td
                    key={cIdx}
                    className={`px-3 py-2 whitespace-nowrap max-w-[150px] truncate ${cellTint[colType]}`}
                    title={display}
                  >
                    {display}
                  </td>
                )
              })}
            </tr>
          ))}
          {previewRows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-3 py-4 text-center text-gray-400">
                Önizleme için veri yok
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
